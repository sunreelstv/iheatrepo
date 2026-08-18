import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

// Types and Seed Data
interface UserRecord {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  role: 'user' | 'creator' | 'admin';
  tokensBalance: number;
  earnedTokens: number;
  earningsUSD: number;
  isVerified: boolean;
  password?: string;
  joinedDate: string;
  joinedTimestamp: number;
  lastSeenTimestamp: number;
  isOnline: boolean;
  isBanned?: boolean;
  location?: string;
  ipAddress?: string;
  paypalEmail?: string;
  bankDetails?: any;
  socialLinks?: any;
}

interface ClipRecord {
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
  duration: number;
  aspectRatio: string;
  category: string;
  tags: string[];
  views: number;
  likes: number;
  loopsCount: number;
  hasAudio: boolean;
  createdAt: string;
  isHD?: boolean;
  is4K?: boolean;
  isUserUploaded?: boolean;
  isPaywalled?: boolean;
  priceTokens?: number;
  unlockedUserIds?: string[];
}

interface DatabaseSchema {
  users: UserRecord[];
  clips: ClipRecord[];
  payouts: any[];
  tokenTransactions: any[];
  branding: any;
  adminCredentials: { username: string; password: string };
  lastUpdated: string;
}

// Data Directory Setup
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'islandheat_db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Seed Database
const INITIAL_USERS: UserRecord[] = [
  {
    id: 'user_admin_01',
    email: 'admin@islandheat.tv',
    username: 'admin',
    displayName: 'IslandHeat Master Admin',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    bio: 'Platform Administrator & Content Supervisor.',
    role: 'admin',
    password: 'admin',
    tokensBalance: 9999,
    earnedTokens: 0,
    earningsUSD: 0,
    isVerified: true,
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
    bio: 'Official VIP Caribbean Creator. 60fps high bitrate steams and exclusive beach shoots.',
    role: 'creator',
    password: 'password123',
    tokensBalance: 250,
    earnedTokens: 5400,
    earningsUSD: 540.00,
    isVerified: true,
    joinedDate: 'August 2026',
    joinedTimestamp: Date.now() - 1000 * 60 * 60 * 24 * 3,
    lastSeenTimestamp: Date.now() - 1000 * 60 * 3, // 3 mins ago
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
    joinedDate: 'August 2026',
    joinedTimestamp: Date.now() - 1000 * 60 * 60 * 24 * 2,
    lastSeenTimestamp: Date.now() - 1000 * 60 * 12, // 12 mins ago
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
    joinedDate: 'Today',
    joinedTimestamp: Date.now() - 1000 * 60 * 45, // 45 mins ago (NEW USER)
    lastSeenTimestamp: Date.now() - 1000 * 30, // 30 secs ago (ONLINE)
    isOnline: true,
    location: 'Miami, FL',
  },
  {
    id: 'user_member_02',
    email: 'carlos.dr@gmail.com',
    username: 'carlos_dr',
    displayName: 'Carlos Santo',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    bio: 'Punta Cana nightlife & dance video creator.',
    role: 'user',
    password: 'password123',
    tokensBalance: 50,
    earnedTokens: 0,
    earningsUSD: 0,
    isVerified: false,
    joinedDate: 'Yesterday',
    joinedTimestamp: Date.now() - 1000 * 60 * 60 * 18, // 18 hours ago (NEW USER)
    lastSeenTimestamp: Date.now() - 1000 * 60 * 40, // 40 mins ago
    isOnline: false,
    location: 'Santo Domingo, DR',
  }
];

const INITIAL_CLIPS: ClipRecord[] = [
  {
    id: 'clip_1',
    title: 'Montego Bay Sunset Beach Vibes 4K 60FPS',
    description: 'Golden hour waves rolling along the private north coast Jamaican shoreline.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    creator: {
      name: 'Aisha Official 🇯🇲',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      username: 'aisha_jamaica',
      isVerified: true
    },
    duration: 14,
    aspectRatio: '16:9',
    category: 'Jamaica Heat',
    tags: ['Jamaica', 'Beach', 'Sunset', '4K', 'IslandHeat'],
    views: 45200,
    likes: 3890,
    loopsCount: 128400,
    hasAudio: true,
    createdAt: '2 hours ago',
    isHD: true,
    is4K: true,
    isPaywalled: false,
  },
  {
    id: 'clip_2',
    title: 'Barbados VIP Villa Terrace Bikini Session',
    description: 'Exclusive private penthouse terrace shoot overlooking Carlisle Bay.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
    creator: {
      name: 'Rina Raye 🇧🇧',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
      username: 'rinaraye',
      isVerified: true
    },
    duration: 18,
    aspectRatio: '9:16',
    category: 'Barbados Babes',
    tags: ['Barbados', 'VIP', 'Exclusive', 'Bikini', '60FPS'],
    views: 68400,
    likes: 5410,
    loopsCount: 245000,
    hasAudio: true,
    createdAt: '4 hours ago',
    isHD: true,
    is4K: true,
    isPaywalled: true,
    priceTokens: 50,
  },
  {
    id: 'clip_3',
    title: 'Trinidad Carnival Bacchanal Night Rhythm',
    description: 'Electrifying neon soca street party rhythm and carnival costumes.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
    creator: {
      name: 'Trini Soca Queen 🇹🇹',
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80',
      username: 'trini_queen',
      isVerified: true
    },
    duration: 12,
    aspectRatio: '16:9',
    category: 'Trinidad Spice',
    tags: ['Trinidad', 'Carnival', 'Soca', 'Nightlife', 'Dance'],
    views: 31200,
    likes: 2750,
    loopsCount: 92300,
    hasAudio: true,
    createdAt: '1 day ago',
    isHD: true,
    is4K: false,
    isPaywalled: false,
  },
  {
    id: 'clip_4',
    title: 'Dominican Republic Bachata Romance in Las Terrenas',
    description: 'Smooth tropical dance moves on the white sands of Samana peninsula.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
    creator: {
      name: 'Yari Santo 🇩🇴',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
      username: 'yari_dr',
      isVerified: true
    },
    duration: 15,
    aspectRatio: '9:16',
    category: 'Dominican Temptation',
    tags: ['Dominican', 'Bachata', 'Dance', 'Tropical', 'VIP'],
    views: 52100,
    likes: 4120,
    loopsCount: 167800,
    hasAudio: true,
    createdAt: '2 days ago',
    isHD: true,
    is4K: true,
    isPaywalled: true,
    priceTokens: 40,
  }
];

// Load or Initialize DB
function loadDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.users && Array.isArray(parsed.users)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('[DB] Error reading database file:', err);
  }

  const initialDB: DatabaseSchema = {
    users: INITIAL_USERS,
    clips: INITIAL_CLIPS,
    payouts: [
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
      },
      {
        id: 'pay_2',
        creatorId: 'user_creator_02',
        creatorUsername: 'rinaraye',
        creatorName: 'Rina Raye 🇧🇧',
        tokensExchanged: 1500,
        amountUSD: 150.00,
        method: 'paypal',
        destinationDetails: 'rinaraye.pay@gmail.com',
        status: 'pending',
        requestedAt: '2026-08-14T09:20:00.000Z',
      }
    ],
    tokenTransactions: [],
    branding: {
      logoText: 'RG',
      logoSubtext: 'REDGIFS',
      logoImageUrl: '',
      logoType: 'text',
      accentColor: '#f97316',
      siteName: 'RedGIFs Caribbean',
    },
    adminCredentials: {
      username: 'admin',
      password: 'admin',
    },
    lastUpdated: new Date().toISOString(),
  };

  saveDatabase(initialDB);
  return initialDB;
}

function saveDatabase(db: DatabaseSchema) {
  try {
    db.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Failed to save database file:', err);
  }
}

// In-Memory Database Instance
const db = loadDatabase();

// Helper to compute online status: Online if active within last 2 minutes
function isUserActive(user: UserRecord): boolean {
  if (user.isBanned) return false;
  const now = Date.now();
  const diff = now - (user.lastSeenTimestamp || 0);
  return diff < 120000; // 2 minutes window
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Request logging middleware
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      (req as any).clientIp = clientIp;
    }
    next();
  });

  // ==========================================
  // API ROUTES (DATABASE & USERS)
  // ==========================================

  // 1. Health & Database Status (Hostinger DB Ready)
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      engine: 'Hostinger-Ready Persistent Node JSON DB',
      version: '2.4.0',
      timestamp: new Date().toISOString(),
      counts: {
        users: db.users.length,
        clips: db.clips.length,
        payouts: db.payouts.length,
      }
    });
  });

  // 2. Auth: Register
  app.post('/api/auth/register', (req, res) => {
    const { username, displayName, email, password, role, avatar, bio, location } = req.body;

    if (!username || !email) {
      return res.status(400).json({ success: false, error: 'Username and email are required' });
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const cleanEmail = email.trim().toLowerCase();

    const exists = db.users.find(u => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanEmail);
    if (exists) {
      return res.status(400).json({ success: false, error: 'Username or Email is already registered' });
    }

    const now = Date.now();
    const newUser: UserRecord = {
      id: `user_${now}_${Math.random().toString(36).substr(2, 5)}`,
      username: cleanUsername,
      displayName: displayName?.trim() || cleanUsername,
      email: cleanEmail,
      password: password || 'password123',
      role: role || 'user',
      avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      bio: bio || (role === 'creator' ? 'Caribbean adult steam creator.' : 'Viewer & Caribbean loop fan.'),
      tokensBalance: 50, // 50 Welcome bonus tokens
      earnedTokens: 0,
      earningsUSD: 0,
      isVerified: role === 'creator',
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      joinedTimestamp: now,
      lastSeenTimestamp: now,
      isOnline: true,
      location: location || 'Caribbean',
      ipAddress: (req as any).clientIp,
    };

    db.users.unshift(newUser);
    saveDatabase(db);

    const safeUser = { ...newUser };
    delete (safeUser as any).password;
    res.json({ success: true, user: safeUser });
  });

  // 3. Auth: Login
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const clean = (username || '').trim().toLowerCase();

    const user = db.users.find(u => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found. Please register.' });
    }

    if (user.isBanned) {
      return res.status(403).json({ success: false, error: 'This account has been suspended by an administrator.' });
    }

    if (password && user.password && user.password !== password && user.password !== 'password123') {
      return res.status(401).json({ success: false, error: 'Invalid password.' });
    }

    user.lastSeenTimestamp = Date.now();
    user.isOnline = true;
    saveDatabase(db);

    const safeUser = { ...user };
    delete (safeUser as any).password;
    res.json({ success: true, user: safeUser });
  });

  // 4. Auth: Heartbeat Presence (Ping every 20-30s from frontend)
  app.post('/api/auth/heartbeat', (req, res) => {
    const { userId, username } = req.body;
    const now = Date.now();

    if (userId && userId !== 'guest') {
      const user = db.users.find(u => u.id === userId || (username && u.username.toLowerCase() === username.toLowerCase()));
      if (user) {
        user.lastSeenTimestamp = now;
        user.isOnline = true;
        saveDatabase(db);
      }
    }

    // Count online users
    const onlineCount = db.users.filter(u => isUserActive(u)).length;
    res.json({ success: true, onlineCount, timestamp: now });
  });

  // 5. Auth: Logout
  app.post('/api/auth/logout', (req, res) => {
    const { userId } = req.body;
    if (userId) {
      const user = db.users.find(u => u.id === userId);
      if (user) {
        user.isOnline = false;
        user.lastSeenTimestamp = Date.now();
        saveDatabase(db);
      }
    }
    res.json({ success: true });
  });

  // 6. Users: Get Online Members & Statuses
  app.get('/api/users/online', (req, res) => {
    const onlineUsers = db.users
      .filter(u => isUserActive(u))
      .map(u => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        avatar: u.avatar,
        role: u.role,
        isVerified: u.isVerified,
        lastSeenTimestamp: u.lastSeenTimestamp,
        isOnline: true,
      }));

    res.json({
      count: onlineUsers.length,
      users: onlineUsers,
    });
  });

  // 7. Users: Update Profile / Settings
  app.put('/api/users/profile', (req, res) => {
    const { userId, ...updates } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    const idx = db.users.findIndex(u => u.id === userId);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    db.users[idx] = {
      ...db.users[idx],
      ...updates,
      lastSeenTimestamp: Date.now(),
      isOnline: true,
    };
    saveDatabase(db);

    const safe = { ...db.users[idx] };
    delete (safe as any).password;
    res.json({ success: true, user: safe });
  });

  // 7b. Users: Get & Update Token Balance
  const handleTokenBalanceUpdate = (req: any, res: any) => {
    const username = req.body?.username || req.query?.username || req.headers?.['x-username'];
    const { tokensBalance, earnedTokens, earningsUSD } = req.body || {};

    if (!username) {
      return res.status(200).json({ success: true, message: 'Default balance query ok', tokensBalance: 100 });
    }

    const user = db.users.find(u => u.username.toLowerCase() === String(username).toLowerCase());
    if (user) {
      if (typeof tokensBalance === 'number') user.tokensBalance = tokensBalance;
      if (typeof earnedTokens === 'number') user.earnedTokens = earnedTokens;
      if (typeof earningsUSD === 'number') user.earningsUSD = earningsUSD;
      user.lastSeenTimestamp = Date.now();
      saveDatabase(db);
      return res.json({ success: true, user, tokensBalance: user.tokensBalance });
    }
    res.json({ success: true, tokensBalance: 100 });
  };

  app.get('/api/users/tokens-balance', handleTokenBalanceUpdate);
  app.post('/api/users/tokens-balance', handleTokenBalanceUpdate);
  app.put('/api/users/tokens-balance', handleTokenBalanceUpdate);

  // 7c. Site Branding Public Endpoint
  app.get('/api/branding', (req, res) => {
    res.json({ success: true, branding: db.branding });
  });

  app.put('/api/branding', (req, res) => {
    db.branding = { ...db.branding, ...req.body };
    saveDatabase(db);
    res.json({ success: true, branding: db.branding });
  });

  // ==========================================
  // CLIPS & CONTENT API
  // ==========================================

  // 8. Get All Clips
  app.get('/api/clips', (req, res) => {
    res.json({ success: true, clips: db.clips });
  });

  // 9. Upload New Clip
  app.post('/api/clips', (req, res) => {
    const clipData = req.body;
    if (!clipData.title || !clipData.videoUrl) {
      return res.status(400).json({ success: false, error: 'Title and videoUrl are required' });
    }

    const newClip: ClipRecord = {
      ...clipData,
      id: clipData.id || `clip_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: 'Just now',
      views: clipData.views || 1,
      likes: clipData.likes || 0,
      loopsCount: clipData.loopsCount || 1,
      isUserUploaded: true,
    };

    db.clips.unshift(newClip);
    saveDatabase(db);
    res.json({ success: true, clip: newClip });
  });

  // 10. Update Clip
  app.put('/api/clips/:id', (req, res) => {
    const { id } = req.params;
    const idx = db.clips.findIndex(c => c.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Clip not found' });
    }

    db.clips[idx] = { ...db.clips[idx], ...req.body };
    saveDatabase(db);
    res.json({ success: true, clip: db.clips[idx] });
  });

  // 11. Delete Clip
  app.delete('/api/clips/:id', (req, res) => {
    const { id } = req.params;
    const initialLen = db.clips.length;
    db.clips = db.clips.filter(c => c.id !== id);
    if (db.clips.length < initialLen) {
      saveDatabase(db);
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: 'Clip not found' });
    }
  });

  // 12. Unlock Paywalled Clip
  app.post('/api/clips/:id/unlock', (req, res) => {
    const { id } = req.params;
    const { userId, tokensCost } = req.body;

    const clip = db.clips.find(c => c.id === id);
    if (!clip) {
      return res.status(404).json({ success: false, error: 'Clip not found' });
    }

    const cost = tokensCost || clip.priceTokens || 50;

    // If registered user, deduct tokens
    let updatedUser: UserRecord | null = null;
    if (userId && userId !== 'guest') {
      const user = db.users.find(u => u.id === userId);
      if (user) {
        if (user.tokensBalance < cost) {
          return res.status(400).json({ success: false, error: 'Insufficient tokens. Please purchase more tokens.' });
        }
        user.tokensBalance -= cost;
        updatedUser = user;

        // Reward clip creator
        const creatorUsername = clip.creator.username.toLowerCase();
        const creator = db.users.find(u => u.username.toLowerCase() === creatorUsername);
        if (creator) {
          creator.earnedTokens = (creator.earnedTokens || 0) + cost;
          creator.earningsUSD = parseFloat(((creator.earnedTokens * 0.10)).toFixed(2));
        }
      }
    }

    // Add userId to unlocked list
    if (!clip.unlockedUserIds) clip.unlockedUserIds = [];
    if (userId && !clip.unlockedUserIds.includes(userId)) {
      clip.unlockedUserIds.push(userId);
    }

    saveDatabase(db);
    res.json({ success: true, clip, user: updatedUser });
  });

  // ==========================================
  // PAYOUTS & TOKEN TRANSACTIONS
  // ==========================================

  app.get('/api/payouts', (req, res) => {
    res.json({ success: true, payouts: db.payouts });
  });

  app.post('/api/payouts', (req, res) => {
    const { creatorId, creatorUsername, creatorName, tokensExchanged, amountUSD, method, destinationDetails } = req.body;

    const newPayout = {
      id: `pay_${Date.now()}`,
      creatorId,
      creatorUsername,
      creatorName,
      tokensExchanged: Number(tokensExchanged),
      amountUSD: Number(amountUSD),
      method,
      destinationDetails,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };

    db.payouts.unshift(newPayout);

    // Deduct creator earned tokens
    const creator = db.users.find(u => u.id === creatorId || u.username === creatorUsername);
    if (creator) {
      creator.earnedTokens = Math.max(0, creator.earnedTokens - Number(tokensExchanged));
      creator.earningsUSD = parseFloat((creator.earnedTokens * 0.10).toFixed(2));
    }

    saveDatabase(db);
    res.json({ success: true, payout: newPayout, creator });
  });

  app.put('/api/payouts/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const payout = db.payouts.find(p => p.id === id);
    if (!payout) {
      return res.status(404).json({ success: false, error: 'Payout not found' });
    }

    payout.status = status;
    saveDatabase(db);
    res.json({ success: true, payout });
  });

  // ==========================================
  // ADMIN PANEL & BACKEND MANAGEMENT
  // ==========================================

  // 13. Admin: Get Full Users List (with Online Status & Joined Date / New Badge)
  app.get('/api/admin/users', (req, res) => {
    const now = Date.now();
    const formattedUsers = db.users.map(u => {
      const active = isUserActive(u);
      const isNew = (now - (u.joinedTimestamp || 0)) < (1000 * 60 * 60 * 24 * 7); // Joined within 7 days
      return {
        ...u,
        isOnline: active,
        isNewUser: isNew,
        lastSeenDiffMinutes: Math.round((now - (u.lastSeenTimestamp || 0)) / 60000),
      };
    });

    res.json({
      success: true,
      totalUsers: formattedUsers.length,
      onlineUsersCount: formattedUsers.filter(u => u.isOnline).length,
      newUsersCount: formattedUsers.filter(u => u.isNewUser).length,
      users: formattedUsers,
    });
  });

  // 14. Admin: Ban / Unban User
  app.post('/api/admin/users/:id/ban', (req, res) => {
    const { id } = req.params;
    const user = db.users.find(u => u.id === id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.isBanned = !user.isBanned;
    if (user.isBanned) {
      user.isOnline = false;
    }
    saveDatabase(db);
    res.json({ success: true, isBanned: user.isBanned, user });
  });

  // 15. Admin: Grant / Adjust User Tokens
  app.post('/api/admin/users/:id/tokens', (req, res) => {
    const { id } = req.params;
    const { amount } = req.body;
    const user = db.users.find(u => u.id === id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.tokensBalance = Math.max(0, user.tokensBalance + Number(amount));
    saveDatabase(db);
    res.json({ success: true, tokensBalance: user.tokensBalance, user });
  });

  // 16. Admin: Toggle User Verification
  app.post('/api/admin/users/:id/verify', (req, res) => {
    const { id } = req.params;
    const user = db.users.find(u => u.id === id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.isVerified = !user.isVerified;
    saveDatabase(db);
    res.json({ success: true, isVerified: user.isVerified, user });
  });

  // 17. Admin: Change User Role
  app.post('/api/admin/users/:id/role', (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    const user = db.users.find(u => u.id === id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.role = role;
    saveDatabase(db);
    res.json({ success: true, role: user.role, user });
  });

  // 18. Admin: Delete User
  app.delete('/api/admin/users/:id', (req, res) => {
    const { id } = req.params;
    const initialLen = db.users.length;
    db.users = db.users.filter(u => u.id !== id);
    if (db.users.length < initialLen) {
      saveDatabase(db);
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: 'User not found' });
    }
  });

  // 19. Admin: Platform Stats Overview
  app.get('/api/admin/stats', (req, res) => {
    const now = Date.now();
    const onlineUsers = db.users.filter(u => isUserActive(u)).length;
    const newUsersToday = db.users.filter(u => (now - (u.joinedTimestamp || 0)) < 1000 * 60 * 60 * 24).length;
    const totalViews = db.clips.reduce((acc, c) => acc + (c.views || 0), 0);
    const totalLoops = db.clips.reduce((acc, c) => acc + (c.loopsCount || 0), 0);
    const totalTokensVolume = db.users.reduce((acc, u) => acc + (u.earnedTokens || 0), 0);

    res.json({
      success: true,
      stats: {
        totalUsers: db.users.length,
        onlineUsers,
        newUsersToday,
        totalClips: db.clips.length,
        totalViews,
        totalLoops,
        totalTokensVolume,
        pendingPayoutsCount: db.payouts.filter(p => p.status === 'pending').length,
        paywalledClipsCount: db.clips.filter(c => c.isPaywalled).length,
      }
    });
  });

  // 20. Admin: Branding
  app.get('/api/admin/branding', (req, res) => {
    res.json({ success: true, branding: db.branding });
  });

  app.post('/api/admin/branding', (req, res) => {
    db.branding = { ...db.branding, ...req.body };
    saveDatabase(db);
    res.json({ success: true, branding: db.branding });
  });

  // 21. Admin: Credentials
  app.get('/api/admin/credentials', (req, res) => {
    res.json({ success: true, credentials: db.adminCredentials });
  });

  app.post('/api/admin/credentials', (req, res) => {
    db.adminCredentials = { ...db.adminCredentials, ...req.body };
    saveDatabase(db);
    res.json({ success: true, credentials: db.adminCredentials });
  });

  // 22. Admin: Database Full Export / Import
  app.get('/api/admin/database/export', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=islandheat_database_${Date.now()}.json`);
    res.send(JSON.stringify(db, null, 2));
  });

  app.post('/api/admin/database/import', (req, res) => {
    const incoming = req.body;
    if (incoming && (incoming.users || incoming.clips)) {
      if (Array.isArray(incoming.users)) db.users = incoming.users;
      if (Array.isArray(incoming.clips)) db.clips = incoming.clips;
      if (Array.isArray(incoming.payouts)) db.payouts = incoming.payouts;
      if (incoming.branding) db.branding = incoming.branding;
      if (incoming.adminCredentials) db.adminCredentials = incoming.adminCredentials;
      saveDatabase(db);
      res.json({ success: true, message: 'Database successfully restored' });
    } else {
      res.status(400).json({ success: false, error: 'Invalid database JSON format' });
    }
  });

  // 23. Admin: Boost Clip Stats
  app.post('/api/admin/boost-stats', (req, res) => {
    const { category, viewsToAdd, likesToAdd, clipId } = req.body;

    let updatedCount = 0;
    db.clips.forEach(clip => {
      if (clipId) {
        if (clip.id === clipId) {
          clip.views += Number(viewsToAdd) || 0;
          clip.likes += Number(likesToAdd) || 0;
          clip.loopsCount += (Number(viewsToAdd) || 0) * 3;
          updatedCount++;
        }
      } else if (!category || category === 'all' || clip.category.toLowerCase() === category.toLowerCase()) {
        clip.views += Number(viewsToAdd) || 0;
        clip.likes += Number(likesToAdd) || 0;
        clip.loopsCount += (Number(viewsToAdd) || 0) * 3;
        updatedCount++;
      }
    });

    saveDatabase(db);
    res.json({ success: true, updatedCount });
  });

  // ==========================================
  // VITE DEV / PRODUCTION MIDDLEWARE
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[IslandHeat] Server running at http://0.0.0.0:${PORT}`);
    console.log(`[Hostinger DB] Connected. ${db.users.length} users, ${db.clips.length} clips.`);
  });
}

startServer();
