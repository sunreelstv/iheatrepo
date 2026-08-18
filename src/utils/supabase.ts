import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { VideoClip, CreatorImage, Comment, UserAccount, TokenTransaction, CoinLedgerItem, PayoutRequest, UnlockedItem } from '../types';

// Default Supabase configuration from user project
const DEFAULT_SUPABASE_URL = 'https://xxjgqeygdvvdbecomfmz.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_9kKTa6OVfpzqt-T9iyojvg_3ozhrNPU';

export const SUPABASE_URL = ((import.meta as any).env?.VITE_SUPABASE_URL as string) || DEFAULT_SUPABASE_URL;
export const SUPABASE_ANON_KEY = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) || DEFAULT_SUPABASE_ANON_KEY;

// Create singleton Supabase Client
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Storage Buckets
export const STORAGE_BUCKET_VIDEOS = 'videos';
export const STORAGE_BUCKET_MEDIA = 'media';

/**
 * Check connectivity to Supabase
 */
export async function checkSupabaseConnection(): Promise<{ connected: boolean; message: string; buckets?: string[] }> {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
      return { 
        connected: false, 
        message: `Supabase reached, but storage error: ${error.message}` 
      };
    }
    return { 
      connected: true, 
      message: 'Connected to Supabase successfully!', 
      buckets: (buckets || []).map(b => b.name) 
    };
  } catch (err: any) {
    return { 
      connected: false, 
      message: `Connection failed: ${err?.message || err}` 
    };
  }
}

/**
 * Upload a Video file directly to Supabase Storage
 * Returns the public URL of the uploaded video file
 */
export async function uploadVideoToSupabase(
  file: File | Blob,
  filename?: string,
  onProgress?: (percent: number) => void
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const extLower = (file as File).name ? ((file as File).name.split('.').pop() || 'mp4').toLowerCase() : 'mp4';
    const uniqueName = filename || `video_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${extLower}`;
    const filePath = `uploads/${uniqueName}`;

    if (onProgress) onProgress(15);

    let contentType = (file as File).type;
    if (!contentType || contentType === 'application/octet-stream') {
      if (extLower === 'webm') contentType = 'video/webm';
      else if (extLower === 'mov') contentType = 'video/quicktime';
      else if (extLower === 'ogg' || extLower === 'ogv') contentType = 'video/ogg';
      else contentType = 'video/mp4';
    }

    // 1. Fetch live bucket list from Supabase Storage
    let existingBuckets: string[] = [];
    try {
      const { data: bucketsData } = await supabase.storage.listBuckets();
      if (bucketsData && Array.isArray(bucketsData)) {
        existingBuckets = bucketsData.map(b => b.name);
      }
    } catch {
      // Ignore list error
    }

    // Bucket candidate list
    const candidates = [
      ...existingBuckets,
      STORAGE_BUCKET_VIDEOS,
      STORAGE_BUCKET_MEDIA,
      'public',
      'uploads',
      'clips'
    ];
    const uniqueCandidates = Array.from(new Set(candidates));

    let uploadedBucket: string | null = null;
    let lastError = '';

    for (const b of uniqueCandidates) {
      try {
        const { error } = await supabase.storage.from(b).upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType,
        });

        if (!error) {
          uploadedBucket = b;
          break;
        } else {
          lastError = error.message;
        }
      } catch (err: any) {
        lastError = err?.message || 'Storage upload error';
      }
    }

    if (onProgress) onProgress(70);

    if (uploadedBucket) {
      const { data: publicUrlData } = supabase.storage.from(uploadedBucket).getPublicUrl(filePath);
      let publicUrl = publicUrlData?.publicUrl;

      // Ensure /public/ is present in the URL path
      if (publicUrl && !publicUrl.includes('/storage/v1/object/public/')) {
        publicUrl = publicUrl.replace('/storage/v1/object/', '/storage/v1/object/public/');
      }

      if (publicUrl) {
        if (onProgress) onProgress(100);
        return {
          success: true,
          url: publicUrl,
        };
      }
    }

    // 2. Fail-safe: If file size is under 15MB, convert to base64 Data URL so video is stored directly in Supabase DB and accessible anywhere
    if (file.size && file.size < 15 * 1024 * 1024) {
      console.warn('[Supabase Storage] Storage bucket missing or private. Using direct base64 Data URL fallback for Supabase DB storage...');
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });

      if (dataUrl) {
        if (onProgress) onProgress(100);
        return {
          success: true,
          url: dataUrl,
        };
      }
    }

    throw new Error(
      `Bucket Not Found: ${lastError || 'No public bucket found'}. ` +
      `Please open your Supabase Dashboard -> Storage -> Create a new public bucket named "videos".`
    );
  } catch (err: any) {
    console.warn('[Supabase Storage Upload Error]', err);
    return {
      success: false,
      error: err?.message || 'Failed to upload video to Supabase Storage.',
    };
  }
}

/**
 * Upload an Image/Photo to Supabase Storage
 * Accepts File, Blob, or base64 Data URL
 */
export async function uploadImageToSupabase(
  imageInput: File | Blob | string,
  customName?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    let fileBlob: Blob;
    let extension = 'jpg';
    let contentType = 'image/jpeg';

    if (typeof imageInput === 'string') {
      if (imageInput.startsWith('data:')) {
        // Convert base64 data URL to Blob
        const parts = imageInput.split(';base64,');
        contentType = parts[0].split(':')[1] || 'image/jpeg';
        extension = contentType.split('/')[1] || 'jpg';
        const raw = window.atob(parts[1]);
        const uInt8Array = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        fileBlob = new Blob([uInt8Array], { type: contentType });
      } else if (imageInput.startsWith('http')) {
        // Already a remote URL
        return { success: true, url: imageInput };
      } else {
        throw new Error('Invalid image string format');
      }
    } else {
      fileBlob = imageInput;
      contentType = (imageInput as File).type || 'image/jpeg';
      extension = contentType.split('/')[1] || 'jpg';
    }

    const filename = customName || `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${extension}`;
    const filePath = `photos/${filename}`;

    // Try 'media' bucket first, fallback to 'videos'
    let bucket = STORAGE_BUCKET_MEDIA;
    let { data, error } = await supabase.storage.from(bucket).upload(filePath, fileBlob, {
      cacheControl: '3600',
      upsert: true,
      contentType,
    });

    if (error) {
      bucket = STORAGE_BUCKET_VIDEOS;
      const secondAttempt = await supabase.storage.from(bucket).upload(filePath, fileBlob, {
        cacheControl: '3600',
        upsert: true,
        contentType,
      });
      if (secondAttempt.error) {
        throw new Error(secondAttempt.error.message);
      }
      data = secondAttempt.data;
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return {
      success: true,
      url: publicUrlData.publicUrl,
    };
  } catch (err: any) {
    console.warn('[Supabase Image Upload Error]', err);
    return {
      success: false,
      error: err?.message || 'Failed to upload photo to Supabase',
    };
  }
}

/**
 * Sync Video Clips from Supabase Database ('clips' table)
 */
export async function fetchClipsFromSupabase(): Promise<{ success: boolean; clips: VideoClip[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('clips')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // Table might not exist yet
      return { success: false, clips: [], error: error.message };
    }

    if (data && Array.isArray(data)) {
      const formattedClips: VideoClip[] = data
        .filter(item => {
          const url = item.video_url || item.videoUrl;
          if (!url || typeof url !== 'string' || url.trim() === '') return false;
          if (url.startsWith('blob:') || url.startsWith('idb:')) {
            console.warn(`[Supabase DB] Skipping clip ${item.id} because video_url is a local-only blob/idb URL (${url})`);
            return false;
          }
          return true;
        })
        .map(item => ({
          id: item.id,
          title: item.title,
          description: item.description || '',
          videoUrl: item.video_url || item.videoUrl,
          posterUrl: item.poster_url || item.posterUrl,
          creator: {
            name: item.creator_name || item.creator?.name || 'Creator',
            username: item.creator_username || item.creator?.username || 'creator',
            avatar: item.creator_avatar || item.creator?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
            isVerified: item.creator_verified ?? item.creator?.isVerified ?? true,
          },
          duration: item.duration || 10,
          aspectRatio: item.aspect_ratio || item.aspectRatio || '16:9',
          category: item.category || 'Jamaica Heat',
          tags: Array.isArray(item.tags) ? item.tags : (typeof item.tags === 'string' ? JSON.parse(item.tags) : ['IslandHeat']),
          views: item.views || 0,
          likes: item.likes || 0,
          loopsCount: item.loops_count || item.loopsCount || 0,
          hasAudio: item.has_audio ?? item.hasAudio ?? true,
          createdAt: item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recently',
          isHD: item.is_hd ?? item.isHD ?? true,
          is4K: item.is_4k ?? item.is4K ?? true,
          isUserUploaded: true,
          isPaywalled: item.is_paywalled ?? item.isPaywalled ?? false,
          priceTokens: item.price_tokens || item.priceTokens || 0,
          unlockedUserIds: item.unlocked_user_ids || item.unlockedUserIds || [],
        }));

      return { success: true, clips: formattedClips };
    }

    return { success: true, clips: [] };
  } catch (err: any) {
    return { success: false, clips: [], error: err?.message };
  }
}

/**
 * Save a new Clip directly to Supabase Database
 */
export async function saveClipToSupabase(clip: VideoClip): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      id: clip.id,
      title: clip.title,
      description: clip.description,
      video_url: clip.videoUrl,
      poster_url: clip.posterUrl,
      creator_name: clip.creator.name,
      creator_username: clip.creator.username,
      creator_avatar: clip.creator.avatar,
      creator_verified: clip.creator.isVerified,
      duration: clip.duration,
      aspect_ratio: clip.aspectRatio,
      category: clip.category,
      tags: clip.tags,
      views: clip.views || 0,
      likes: clip.likes || 0,
      loops_count: clip.loopsCount || 0,
      has_audio: clip.hasAudio,
      is_hd: clip.isHD,
      is_4k: clip.is4K,
      is_paywalled: clip.isPaywalled || false,
      price_tokens: clip.priceTokens || 0,
      unlocked_user_ids: clip.unlockedUserIds || [],
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('clips').upsert(payload, { onConflict: 'id' });
    if (error) throw error;

    return { success: true };
  } catch (err: any) {
    console.warn('[Supabase DB Save Clip Error]', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Save / Sync Creator Images in Supabase Database
 */
export async function saveCreatorImageToSupabase(image: CreatorImage): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      id: image.id,
      creator_username: image.creatorUsername,
      creator_name: image.creatorName,
      creator_avatar: image.creatorAvatar,
      image_url: image.imageUrl,
      title: image.title,
      description: image.description,
      tags: image.tags,
      is_paywalled: image.isPaywalled,
      price_tokens: image.priceTokens,
      unlocked_user_ids: image.unlockedUserIds || [],
      likes: image.likes || 0,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('creator_images').upsert(payload, { onConflict: 'id' });
    if (error) throw error;

    return { success: true };
  } catch (err: any) {
    console.warn('[Supabase DB Save Creator Image Error]', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Delete Clip from Supabase Database
 */
export async function deleteClipFromSupabase(clipId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('clips').delete().eq('id', clipId);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.warn('[Supabase DB Delete Clip Error]', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Delete Creator Image / Gallery from Supabase Database
 */
export async function deleteCreatorImageFromSupabase(imageId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('creator_images').delete().eq('id', imageId);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.warn('[Supabase DB Delete Creator Image Error]', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Fetch Creator Images from Supabase
 */
export async function fetchCreatorImagesFromSupabase(): Promise<{ success: boolean; images: CreatorImage[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('creator_images')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (data && Array.isArray(data)) {
      const formatted: CreatorImage[] = data.map(item => ({
        id: item.id,
        creatorUsername: item.creator_username,
        creatorName: item.creator_name,
        creatorAvatar: item.creator_avatar,
        imageUrl: item.image_url,
        title: item.title,
        description: item.description || '',
        tags: Array.isArray(item.tags) ? item.tags : ['IslandHeat'],
        isPaywalled: item.is_paywalled || false,
        priceTokens: item.price_tokens || 0,
        unlockedUserIds: item.unlocked_user_ids || [],
        createdAt: item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recently',
        likes: item.likes || 0,
      }));
      return { success: true, images: formatted };
    }
    return { success: true, images: [] };
  } catch (err: any) {
    return { success: false, images: [], error: err?.message };
  }
}

/**
 * Fetch Comments for a Clip from Supabase
 */
export async function fetchCommentsFromSupabase(clipId: string): Promise<{ success: boolean; comments: Comment[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('clip_id', clipId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (data && Array.isArray(data)) {
      const formatted: Comment[] = data.map(item => ({
        id: item.id,
        user: item.user_name || item.user || 'User',
        avatar: item.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
        text: item.text,
        createdAt: item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
        likes: item.likes || 0,
      }));
      return { success: true, comments: formatted };
    }
    return { success: true, comments: [] };
  } catch (err: any) {
    return { success: false, comments: [], error: err?.message };
  }
}

/**
 * Save a new comment to Supabase
 */
export async function saveCommentToSupabase(clipId: string, comment: Comment): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      id: comment.id,
      clip_id: clipId,
      user_name: comment.user,
      avatar: comment.avatar,
      text: comment.text,
      likes: comment.likes || 0,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('comments').upsert(payload, { onConflict: 'id' });
    if (error) throw error;

    return { success: true };
  } catch (err: any) {
    console.warn('[Supabase DB Save Comment Error]', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Save / Update User / Creator Profile in Supabase
 */
export async function saveUserProfileToSupabase(profile: Partial<UserAccount>): Promise<{ success: boolean; error?: string }> {
  try {
    if (!profile.username) return { success: false, error: 'Username required' };

    const payload = {
      id: profile.id || `user_${profile.username}`,
      username: profile.username.toLowerCase(),
      display_name: profile.displayName || profile.username,
      email: profile.email || `${profile.username}@islandheat.tv`,
      avatar: profile.avatar,
      bio: profile.bio || '',
      role: profile.role || 'creator',
      is_verified: profile.isVerified ?? true,
      tokens_balance: profile.tokensBalance ?? 0,
      earned_tokens: profile.earnedTokens ?? 0,
      earnings_usd: profile.earningsUSD ?? 0,
      social_links: profile.socialLinks || {},
      location: profile.location || 'Caribbean',
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'username' });
    if (error) throw error;

    return { success: true };
  } catch (err: any) {
    console.warn('[Supabase DB Save Profile Error]', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Fetch User / Creator Profile from Supabase
 */
export async function fetchUserProfileFromSupabase(username: string): Promise<{ success: boolean; profile?: Partial<UserAccount>; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username.toLowerCase())
      .maybeSingle();

    if (error) throw error;
    if (!data) return { success: false, error: 'Profile not found' };

    const profile: Partial<UserAccount> = {
      id: data.id,
      username: data.username,
      displayName: data.display_name,
      email: data.email,
      avatar: data.avatar,
      bio: data.bio,
      role: data.role,
      isVerified: data.is_verified,
      tokensBalance: data.tokens_balance,
      earnedTokens: data.earned_tokens,
      earningsUSD: data.earnings_usd,
      socialLinks: data.social_links,
      location: data.location,
    };

    return { success: true, profile };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * Log Likes in Supabase
 */
export async function saveLikeToSupabase(clipId: string, userId: string, isLiked: boolean): Promise<{ success: boolean }> {
  try {
    if (isLiked) {
      await supabase.from('likes').upsert({
        id: `like_${userId}_${clipId}`,
        clip_id: clipId,
        user_id: userId,
        created_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    } else {
      await supabase.from('likes').delete().match({ clip_id: clipId, user_id: userId });
    }
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

/**
 * Log Follow / Unfollow in Supabase
 */
export async function saveFollowToSupabase(followerUsername: string, creatorUsername: string, isFollowing: boolean): Promise<{ success: boolean }> {
  try {
    if (isFollowing) {
      await supabase.from('follows').upsert({
        id: `follow_${followerUsername}_${creatorUsername}`,
        follower_username: followerUsername.toLowerCase(),
        creator_username: creatorUsername.toLowerCase(),
        created_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    } else {
      await supabase.from('follows').delete().match({
        follower_username: followerUsername.toLowerCase(),
        creator_username: creatorUsername.toLowerCase(),
      });
    }
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

/**
 * Save / Log Token Transaction (Payment) in Supabase
 */
export async function saveTransactionToSupabase(tx: TokenTransaction): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      id: tx.id,
      user_id: tx.userId,
      username: tx.username,
      tokens: tx.tokens,
      bonus_tokens: tx.bonusTokens || 0,
      cost_usd: tx.costUSD,
      payment_method: tx.method,
      status: tx.status || 'completed',
      created_at: tx.createdAt === 'Just now' ? new Date().toISOString() : tx.createdAt,
    };

    const { error } = await supabase.from('transactions').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.warn('[Supabase Save Transaction Error]', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Fetch all Token Transactions from Supabase
 */
export async function fetchTransactionsFromSupabase(): Promise<{ success: boolean; transactions: TokenTransaction[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (data && Array.isArray(data)) {
      const formatted: TokenTransaction[] = data.map(item => ({
        id: item.id,
        userId: item.user_id,
        username: item.username,
        tokens: Number(item.tokens) || 0,
        bonusTokens: Number(item.bonus_tokens) || 0,
        costUSD: Number(item.cost_usd) || 0,
        method: item.payment_method || 'paypal',
        status: item.status || 'completed',
        createdAt: item.created_at ? new Date(item.created_at).toLocaleString() : 'Recent',
      }));
      return { success: true, transactions: formatted };
    }
    return { success: true, transactions: [] };
  } catch (err: any) {
    return { success: false, transactions: [], error: err?.message };
  }
}

/**
 * Save Coin Ledger Event (Unlock, Tip, Grant, Payout, Purchase) in Supabase
 */
export async function saveCoinLedgerToSupabase(log: CoinLedgerItem): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      id: log.id,
      user_id: log.userId,
      username: log.username,
      event_type: log.eventType,
      tokens_amount: log.tokensAmount,
      target_id: log.targetId || null,
      target_creator: log.targetCreator || null,
      usd_equivalent: log.usdEquivalent || (Math.abs(log.tokensAmount) * 0.10),
      description: log.description,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('coin_ledger').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.warn('[Supabase Save Coin Ledger Error]', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Fetch Coin Ledger Events from Supabase
 */
export async function fetchCoinLedgerFromSupabase(): Promise<{ success: boolean; ledger: CoinLedgerItem[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('coin_ledger')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (data && Array.isArray(data)) {
      const formatted: CoinLedgerItem[] = data.map(item => ({
        id: item.id,
        userId: item.user_id,
        username: item.username,
        eventType: item.event_type,
        tokensAmount: Number(item.tokens_amount) || 0,
        targetId: item.target_id || undefined,
        targetCreator: item.target_creator || undefined,
        usdEquivalent: Number(item.usd_equivalent) || 0,
        description: item.description || '',
        createdAt: item.created_at ? new Date(item.created_at).toLocaleString() : 'Recent',
      }));
      return { success: true, ledger: formatted };
    }
    return { success: true, ledger: [] };
  } catch (err: any) {
    return { success: false, ledger: [], error: err?.message };
  }
}

/**
 * Save / Update Payout Request in Supabase
 */
export async function savePayoutRequestToSupabase(req: PayoutRequest): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      id: req.id,
      creator_id: req.creatorId,
      creator_username: req.creatorUsername,
      creator_name: req.creatorName,
      tokens_exchanged: req.tokensExchanged,
      amount_usd: req.amountUSD,
      method: req.method,
      destination_details: req.destinationDetails,
      status: req.status,
      admin_notes: req.adminNotes || '',
      requested_at: req.requestedAt === 'Just now' ? new Date().toISOString() : req.requestedAt,
      processed_at: req.processedAt || (req.status !== 'pending' ? new Date().toISOString() : null),
    };

    const { error } = await supabase.from('payout_requests').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.warn('[Supabase Save Payout Request Error]', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Fetch all Creator Payout Requests from Supabase
 */
export async function fetchPayoutRequestsFromSupabase(): Promise<{ success: boolean; requests: PayoutRequest[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('payout_requests')
      .select('*')
      .order('requested_at', { ascending: false });

    if (error) throw error;

    if (data && Array.isArray(data)) {
      const formatted: PayoutRequest[] = data.map(item => ({
        id: item.id,
        creatorId: item.creator_id,
        creatorUsername: item.creator_username,
        creatorName: item.creator_name,
        tokensExchanged: Number(item.tokens_exchanged) || 0,
        amountUSD: Number(item.amount_usd) || 0,
        method: item.method || 'paypal',
        destinationDetails: item.destination_details || '',
        status: item.status || 'pending',
        adminNotes: item.admin_notes || '',
        requestedAt: item.requested_at ? new Date(item.requested_at).toLocaleString() : 'Recent',
        processedAt: item.processed_at ? new Date(item.processed_at).toLocaleString() : undefined,
      }));
      return { success: true, requests: formatted };
    }
    return { success: true, requests: [] };
  } catch (err: any) {
    return { success: false, requests: [], error: err?.message };
  }
}

/**
 * Save Unlocked Post / Media in Supabase
 */
export async function saveUnlockedItemToSupabase(unlocked: UnlockedItem): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      id: unlocked.id,
      user_id: unlocked.userId,
      item_id: unlocked.itemId,
      item_type: unlocked.itemType,
      tokens_spent: unlocked.tokensSpent,
      creator_username: unlocked.creatorUsername || null,
      unlocked_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('unlocked_items').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.warn('[Supabase Save Unlocked Item Error]', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Fetch all Unlocked Items from Supabase
 */
export async function fetchUnlockedItemsFromSupabase(): Promise<{ success: boolean; items: UnlockedItem[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('unlocked_items')
      .select('*')
      .order('unlocked_at', { ascending: false });

    if (error) throw error;

    if (data && Array.isArray(data)) {
      const formatted: UnlockedItem[] = data.map(item => ({
        id: item.id,
        userId: item.user_id,
        itemId: item.item_id,
        itemType: item.item_type || 'clip',
        tokensSpent: Number(item.tokens_spent) || 0,
        creatorUsername: item.creator_username || undefined,
        unlockedAt: item.unlocked_at ? new Date(item.unlocked_at).toLocaleString() : 'Recent',
      }));
      return { success: true, items: formatted };
    }
    return { success: true, items: [] };
  } catch (err: any) {
    return { success: false, items: [], error: err?.message };
  }
}

/**
 * SQL Schema Template for creating tables in Supabase SQL Editor
 */
export const SUPABASE_SQL_SCHEMA = `-- ==========================================
-- IslandHeat Production Supabase Database Schema
-- Run this in your Supabase SQL Editor:
-- (https://supabase.com/dashboard/project/_/sql)
-- ==========================================

-- 1. Create Clips Table
CREATE TABLE IF NOT EXISTS public.clips (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  poster_url TEXT,
  creator_name TEXT,
  creator_username TEXT,
  creator_avatar TEXT,
  creator_verified BOOLEAN DEFAULT true,
  duration INT DEFAULT 10,
  aspect_ratio TEXT DEFAULT '16:9',
  category TEXT DEFAULT 'Jamaica Heat',
  tags JSONB DEFAULT '["IslandHeat"]'::jsonb,
  views INT DEFAULT 0,
  likes INT DEFAULT 0,
  loops_count INT DEFAULT 0,
  has_audio BOOLEAN DEFAULT true,
  is_hd BOOLEAN DEFAULT true,
  is_4k BOOLEAN DEFAULT true,
  is_paywalled BOOLEAN DEFAULT false,
  price_tokens INT DEFAULT 0,
  unlocked_user_ids JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Creator Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  email TEXT,
  avatar TEXT,
  bio TEXT,
  role TEXT DEFAULT 'creator',
  is_verified BOOLEAN DEFAULT true,
  tokens_balance INT DEFAULT 0,
  earned_tokens INT DEFAULT 0,
  earnings_usd NUMERIC(10,2) DEFAULT 0.00,
  social_links JSONB DEFAULT '{}'::jsonb,
  location TEXT DEFAULT 'Caribbean',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Creator Images Table (Photos & Galleries)
CREATE TABLE IF NOT EXISTS public.creator_images (
  id TEXT PRIMARY KEY,
  creator_username TEXT NOT NULL,
  creator_name TEXT,
  creator_avatar TEXT,
  image_url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tags JSONB DEFAULT '["IslandHeat"]'::jsonb,
  is_paywalled BOOLEAN DEFAULT false,
  price_tokens INT DEFAULT 0,
  unlocked_user_ids JSONB DEFAULT '[]'::jsonb,
  likes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
  id TEXT PRIMARY KEY,
  clip_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  avatar TEXT,
  text TEXT NOT NULL,
  likes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Likes Table
CREATE TABLE IF NOT EXISTS public.likes (
  id TEXT PRIMARY KEY,
  clip_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create Follows Table
CREATE TABLE IF NOT EXISTS public.follows (
  id TEXT PRIMARY KEY,
  follower_username TEXT NOT NULL,
  creator_username TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create Payment Transactions Table (Token Purchases)
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  tokens INT NOT NULL,
  bonus_tokens INT DEFAULT 0,
  cost_usd NUMERIC(10,2) NOT NULL,
  payment_method TEXT DEFAULT 'paypal',
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create Coin Ledger Table (Token Inflow/Outflow Records)
CREATE TABLE IF NOT EXISTS public.coin_ledger (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'purchase', 'unlock_clip', 'unlock_image', 'tip_creator', 'admin_grant', 'payout_exchange'
  tokens_amount INT NOT NULL,
  target_id TEXT,
  target_creator TEXT,
  usd_equivalent NUMERIC(10,2) DEFAULT 0.00,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Create Creator Payout Requests Table (Withdrawals)
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL,
  creator_username TEXT NOT NULL,
  creator_name TEXT NOT NULL,
  tokens_exchanged INT NOT NULL,
  amount_usd NUMERIC(10,2) NOT NULL,
  method TEXT NOT NULL, -- 'paypal', 'bank_transfer'
  destination_details TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  admin_notes TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- 10. Create Unlocked Items Table (Audit Trail of Unlocked VIP Media)
CREATE TABLE IF NOT EXISTS public.unlocked_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL, -- 'clip', 'image'
  tokens_spent INT NOT NULL,
  creator_username TEXT,
  unlocked_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Enable Row Level Security (RLS) & Public Policies
ALTER TABLE public.clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unlocked_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on clips" ON public.clips FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on clips" ON public.clips FOR ALL USING (true);

CREATE POLICY "Allow public read on profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on profiles" ON public.profiles FOR ALL USING (true);

CREATE POLICY "Allow public read on creator_images" ON public.creator_images FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on creator_images" ON public.creator_images FOR ALL USING (true);

CREATE POLICY "Allow public read on comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on comments" ON public.comments FOR ALL USING (true);

CREATE POLICY "Allow public read on likes" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Allow public insert/delete on likes" ON public.likes FOR ALL USING (true);

CREATE POLICY "Allow public read on follows" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Allow public insert/delete on follows" ON public.follows FOR ALL USING (true);

CREATE POLICY "Allow public read on transactions" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on transactions" ON public.transactions FOR ALL USING (true);

CREATE POLICY "Allow public read on coin_ledger" ON public.coin_ledger FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on coin_ledger" ON public.coin_ledger FOR ALL USING (true);

CREATE POLICY "Allow public read on payout_requests" ON public.payout_requests FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on payout_requests" ON public.payout_requests FOR ALL USING (true);

CREATE POLICY "Allow public read on unlocked_items" ON public.unlocked_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on unlocked_items" ON public.unlocked_items FOR ALL USING (true);
`;
