import React, { useState, useRef, useEffect } from 'react';
import { 
  X, ShieldCheck, Users, Film, DollarSign, Settings, Check, 
  XCircle, Lock, Unlock, Sparkles, Flame, Plus, Trash2, Coins, 
  Building2, CreditCard, CheckCircle2, AlertTriangle, RefreshCw,
  Download, Upload, KeyRound, Database, Save, Image, Palette, Type, Globe,
  Eye, Heart, TrendingUp, Zap, BarChart3, Search, Sliders,
  UserCheck, UserX, UserPlus, Activity, Wifi, WifiOff, Clock, Calendar,
  Award, Ban, Mail, MapPin, Star, ChevronRight, Cloud, Copy
} from 'lucide-react';
import { VideoClip, PayoutRequest, UserAccount, Category, SiteBranding, TokenTransaction, CoinLedgerItem, UnlockedItem, CoinEventType } from '../types';
import { 
  getStoredPayoutRequests, updatePayoutStatus, getStoredTokenTransactions,
  getAdminCredentials, saveAdminCredentials, exportDatabaseJSON, importDatabaseJSON,
  getSiteBranding, saveSiteBranding, saveStoredClips, getRegisteredUsers,
  formatLastSeenText, formatJoinedDateText, adminToggleBanUser, adminGrantTokensToUser,
  adminToggleVerifyUser, adminChangeUserRole, adminDeleteUserAccount, saveRegisteredUsers,
  getCoinLedger, getUnlockedItems, deleteStoredClip, deleteStoredCreatorImage
} from '../utils/storage';
import { 
  fetchAdminUsersApi, adminToggleBanUserApi, adminGrantTokensApi, 
  adminToggleVerifyApi, adminChangeRoleApi, adminDeleteUserApi, AdminUserListItem 
} from '../utils/api';
import { 
  checkSupabaseConnection, SUPABASE_URL, SUPABASE_SQL_SCHEMA,
  fetchTransactionsFromSupabase, fetchCoinLedgerFromSupabase, 
  fetchPayoutRequestsFromSupabase, fetchUnlockedItemsFromSupabase
} from '../utils/supabase';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  clips: VideoClip[];
  onUpdateClips: (clips: VideoClip[]) => void;
  activeUser: UserAccount;
  onAccountUpdate: (updated: UserAccount) => void;
  branding?: SiteBranding;
  onBrandingUpdate?: (branding: SiteBranding) => void;
}

const ACCENT_PRESETS = [
  { name: 'IslandHeat Orange', color: '#f97316' },
  { name: 'Caribbean Emerald', color: '#10b981' },
  { name: 'VIP Gold', color: '#eab308' },
  { name: 'Hot Pink / Magenta', color: '#ec4899' },
  { name: 'Electric Cyan', color: '#06b6d4' },
  { name: 'Royal Purple', color: '#a855f7' },
];

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  clips,
  onUpdateClips,
  activeUser,
  onAccountUpdate,
  branding: initialBranding,
  onBrandingUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'finance' | 'branding' | 'payouts' | 'clips' | 'users'>('overview');
  const [payoutsList, setPayoutsList] = useState<PayoutRequest[]>(getStoredPayoutRequests());
  const [transactionsList, setTransactionsList] = useState<TokenTransaction[]>(getStoredTokenTransactions());
  const [coinLedgerList, setCoinLedgerList] = useState<CoinLedgerItem[]>(getCoinLedger());
  const [unlockedItemsList, setUnlockedItemsList] = useState<UnlockedItem[]>(getUnlockedItems());

  // Finance tab controls
  const [financeSubTab, setFinanceSubTab] = useState<'ledger' | 'payments' | 'unlocks'>('ledger');
  const [financeSearch, setFinanceSearch] = useState('');
  const [financeTypeFilter, setFinanceTypeFilter] = useState<string>('all');
  const [isSyncingFinance, setIsSyncingFinance] = useState(false);
  const [financeToast, setFinanceToast] = useState('');
  const [viewKycUser, setViewKycUser] = useState<UserAccount | null>(null);

  // Fetch / Sync financial data from Supabase
  const handleSyncFinancials = async () => {
    setIsSyncingFinance(true);
    setFinanceToast('Syncing financial records with Supabase...');
    try {
      const [txRes, ledgerRes, unlockRes, payoutRes] = await Promise.all([
        fetchTransactionsFromSupabase(),
        fetchCoinLedgerFromSupabase(),
        fetchUnlockedItemsFromSupabase(),
        fetchPayoutRequestsFromSupabase(),
      ]);

      if (txRes.success && txRes.transactions.length > 0) {
        setTransactionsList(txRes.transactions);
        localStorage.setItem('islandheat_token_transactions_v2', JSON.stringify(txRes.transactions));
      }
      if (ledgerRes.success && ledgerRes.ledger.length > 0) {
        setCoinLedgerList(ledgerRes.ledger);
        localStorage.setItem('islandheat_coin_ledger_v2', JSON.stringify(ledgerRes.ledger));
      }
      if (unlockRes.success && unlockRes.items.length > 0) {
        setUnlockedItemsList(unlockRes.items);
        localStorage.setItem('islandheat_unlocked_items_v2', JSON.stringify(unlockRes.items));
      }
      if (payoutRes.success && payoutRes.requests.length > 0) {
        setPayoutsList(payoutRes.requests);
        localStorage.setItem('islandheat_payout_requests_v2', JSON.stringify(payoutRes.requests));
      }

      setFinanceToast('✅ Financial ledger and payments synced from Supabase PostgreSQL!');
      setTimeout(() => setFinanceToast(''), 3500);
    } catch (e: any) {
      setFinanceToast('Loaded local ledger cache.');
      setTimeout(() => setFinanceToast(''), 3000);
    } finally {
      setIsSyncingFinance(false);
    }
  };

  // CSV Exporter for Financial Audit
  const handleExportPaymentsCSV = () => {
    const headers = ['Transaction ID', 'User ID', 'Username', 'Tokens Purchased', 'Bonus Tokens', 'Cost USD', 'Payment Method', 'Status', 'Date'];
    const rows = transactionsList.map(tx => [
      `"${tx.id}"`,
      `"${tx.userId}"`,
      `"${tx.username}"`,
      tx.tokens,
      tx.bonusTokens || 0,
      `"$${tx.costUSD.toFixed(2)}"`,
      `"${tx.method}"`,
      `"${tx.status}"`,
      `"${tx.createdAt}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `islandheat_payment_transactions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setFinanceToast('✅ Exported payments CSV spreadsheet!');
    setTimeout(() => setFinanceToast(''), 3000);
  };

  const handleExportLedgerCSV = () => {
    const headers = ['Ledger ID', 'User ID', 'Username', 'Event Type', 'Tokens Delta', 'Target ID/Creator', 'USD Value', 'Description', 'Timestamp'];
    const rows = coinLedgerList.map(item => [
      `"${item.id}"`,
      `"${item.userId}"`,
      `"${item.username}"`,
      `"${item.eventType}"`,
      item.tokensAmount,
      `"${item.targetCreator || item.targetId || '-'}"`,
      `"$${(item.usdEquivalent || 0).toFixed(2)}"`,
      `"${item.description.replace(/"/g, '""')}"`,
      `"${item.createdAt}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `islandheat_coin_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setFinanceToast('✅ Exported coin ledger CSV audit file!');
    setTimeout(() => setFinanceToast(''), 3000);
  };

  // Users State
  const [usersList, setUsersList] = useState<UserAccount[]>(getRegisteredUsers());
  const [userFilter, setUserFilter] = useState<'all' | 'online' | 'new' | 'creators' | 'banned'>('all');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [tokenModalUser, setTokenModalUser] = useState<UserAccount | null>(null);
  const [tokenGrantAmount, setTokenGrantAmount] = useState(100);
  const [userActionToast, setUserActionToast] = useState('');

  // Admin Credentials State
  const currentCreds = getAdminCredentials();
  const [adminUser, setAdminUser] = useState(currentCreds.username);
  const [adminPass, setAdminPass] = useState(currentCreds.password);
  const [credSaveMsg, setCredSaveMsg] = useState('');

  // Branding State
  const activeBranding = initialBranding || getSiteBranding();
  const [logoType, setLogoType] = useState<'text' | 'image' | 'both'>(activeBranding.logoType || 'text');
  const [logoText, setLogoText] = useState(activeBranding.logoText);
  const [logoSubtext, setLogoSubtext] = useState(activeBranding.logoSubtext);
  const [logoImageUrl, setLogoImageUrl] = useState(activeBranding.logoImageUrl || '');
  const [accentColor, setAccentColor] = useState(activeBranding.accentColor);
  const [siteName, setSiteName] = useState(activeBranding.siteName);
  const [brandingSaveMsg, setBrandingSaveMsg] = useState('');

  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Database Backup/Restore State
  const [backupMsg, setBackupMsg] = useState('');

  // Supabase Cloud State
  const [supabaseStatus, setSupabaseStatus] = useState<string>('Ready');
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleTestSupabase = async () => {
    setIsTestingSupabase(true);
    setSupabaseStatus('Testing connection to Supabase...');
    const res = await checkSupabaseConnection();
    setIsTestingSupabase(false);
    if (res.connected) {
      setSupabaseStatus(`✅ Connected! Active Buckets: ${res.buckets && res.buckets.length > 0 ? res.buckets.join(', ') : 'None yet (create "videos" & "media" in storage)'}`);
    } else {
      setSupabaseStatus(`⚠️ Reached: ${res.message}`);
    }
  };

  const handleCopySqlSchema = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  // Fake Views & Likes Booster State
  const [clipSearch, setClipSearch] = useState('');
  const [batchViewsToAdd, setBatchViewsToAdd] = useState(5000);
  const [batchLikesToAdd, setBatchLikesToAdd] = useState(500);
  const [batchCategory, setBatchCategory] = useState<string>('all');
  const [statsToastMsg, setStatsToastMsg] = useState('');

  // Refresh users on modal open and periodically
  const loadUsers = async () => {
    try {
      const serverRes = await fetchAdminUsersApi();
      if (serverRes.users && serverRes.users.length > 0) {
        setUsersList(serverRes.users);
        saveRegisteredUsers(serverRes.users);
      } else {
        setUsersList(getRegisteredUsers());
      }
    } catch {
      setUsersList(getRegisteredUsers());
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      // Real-time polling every 10 seconds while admin panel is open
      const interval = setInterval(() => {
        loadUsers();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // Compute live user stats
  const now = Date.now();
  const onlineCount = usersList.filter(u => {
    if (u.isBanned) return false;
    const diff = now - (u.lastSeenTimestamp || 0);
    return diff < 120000 || u.isOnline;
  }).length;

  const newUsersCount = usersList.filter(u => {
    const diff = now - (u.joinedTimestamp || 0);
    return diff < (1000 * 60 * 60 * 24 * 7); // < 7 days
  }).length;

  const creatorsCount = usersList.filter(u => u.role === 'creator').length;
  const bannedCount = usersList.filter(u => u.isBanned).length;

  // Filtered users list
  const filteredUsers = usersList.filter(u => {
    const matchesSearch = !userSearchQuery || 
      u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.displayName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      (u.location && u.location.toLowerCase().includes(userSearchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    const isUserOnline = !u.isBanned && ((now - (u.lastSeenTimestamp || 0)) < 120000 || u.isOnline);
    const isNew = (now - (u.joinedTimestamp || 0)) < (1000 * 60 * 60 * 24 * 7);

    if (userFilter === 'online') return isUserOnline;
    if (userFilter === 'new') return isNew;
    if (userFilter === 'creators') return u.role === 'creator';
    if (userFilter === 'banned') return !!u.isBanned;
    return true;
  });

  const showToast = (msg: string) => {
    setUserActionToast(msg);
    setTimeout(() => setUserActionToast(''), 3500);
  };

  // User Actions Handlers
  const handleToggleBan = async (user: UserAccount) => {
    const newBanState = !user.isBanned;
    adminToggleBanUser(user.id);
    await adminToggleBanUserApi(user.id);

    setUsersList(prev => prev.map(u => u.id === user.id ? { ...u, isBanned: newBanState, isOnline: newBanState ? false : u.isOnline } : u));
    showToast(newBanState ? `🚫 Account @${user.username} has been suspended.` : `✅ Account @${user.username} restored.`);
  };

  const handleToggleVerify = async (user: UserAccount) => {
    const newVerifyState = !user.isVerified;
    adminToggleVerifyUser(user.id);
    await adminToggleVerifyApi(user.id);

    setUsersList(prev => prev.map(u => u.id === user.id ? { ...u, isVerified: newVerifyState } : u));
    showToast(newVerifyState ? `✨ @${user.username} granted Verified Creator badge!` : `Removed verified badge from @${user.username}`);
  };

  const handleChangeRole = async (user: UserAccount, newRole: 'user' | 'creator' | 'admin') => {
    adminChangeUserRole(user.id, newRole);
    await adminChangeRoleApi(user.id, newRole);

    setUsersList(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
    showToast(`Role updated for @${user.username} to ${newRole.toUpperCase()}`);
  };

  const handleDeleteUser = async (user: UserAccount) => {
    if (user.id === activeUser.id) {
      alert('You cannot delete your own active admin account.');
      return;
    }
    if (window.confirm(`Are you sure you want to permanently delete user @${user.username}? This action cannot be undone.`)) {
      adminDeleteUserAccount(user.id);
      await adminDeleteUserApi(user.id);
      setUsersList(prev => prev.filter(u => u.id !== user.id));
      showToast(`🗑️ User @${user.username} deleted.`);
    }
  };

  const handleGrantTokens = async () => {
    if (!tokenModalUser) return;
    const amount = Number(tokenGrantAmount);
    if (isNaN(amount) || amount === 0) return;

    adminGrantTokensToUser(tokenModalUser.id, amount);
    await adminGrantTokensApi(tokenModalUser.id, amount);

    setUsersList(prev => prev.map(u => u.id === tokenModalUser.id ? { ...u, tokensBalance: Math.max(0, (u.tokensBalance || 0) + amount) } : u));
    showToast(`🪙 Successfully updated tokens for @${tokenModalUser.username} (${amount > 0 ? `+${amount}` : amount} Tokens)`);
    setTokenModalUser(null);
  };

  const handleSaveAdminCreds = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser.trim() || !adminPass.trim()) return;
    saveAdminCredentials({ username: adminUser.trim(), password: adminPass.trim() });
    setCredSaveMsg('✅ Admin credentials updated! Use these on /admin login.');
    setTimeout(() => setCredSaveMsg(''), 3000);
  };

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = saveSiteBranding({
      logoType,
      logoText: logoText.trim() || 'RG',
      logoSubtext: logoSubtext.trim() || 'REDGIFS',
      logoImageUrl: logoImageUrl.trim(),
      accentColor,
      siteName: siteName.trim() || 'RedGIFs Caribbean',
    });
    if (onBrandingUpdate) {
      onBrandingUpdate(updated);
    }
    setBrandingSaveMsg('✅ Site logo & branding updated successfully across all pages!');
    setTimeout(() => setBrandingSaveMsg(''), 3500);
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, SVG, WebP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setLogoImageUrl(dataUrl);
        setLogoType('image');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExportDB = () => {
    const jsonStr = exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `redgifs_database_backup_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setBackupMsg('✅ Database exported as JSON file!');
    setTimeout(() => setBackupMsg(''), 3000);
  };

  const handleImportDB = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && importDatabaseJSON(content)) {
        setBackupMsg('✅ Database restored successfully! Reloading view...');
        setTimeout(() => window.location.reload(), 1200);
      } else {
        setBackupMsg('❌ Invalid database JSON file!');
      }
    };
    reader.readAsText(file);
  };

  // Handle approving or rejecting payouts
  const handleProcessPayout = (requestId: string, status: 'approved' | 'rejected') => {
    const updated = updatePayoutStatus(requestId, status);
    setPayoutsList(updated);
  };

  // Toggle clip paywalled status & price
  const handleTogglePaywall = (clipId: string) => {
    const updatedClips = clips.map(clip => {
      if (clip.id === clipId) {
        return {
          ...clip,
          isPaywalled: !clip.isPaywalled,
          priceTokens: clip.priceTokens || 50,
        };
      }
      return clip;
    });
    onUpdateClips(updatedClips);
  };

  const handleDeleteClip = (clipId: string) => {
    if (window.confirm('Admin Action: Delete this clip from platform?')) {
      const updatedClips = deleteStoredClip(clipId);
      onUpdateClips(updatedClips);
    }
  };

  const handleUpdatePrice = (clipId: string, newPrice: number) => {
    const updatedClips = clips.map(clip => {
      if (clip.id === clipId) {
        return { ...clip, priceTokens: newPrice };
      }
      return clip;
    });
    saveStoredClips(updatedClips);
    onUpdateClips(updatedClips);
  };

  // --- Fake Views & Likes Booster Actions ---
  const handleBatchBoost = (viewsToAdd: number, likesToAdd: number, targetCategory = 'all') => {
    let affectedCount = 0;
    const updatedClips = clips.map(clip => {
      if (targetCategory === 'all' || clip.category === targetCategory) {
        affectedCount++;
        const newViews = Math.max(0, (clip.views || 0) + viewsToAdd);
        const newLoops = Math.max(0, (clip.loopsCount || 0) + viewsToAdd);
        const newLikes = Math.max(0, (clip.likes || 0) + likesToAdd);
        return {
          ...clip,
          views: newViews,
          loopsCount: newLoops,
          likes: newLikes,
        };
      }
      return clip;
    });

    saveStoredClips(updatedClips);
    onUpdateClips(updatedClips);
    setStatsToastMsg(`🚀 Boost applied to ${affectedCount} clips! (+${viewsToAdd.toLocaleString()} Views, +${likesToAdd.toLocaleString()} Likes)`);
    setTimeout(() => setStatsToastMsg(''), 4000);
  };

  const handleRandomizeOrganicBoost = () => {
    const updatedClips = clips.map(clip => {
      const randomViews = Math.floor(Math.random() * 12000) + 1500;
      const randomLikes = Math.floor(randomViews * (0.05 + Math.random() * 0.08));
      return {
        ...clip,
        views: (clip.views || 0) + randomViews,
        loopsCount: (clip.loopsCount || 0) + randomViews,
        likes: (clip.likes || 0) + randomLikes,
      };
    });

    saveStoredClips(updatedClips);
    onUpdateClips(updatedClips);
    setStatsToastMsg(`🎲 Organic engagement boost randomized across all ${updatedClips.length} clips!`);
    setTimeout(() => setStatsToastMsg(''), 4000);
  };

  const handleQuickBoostSingleClip = (clipId: string, viewsDelta: number, likesDelta: number) => {
    const updatedClips = clips.map(clip => {
      if (clip.id === clipId) {
        const newViews = Math.max(0, (clip.views || 0) + viewsDelta);
        const newLoops = Math.max(0, (clip.loopsCount || 0) + viewsDelta);
        const newLikes = Math.max(0, (clip.likes || 0) + likesDelta);
        return {
          ...clip,
          views: newViews,
          loopsCount: newLoops,
          likes: newLikes,
        };
      }
      return clip;
    });

    saveStoredClips(updatedClips);
    onUpdateClips(updatedClips);
  };

  const handleSetExactStats = (clipId: string, exactViews: number, exactLikes: number) => {
    const updatedClips = clips.map(clip => {
      if (clip.id === clipId) {
        return {
          ...clip,
          views: Math.max(0, exactViews),
          loopsCount: Math.max(0, exactViews),
          likes: Math.max(0, exactLikes),
        };
      }
      return clip;
    });

    saveStoredClips(updatedClips);
    onUpdateClips(updatedClips);
  };

  // Give bonus tokens to active account (Admin Perk)
  const handleAddAdminTokens = () => {
    onAccountUpdate({
      ...activeUser,
      tokensBalance: activeUser.tokensBalance + 500
    });
  };

  const pendingPayouts = payoutsList.filter(p => p.status === 'pending');
  const approvedPayouts = payoutsList.filter(p => p.status === 'approved');

  const totalTokensBought = transactionsList.reduce((acc, tx) => acc + (Number(tx.tokens) || 0), 0);
  const totalRevenueUSD = transactionsList.reduce((acc, tx) => acc + (Number(tx.costUSD) || 0), 0);
  const totalTipsCirculated = coinLedgerList.filter(l => l.eventType === 'tip_creator').reduce((acc, l) => acc + Math.abs(l.tokensAmount || 0), 0);
  const totalUnlocksCost = coinLedgerList.filter(l => l.eventType === 'unlock_clip' || l.eventType === 'unlock_image').reduce((acc, l) => acc + Math.abs(l.tokensAmount || 0), 0);

  // Financial filtering
  const filteredTransactions = transactionsList.filter(tx => {
    const q = financeSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      tx.id.toLowerCase().includes(q) ||
      tx.username.toLowerCase().includes(q) ||
      tx.userId.toLowerCase().includes(q) ||
      tx.method.toLowerCase().includes(q) ||
      tx.status.toLowerCase().includes(q)
    );
  });

  const filteredCoinLedger = coinLedgerList.filter(item => {
    const q = financeSearch.toLowerCase().trim();
    const matchesQuery = !q || (
      item.id.toLowerCase().includes(q) ||
      item.username.toLowerCase().includes(q) ||
      item.userId.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      (item.targetCreator && item.targetCreator.toLowerCase().includes(q)) ||
      (item.targetId && item.targetId.toLowerCase().includes(q))
    );

    const matchesType = financeTypeFilter === 'all' || item.eventType === financeTypeFilter;
    return matchesQuery && matchesType;
  });

  const filteredUnlockedItems = unlockedItemsList.filter(item => {
    const q = financeSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      item.id.toLowerCase().includes(q) ||
      item.userId.toLowerCase().includes(q) ||
      item.itemId.toLowerCase().includes(q) ||
      item.itemType.toLowerCase().includes(q) ||
      (item.creatorUsername && item.creatorUsername.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl bg-zinc-950 border border-emerald-500/40 rounded-3xl p-5 md:p-6 shadow-2xl max-h-[92vh] flex flex-col custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-black shadow-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-bold text-white">
                  RedGifs Master Admin Panel
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  SUPERADMIN
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Site branding, coin ledger, payment transactions, creator payouts, users, & Supabase cloud.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 my-4 border-b border-zinc-800 pb-3 overflow-x-auto custom-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'overview' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Overview & DB</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('finance');
              handleSyncFinancials();
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap relative ${
              activeTab === 'finance' 
                ? 'bg-amber-500 text-black shadow-md' 
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>Payments & Coins</span>
            <span className="px-1.5 py-0.2 text-[9px] bg-emerald-500 text-black font-black rounded-full">
              ${totalRevenueUSD.toFixed(0)}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('payouts')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap relative ${
              activeTab === 'payouts' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Payout Requests</span>
            {pendingPayouts.length > 0 && (
              <span className="px-1.5 py-0.2 text-[9px] bg-amber-500 text-black font-black rounded-full">
                {pendingPayouts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'users' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Users & Roles</span>
          </button>

          <button
            onClick={() => setActiveTab('clips')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'clips' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Clips ({clips.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('branding')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'branding' 
                ? 'bg-orange-500 text-white shadow-md' 
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Site Logo & Branding</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
          {/* FINANCE & COIN LEDGER RECORD KEEPING TAB */}
          {activeTab === 'finance' && (
            <div className="space-y-5">
              {/* Toast Feedback */}
              {financeToast && (
                <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>{financeToast}</span>
                </div>
              )}

              {/* Top Financial KPI Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-zinc-900 border border-emerald-500/30 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-zinc-400 text-[11px] font-bold">
                    <span>Gross Revenue</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-xl font-black text-emerald-400 mt-1 font-mono">
                    ${totalRevenueUSD.toFixed(2)} <span className="text-[10px] text-zinc-500 font-normal font-sans">USD</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1">
                    {transactionsList.length} total payments processed
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-900 border border-amber-500/30 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-zinc-400 text-[11px] font-bold">
                    <span>Tokens Bought</span>
                    <Coins className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-xl font-black text-amber-300 mt-1 font-mono">
                    {totalTokensBought.toLocaleString()} <span className="text-[10px] text-zinc-500 font-normal font-sans">tokens</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1">
                    Inflow via payment gateways
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-900 border border-orange-500/30 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-zinc-400 text-[11px] font-bold">
                    <span>Creator Tips</span>
                    <Sparkles className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="text-xl font-black text-orange-400 mt-1 font-mono">
                    {totalTipsCirculated.toLocaleString()} <span className="text-[10px] text-zinc-500 font-normal font-sans">tokens</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1">
                    ~${(totalTipsCirculated * 0.10).toFixed(2)} USD value
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-900 border border-purple-500/30 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-zinc-400 text-[11px] font-bold">
                    <span>VIP Unlocks</span>
                    <Lock className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-xl font-black text-purple-400 mt-1 font-mono">
                    {totalUnlocksCost.toLocaleString()} <span className="text-[10px] text-zinc-500 font-normal font-sans">tokens</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1">
                    {unlockedItemsList.length} paywalled media unlocks
                  </div>
                </div>
              </div>

              {/* Sub-tab Navigation & Actions Bar */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 custom-scrollbar text-xs">
                  <button
                    type="button"
                    onClick={() => setFinanceSubTab('ledger')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                      financeSubTab === 'ledger'
                        ? 'bg-amber-500 text-black shadow-md'
                        : 'bg-zinc-950 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Coin Ledger Flow ({coinLedgerList.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFinanceSubTab('payments')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                      financeSubTab === 'payments'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-zinc-950 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Token Purchases ({transactionsList.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFinanceSubTab('unlocks')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                      financeSubTab === 'unlocks'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-zinc-950 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>VIP Unlocks ({unlockedItemsList.length})</span>
                  </button>
                </div>

                {/* Right Actions: Sync & CSV Export */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleSyncFinancials}
                    disabled={isSyncingFinance}
                    className="px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
                    title="Fetch live records from Supabase tables: transactions, coin_ledger, unlocked_items"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-orange-400 ${isSyncingFinance ? 'animate-spin' : ''}`} />
                    <span>{isSyncingFinance ? 'Syncing...' : 'Sync Supabase'}</span>
                  </button>

                  {financeSubTab === 'payments' ? (
                    <button
                      type="button"
                      onClick={handleExportPaymentsCSV}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Export Payments CSV</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleExportLedgerCSV}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-400" />
                      <span>Export Ledger CSV</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Search & Filter Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={financeSearch}
                    onChange={(e) => setFinanceSearch(e.target.value)}
                    placeholder="Search by username, transaction ID, creator, target..."
                    className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-sans"
                  />
                  {financeSearch && (
                    <button
                      onClick={() => setFinanceSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {financeSubTab === 'ledger' && (
                  <select
                    value={financeTypeFilter}
                    onChange={(e) => setFinanceTypeFilter(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="all">All Event Types</option>
                    <option value="purchase">Token Purchases (+)</option>
                    <option value="tip_creator">Creator Tips (-)</option>
                    <option value="unlock_clip">Clip Unlocks (-)</option>
                    <option value="unlock_image">Photo Unlocks (-)</option>
                    <option value="admin_grant">Admin Grants (+/-)</option>
                    <option value="payout_exchange">Payout Withdrawals (-)</option>
                  </select>
                )}
              </div>

              {/* SUBTAB 1: COIN LEDGER FLOW */}
              {financeSubTab === 'ledger' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Showing <strong>{filteredCoinLedger.length}</strong> logged ledger events</span>
                    <span className="font-mono text-[11px] text-zinc-500">Dual-written: LocalStorage + Supabase public.coin_ledger</span>
                  </div>

                  {filteredCoinLedger.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-zinc-900/50 border border-zinc-800/80 text-zinc-500 text-xs">
                      No coin ledger events found matching your search.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/60 custom-scrollbar">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                          <tr>
                            <th className="p-3">Event Type</th>
                            <th className="p-3">User</th>
                            <th className="p-3">Tokens Delta</th>
                            <th className="p-3">USD Equiv.</th>
                            <th className="p-3">Target / Creator</th>
                            <th className="p-3">Description</th>
                            <th className="p-3 text-right">Date & Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60">
                          {filteredCoinLedger.map((item) => {
                            const isPositive = item.tokensAmount > 0;
                            return (
                              <tr key={item.id} className="hover:bg-zinc-800/40 transition">
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase whitespace-nowrap ${
                                    item.eventType === 'purchase' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                    item.eventType === 'tip_creator' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                                    item.eventType === 'unlock_clip' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                    item.eventType === 'unlock_image' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                                    item.eventType === 'admin_grant' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                    'bg-zinc-800 text-zinc-300 border border-zinc-700'
                                  }`}>
                                    {item.eventType.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="p-3 font-mono">
                                  <span className="font-bold text-white">@{item.username}</span>
                                  <span className="block text-[10px] text-zinc-500 truncate max-w-[100px]">{item.userId}</span>
                                </td>
                                <td className="p-3">
                                  <div className={`font-mono font-black flex items-center gap-1 ${
                                    isPositive ? 'text-emerald-400' : 'text-amber-400'
                                  }`}>
                                    <Coins className="w-3.5 h-3.5" />
                                    <span>{isPositive ? `+${item.tokensAmount}` : item.tokensAmount}</span>
                                  </div>
                                </td>
                                <td className="p-3 font-mono text-zinc-300">
                                  ${(item.usdEquivalent || (Math.abs(item.tokensAmount) * 0.10)).toFixed(2)}
                                </td>
                                <td className="p-3 font-mono text-xs">
                                  {item.targetCreator ? (
                                    <span className="text-orange-400 font-bold">@{item.targetCreator}</span>
                                  ) : item.targetId ? (
                                    <span className="text-zinc-500 truncate max-w-[100px] block">{item.targetId}</span>
                                  ) : (
                                    <span className="text-zinc-600">-</span>
                                  )}
                                </td>
                                <td className="p-3 text-zinc-300 max-w-[240px] truncate" title={item.description}>
                                  {item.description}
                                </td>
                                <td className="p-3 text-right text-zinc-400 text-[11px] whitespace-nowrap">
                                  {item.createdAt}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* SUBTAB 2: PAYMENT TRANSACTIONS (TOKEN PURCHASES) */}
              {financeSubTab === 'payments' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Showing <strong>{filteredTransactions.length}</strong> token purchases</span>
                    <span className="font-mono text-[11px] text-zinc-500">Dual-written: LocalStorage + Supabase public.transactions</span>
                  </div>

                  {filteredTransactions.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-zinc-900/50 border border-zinc-800/80 text-zinc-500 text-xs">
                      No payment transactions found.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/60 custom-scrollbar">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                          <tr>
                            <th className="p-3">Tx ID</th>
                            <th className="p-3">Buyer Account</th>
                            <th className="p-3">Tokens Purchased</th>
                            <th className="p-3">Amount Paid</th>
                            <th className="p-3">Payment Gateway</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Processed At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60">
                          {filteredTransactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-zinc-800/40 transition">
                              <td className="p-3 font-mono text-[11px] text-zinc-400">
                                <span className="p-1 px-1.5 rounded bg-black/60 border border-zinc-800 select-all font-mono">
                                  {tx.id}
                                </span>
                              </td>
                              <td className="p-3 font-mono">
                                <span className="font-bold text-white">@{tx.username}</span>
                                <span className="block text-[10px] text-zinc-500">{tx.userId}</span>
                              </td>
                              <td className="p-3">
                                <div className="font-mono font-bold text-amber-300 flex items-center gap-1">
                                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                                  <span>{tx.tokens.toLocaleString()}</span>
                                  {tx.bonusTokens && tx.bonusTokens > 0 ? (
                                    <span className="text-[10px] text-emerald-400 font-sans">
                                      (+{tx.bonusTokens} bonus)
                                    </span>
                                  ) : null}
                                </div>
                              </td>
                              <td className="p-3 font-mono font-bold text-emerald-400">
                                ${tx.costUSD.toFixed(2)} USD
                              </td>
                              <td className="p-3">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-[11px]">
                                  {tx.method === 'paypal' ? (
                                    <>
                                      <CreditCard className="w-3 h-3 text-blue-400" />
                                      <span>PayPal</span>
                                    </>
                                  ) : tx.method === 'bank_transfer' ? (
                                    <>
                                      <Building2 className="w-3 h-3 text-emerald-400" />
                                      <span>Bank Wire</span>
                                    </>
                                  ) : (
                                    <>
                                      <CreditCard className="w-3 h-3 text-purple-400" />
                                      <span>Credit Card</span>
                                    </>
                                  )}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  {tx.status || 'completed'}
                                </span>
                              </td>
                              <td className="p-3 text-right text-zinc-400 text-[11px] whitespace-nowrap">
                                {tx.createdAt}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* SUBTAB 3: VIP CONTENT UNLOCKS */}
              {financeSubTab === 'unlocks' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Showing <strong>{filteredUnlockedItems.length}</strong> unlocked premium items</span>
                    <span className="font-mono text-[11px] text-zinc-500">Dual-written: LocalStorage + Supabase public.unlocked_items</span>
                  </div>

                  {filteredUnlockedItems.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-zinc-900/50 border border-zinc-800/80 text-zinc-500 text-xs">
                      No VIP content unlocks recorded yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/60 custom-scrollbar">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                          <tr>
                            <th className="p-3">Unlock ID</th>
                            <th className="p-3">Buyer User ID</th>
                            <th className="p-3">Media Type</th>
                            <th className="p-3">Content ID</th>
                            <th className="p-3">Creator</th>
                            <th className="p-3">Tokens Spent</th>
                            <th className="p-3 text-right">Unlocked At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60">
                          {filteredUnlockedItems.map((u) => (
                            <tr key={u.id} className="hover:bg-zinc-800/40 transition">
                              <td className="p-3 font-mono text-[10px] text-zinc-500 select-all">
                                {u.id}
                              </td>
                              <td className="p-3 font-mono text-zinc-300">
                                {u.userId}
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  u.itemType === 'image' 
                                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                }`}>
                                  {u.itemType === 'image' ? 'VIP Photo' : 'Video Clip'}
                                </span>
                              </td>
                              <td className="p-3 font-mono text-xs text-zinc-400 truncate max-w-[120px]">
                                {u.itemId}
                              </td>
                              <td className="p-3 font-mono font-bold text-orange-400">
                                {u.creatorUsername ? `@${u.creatorUsername}` : '-'}
                              </td>
                              <td className="p-3 font-mono font-bold text-amber-300">
                                <div className="flex items-center gap-1">
                                  <Coins className="w-3 h-3 text-amber-400" />
                                  <span>{u.tokensSpent}</span>
                                </div>
                              </td>
                              <td className="p-3 text-right text-zinc-400 text-[11px] whitespace-nowrap">
                                {u.unlockedAt}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* BRANDING & SITE LOGO TAB */}
          {activeTab === 'branding' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Palette className="w-4 h-4 text-orange-500" />
                    Customize Site Logo & Branding
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Modify the site logo text, upload a custom logo graphic, choose accent colors, and rename the site.
                  </p>
                </div>
              </div>

              {brandingSaveMsg && (
                <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40">
                  {brandingSaveMsg}
                </div>
              )}

              {/* Live Logo Preview Box */}
              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-orange-500/30">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-2">
                  Live Navbar Header Preview
                </span>
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Logo Icon / Graphic */}
                    {logoType === 'image' && logoImageUrl ? (
                      <img 
                        src={logoImageUrl} 
                        alt="Site Logo" 
                        className="w-10 h-10 rounded-2xl object-cover ring-2"
                        style={{ borderColor: accentColor }}
                      />
                    ) : (
                      <div 
                        className="relative w-10 h-10 rounded-2xl p-0.5 shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${accentColor}, #fbbf24)` }}
                      >
                        <div className="w-full h-full rounded-[14px] bg-zinc-950 flex items-center justify-center">
                          <span 
                            className="font-black text-lg"
                            style={{ color: accentColor }}
                          >
                            {logoText || 'RG'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Logo Subtext / Title */}
                    {(logoType === 'text' || logoType === 'both') && (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <span className="text-lg font-black tracking-tight text-white">
                            {logoSubtext || 'REDGIFS'}
                          </span>
                          <span 
                            className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider text-black"
                            style={{ backgroundColor: accentColor }}
                          >
                            HD
                          </span>
                        </div>
                        <span className="text-[10px] font-medium text-zinc-400 -mt-0.5">
                          {siteName || 'Looping Video Network'}
                        </span>
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-zinc-500 font-mono">
                    Mode: {logoType.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Branding Configuration Form */}
              <form onSubmit={handleSaveBranding} className="space-y-4">
                {/* Logo Type Selector */}
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                    Logo Display Type:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setLogoType('text')}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition ${
                        logoType === 'text'
                          ? 'bg-orange-500/20 text-orange-400 border-orange-500'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      <Type className="w-3.5 h-3.5 mx-auto mb-1" />
                      Text Logo (RG Badge)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogoType('image')}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition ${
                        logoType === 'image'
                          ? 'bg-orange-500/20 text-orange-400 border-orange-500'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      <Image className="w-3.5 h-3.5 mx-auto mb-1" />
                      Image / Icon File
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogoType('both')}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition ${
                        logoType === 'both'
                          ? 'bg-orange-500/20 text-orange-400 border-orange-500'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5 mx-auto mb-1" />
                      Both Badge + Text
                    </button>
                  </div>
                </div>

                {/* Upload Image Logo (if image or both) */}
                {(logoType === 'image' || logoType === 'both') && (
                  <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                    <label className="text-xs font-bold text-zinc-300 block">
                      Custom Logo Image / Icon (PNG, SVG, JPG)
                    </label>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      {logoImageUrl ? (
                        <img 
                          src={logoImageUrl} 
                          alt="Logo Preview" 
                          className="w-12 h-12 rounded-xl object-contain bg-black border border-zinc-700 p-1"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-dashed border-zinc-700 flex items-center justify-center text-zinc-500 text-xs">
                          No Pic
                        </div>
                      )}

                      <div className="flex-1 w-full space-y-2">
                        <input 
                          type="file" 
                          ref={logoFileInputRef}
                          onChange={handleLogoFileUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => logoFileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-zinc-700"
                          >
                            <Upload className="w-3.5 h-3.5 text-orange-400" />
                            Upload Logo Image
                          </button>
                          {logoImageUrl && (
                            <button
                              type="button"
                              onClick={() => setLogoImageUrl('')}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 text-xs font-bold hover:bg-rose-500/30"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <input 
                          type="url"
                          placeholder="Or paste image URL (e.g. https://domain.com/logo.png)"
                          value={logoImageUrl}
                          onChange={(e) => setLogoImageUrl(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Text fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      Logo Badge Short Text (e.g. RG, VIP, 60):
                    </label>
                    <input 
                      type="text" 
                      maxLength={6}
                      value={logoText}
                      onChange={(e) => setLogoText(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono font-bold focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      Logo Subtext / Main Title (e.g. REDGIFS, LOOPS):
                    </label>
                    <input 
                      type="text" 
                      value={logoSubtext}
                      onChange={(e) => setLogoSubtext(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-800 text-white font-bold focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">
                    Site Sub-headline / Network Name:
                  </label>
                  <input 
                    type="text" 
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Accent Color Palette */}
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                    Brand Accent Theme Color:
                  </label>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {ACCENT_PRESETS.map((preset) => (
                      <button
                        key={preset.color}
                        type="button"
                        onClick={() => setAccentColor(preset.color)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                          accentColor.toLowerCase() === preset.color.toLowerCase()
                            ? 'bg-zinc-800 border-white text-white shadow'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <span 
                          className="w-3 h-3 rounded-full shrink-0" 
                          style={{ backgroundColor: preset.color }}
                        />
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:brightness-110 transition flex items-center gap-1.5 shadow-lg"
                  >
                    <Save className="w-4 h-4" />
                    Save Logo & Branding Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 1. OVERVIEW STATS TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <span className="text-xs text-zinc-400">Total System Revenue:</span>
                  <div className="text-xl font-black text-emerald-400 mt-1 font-mono">
                    ${totalRevenueUSD.toFixed(2)} USD
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <span className="text-xs text-zinc-400">Tokens Purchased:</span>
                  <div className="text-xl font-black text-amber-300 mt-1 font-mono flex items-center gap-1">
                    <Coins className="w-5 h-5 text-amber-400" />
                    <span>{totalTokensBought.toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <span className="text-xs text-zinc-400">Paywalled Posts Active:</span>
                  <div className="text-xl font-black text-orange-400 mt-1 font-mono">
                    {clips.filter(c => c.isPaywalled).length} Posts
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <span className="text-xs text-zinc-400">Pending Withdrawals:</span>
                  <div className="text-xl font-black text-amber-400 mt-1 font-mono">
                    {pendingPayouts.length} Requests
                  </div>
                </div>
              </div>

              {/* Admin Quick Action Tools & Editable Credentials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Editable Admin Credentials Card */}
                <div className="p-5 rounded-2xl bg-zinc-900 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-emerald-400" />
                      Editable Admin Credentials (/admin)
                    </h4>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Default: admin/admin
                    </span>
                  </div>

                  {credSaveMsg && (
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
                      {credSaveMsg}
                    </div>
                  )}

                  <form onSubmit={handleSaveAdminCreds} className="space-y-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-zinc-300 block mb-1">Admin Username:</label>
                      <input 
                        type="text" 
                        value={adminUser}
                        onChange={(e) => setAdminUser(e.target.value)}
                        required
                        className="w-full px-3 py-1.5 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-zinc-300 block mb-1">Admin Password:</label>
                      <input 
                        type="text" 
                        value={adminPass}
                        onChange={(e) => setAdminPass(e.target.value)}
                        required
                        className="w-full px-3 py-1.5 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center justify-center gap-1.5 shadow"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save Admin Login Credentials
                    </button>
                  </form>
                </div>

                {/* Hostinger Database Backup & Restore Card */}
                <div className="p-5 rounded-2xl bg-zinc-900 border border-orange-500/30 space-y-3">
                  <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-orange-400" />
                    Hostinger Database Backup & Restore
                  </h4>

                  <p className="text-[11px] text-zinc-400">
                    Export your clips, paywalls, token balances, branding, and admin config into a single JSON database file or restore it anytime.
                  </p>

                  {backupMsg && (
                    <div className="p-2 rounded-xl bg-orange-500/20 text-orange-300 text-[11px] font-bold">
                      {backupMsg}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleExportDB}
                      className="flex-1 py-2 px-3 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export DB JSON
                    </button>

                    <label className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition">
                      <Upload className="w-3.5 h-3.5 text-amber-300" />
                      <span>Import DB JSON</span>
                      <input 
                        type="file" 
                        accept=".json"
                        onChange={handleImportDB}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <button
                    onClick={handleAddAdminTokens}
                    className="w-full py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition mt-2"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>Grant +500 Test Tokens to Account</span>
                  </button>
                </div>
              </div>

              {/* Supabase Cloud Storage & Database Card */}
              <div className="p-5 rounded-2xl bg-zinc-900 border border-orange-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Cloud className="w-4 h-4 text-orange-400" />
                      Supabase Cloud Storage & Database
                    </h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Uploads and videos are stored in Supabase Storage and synced with PostgreSQL.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTestSupabase}
                      disabled={isTestingSupabase}
                      className="px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTestingSupabase ? 'animate-spin' : ''}`} />
                      <span>Test Connection</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopySqlSchema}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Copy className="w-3.5 h-3.5 text-amber-400" />
                      <span>{copiedSql ? '✅ SQL Copied!' : 'Copy SQL Schema'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <span className="text-zinc-400 font-medium">Supabase Project URL:</span>
                    <span className="font-mono text-emerald-400 break-all select-all">{SUPABASE_URL}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <span className="text-zinc-400 font-medium">Connection Status:</span>
                    <span className="text-xs font-semibold text-zinc-300">{supabaseStatus}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/50 border border-zinc-800 text-[11px] text-zinc-400 space-y-1.5">
                  <div className="font-bold text-zinc-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Quick Supabase Cloud Setup (2 Storage Buckets + 9 Tables):
                  </div>
                  <ol className="list-decimal list-inside space-y-1 pl-1 text-zinc-400">
                    <li>Go to your Supabase Dashboard &rarr; <strong>Storage</strong> &rarr; Click <strong>New Bucket</strong></li>
                    <li>Create bucket <strong className="text-orange-400 font-mono">videos</strong> (<strong className="text-emerald-400">Public bucket: ON</strong>) and bucket <strong className="text-orange-400 font-mono">media</strong> (<strong className="text-emerald-400">Public bucket: ON</strong>)</li>
                    <li>Click <strong>Copy SQL Schema</strong> above and run it in the Supabase <strong>SQL Editor</strong></li>
                    <li>All 9 tables (<code className="text-amber-300">transactions</code>, <code className="text-amber-300">coin_ledger</code>, <code className="text-amber-300">unlocked_items</code>, <code className="text-amber-300">payout_requests</code>, <code className="text-amber-300">clips</code>, <code className="text-amber-300">creator_images</code>, <code className="text-amber-300">profiles</code>, <code className="text-amber-300">comments</code>, <code className="text-amber-300">likes</code>) and RLS policies will be automatically provisioned!</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* 2. PAYOUT REQUESTS TAB */}
          {activeTab === 'payouts' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white mb-2">
                Manage Creator Withdrawal Requests (PayPal & Bank Wire)
              </h3>

              {payoutsList.length === 0 ? (
                <p className="text-xs text-zinc-500">No payout requests submitted yet.</p>
              ) : (
                <div className="space-y-3">
                  {payoutsList.map((req) => (
                    <div 
                      key={req.id} 
                      className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        req.status === 'pending' 
                          ? 'bg-amber-500/10 border-amber-500/30' 
                          : req.status === 'approved'
                          ? 'bg-zinc-900 border-emerald-500/30'
                          : 'bg-zinc-900 border-red-500/30'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{req.creatorName}</span>
                          <span className="text-xs text-orange-400 font-mono">@{req.creatorUsername}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            req.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                            req.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {req.status}
                          </span>
                        </div>

                        <div className="text-xs font-mono font-bold text-emerald-400 mt-1">
                          Amount: ${req.amountUSD.toFixed(2)} USD ({req.tokensExchanged} Tokens)
                        </div>

                        <div className="text-xs text-zinc-300 mt-1 flex items-center gap-1.5">
                          {req.method === 'paypal' ? (
                            <CreditCard className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          ) : (
                            <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                          <span className="font-mono text-[11px]">{req.destinationDetails}</span>
                        </div>
                      </div>

                      {/* Action Buttons for Pending Payouts */}
                      {req.status === 'pending' && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleProcessPayout(req.id, 'approved')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition"
                          >
                            <Check className="w-4 h-4" />
                            <span>Approve & Send</span>
                          </button>
                          <button
                            onClick={() => handleProcessPayout(req.id, 'rejected')}
                            className="px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 font-bold text-xs flex items-center gap-1 transition"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. CLIPS & PAYWALLS TAB */}
          {activeTab === 'clips' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white mb-2">
                Platform Videos & Paywall Monetization Controls
              </h3>

              <div className="space-y-3">
                {clips.map((clip) => (
                  <div key={clip.id} className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img src={clip.posterUrl} alt={clip.title} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                      <div>
                        <h4 className="font-bold text-xs text-white line-clamp-1">{clip.title}</h4>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-2">
                          <span>by @{clip.creator.username}</span>
                          <span>•</span>
                          <span className="text-orange-400 font-mono">{clip.loopsCount} loops</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Price input */}
                      <div className="flex items-center gap-1 bg-zinc-950 px-2 py-1 rounded-xl border border-zinc-800 text-xs">
                        <Coins className="w-3.5 h-3.5 text-amber-300" />
                        <input 
                          type="number"
                          value={clip.priceTokens || 50}
                          onChange={(e) => handleUpdatePrice(clip.id, parseInt(e.target.value) || 0)}
                          className="w-12 bg-transparent text-amber-300 font-mono text-xs font-bold focus:outline-none text-center"
                        />
                        <span className="text-[10px] text-zinc-500">Tokens</span>
                      </div>

                      {/* Toggle Paywall Button */}
                      <button
                        onClick={() => handleTogglePaywall(clip.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                          clip.isPaywalled 
                            ? 'bg-orange-500 text-white' 
                            : 'bg-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {clip.isPaywalled ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        <span>{clip.isPaywalled ? 'Paywalled' : 'Free Clip'}</span>
                      </button>

                      {/* Delete Clip */}
                      <button
                        onClick={() => handleDeleteClip(clip.id)}
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                        title="Delete Clip"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. MEMBERS & ONLINE USERS TAB */}
          {activeTab === 'users' && (
            <div className="space-y-5">
              {/* Toast Feedback */}
              {userActionToast && (
                <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{userActionToast}</span>
                </div>
              )}

              {/* Top Stats Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-zinc-400 text-[11px] font-bold">
                    <span>Online Now</span>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </div>
                  <div className="text-xl font-black text-emerald-400 mt-1">
                    {onlineCount} <span className="text-[10px] text-zinc-400 font-normal">users</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-zinc-400 text-[11px] font-bold">
                    <span>New Members</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-xl font-black text-amber-400 mt-1">
                    {newUsersCount} <span className="text-[10px] text-zinc-400 font-normal">&lt; 7 days</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-zinc-400 text-[11px] font-bold">
                    <span>Total Members</span>
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div className="text-xl font-black text-white mt-1">
                    {usersList.length}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-zinc-400 text-[11px] font-bold">
                    <span>VIP Creators</span>
                    <Award className="w-3.5 h-3.5 text-orange-400" />
                  </div>
                  <div className="text-xl font-black text-orange-400 mt-1">
                    {creatorsCount}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between col-span-2 sm:col-span-1">
                  <div className="flex items-center justify-between text-zinc-400 text-[11px] font-bold">
                    <span>Suspended</span>
                    <Ban className="w-3.5 h-3.5 text-red-400" />
                  </div>
                  <div className="text-xl font-black text-red-400 mt-1">
                    {bannedCount}
                  </div>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
                  <button
                    onClick={() => setUserFilter('all')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                      userFilter === 'all' ? 'bg-orange-500 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    All ({usersList.length})
                  </button>

                  <button
                    onClick={() => setUserFilter('online')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                      userFilter === 'online' ? 'bg-emerald-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Online ({onlineCount})</span>
                  </button>

                  <button
                    onClick={() => setUserFilter('new')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                      userFilter === 'new' ? 'bg-amber-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>New Users ({newUsersCount})</span>
                  </button>

                  <button
                    onClick={() => setUserFilter('creators')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                      userFilter === 'creators' ? 'bg-orange-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    Creators ({creatorsCount})
                  </button>

                  <button
                    onClick={() => setUserFilter('banned')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                      userFilter === 'banned' ? 'bg-red-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    Banned ({bannedCount})
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Search member, email, location..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <button
                    onClick={loadUsers}
                    title="Refresh latest database user presence"
                    className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Members List */}
              <div className="space-y-3">
                {filteredUsers.length === 0 ? (
                  <div className="p-8 text-center bg-zinc-900/50 rounded-2xl border border-zinc-800 text-zinc-500 text-xs">
                    No users matching criteria.
                  </div>
                ) : (
                  filteredUsers.map((user) => {
                    const isUserOnline = !user.isBanned && ((now - (user.lastSeenTimestamp || 0)) < 120000 || user.isOnline);
                    const isNew = (now - (user.joinedTimestamp || 0)) < (1000 * 60 * 60 * 24 * 7);

                    return (
                      <div
                        key={user.id}
                        className={`p-4 rounded-2xl border transition flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                          user.isBanned 
                            ? 'bg-red-950/20 border-red-500/30' 
                            : isUserOnline
                            ? 'bg-zinc-900/90 border-emerald-500/30 shadow-sm'
                            : 'bg-zinc-900 border-zinc-800'
                        }`}
                      >
                        {/* Member Identity & Status */}
                        <div className="flex items-start gap-3.5">
                          {/* Avatar with live status pulse */}
                          <div className="relative shrink-0">
                            <img
                              src={user.avatar}
                              alt={user.displayName}
                              className={`w-12 h-12 rounded-2xl object-cover ring-2 ${
                                user.isBanned ? 'ring-red-500 grayscale' :
                                isUserOnline ? 'ring-emerald-400' : 'ring-zinc-700'
                              }`}
                            />
                            {isUserOnline && !user.isBanned && (
                              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-zinc-950"></span>
                              </span>
                            )}
                          </div>

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-sm text-white">{user.displayName}</span>
                              {user.isVerified && (
                                <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold flex items-center gap-1" title="Verified Creator">
                                  <Sparkles className="w-3 h-3 text-blue-400" />
                                  Verified
                                </span>
                              )}
                              {isNew && (
                                <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-red-500 text-white text-[9px] font-black rounded-full uppercase tracking-wider animate-pulse">
                                  NEW MEMBER
                                </span>
                              )}
                              {user.isBanned && (
                                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-black rounded-full uppercase">
                                  SUSPENDED
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 font-mono">
                              <span className="text-orange-400">@{user.username}</span>
                              <span>•</span>
                              <span className="text-zinc-500">{user.email}</span>
                              {user.location && (
                                <>
                                  <span>•</span>
                                  <span className="text-zinc-300 flex items-center gap-1 font-sans">
                                    <MapPin className="w-3 h-3 text-zinc-500" />
                                    {user.location}
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Presence & Joined Timestamps */}
                            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px]">
                              {isUserOnline ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  Online Now
                                </span>
                              ) : (
                                <span className="text-zinc-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-zinc-500" />
                                  Last active: <strong className="text-zinc-300">{formatLastSeenText(user.lastSeenTimestamp)}</strong>
                                </span>
                              )}

                              <span className="text-zinc-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-zinc-600" />
                                Joined: <strong className="text-zinc-400">{formatJoinedDateText(user.joinedTimestamp, user.joinedDate)}</strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* User Balances, Role & Admin Moderation Controls */}
                        <div className="flex flex-wrap items-center gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-zinc-800">
                          {/* Tokens Balance Badge */}
                          <div className="p-2 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                            <div className="text-[10px] text-zinc-500 font-bold">BALANCE</div>
                            <div className="flex items-center gap-1.5 text-amber-300 font-bold font-mono">
                              <Coins className="w-3.5 h-3.5 text-amber-400" />
                              <span>{user.tokensBalance.toLocaleString()}</span>
                            </div>
                          </div>

                          {/* Role Selector */}
                          <select
                            value={user.role}
                            onChange={(e) => handleChangeRole(user, e.target.value as any)}
                            className="px-2.5 py-1.5 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 font-bold focus:outline-none focus:border-orange-500"
                          >
                            <option value="user">Member</option>
                            <option value="creator">Creator (VIP)</option>
                            <option value="admin">Admin</option>
                          </select>

                          {/* View KYC Photo ID Document */}
                          {user.kycPhotoIdUrl && (
                            <button
                              onClick={() => setViewKycUser(user)}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1 transition"
                              title="View submitted Photo ID document"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Photo ID</span>
                            </button>
                          )}

                          {/* Toggle Verified */}
                          <button
                            onClick={() => handleToggleVerify(user)}
                            className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1 ${
                              user.isVerified 
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30' 
                                : 'bg-zinc-800 text-zinc-400 border-white/5 hover:text-white'
                            }`}
                            title={user.isVerified ? 'Revoke Creator Verification' : 'Grant Verified Creator Badge'}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>

                          {/* Grant Tokens Button */}
                          <button
                            onClick={() => setTokenModalUser(user)}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1 transition"
                            title="Add / Subtract Tokens"
                          >
                            <Coins className="w-3.5 h-3.5" />
                            <span>Tokens</span>
                          </button>

                          {/* Ban / Suspend Button */}
                          <button
                            onClick={() => handleToggleBan(user)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1 ${
                              user.isBanned 
                                ? 'bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border-emerald-500/40' 
                                : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30'
                            }`}
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>{user.isBanned ? 'Restore' : 'Suspend'}</span>
                          </button>

                          {/* Delete Account */}
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-2 rounded-xl bg-zinc-800 hover:bg-red-500/20 hover:text-red-400 text-zinc-500 transition"
                            title="Delete Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Token Grant Modal */}
              {tokenModalUser && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                  <div className="w-full max-w-sm bg-zinc-950 border border-amber-500/40 rounded-3xl p-5 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
                          <Coins className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white">Adjust User Tokens</h4>
                          <p className="text-[11px] text-zinc-400">@{tokenModalUser.username}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setTokenModalUser(null)}
                        className="p-1.5 rounded-full bg-zinc-900 text-zinc-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Current Balance:</span>
                      <span className="font-mono font-bold text-amber-300">{tokenModalUser.tokensBalance} Tokens</span>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-300 block mb-1">
                        Amount to Add (or use negative number to deduct):
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={tokenGrantAmount}
                          onChange={(e) => setTokenGrantAmount(parseInt(e.target.value) || 0)}
                          className="flex-1 px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-800 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 mt-2">
                        {[+50, +100, +500, +1000, -50].map((quick) => (
                          <button
                            key={quick}
                            type="button"
                            onClick={() => setTokenGrantAmount(quick)}
                            className="flex-1 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[10px] font-bold border border-zinc-800"
                          >
                            {quick > 0 ? `+${quick}` : quick}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setTokenModalUser(null)}
                        className="flex-1 py-2 rounded-xl bg-zinc-900 text-zinc-400 text-xs font-bold hover:bg-zinc-800 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleGrantTokens}
                        className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Apply Balance</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {/* Photo ID KYC Document Preview Modal */}
              {viewKycUser && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
                  <div className="relative w-full max-w-lg bg-zinc-950 border border-orange-500/40 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white">KYC Photo ID Submission</h4>
                          <p className="text-[11px] text-zinc-400">Creator @{viewKycUser.username} ({viewKycUser.displayName})</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setViewKycUser(null)}
                        className="p-1.5 rounded-full bg-zinc-900 text-zinc-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-300 block">Submitted Photo Document:</label>
                      <div className="w-full bg-black border border-zinc-800 rounded-2xl p-2 flex items-center justify-center overflow-hidden min-h-[220px]">
                        {viewKycUser.kycPhotoIdUrl ? (
                          <img 
                            src={viewKycUser.kycPhotoIdUrl} 
                            alt={`Photo ID for ${viewKycUser.username}`} 
                            className="max-h-[350px] w-auto object-contain rounded-xl"
                          />
                        ) : (
                          <p className="text-xs text-zinc-500">No photo ID document attached.</p>
                        )}
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Submitted Date:</span>
                        <span className="font-mono text-zinc-200">{viewKycUser.kycSubmittedDate ? new Date(viewKycUser.kycSubmittedDate).toLocaleString() : 'Recent'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Current Verification Status:</span>
                        <span className={`font-bold ${viewKycUser.isVerified ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {viewKycUser.isVerified ? 'Verified Creator' : 'Pending Verification'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      {!viewKycUser.isVerified ? (
                        <button
                          type="button"
                          onClick={() => {
                            handleToggleVerify(viewKycUser);
                            setViewKycUser(null);
                          }}
                          className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve KYC & Verify Creator</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setViewKycUser(null)}
                          className="flex-1 py-2.5 rounded-2xl bg-zinc-900 text-zinc-300 text-xs font-bold hover:bg-zinc-800 transition"
                        >
                          Close Document
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
