export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3';

export type Category = 
  | 'Trending' 
  | 'Jamaica Heat' 
  | 'Trinidad Spice' 
  | 'Barbados Babes' 
  | 'Dominican Temptation' 
  | 'Bahamas Paradise' 
  | 'Puerto Rico Passion' 
  | 'Curacao Dreams' 
  | 'Aruba Sunsets' 
  | 'St. Lucia Secrets' 
  | 'Virgin Islands VIP'
  | 'Glamour'
  | 'Satisfying'
  | 'Gaming'
  | 'Lifestyle';

export type UserRole = 'user' | 'creator' | 'admin';
export type KycStatus = 'none' | 'pending' | 'verified' | 'rejected';

export interface UserAccount {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  role: UserRole;
  tokensBalance: number;
  earnedTokens: number;
  earningsUSD: number;
  isVerified: boolean;
  kycStatus?: KycStatus;
  kycPhotoIdUrl?: string;
  isMonetizationEnabled?: boolean;
  kycSubmittedDate?: string;
  isLoggedIn?: boolean;
  password?: string;
  joinedDate: string;
  joinedTimestamp?: number;
  lastSeenTimestamp?: number;
  isOnline?: boolean;
  isBanned?: boolean;
  location?: string;
  paypalEmail?: string;
  socialLinks?: {
    onlyfans?: string;
    fansly?: string;
    website?: string;
    twitter?: string;
    instagram?: string;
  };
  bankDetails?: {
    bankName: string;
    accountHolder: string;
    accountNumber: string;
    swiftCode: string;
  };
}

export interface SiteBranding {
  logoText: string;
  logoSubtext: string;
  logoImageUrl: string;
  logoType: 'text' | 'image' | 'both';
  accentColor: string; // e.g. '#ef4444' or 'rgb(239, 68, 68)'
  siteName: string;
}

export interface Comment {
  id: string;
  user: string;
  avatar: string;
  text: string;
  createdAt: string;
  likes: number;
  isLiked?: boolean;
}

export interface UserProfileData {
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  bannerUrl?: string;
  joinedDate: string;
  isVerified?: boolean;
}

export interface CreatorImage {
  id: string;
  creatorUsername: string;
  creatorName: string;
  creatorAvatar: string;
  imageUrl: string; // Cover photo
  images?: string[]; // Multiple photos in the gallery for carousel
  title: string;
  description: string;
  category?: Category;
  tags: string[];
  isPaywalled: boolean;
  priceTokens: number;
  unlockedUserIds: string[];
  createdAt: string;
  likes: number;
  rating?: number; // e.g. 4.9
  ratingCount?: number; // e.g. 38
  userRatings?: { [userId: string]: number }; // Map of userId to rating 1-5
  views?: number;
  isFeatured?: boolean;
}

export interface CreatorProfileInfo {
  name: string;
  username: string;
  avatar: string;
  bannerUrl?: string;
  bio: string;
  isVerified?: boolean;
  followersCount: number;
  totalLoops: number;
  clipsCount: number;
}

export interface VideoClip {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  posterUrl?: string;
  creator: {
    name: string;
    avatar: string;
    username: string;
    isVerified?: boolean;
  };
  duration: number; // in seconds
  aspectRatio: AspectRatio;
  category: Category;
  tags: string[];
  views: number;
  likes: number;
  loopsCount: number;
  hasAudio: boolean;
  createdAt: string;
  isHD?: boolean;
  is4K?: boolean;
  isUserUploaded?: boolean;
  
  // Paywall & Monetization Features
  isPaywalled?: boolean;
  priceTokens?: number;
  unlockedUserIds?: string[];
}

export type PaymentMethod = 'paypal' | 'bank_transfer' | 'credit_card';

export interface TokenPackage {
  id: string;
  tokens: number;
  priceUSD: number;
  bonusTokens: number;
  isPopular?: boolean;
}

export interface TokenTransaction {
  id: string;
  userId: string;
  username: string;
  tokens: number;
  costUSD: number;
  method: PaymentMethod;
  status: 'completed' | 'pending';
  createdAt: string;
  bonusTokens?: number;
}

export type CoinEventType = 'purchase' | 'unlock_clip' | 'unlock_image' | 'tip_creator' | 'admin_grant' | 'payout_exchange';

export interface CoinLedgerItem {
  id: string;
  userId: string;
  username: string;
  eventType: CoinEventType;
  tokensAmount: number; // positive for credit (e.g. +100), negative for debit (e.g. -50)
  targetId?: string; // clip ID or image ID or creator username
  targetCreator?: string;
  usdEquivalent?: number;
  description: string;
  createdAt: string;
}

export interface UnlockedItem {
  id: string;
  userId: string;
  itemId: string;
  itemType: 'clip' | 'image';
  tokensSpent: number;
  creatorUsername?: string;
  unlockedAt: string;
}

export interface PayoutRequest {
  id: string;
  creatorId: string;
  creatorUsername: string;
  creatorName: string;
  tokensExchanged: number;
  amountUSD: number;
  method: 'paypal' | 'bank_transfer';
  destinationDetails: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  adminNotes?: string;
  processedAt?: string;
}

export type SortOption = 'trending' | 'latest' | 'most_viewed' | 'top_liked';
export type OrientationFilter = 'all' | 'horizontal' | 'vertical' | 'square';
export type FeedViewMode = 'all' | 'following' | 'paywalled';
export type MainViewTab = 'home_916' | 'explore_grid' | 'galleries' | 'niches' | 'profile' | 'admin';

export interface FilterState {
  category: string;
  searchQuery: string;
  tag: string;
  sort: SortOption;
  orientation: OrientationFilter;
  hasAudioOnly: boolean;
  feedMode: FeedViewMode;
}


