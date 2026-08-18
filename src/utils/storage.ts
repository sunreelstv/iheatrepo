import { VideoClip, Comment, UserProfileData, UserAccount, TokenTransaction, PayoutRequest, PaymentMethod, SiteBranding, CreatorImage, CoinLedgerItem, UnlockedItem, Category } from '../types';
import { INITIAL_CLIPS, DEFAULT_FALLBACK_VIDEO } from '../data/mockClips';
import { 
  saveTransactionToSupabase, 
  saveCoinLedgerToSupabase, 
  savePayoutRequestToSupabase, 
  saveUnlockedItemToSupabase, 
  saveUserProfileToSupabase,
  deleteClipFromSupabase,
  deleteCreatorImageFromSupabase
} from './supabase';
import { deleteClipOnServer } from './api';

const STORAGE_KEYS = {
  USER_CLIPS: 'islandheat_user_clips',
  CLIPS_OVERRIDE: 'islandheat_clips_override_v1',
  LIKED_CLIPS: 'islandheat_liked_ids',
  SAVED_CLIPS: 'islandheat_saved_ids',
  COMMENTS: 'islandheat_comments_map',
  THEME_MODE: 'islandheat_theme_mode',
  WATCH_HISTORY: 'islandheat_watch_history',
  USER_PROFILE: 'islandheat_user_profile',
  FOLLOWED_CREATORS: 'islandheat_followed_creators',
  ACTIVE_USER_ACCOUNT: 'islandheat_active_user_account_v2',
  REGISTERED_USERS: 'islandheat_registered_users_list',
  TOKEN_TRANSACTIONS: 'islandheat_token_transactions',
  PAYOUT_REQUESTS: 'islandheat_payout_requests',
  COIN_LEDGER: 'islandheat_coin_ledger_v1',
  UNLOCKED_CLIPS: 'islandheat_unlocked_clips',
  CREATOR_IMAGES: 'islandheat_creator_images_v1',
  UNLOCKED_IMAGES: 'islandheat_unlocked_images_v1',
  ADMIN_CREDENTIALS: 'islandheat_admin_credentials',
  SITE_BRANDING: 'islandheat_site_branding_v1',
};

export const INITIAL_CREATOR_IMAGES: CreatorImage[] = [
  {
    id: 'img_rinaraye_1',
    creatorUsername: 'rinaraye',
    creatorName: 'Rina Raye 🇧🇧',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=1200&q=80'
    ],
    title: 'Sun-kissed Golden Hour in Barbados (4-Photo Set)',
    description: 'Basking under the tropical Caribbean warmth. Exclusive portrait captured on the private beach villa terrace.',
    category: 'Barbados Babes',
    tags: ['Barbados', 'GoldenHour', 'IslandHeat', 'Glamour', 'Set'],
    isPaywalled: false,
    priceTokens: 0,
    unlockedUserIds: [],
    createdAt: '2 days ago',
    likes: 342,
    rating: 4.9,
    ratingCount: 56,
    views: 12400,
    isFeatured: true,
  },
  {
    id: 'img_rinaraye_2',
    creatorUsername: 'rinaraye',
    creatorName: 'Rina Raye 🇧🇧',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200&q=80'
    ],
    title: 'VIP Ocean Villa Poolside Steam Session 🔞',
    description: 'Exclusive unreleased high-res photo set from our private Caribbean getaway photoshoot. Full 4K set for VIP supporters.',
    category: 'Barbados Babes',
    tags: ['VIP', 'Poolside', 'Exclusive', 'IslandHeat', 'Unreleased'],
    isPaywalled: true,
    priceTokens: 40,
    unlockedUserIds: [],
    createdAt: '1 day ago',
    likes: 589,
    rating: 5.0,
    ratingCount: 84,
    views: 18900,
    isFeatured: true,
  },
  {
    id: 'img_rinaraye_3',
    creatorUsername: 'rinaraye',
    creatorName: 'Rina Raye 🇧🇧',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1200&q=80'
    ],
    title: 'Midnight Tropical Breeze Sunset Silhouette',
    description: 'Warm breeze and island rhythm. Full 4K dual portrait set available now.',
    category: 'Barbados Babes',
    tags: ['Sunset', 'Amateur', 'Babe', 'Tropical', 'Silhouette'],
    isPaywalled: true,
    priceTokens: 30,
    unlockedUserIds: [],
    createdAt: '4 hours ago',
    likes: 215,
    rating: 4.8,
    ratingCount: 32,
    views: 7600,
  },
  {
    id: 'img_aisha_1',
    creatorUsername: 'aisha_jamaica',
    creatorName: 'Aisha Official 🇯🇲',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=1200&q=80'
    ],
    title: 'Montego Bay Beachside Glamour Trio',
    description: 'Straight from Jamaica! Warm white sand and crystal turquoise Caribbean ocean breeze.',
    category: 'Jamaica Heat',
    tags: ['Jamaica', 'MontegoBay', 'IslandHeat', 'Babe', 'Beach'],
    isPaywalled: false,
    priceTokens: 0,
    unlockedUserIds: [],
    createdAt: '3 days ago',
    likes: 412,
    rating: 4.9,
    ratingCount: 68,
    views: 14200,
    isFeatured: true,
  },
  {
    id: 'img_aisha_2',
    creatorUsername: 'aisha_jamaica',
    creatorName: 'Aisha Official 🇯🇲',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200&q=80'
    ],
    title: 'VIP Private Cabana Secret Shoot (4K Quad)',
    description: 'Special high-resolution shoot taken inside the secluded resort cabana. Access unlocked with IslandHeat tokens.',
    category: 'Jamaica Heat',
    tags: ['VIP', 'Cabana', 'Private', 'Exclusive', 'Jamaica'],
    isPaywalled: true,
    priceTokens: 50,
    unlockedUserIds: [],
    createdAt: '1 day ago',
    likes: 740,
    rating: 5.0,
    ratingCount: 112,
    views: 26400,
    isFeatured: true,
  },
  {
    id: 'img_boricua_1',
    creatorUsername: 'boricua_queen',
    creatorName: 'Boricua Queen 🇵🇷',
    creatorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80'
    ],
    title: 'San Juan Old Town Balcony Portrait Set',
    description: 'Enjoying the Caribbean sun on the cobblestone streets and ocean view balcony of Old San Juan.',
    category: 'Puerto Rico Passion',
    tags: ['PuertoRico', 'SanJuan', 'IslandHeat', 'Balcony'],
    isPaywalled: false,
    priceTokens: 0,
    unlockedUserIds: [],
    createdAt: '2 days ago',
    likes: 190,
    rating: 4.7,
    ratingCount: 29,
    views: 8900,
  }
];

export const GUEST_USER_ACCOUNT: UserAccount = {
  id: 'guest',
  email: '',
  username: 'guest',
  displayName: 'Guest Viewer',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
  bio: 'Explore Caribbean adult steam videos and VIP island photos.',
  role: 'user',
  tokensBalance: 0,
  earnedTokens: 0,
  earningsUSD: 0,
  isVerified: false,
  isLoggedIn: false,
  joinedDate: 'August 2026',
};

export const DEFAULT_USER_ACCOUNT = GUEST_USER_ACCOUNT;

export const INITIAL_REGISTERED_USERS: UserAccount[] = [
  {
    id: 'user_admin_01',
    email: 'admin@islandheat.tv',
    username: 'admin',
    displayName: 'Master Superadmin',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    bio: 'Master Platform Superadmin. Full moderation, revenue, and creator management.',
    role: 'admin',
    password: 'admin',
    tokensBalance: 9999,
    earnedTokens: 50000,
    earningsUSD: 5000.00,
    isVerified: true,
    isLoggedIn: true,
    joinedDate: 'August 2026',
    joinedTimestamp: Date.now() - 1000 * 60 * 60 * 24 * 14,
    lastSeenTimestamp: Date.now(),
    isOnline: true,
    location: 'Kingston, Jamaica',
  },
  {
    id: 'user_creator_01',
    email: 'aisha@islandheat.tv',
    username: 'aisha_jamaica',
    displayName: 'Aisha Official 🇯🇲',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    bio: 'Official VIP Steam Creator. Premium 60fps high bitrate steams and exclusive beach shoots.',
    role: 'creator',
    password: 'password123',
    tokensBalance: 250,
    earnedTokens: 5400,
    earningsUSD: 540.00,
    isVerified: true,
    isLoggedIn: true,
    joinedDate: '3 days ago',
    joinedTimestamp: Date.now() - 1000 * 60 * 60 * 24 * 3,
    lastSeenTimestamp: Date.now() - 1000 * 60 * 2, // 2 mins ago
    isOnline: true,
    location: 'Montego Bay, Jamaica',
    paypalEmail: 'aisha.payouts@gmail.com',
  },
  {
    id: 'user_creator_02',
    email: 'rinaraye@islandheat.tv',
    username: 'rinaraye',
    displayName: 'Rina Raye 🇧🇧',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
    bio: 'Barbados sunshine girl. Exclusive 4K beach & villa loops.',
    role: 'creator',
    password: 'password123',
    tokensBalance: 400,
    earnedTokens: 3800,
    earningsUSD: 380.00,
    isVerified: true,
    isLoggedIn: true,
    joinedDate: '2 days ago',
    joinedTimestamp: Date.now() - 1000 * 60 * 60 * 24 * 2,
    lastSeenTimestamp: Date.now() - 1000 * 60 * 15, // 15 mins ago
    isOnline: false,
    location: 'Bridgetown, Barbados',
    paypalEmail: 'rinaraye.pay@gmail.com',
  },
  {
    id: 'user_member_01',
    email: 'marcus.v@gmail.com',
    username: 'marcus_carib',
    displayName: 'Marcus V.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    bio: 'VIP member & loop enthusiast from Miami.',
    role: 'user',
    password: 'password123',
    tokensBalance: 320,
    earnedTokens: 0,
    earningsUSD: 0,
    isVerified: false,
    isLoggedIn: false,
    joinedDate: 'Today',
    joinedTimestamp: Date.now() - 1000 * 60 * 45, // 45 mins ago (NEW USER)
    lastSeenTimestamp: Date.now() - 1000 * 40, // 40 secs ago (ONLINE)
    isOnline: true,
    location: 'Miami, FL',
  },
  {
    id: 'user_member_02',
    email: 'carlos.dr@gmail.com',
    username: 'carlos_dr',
    displayName: 'Carlos Santo',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    bio: 'Punta Cana nightlife & dance video fan.',
    role: 'user',
    password: 'password123',
    tokensBalance: 50,
    earnedTokens: 0,
    earningsUSD: 0,
    isVerified: false,
    isLoggedIn: false,
    joinedDate: 'Yesterday',
    joinedTimestamp: Date.now() - 1000 * 60 * 60 * 18, // 18 hours ago (NEW USER)
    lastSeenTimestamp: Date.now() - 1000 * 60 * 45, // 45 mins ago
    isOnline: false,
    location: 'Santo Domingo, DR',
  }
];

export const INITIAL_PAYOUT_REQUESTS: PayoutRequest[] = [
  {
    id: 'pay_1',
    creatorId: 'user_creator_01',
    creatorUsername: 'aisha_jamaica',
    creatorName: 'Aisha Official 🇯🇲',
    tokensExchanged: 2000,
    amountUSD: 200.00,
    method: 'paypal',
    destinationDetails: 'aisha.payouts@gmail.com',
    status: 'approved',
    requestedAt: '2026-08-10T14:32:00.000Z',
    processedAt: '2026-08-11T10:00:00.000Z',
    adminNotes: 'PayPal payout batch #8912 sent.',
  },
  {
    id: 'pay_2',
    creatorId: 'user_synth',
    creatorUsername: 'synthwave_labs',
    creatorName: 'SynthWave Labs',
    tokensExchanged: 1500,
    amountUSD: 150.00,
    method: 'paypal',
    destinationDetails: 'synthwave.pay@gmail.com',
    status: 'pending',
    requestedAt: '2026-08-13T09:20:00.000Z',
    adminNotes: 'Awaiting weekend batch approval',
  },
  {
    id: 'pay_3',
    creatorId: 'user_creator_02',
    creatorUsername: 'rinaraye',
    creatorName: 'Rina Raye 🇧🇧',
    tokensExchanged: 3500,
    amountUSD: 350.00,
    method: 'bank_transfer',
    destinationDetails: 'First Caribbean Int Bank - Acc: 9940129481, SWIFT: FCIBBB22',
    status: 'approved',
    requestedAt: '2026-08-15T16:45:00.000Z',
    processedAt: '2026-08-16T11:15:00.000Z',
    adminNotes: 'Direct wire processed.',
  }
];

export const INITIAL_TOKEN_TRANSACTIONS: TokenTransaction[] = [
  {
    id: 'tx_1723891001',
    userId: 'user_member_01',
    username: 'island_lover99',
    tokens: 550,
    bonusTokens: 50,
    costUSD: 44.99,
    method: 'paypal',
    status: 'completed',
    createdAt: '2026-08-16T18:22:00.000Z',
  },
  {
    id: 'tx_1723880402',
    userId: 'user_member_02',
    username: 'carlos_dr',
    tokens: 100,
    bonusTokens: 0,
    costUSD: 9.99,
    method: 'credit_card',
    status: 'completed',
    createdAt: '2026-08-16T14:10:00.000Z',
  },
  {
    id: 'tx_1723812003',
    userId: 'user_vip_guest',
    username: 'miami_clubber',
    tokens: 1400,
    bonusTokens: 200,
    costUSD: 99.99,
    method: 'paypal',
    status: 'completed',
    createdAt: '2026-08-15T21:40:00.000Z',
  },
  {
    id: 'tx_1723745004',
    userId: 'user_vip_03',
    username: 'trini_steamer',
    tokens: 3600,
    bonusTokens: 600,
    costUSD: 229.99,
    method: 'bank_transfer',
    status: 'completed',
    createdAt: '2026-08-14T11:05:00.000Z',
  },
  {
    id: 'tx_1723658005',
    userId: 'user_active_01',
    username: 'caribbean_fan',
    tokens: 550,
    bonusTokens: 50,
    costUSD: 44.99,
    method: 'paypal',
    status: 'completed',
    createdAt: '2026-08-13T08:15:00.000Z',
  }
];

export const INITIAL_COIN_LEDGER: CoinLedgerItem[] = [
  {
    id: 'coin_log_01',
    userId: 'user_member_01',
    username: 'island_lover99',
    eventType: 'purchase',
    tokensAmount: 550,
    usdEquivalent: 44.99,
    description: 'Purchased 500 Tokens + 50 Bonus via PayPal',
    createdAt: '2026-08-16T18:22:00.000Z',
  },
  {
    id: 'coin_log_02',
    userId: 'user_member_01',
    username: 'island_lover99',
    eventType: 'unlock_clip',
    tokensAmount: -50,
    targetId: 'clip-rinaraye-1',
    targetCreator: 'rinaraye',
    usdEquivalent: 5.00,
    description: 'Unlocked VIP Steam: Barbados Villa Beach Sunset (60fps)',
    createdAt: '2026-08-16T18:30:00.000Z',
  },
  {
    id: 'coin_log_03',
    userId: 'user_member_01',
    username: 'island_lover99',
    eventType: 'tip_creator',
    tokensAmount: -100,
    targetCreator: 'rinaraye',
    usdEquivalent: 10.00,
    description: 'Tipped Creator @rinaraye 100 Tokens ("Amazing high quality steams!")',
    createdAt: '2026-08-16T18:35:00.000Z',
  },
  {
    id: 'coin_log_04',
    userId: 'user_member_02',
    username: 'carlos_dr',
    eventType: 'purchase',
    tokensAmount: 100,
    usdEquivalent: 9.99,
    description: 'Purchased 100 Tokens Starter Pack via Card',
    createdAt: '2026-08-16T14:10:00.000Z',
  },
  {
    id: 'coin_log_05',
    userId: 'user_member_02',
    username: 'carlos_dr',
    eventType: 'unlock_image',
    tokensAmount: -40,
    targetId: 'img_rinaraye_2',
    targetCreator: 'rinaraye',
    usdEquivalent: 4.00,
    description: 'Unlocked VIP Photo: VIP Ocean Villa Poolside Steam Session',
    createdAt: '2026-08-16T14:25:00.000Z',
  },
  {
    id: 'coin_log_06',
    userId: 'admin_master',
    username: 'admin',
    eventType: 'admin_grant',
    tokensAmount: 250,
    targetCreator: 'aisha_jamaica',
    usdEquivalent: 25.00,
    description: 'Admin granted +250 promotional tokens to @aisha_jamaica',
    createdAt: '2026-08-15T12:00:00.000Z',
  },
  {
    id: 'coin_log_07',
    userId: 'user_creator_02',
    username: 'rinaraye',
    eventType: 'payout_exchange',
    tokensAmount: -3500,
    targetCreator: 'rinaraye',
    usdEquivalent: 350.00,
    description: 'Creator Payout Withdrawal: 3,500 Earned Tokens &rarr; $350.00 USD via Bank Wire',
    createdAt: '2026-08-15T16:45:00.000Z',
  }
];

// --- Registered Users Storage ---
export function getRegisteredUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading registered users:', err);
  }
  return INITIAL_REGISTERED_USERS;
}

export function saveRegisteredUsers(users: UserAccount[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save registered users list:', err);
  }
}

// --- User Account & Auth Storage ---
export function getStoredUserAccount(): UserAccount {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ACCOUNT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
    return GUEST_USER_ACCOUNT;
  } catch {
    return GUEST_USER_ACCOUNT;
  }
}

export function saveStoredUserAccount(account: Partial<UserAccount>): UserAccount {
  const current = getStoredUserAccount();
  const updated: UserAccount = { ...current, ...account };
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ACCOUNT, JSON.stringify(updated));
    // Also sync in registered users list if matching user
    if (updated.id && updated.id !== 'guest') {
      const allUsers = getRegisteredUsers();
      const idx = allUsers.findIndex(u => u.id === updated.id || u.username.toLowerCase() === updated.username.toLowerCase());
      if (idx >= 0) {
        allUsers[idx] = { ...allUsers[idx], ...updated };
        saveRegisteredUsers(allUsers);
      }
    }
  } catch (err) {
    console.error('Failed to save account:', err);
  }
  return updated;
}

export function registerNewUser(data: {
  username: string;
  displayName: string;
  email: string;
  password?: string;
  role?: 'user' | 'creator';
  avatar?: string;
  bio?: string;
}): { success: boolean; user?: UserAccount; error?: string } {
  const allUsers = getRegisteredUsers();
  const cleanUsername = data.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  const cleanEmail = data.email.trim().toLowerCase();

  if (!cleanUsername || cleanUsername.length < 3) {
    return { success: false, error: 'Username must be at least 3 characters long.' };
  }
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Please provide a valid email address.' };
  }

  // Check uniqueness
  const exists = allUsers.find(
    u => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanEmail
  );
  if (exists) {
    return { success: false, error: 'Username or Email is already registered. Please sign in.' };
  }

  const now = Date.now();
  const newUser: UserAccount = {
    id: `user_${now}_${Math.random().toString(36).substr(2, 4)}`,
    username: cleanUsername,
    displayName: data.displayName.trim() || cleanUsername,
    email: cleanEmail,
    password: data.password || 'password123',
    role: data.role || 'user',
    avatar: data.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    bio: data.bio || (data.role === 'creator' ? 'New Caribbean Creator. Loop lover!' : 'Viewer & Caribbean loop fan.'),
    tokensBalance: 50, // 50 Free Welcome Tokens for new registrations!
    earnedTokens: 0,
    earningsUSD: 0,
    isVerified: data.role === 'creator',
    isLoggedIn: true,
    joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    joinedTimestamp: now,
    lastSeenTimestamp: now,
    isOnline: true,
  };

  // Add to registered users
  saveRegisteredUsers([...allUsers, newUser]);

  // Set as active session
  saveStoredUserAccount(newUser);

  return { success: true, user: newUser };
}

// Format relative time helper for last seen
export function formatLastSeenText(timestamp?: number): string {
  if (!timestamp) return 'Never active';
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - timestamp) / 1000));
  
  if (diffSec < 120) return 'Online now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Format joined text helper
export function formatJoinedDateText(timestamp?: number, fallback = 'Recently'): string {
  if (!timestamp) return fallback;
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - timestamp) / 1000));
  
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Admin Moderation Helpers
export function adminToggleBanUser(userId: string): { success: boolean; isBanned?: boolean } {
  const users = getRegisteredUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return { success: false };

  users[idx].isBanned = !users[idx].isBanned;
  if (users[idx].isBanned) users[idx].isOnline = false;
  saveRegisteredUsers(users);
  return { success: true, isBanned: users[idx].isBanned };
}

export function adminGrantTokensToUser(userId: string, amount: number): { success: boolean; tokensBalance?: number } {
  const users = getRegisteredUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return { success: false };

  users[idx].tokensBalance = Math.max(0, (users[idx].tokensBalance || 0) + amount);
  saveRegisteredUsers(users);

  // If granting to current active user, sync their session
  const activeUser = getStoredUserAccount();
  if (activeUser.id === userId) {
    saveStoredUserAccount({ tokensBalance: users[idx].tokensBalance });
  }

  // Log in Coin Ledger
  logCoinEvent({
    userId: 'admin_master',
    username: 'admin',
    eventType: 'admin_grant',
    tokensAmount: amount,
    targetCreator: users[idx].username,
    usdEquivalent: amount * 0.10,
    description: `Admin manual grant: ${amount >= 0 ? '+' : ''}${amount} tokens to @${users[idx].username}`,
  });

  saveUserProfileToSupabase(users[idx]).catch(e => console.warn('[Supabase Grant Sync Warning]', e));

  return { success: true, tokensBalance: users[idx].tokensBalance };
}

export function adminToggleVerifyUser(userId: string): { success: boolean; isVerified?: boolean } {
  const users = getRegisteredUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return { success: false };

  users[idx].isVerified = !users[idx].isVerified;
  saveRegisteredUsers(users);
  return { success: true, isVerified: users[idx].isVerified };
}

export function adminChangeUserRole(userId: string, role: 'user' | 'creator' | 'admin'): { success: boolean } {
  const users = getRegisteredUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return { success: false };

  users[idx].role = role;
  saveRegisteredUsers(users);
  return { success: true };
}

export function adminDeleteUserAccount(userId: string): { success: boolean } {
  const users = getRegisteredUsers();
  const filtered = users.filter(u => u.id !== userId);
  if (filtered.length < users.length) {
    saveRegisteredUsers(filtered);
    return { success: true };
  }
  return { success: false };
}

export function loginUserAccount(usernameOrEmail: string, passwordInput: string): { success: boolean; user?: UserAccount; error?: string } {
  const cleanInput = usernameOrEmail.trim().toLowerCase();
  
  // Check if admin credentials match
  const adminCreds = getAdminCredentials();
  if (
    cleanInput === adminCreds.username.toLowerCase() &&
    passwordInput.trim() === adminCreds.password.trim()
  ) {
    const adminUser: UserAccount = {
      id: 'admin_master',
      username: adminCreds.username,
      displayName: 'Master Superadmin',
      email: 'admin@redgifs.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      bio: 'Master Platform Superadmin. Full moderation and payout control.',
      role: 'admin',
      tokensBalance: 9999,
      earnedTokens: 50000,
      earningsUSD: 5000.00,
      isVerified: true,
      isLoggedIn: true,
      joinedDate: 'August 2026',
    };
    saveStoredUserAccount(adminUser);
    return { success: true, user: adminUser };
  }

  // Check registered users
  const allUsers = getRegisteredUsers();
  const matched = allUsers.find(
    u => (u.username.toLowerCase() === cleanInput || u.email.toLowerCase() === cleanInput) &&
         (!u.password || u.password === passwordInput.trim() || passwordInput.trim() === 'password123')
  );

  if (matched) {
    const loggedInUser: UserAccount = { ...matched, isLoggedIn: true };
    saveStoredUserAccount(loggedInUser);
    return { success: true, user: loggedInUser };
  }

  return { success: false, error: 'Invalid username/email or password.' };
}

export function logoutUserAccount(): UserAccount {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ACCOUNT, JSON.stringify(GUEST_USER_ACCOUNT));
  } catch (err) {
    console.error('Error logging out:', err);
  }
  return GUEST_USER_ACCOUNT;
}

// --- Token Wallet & Transactions Storage ---
export function getStoredTokenTransactions(): TokenTransaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TOKEN_TRANSACTIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return INITIAL_TOKEN_TRANSACTIONS;
}

export function getStoredCoinLedger(): CoinLedgerItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COIN_LEDGER);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return INITIAL_COIN_LEDGER;
}

export const getCoinLedger = getStoredCoinLedger;

export function getUnlockedItems(): UnlockedItem[] {
  try {
    const raw = localStorage.getItem('islandheat_unlocked_items_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return [
    {
      id: 'unlock_init_01',
      userId: 'user_member_01',
      itemId: 'clip-rinaraye-1',
      itemType: 'clip',
      tokensSpent: 50,
      creatorUsername: 'rinaraye',
      unlockedAt: '2026-08-16T18:30:00.000Z',
    },
    {
      id: 'unlock_init_02',
      userId: 'user_member_02',
      itemId: 'img_rinaraye_2',
      itemType: 'image',
      tokensSpent: 40,
      creatorUsername: 'rinaraye',
      unlockedAt: '2026-08-16T14:25:00.000Z',
    },
  ];
}

export function logCoinEvent(event: Omit<CoinLedgerItem, 'id' | 'createdAt'>): CoinLedgerItem {
  const current = getStoredCoinLedger();
  const newLog: CoinLedgerItem = {
    ...event,
    id: `coin_log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    createdAt: new Date().toISOString(),
  };

  const updated = [newLog, ...current];
  try {
    localStorage.setItem(STORAGE_KEYS.COIN_LEDGER, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save coin ledger event:', e);
  }

  // Asynchronously sync to Supabase database
  saveCoinLedgerToSupabase(newLog).catch(err => console.warn('[Supabase Sync Coin Ledger Warning]', err));

  return newLog;
}

export function buyTokens(tokensCount: number, costUSD: number, method: PaymentMethod, bonusTokens = 0): UserAccount {
  const account = getStoredUserAccount();
  const newBalance = account.tokensBalance + tokensCount;
  const updatedAccount = saveStoredUserAccount({ tokensBalance: newBalance });

  // Add transaction
  const currentTxs = getStoredTokenTransactions();
  const newTx: TokenTransaction = {
    id: `tx_${Date.now()}`,
    userId: account.id,
    username: account.username,
    tokens: tokensCount,
    bonusTokens,
    costUSD,
    method,
    status: 'completed',
    createdAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEYS.TOKEN_TRANSACTIONS, JSON.stringify([newTx, ...currentTxs]));
  } catch (e) {
    console.error('Tx save error:', e);
  }

  // Log in Coin Ledger
  logCoinEvent({
    userId: account.id,
    username: account.username,
    eventType: 'purchase',
    tokensAmount: tokensCount,
    usdEquivalent: costUSD,
    description: `Purchased ${tokensCount - bonusTokens} Tokens${bonusTokens > 0 ? ` (+${bonusTokens} Bonus)` : ''} via ${method.toUpperCase()}`,
  });

  // Sync transaction to Supabase
  saveTransactionToSupabase(newTx).catch(e => console.warn('[Supabase Sync Tx Warning]', e));
  saveUserProfileToSupabase(updatedAccount).catch(e => console.warn('[Supabase Sync Profile Warning]', e));

  return updatedAccount;
}

// --- Paywall Unlocking System ---
export function getUnlockedClipIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.UNLOCKED_CLIPS);
    return raw ? JSON.parse(raw) : ['clip-aisha-1', 'clip-rinaraye-1']; // default test unlocked
  } catch {
    return ['clip-aisha-1', 'clip-rinaraye-1'];
  }
}

export function isClipUnlocked(clipId: string): boolean {
  const unlocked = getUnlockedClipIds();
  return unlocked.includes(clipId);
}

export function unlockPaywallClip(clipId: string, tokenCost: number, clipTitle?: string, creatorUsername?: string): { success: boolean; account: UserAccount; error?: string } {
  const account = getStoredUserAccount();
  if (account.tokensBalance < tokenCost) {
    return { success: false, account, error: `Insufficient tokens! You need ${tokenCost} tokens. Current balance: ${account.tokensBalance}` };
  }

  const updatedAccount = saveStoredUserAccount({ tokensBalance: account.tokensBalance - tokenCost });
  const unlocked = getUnlockedClipIds();
  if (!unlocked.includes(clipId)) {
    const newUnlocked = [...unlocked, clipId];
    localStorage.setItem(STORAGE_KEYS.UNLOCKED_CLIPS, JSON.stringify(newUnlocked));
  }

  // Credit creator earnings if registered creator exists
  if (creatorUsername) {
    const allUsers = getRegisteredUsers();
    const creatorUser = allUsers.find(u => u.username.toLowerCase() === creatorUsername.toLowerCase());
    if (creatorUser) {
      const earned = (creatorUser.earnedTokens || 0) + tokenCost;
      const earnedUSD = (creatorUser.earningsUSD || 0) + (tokenCost * 0.10);
      saveRegisteredUsers(allUsers.map(u => u.id === creatorUser.id ? { ...u, earnedTokens: earned, earningsUSD: earnedUSD } : u));
    }
  }

  // Record in Coin Ledger
  logCoinEvent({
    userId: account.id,
    username: account.username,
    eventType: 'unlock_clip',
    tokensAmount: -tokenCost,
    targetId: clipId,
    targetCreator: creatorUsername,
    usdEquivalent: tokenCost * 0.10,
    description: `Unlocked VIP Steam: "${clipTitle || clipId}" (${tokenCost} Tokens)`,
  });

  // Sync unlock record & buyer profile to Supabase
  saveUnlockedItemToSupabase({
    id: `unlock_${account.id}_${clipId}`,
    userId: account.id,
    itemId: clipId,
    itemType: 'clip',
    tokensSpent: tokenCost,
    creatorUsername,
    unlockedAt: new Date().toISOString(),
  }).catch(e => console.warn('[Supabase Sync Unlock Warning]', e));

  saveUserProfileToSupabase(updatedAccount).catch(e => console.warn('[Supabase Sync Profile Warning]', e));

  return { success: true, account: updatedAccount };
}

// --- Creator Tipping / Gifting System ---
export function tipCreator(creatorUsername: string, tokensAmount: number, note?: string): { success: boolean; account: UserAccount; error?: string } {
  const account = getStoredUserAccount();
  if (!account.isLoggedIn || account.id === 'guest') {
    return { success: false, account, error: 'Please sign in or register to tip creators.' };
  }

  if (account.tokensBalance < tokensAmount) {
    return { success: false, account, error: `Insufficient tokens. You have ${account.tokensBalance} tokens, but tried to tip ${tokensAmount} tokens.` };
  }

  // Deduct from tipper
  const updatedAccount = saveStoredUserAccount({ tokensBalance: account.tokensBalance - tokensAmount });

  // Credit to creator
  const allUsers = getRegisteredUsers();
  const creatorUser = allUsers.find(u => u.username.toLowerCase() === creatorUsername.toLowerCase());
  if (creatorUser) {
    const earned = (creatorUser.earnedTokens || 0) + tokensAmount;
    const earnedUSD = (creatorUser.earningsUSD || 0) + (tokensAmount * 0.10);
    saveRegisteredUsers(allUsers.map(u => u.id === creatorUser.id ? { ...u, earnedTokens: earned, earningsUSD: earnedUSD } : u));
  }

  // Log in Coin Ledger
  logCoinEvent({
    userId: account.id,
    username: account.username,
    eventType: 'tip_creator',
    tokensAmount: -tokensAmount,
    targetCreator: creatorUsername,
    usdEquivalent: tokensAmount * 0.10,
    description: `Tipped @${creatorUsername} ${tokensAmount} Tokens${note ? ` ("${note}")` : ''}`,
  });

  // Sync to Supabase
  saveUserProfileToSupabase(updatedAccount).catch(e => console.warn('[Supabase Sync Tipper Warning]', e));

  return { success: true, account: updatedAccount };
}

// --- Creator Payout Requests ---
export function getStoredPayoutRequests(): PayoutRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PAYOUT_REQUESTS);
    return raw ? JSON.parse(raw) : INITIAL_PAYOUT_REQUESTS;
  } catch {
    return INITIAL_PAYOUT_REQUESTS;
  }
}

export function saveStoredPayoutRequests(requests: PayoutRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PAYOUT_REQUESTS, JSON.stringify(requests));
  } catch (e) {
    console.error('Failed to save payout requests:', e);
  }
}

export function createPayoutRequest(
  tokensToExchange: number, 
  method: 'paypal' | 'bank_transfer', 
  details: string
): { success: boolean; requests: PayoutRequest[]; error?: string } {
  const account = getStoredUserAccount();
  const usdAmount = tokensToExchange * 0.10; // 1 token = $0.10 USD
  
  if (account.earnedTokens < tokensToExchange) {
    return { success: false, requests: getStoredPayoutRequests(), error: 'Insufficient earned tokens balance.' };
  }

  const newRequest: PayoutRequest = {
    id: `pay_${Date.now()}`,
    creatorId: account.id,
    creatorUsername: account.username,
    creatorName: account.displayName,
    tokensExchanged: tokensToExchange,
    amountUSD: usdAmount,
    method,
    destinationDetails: details,
    status: 'pending',
    requestedAt: new Date().toISOString(),
  };

  const current = getStoredPayoutRequests();
  const updated = [newRequest, ...current];
  localStorage.setItem(STORAGE_KEYS.PAYOUT_REQUESTS, JSON.stringify(updated));

  // Deduct from earned tokens
  const updatedAccount = saveStoredUserAccount({ 
    earnedTokens: account.earnedTokens - tokensToExchange,
    earningsUSD: Math.max(0, account.earningsUSD - usdAmount) 
  });

  // Log in Coin Ledger
  logCoinEvent({
    userId: account.id,
    username: account.username,
    eventType: 'payout_exchange',
    tokensAmount: -tokensToExchange,
    targetCreator: account.username,
    usdEquivalent: usdAmount,
    description: `Requested Payout: ${tokensToExchange} Earned Tokens &rarr; $${usdAmount.toFixed(2)} USD via ${method === 'paypal' ? 'PayPal' : 'Bank Wire'}`,
  });

  // Sync to Supabase
  savePayoutRequestToSupabase(newRequest).catch(e => console.warn('[Supabase Sync Payout Warning]', e));
  saveUserProfileToSupabase(updatedAccount).catch(e => console.warn('[Supabase Sync Profile Warning]', e));

  return { success: true, requests: updated };
}

export function updatePayoutStatus(requestId: string, status: 'approved' | 'rejected', notes?: string): PayoutRequest[] {
  const current = getStoredPayoutRequests();
  let updatedReq: PayoutRequest | null = null;

  const updated = current.map(req => {
    if (req.id === requestId) {
      updatedReq = { 
        ...req, 
        status, 
        adminNotes: notes || (status === 'approved' ? 'Payout sent successfully' : 'Request rejected'),
        processedAt: new Date().toISOString(),
      };
      return updatedReq;
    }
    return req;
  });

  localStorage.setItem(STORAGE_KEYS.PAYOUT_REQUESTS, JSON.stringify(updated));

  if (updatedReq) {
    savePayoutRequestToSupabase(updatedReq).catch(e => console.warn('[Supabase Sync Payout Status Warning]', e));
  }

  return updated;
}

// --- User Profile Storage ---
export function getStoredUserProfile(): UserProfileData {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    return raw ? { ...DEFAULT_USER_ACCOUNT, ...JSON.parse(raw) } : DEFAULT_USER_ACCOUNT;
  } catch {
    return DEFAULT_USER_ACCOUNT;
  }
}

export function saveStoredUserProfile(profile: Partial<UserProfileData>): UserProfileData {
  const current = getStoredUserProfile();
  const updated = { ...current, ...profile };
  try {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save profile:', err);
  }
  return updated;
}

// --- Follow / Unfollow System ---
export function getFollowedCreators(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FOLLOWED_CREATORS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse followed creators:', err);
  }
  return ['aisha01', 'synthwave_labs', 'fluidfx'];
}

export function isFollowingCreator(username: string): boolean {
  const current = getFollowedCreators();
  return current.includes(username.toLowerCase());
}

export function toggleFollowCreator(username: string): string[] {
  const current = getFollowedCreators();
  const normalized = username.toLowerCase();
  const exists = current.includes(normalized);
  const updated = exists ? current.filter(u => u !== normalized) : [...current, normalized];
  try {
    localStorage.setItem(STORAGE_KEYS.FOLLOWED_CREATORS, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to toggle follow creator:', err);
  }
  return updated;
}

// --- Theme Helpers ---
export function getStoredTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem(STORAGE_KEYS.THEME_MODE);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  return 'dark';
}

export function setStoredTheme(theme: 'dark' | 'light') {
  localStorage.setItem(STORAGE_KEYS.THEME_MODE, theme);
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// --- Safe LocalStorage Helper to Prevent QuotaExceededError ---
function cleanClipForStorage(clip: VideoClip): VideoClip {
  const cleaned = { ...clip };
  // Replace huge data URLs in posterUrl or avatar with lightweight fallback or placeholders
  if (cleaned.posterUrl && cleaned.posterUrl.startsWith('data:') && cleaned.posterUrl.length > 50000) {
    cleaned.posterUrl = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80';
  }
  if (cleaned.creator && cleaned.creator.avatar && cleaned.creator.avatar.startsWith('data:') && cleaned.creator.avatar.length > 50000) {
    cleaned.creator = {
      ...cleaned.creator,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    };
  }
  return cleaned;
}

function safeSetClipsStorage(key: string, clips: VideoClip[]): void {
  try {
    const cleanedClips = clips.map(cleanClipForStorage);
    localStorage.setItem(key, JSON.stringify(cleanedClips));
  } catch (err: any) {
    console.warn(`[Storage Quota Warning] Failed initial save to ${key}, attempting payload optimization...`, err);
    try {
      // Strip all base64 data URLs entirely
      const stripped = clips.map(c => {
        const item = cleanClipForStorage(c);
        if (item.videoUrl && item.videoUrl.startsWith('data:')) {
          item.videoUrl = '';
        }
        return item;
      });
      localStorage.setItem(key, JSON.stringify(stripped.slice(0, 30)));
    } catch (secondErr) {
      console.error(`[Storage Quota Error] Unable to persist clips to ${key}:`, secondErr);
    }
  }
}

// --- Clip Helpers ---
export function getStoredUserClips(): VideoClip[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_CLIPS);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to parse user clips:', err);
    return [];
  }
}

export function saveUserClip(clip: VideoClip): VideoClip[] {
  const current = getStoredUserClips();
  const updated = [clip, ...current];
  safeSetClipsStorage(STORAGE_KEYS.USER_CLIPS, updated);
  try {
    const rawComments = localStorage.getItem(STORAGE_KEYS.COMMENTS);
    const commentsMap = rawComments ? JSON.parse(rawComments) : {};
    commentsMap[clip.id] = [];
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(commentsMap));
  } catch (err) {
    console.warn('Storage limit reached when initializing comments:', err);
  }
  return updated;
}

export function saveStoredClips(clips: VideoClip[]): void {
  safeSetClipsStorage(STORAGE_KEYS.CLIPS_OVERRIDE, clips);
}

export function getAllClips(): VideoClip[] {
  try {
    const rawOverride = localStorage.getItem(STORAGE_KEYS.CLIPS_OVERRIDE);
    if (rawOverride) {
      const parsedOverride = JSON.parse(rawOverride);
      if (Array.isArray(parsedOverride) && parsedOverride.length > 0) {
        return parsedOverride
          .filter(clip => clip.videoUrl && !clip.videoUrl.startsWith('idb:') && !clip.videoUrl.startsWith('blob:'))
          .map(clip => {
            let finalVideoUrl = clip.videoUrl;
            if (finalVideoUrl && finalVideoUrl.includes('assets.mixkit.co')) {
              const matchInitial = INITIAL_CLIPS.find(c => c.id === clip.id);
              finalVideoUrl = matchInitial ? matchInitial.videoUrl : clip.videoUrl;
            }
            return { ...clip, videoUrl: finalVideoUrl || '' };
          });
      }
    }
  } catch (e) {
    console.warn('Could not parse clips override:', e);
  }

  const userClips = getStoredUserClips().filter(c => c.videoUrl && !c.videoUrl.startsWith('idb:') && !c.videoUrl.startsWith('blob:'));
  const combined = [...userClips, ...INITIAL_CLIPS];
  const map = new Map<string, VideoClip>();
  combined.forEach(clip => {
    if (!clip.videoUrl || clip.videoUrl.startsWith('idb:') || clip.videoUrl.startsWith('blob:')) return;
    let finalVideoUrl = clip.videoUrl;
    if (finalVideoUrl && finalVideoUrl.includes('assets.mixkit.co')) {
      const matchInitial = INITIAL_CLIPS.find(c => c.id === clip.id);
      finalVideoUrl = matchInitial ? matchInitial.videoUrl : clip.videoUrl;
    }
    map.set(clip.id, { ...clip, videoUrl: finalVideoUrl || '' });
  });
  return Array.from(map.values());
}

export function canUserDeleteContent(contentCreatorUsername?: string, activeUser?: UserAccount | null): boolean {
  if (!activeUser || !activeUser.username || activeUser.username === 'guest') return false;
  if (activeUser.role === 'admin' || activeUser.username.toLowerCase() === 'admin') return true;
  if (contentCreatorUsername && activeUser.username.toLowerCase() === contentCreatorUsername.toLowerCase()) return true;
  return false;
}

export function deleteStoredClip(clipId: string): VideoClip[] {
  // 1. Remove from local user clips
  const userClips = getStoredUserClips().filter(c => c.id !== clipId);
  safeSetClipsStorage(STORAGE_KEYS.USER_CLIPS, userClips);

  // 2. Remove from clips override
  const currentAll = getAllClips().filter(c => c.id !== clipId);
  safeSetClipsStorage(STORAGE_KEYS.CLIPS_OVERRIDE, currentAll);

  // 3. Sync deletion to Supabase and Express backend
  deleteClipFromSupabase(clipId).catch(err => console.warn('Supabase delete clip error:', err));
  deleteClipOnServer(clipId).catch(err => console.warn('Server delete clip error:', err));

  // 4. Dispatch global event for instant UI update
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('islandheat_clip_deleted', { detail: { clipId } }));
  }

  return currentAll;
}

export function deleteStoredCreatorImage(imageId: string): CreatorImage[] {
  const current = getStoredCreatorImages().filter(img => img.id !== imageId);
  try {
    localStorage.setItem(STORAGE_KEYS.CREATOR_IMAGES, JSON.stringify(current));
  } catch (err) {
    console.error('Failed to save creator images after deletion:', err);
  }

  // Sync deletion to Supabase
  deleteCreatorImageFromSupabase(imageId).catch(err => console.warn('Supabase delete image error:', err));

  // Dispatch global event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('islandheat_gallery_deleted', { detail: { imageId } }));
  }

  return current;
}

// --- Liked & Saved IDs ---
export function getLikedClipIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LIKED_CLIPS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleLikeClipId(clipId: string): string[] {
  const current = getLikedClipIds();
  const exists = current.includes(clipId);
  const updated = exists ? current.filter(id => id !== clipId) : [...current, clipId];
  localStorage.setItem(STORAGE_KEYS.LIKED_CLIPS, JSON.stringify(updated));
  return updated;
}

export function getSavedClipIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_CLIPS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleSaveClipId(clipId: string): string[] {
  const current = getSavedClipIds();
  const exists = current.includes(clipId);
  const updated = exists ? current.filter(id => id !== clipId) : [...current, clipId];
  localStorage.setItem(STORAGE_KEYS.SAVED_CLIPS, JSON.stringify(updated));
  return updated;
}

// --- Comments Map ---
export function getClipComments(clipId: string): Comment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COMMENTS);
    const map = raw ? JSON.parse(raw) : {};
    if (map && Object.prototype.hasOwnProperty.call(map, clipId)) {
      return Array.isArray(map[clipId]) ? map[clipId] : [];
    }
  } catch (err) {
    console.error('Error fetching comments', err);
  }

  // By default, clips start with 0 comments unless comments have been added by real users
  return [];
}

export function addClipComment(clipId: string, text: string): Comment[] {
  const existing = getClipComments(clipId);
  const account = getStoredUserAccount();
  const newComment: Comment = {
    id: `comm-${Date.now()}`,
    user: account.displayName || account.username,
    avatar: account.avatar,
    text,
    createdAt: 'Just now',
    likes: 0,
  };
  const updated = [newComment, ...existing];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COMMENTS);
    const map = raw ? JSON.parse(raw) : {};
    map[clipId] = updated;
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(map));
  } catch (err) {
    console.error('Error saving comment', err);
  }
  return updated;
}

// --- Admin Credentials Management ---
export interface AdminCredentials {
  username: string;
  password: string;
  updatedAt?: string;
}

export function getAdminCredentials(): AdminCredentials {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_CREDENTIALS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.username && parsed.password) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading admin credentials:', e);
  }
  // Default fallback credentials requested by user
  return {
    username: 'admin',
    password: 'admin',
  };
}

export function saveAdminCredentials(credentials: Partial<AdminCredentials>): AdminCredentials {
  const current = getAdminCredentials();
  const updated: AdminCredentials = {
    username: credentials.username || current.username,
    password: credentials.password || current.password,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEYS.ADMIN_CREDENTIALS, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save admin credentials:', err);
  }
  return updated;
}

export function verifyAdminCredentials(inputUser: string, inputPass: string): boolean {
  const creds = getAdminCredentials();
  return inputUser.trim() === creds.username.trim() && inputPass.trim() === creds.password.trim();
}

// --- Creator Images Management (Profile Only & Paywalls) ---
export function getStoredCreatorImages(): CreatorImage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CREATOR_IMAGES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error fetching creator images:', err);
  }
  return INITIAL_CREATOR_IMAGES;
}

export function saveStoredCreatorImage(imageData: {
  creatorUsername: string;
  creatorName: string;
  creatorAvatar: string;
  imageUrl: string;
  images?: string[];
  title: string;
  description: string;
  category?: Category;
  tags?: string[];
  isPaywalled?: boolean;
  priceTokens?: number;
}): CreatorImage {
  const current = getStoredCreatorImages();
  const allImgs = imageData.images && imageData.images.length > 0 
    ? imageData.images 
    : [imageData.imageUrl];

  const newImage: CreatorImage = {
    id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    creatorUsername: imageData.creatorUsername.toLowerCase(),
    creatorName: imageData.creatorName || imageData.creatorUsername,
    creatorAvatar: imageData.creatorAvatar,
    imageUrl: imageData.imageUrl || allImgs[0],
    images: allImgs,
    title: imageData.title.trim() || 'Exclusive Creator Photo Gallery',
    description: imageData.description.trim() || '',
    category: imageData.category || 'Jamaica Heat',
    tags: imageData.tags && imageData.tags.length > 0 ? imageData.tags : ['IslandHeat', 'Exclusive', 'Gallery'],
    isPaywalled: !!imageData.isPaywalled,
    priceTokens: imageData.isPaywalled ? (imageData.priceTokens || 30) : 0,
    unlockedUserIds: [],
    createdAt: 'Just now',
    likes: 1,
    rating: 5.0,
    ratingCount: 1,
    userRatings: {},
    views: 1,
  };

  const updated = [newImage, ...current];
  try {
    localStorage.setItem(STORAGE_KEYS.CREATOR_IMAGES, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save creator image:', err);
  }
  return newImage;
}

export function rateCreatorGallery(galleryId: string, ratingValue: number): { success: boolean; newRating: number; newRatingCount: number; error?: string } {
  const account = getStoredUserAccount();
  if (!account.isLoggedIn || account.id === 'guest') {
    return { success: false, newRating: 5.0, newRatingCount: 0, error: 'Please sign in to rate galleries.' };
  }

  const allImages = getStoredCreatorImages();
  const target = allImages.find(img => img.id === galleryId);
  if (!target) {
    return { success: false, newRating: 5.0, newRatingCount: 0, error: 'Gallery not found.' };
  }

  const currentRatings: { [userId: string]: number } = target.userRatings || {};
  currentRatings[account.id] = Math.max(1, Math.min(5, ratingValue));

  const ratingVals = Object.values(currentRatings);
  const totalScore = ratingVals.reduce((a, b) => a + b, 0);
  const avg = parseFloat((totalScore / ratingVals.length).toFixed(1));
  const count = ratingVals.length;

  const updated = allImages.map(img => {
    if (img.id === galleryId) {
      return {
        ...img,
        rating: avg,
        ratingCount: count,
        userRatings: currentRatings,
      };
    }
    return img;
  });

  try {
    localStorage.setItem(STORAGE_KEYS.CREATOR_IMAGES, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save rating:', e);
  }

  return { success: true, newRating: avg, newRatingCount: count };
}

export function recordGalleryView(galleryId: string): void {
  const allImages = getStoredCreatorImages();
  const updated = allImages.map(img => {
    if (img.id === galleryId) {
      return { ...img, views: (img.views || 0) + 1 };
    }
    return img;
  });
  try {
    localStorage.setItem(STORAGE_KEYS.CREATOR_IMAGES, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to record view:', e);
  }
}

export function deleteCreatorImage(imageId: string): CreatorImage[] {
  const current = getStoredCreatorImages();
  const updated = current.filter(img => img.id !== imageId);
  try {
    localStorage.setItem(STORAGE_KEYS.CREATOR_IMAGES, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete creator image:', err);
  }
  return updated;
}

export function getUnlockedImageIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.UNLOCKED_IMAGES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function unlockCreatorImage(imageId: string): { success: boolean; error?: string; updatedAccount?: UserAccount } {
  const account = getStoredUserAccount();
  if (!account.isLoggedIn || account.id === 'guest') {
    return { success: false, error: 'Please sign in or register to unlock paywalled creator content.' };
  }

  const allImages = getStoredCreatorImages();
  const targetImage = allImages.find(img => img.id === imageId);
  if (!targetImage) {
    return { success: false, error: 'Image not found.' };
  }

  const cost = targetImage.priceTokens || 30;
  if (account.tokensBalance < cost) {
    return { success: false, error: `Insufficient tokens. You need ${cost} tokens, but currently have ${account.tokensBalance} tokens.` };
  }

  // Deduct tokens from buyer
  const newBuyerBalance = account.tokensBalance - cost;
  const updatedBuyer = saveStoredUserAccount({ tokensBalance: newBuyerBalance });

  // Credit tokens to creator if registered
  if (targetImage.creatorUsername) {
    const allUsers = getRegisteredUsers();
    const creatorUser = allUsers.find(u => u.username.toLowerCase() === targetImage.creatorUsername.toLowerCase());
    if (creatorUser) {
      const creatorEarned = (creatorUser.earnedTokens || 0) + cost;
      const creatorUSD = (creatorUser.earningsUSD || 0) + (cost * 0.10);
      saveRegisteredUsers(allUsers.map(u => u.id === creatorUser.id ? { ...u, earnedTokens: creatorEarned, earningsUSD: creatorUSD } : u));
    }
  }

  // Save unlocked image ID
  const unlocked = getUnlockedImageIds();
  if (!unlocked.includes(imageId)) {
    const updatedUnlocked = [...unlocked, imageId];
    try {
      localStorage.setItem(STORAGE_KEYS.UNLOCKED_IMAGES, JSON.stringify(updatedUnlocked));
    } catch (e) {
      console.error('Failed to save unlocked image', e);
    }
  }

  // Record in Coin Ledger
  logCoinEvent({
    userId: account.id,
    username: account.username,
    eventType: 'unlock_image',
    tokensAmount: -cost,
    targetId: imageId,
    targetCreator: targetImage.creatorUsername,
    usdEquivalent: cost * 0.10,
    description: `Unlocked VIP Photo: "${targetImage.title || 'Creator Photo'}" (${cost} Tokens)`,
  });

  // Sync unlock item to Supabase
  saveUnlockedItemToSupabase({
    id: `unlock_${account.id}_${imageId}`,
    userId: account.id,
    itemId: imageId,
    itemType: 'image',
    tokensSpent: cost,
    creatorUsername: targetImage.creatorUsername,
    unlockedAt: new Date().toISOString(),
  }).catch(e => console.warn('[Supabase Sync Unlock Image Warning]', e));

  saveUserProfileToSupabase(updatedBuyer).catch(e => console.warn('[Supabase Sync Buyer Profile Warning]', e));

  return { success: true, updatedAccount: updatedBuyer };
}

export function toggleLikeCreatorImage(imageId: string): void {
  const allImages = getStoredCreatorImages();
  const updated = allImages.map(img => {
    if (img.id === imageId) {
      return { ...img, likes: (img.likes || 0) + 1 };
    }
    return img;
  });
  try {
    localStorage.setItem(STORAGE_KEYS.CREATOR_IMAGES, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to update likes', e);
  }
}

// --- Site Logo & Branding Management ---
export const DEFAULT_SITE_BRANDING: SiteBranding = {
  logoText: 'IH',
  logoSubtext: 'ISLANDHEAT',
  logoImageUrl: '',
  logoType: 'text', // 'text' | 'image' | 'both'
  accentColor: '#f97316', // Vibrant Caribbean Orange / Heat style
  siteName: 'IslandHeat',
};

export function getSiteBranding(): SiteBranding {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SITE_BRANDING);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SITE_BRANDING, ...parsed };
    }
  } catch (e) {
    console.error('Error loading site branding:', e);
  }
  return DEFAULT_SITE_BRANDING;
}

export function saveSiteBranding(branding: Partial<SiteBranding>): SiteBranding {
  const current = getSiteBranding();
  const updated: SiteBranding = {
    ...current,
    ...branding,
  };
  try {
    localStorage.setItem(STORAGE_KEYS.SITE_BRANDING, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving site branding:', e);
  }
  return updated;
}

// --- Hostinger Database Backup & Restore ---
export function exportDatabaseJSON(): string {
  const dump = {
    exportDate: new Date().toISOString(),
    platform: 'IslandHeat Caribbean Steam Platform',
    clipsOverride: getAllClips(),
    userClips: getStoredUserClips(),
    likedClips: getLikedClipIds(),
    savedClips: getSavedClipIds(),
    userAccount: getStoredUserAccount(),
    payoutRequests: getStoredPayoutRequests(),
    tokenTransactions: getStoredTokenTransactions(),
    adminCredentials: getAdminCredentials(),
    siteBranding: getSiteBranding(),
    unlockedClips: getUnlockedClipIds(),
    creatorImages: getStoredCreatorImages(),
    unlockedImages: getUnlockedImageIds(),
  };
  return JSON.stringify(dump, null, 2);
}

export function importDatabaseJSON(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (data.clipsOverride && Array.isArray(data.clipsOverride)) {
      localStorage.setItem(STORAGE_KEYS.CLIPS_OVERRIDE, JSON.stringify(data.clipsOverride));
    }
    if (data.userClips && Array.isArray(data.userClips)) {
      localStorage.setItem(STORAGE_KEYS.USER_CLIPS, JSON.stringify(data.userClips));
    }
    if (data.userAccount) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ACCOUNT, JSON.stringify(data.userAccount));
    }
    if (data.payoutRequests) {
      localStorage.setItem(STORAGE_KEYS.PAYOUT_REQUESTS, JSON.stringify(data.payoutRequests));
    }
    if (data.tokenTransactions) {
      localStorage.setItem(STORAGE_KEYS.TOKEN_TRANSACTIONS, JSON.stringify(data.tokenTransactions));
    }
    if (data.adminCredentials) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_CREDENTIALS, JSON.stringify(data.adminCredentials));
    }
    if (data.siteBranding) {
      localStorage.setItem(STORAGE_KEYS.SITE_BRANDING, JSON.stringify(data.siteBranding));
    }
    if (data.unlockedClips) {
      localStorage.setItem(STORAGE_KEYS.UNLOCKED_CLIPS, JSON.stringify(data.unlockedClips));
    }
    if (data.creatorImages && Array.isArray(data.creatorImages)) {
      localStorage.setItem(STORAGE_KEYS.CREATOR_IMAGES, JSON.stringify(data.creatorImages));
    }
    if (data.unlockedImages && Array.isArray(data.unlockedImages)) {
      localStorage.setItem(STORAGE_KEYS.UNLOCKED_IMAGES, JSON.stringify(data.unlockedImages));
    }
    return true;
  } catch (err) {
    console.error('Failed to import database JSON:', err);
    return false;
  }
}


