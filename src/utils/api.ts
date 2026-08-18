import { VideoClip, UserAccount, SiteBranding, PayoutRequest, TokenTransaction } from '../types';
import { 
  getStoredUserAccount, 
  saveStoredUserAccount, 
  getAllClips, 
  saveStoredClips,
  getStoredPayoutRequests,
  saveStoredPayoutRequests,
  getSiteBranding,
  saveSiteBranding,
  getAdminCredentials,
  saveAdminCredentials,
  GUEST_USER_ACCOUNT
} from './storage';

// Base API request wrapper with graceful fallback
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<{ data: T | null; error?: string }> {
  try {
    const res = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(options?.headers || {}),
      },
    });

    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || contentType.includes('text/html')) {
      return { data: null, error: 'Backend route handled via local storage fallback' };
    }

    const data = await res.json().catch(() => null);
    if (!data) {
      return { data: null, error: 'Invalid JSON response from server' };
    }
    return { data };
  } catch (err: any) {
    // Graceful offline fallback
    console.warn(`[API] Fallback for ${endpoint}:`, err?.message || err);
    return { data: null, error: err?.message || 'Network unavailable' };
  }
}

// 1. Clips
export async function fetchClipsApi(): Promise<{ success: boolean; clips?: VideoClip[] }> {
  const res = await apiRequest<{ success: boolean; clips: VideoClip[] }>('/api/clips');
  if (res.data?.clips) {
    return { success: true, clips: res.data.clips };
  }
  return { success: true, clips: getAllClips() };
}

export async function createClipApi(clip: VideoClip): Promise<{ success: boolean; clip?: VideoClip }> {
  const res = await apiRequest<{ success: boolean; clip: VideoClip }>('/api/clips', {
    method: 'POST',
    body: JSON.stringify(clip),
  });
  return { success: !!res.data?.clip, clip: res.data?.clip || clip };
}

export async function syncClipsFromServer(): Promise<VideoClip[]> {
  const res = await apiRequest<{ success: boolean; clips: VideoClip[] }>('/api/clips');
  if (res.data && Array.isArray(res.data.clips) && res.data.clips.length > 0) {
    saveStoredClips(res.data.clips);
    return res.data.clips;
  }
  return getAllClips();
}

export async function uploadClipToServer(clip: VideoClip): Promise<VideoClip> {
  const res = await apiRequest<{ success: boolean; clip: VideoClip }>('/api/clips', {
    method: 'POST',
    body: JSON.stringify(clip),
  });
  if (res.data?.clip) {
    return res.data.clip;
  }
  return clip;
}

export async function updateClipOnServer(id: string, updates: Partial<VideoClip>): Promise<void> {
  await apiRequest(`/api/clips/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteClipOnServer(id: string): Promise<void> {
  await apiRequest(`/api/clips/${id}`, {
    method: 'DELETE',
  });
}

export async function unlockClipOnServer(clipId: string, userId: string, tokensCost: number): Promise<{ success: boolean; user?: UserAccount }> {
  const res = await apiRequest<{ success: boolean; clip: VideoClip; user: UserAccount }>(`/api/clips/${clipId}/unlock`, {
    method: 'POST',
    body: JSON.stringify({ userId, tokensCost }),
  });
  if (res.data?.success && res.data.user) {
    saveStoredUserAccount(res.data.user);
    return { success: true, user: res.data.user };
  }
  return { success: res.data?.success || false };
}

// 1b. Branding
export async function fetchBrandingApi(): Promise<{ success: boolean; branding?: SiteBranding }> {
  const res = await apiRequest<{ success: boolean; branding: SiteBranding }>('/api/branding');
  if (res.data?.branding) {
    return { success: true, branding: res.data.branding };
  }
  return { success: true, branding: getSiteBranding() };
}

export async function saveBrandingApi(branding: Partial<SiteBranding>): Promise<{ success: boolean; branding?: SiteBranding }> {
  const res = await apiRequest<{ success: boolean; branding: SiteBranding }>('/api/branding', {
    method: 'PUT',
    body: JSON.stringify(branding),
  });
  if (res.data?.branding) {
    saveSiteBranding(res.data.branding);
    return { success: true, branding: res.data.branding };
  }
  return { success: true, branding: saveSiteBranding(branding) };
}

// 1c. Tokens
export async function updateUserTokensApi(
  username: string,
  tokensBalance: number,
  earnedTokens?: number,
  earningsUSD?: number
): Promise<{ success: boolean }> {
  const res = await apiRequest<{ success: boolean }>('/api/users/tokens-balance', {
    method: 'PUT',
    body: JSON.stringify({ username, tokensBalance, earnedTokens, earningsUSD }),
  });
  return { success: !!res.data?.success };
}

// 2. Auth & Presence Heartbeat
export async function registerUserApi(userData: {
  username: string;
  displayName: string;
  email: string;
  password?: string;
  role?: 'user' | 'creator';
  avatar?: string;
  bio?: string;
  location?: string;
}): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  const res = await apiRequest<{ success: boolean; user: UserAccount; error?: string }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });

  if (res.data?.success && res.data.user) {
    saveStoredUserAccount(res.data.user);
    return { success: true, user: res.data.user };
  }
  return { success: false, error: res.data?.error || res.error || 'Registration failed' };
}

export async function loginUserApi(credentials: {
  username: string;
  password?: string;
}): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  const res = await apiRequest<{ success: boolean; user: UserAccount; error?: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  if (res.data?.success && res.data.user) {
    saveStoredUserAccount(res.data.user);
    return { success: true, user: res.data.user };
  }
  return { success: false, error: res.data?.error || res.error || 'Login failed' };
}

export async function sendHeartbeatApi(userId?: string, username?: string): Promise<{ onlineCount: number }> {
  const res = await apiRequest<{ success: boolean; onlineCount: number }>('/api/auth/heartbeat', {
    method: 'POST',
    body: JSON.stringify({ userId, username }),
  });
  return { onlineCount: res.data?.onlineCount || 1 };
}

export async function logoutUserApi(userId?: string): Promise<void> {
  if (userId && userId !== 'guest') {
    await apiRequest('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }
}

// 3. User Profile Update
export async function updateUserProfileApi(userId: string, updates: Partial<UserAccount>): Promise<UserAccount | null> {
  const res = await apiRequest<{ success: boolean; user: UserAccount }>('/api/users/profile', {
    method: 'PUT',
    body: JSON.stringify({ userId, ...updates }),
  });

  if (res.data?.user) {
    saveStoredUserAccount(res.data.user);
    return res.data.user;
  }
  return null;
}

// 4. Admin API Methods (Users Management, Online/Last Online, Banning, Tokens)
export interface AdminUserListItem extends UserAccount {
  isOnline: boolean;
  isNewUser: boolean;
  lastSeenDiffMinutes?: number;
}

export async function fetchAdminUsersApi(): Promise<{
  totalUsers: number;
  onlineUsersCount: number;
  newUsersCount: number;
  users: AdminUserListItem[];
}> {
  const res = await apiRequest<{
    success: boolean;
    totalUsers: number;
    onlineUsersCount: number;
    newUsersCount: number;
    users: AdminUserListItem[];
  }>('/api/admin/users');

  if (res.data?.users) {
    return {
      totalUsers: res.data.totalUsers || res.data.users.length,
      onlineUsersCount: res.data.onlineUsersCount || 0,
      newUsersCount: res.data.newUsersCount || 0,
      users: res.data.users,
    };
  }

  return {
    totalUsers: 0,
    onlineUsersCount: 0,
    newUsersCount: 0,
    users: [],
  };
}

export async function adminToggleBanUserApi(userId: string): Promise<{ success: boolean; isBanned?: boolean }> {
  const res = await apiRequest<{ success: boolean; isBanned: boolean }>(`/api/admin/users/${userId}/ban`, {
    method: 'POST',
  });
  return { success: res.data?.success || false, isBanned: res.data?.isBanned };
}

export async function adminGrantTokensApi(userId: string, amount: number): Promise<{ success: boolean; tokensBalance?: number }> {
  const res = await apiRequest<{ success: boolean; tokensBalance: number }>(`/api/admin/users/${userId}/tokens`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
  return { success: res.data?.success || false, tokensBalance: res.data?.tokensBalance };
}

export async function adminToggleVerifyApi(userId: string): Promise<{ success: boolean; isVerified?: boolean }> {
  const res = await apiRequest<{ success: boolean; isVerified: boolean }>(`/api/admin/users/${userId}/verify`, {
    method: 'POST',
  });
  return { success: res.data?.success || false, isVerified: res.data?.isVerified };
}

export async function adminChangeRoleApi(userId: string, role: 'user' | 'creator' | 'admin'): Promise<{ success: boolean }> {
  const res = await apiRequest<{ success: boolean }>(`/api/admin/users/${userId}/role`, {
    method: 'POST',
    body: JSON.stringify({ role }),
  });
  return { success: res.data?.success || false };
}

export async function adminDeleteUserApi(userId: string): Promise<{ success: boolean }> {
  const res = await apiRequest<{ success: boolean }>(`/api/admin/users/${userId}`, {
    method: 'DELETE',
  });
  return { success: res.data?.success || false };
}

export async function fetchAdminStatsApi(): Promise<any> {
  const res = await apiRequest<{ success: boolean; stats: any }>('/api/admin/stats');
  return res.data?.stats || null;
}

export async function adminBoostStatsApi(params: {
  category?: string;
  viewsToAdd: number;
  likesToAdd: number;
  clipId?: string;
}): Promise<{ success: boolean; updatedCount: number }> {
  const res = await apiRequest<{ success: boolean; updatedCount: number }>('/api/admin/boost-stats', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return { success: res.data?.success || false, updatedCount: res.data?.updatedCount || 0 };
}
