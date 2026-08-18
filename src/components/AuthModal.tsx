import React, { useState, useRef } from 'react';
import { 
  X, User, Lock, Mail, ShieldCheck, Sparkles, CheckCircle2, 
  UserPlus, LogIn, Coins, ArrowRight, UserCheck, AlertCircle, MapPin,
  Upload, Check, Link as LinkIcon
} from 'lucide-react';
import { UserAccount, UserRole } from '../types';
import { registerNewUser, loginUserAccount, getRegisteredUsers, getAdminCredentials } from '../utils/storage';
import { registerUserApi, loginUserApi } from '../utils/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeUser: UserAccount;
  onAccountUpdate: (updated: UserAccount) => void;
  onOpenKycModal?: () => void;
}

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  activeUser,
  onAccountUpdate,
  onOpenKycModal,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [location, setLocation] = useState('Caribbean');
  const [role, setRole] = useState<'user' | 'creator'>('user');
  const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_AVATAR);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleAvatarFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (PNG, JPG, WEBP, or SVG).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Avatar image size must be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setSelectedAvatar(result);
        setSuccessMessage('Custom avatar uploaded!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCustomUrlApply = () => {
    if (customAvatarUrl.trim()) {
      setSelectedAvatar(customAvatarUrl.trim());
      setSuccessMessage('Avatar URL applied!');
      setShowUrlInput(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (mode === 'register') {
      try {
        // Try backend API first
        const apiRes = await registerUserApi({
          username,
          displayName: displayName || username,
          email,
          password,
          role,
          avatar: selectedAvatar,
          location,
        });

        if (apiRes.success && apiRes.user) {
          onAccountUpdate(apiRes.user);
          setSuccessMessage('🎉 Account registered on backend database! 50 bonus tokens added.');
          setTimeout(() => {
            setIsSubmitting(false);
            onClose();
            if (role === 'creator' && onOpenKycModal) {
              onOpenKycModal();
            }
          }, 1000);
          return;
        }

        // Fallback to local storage if API failed
        const localRes = registerNewUser({
          username,
          displayName: displayName || username,
          email,
          password,
          role,
          avatar: selectedAvatar,
        });

        if (localRes.success && localRes.user) {
          onAccountUpdate(localRes.user);
          setSuccessMessage('🎉 Account created! 50 welcome tokens added to your wallet.');
          setTimeout(() => {
            setIsSubmitting(false);
            onClose();
            if (role === 'creator' && onOpenKycModal) {
              onOpenKycModal();
            }
          }, 1000);
        } else {
          setIsSubmitting(false);
          setErrorMessage(apiRes.error || localRes.error || 'Registration failed.');
        }
      } catch (err: any) {
        setIsSubmitting(false);
        setErrorMessage(err.message || 'Registration failed.');
      }
    } else {
      // Login flow
      try {
        const apiRes = await loginUserApi({
          username: username || email,
          password,
        });

        if (apiRes.success && apiRes.user) {
          onAccountUpdate(apiRes.user);
          setSuccessMessage(`Welcome back, ${apiRes.user.displayName}!`);
          setTimeout(() => {
            setIsSubmitting(false);
            onClose();
          }, 800);
          return;
        }

        const localRes = loginUserAccount(username || email, password);
        if (localRes.success && localRes.user) {
          onAccountUpdate(localRes.user);
          setSuccessMessage(`Welcome back, ${localRes.user.displayName}!`);
          setTimeout(() => {
            setIsSubmitting(false);
            onClose();
          }, 800);
        } else {
          setIsSubmitting(false);
          setErrorMessage(localRes.error || 'Invalid username or password. Please check your credentials.');
        }
      } catch (err: any) {
        setIsSubmitting(false);
        setErrorMessage(err.message || 'Login error occurred.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-zinc-950 border border-orange-500/30 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center pb-4 border-b border-zinc-800">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-orange-500 to-emerald-500 text-white shadow-lg mb-2">
            {mode === 'register' ? <UserPlus className="w-6 h-6" /> : <LogIn className="w-6 h-6" />}
          </div>
          <h2 className="text-xl font-bold text-white">
            {mode === 'register' ? 'Create Your Account' : 'Sign In to IslandHeat'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {mode === 'register' 
              ? 'Join to follow Caribbean creators, unlock VIP clips, and earn.'
              : 'Enter your credentials to access your account and token balance.'}
          </p>
        </div>

        {/* Mode Switch Tabs */}
        <div className="flex rounded-full bg-zinc-900 p-1 border border-zinc-800 my-4">
          <button
            onClick={() => {
              setMode('register');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-2 rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              mode === 'register' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Register Account
          </button>
          <button
            onClick={() => {
              setMode('login');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-2 rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              mode === 'login' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </button>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' ? (
            <>
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Full Name / Display Name:</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., Caribbean Star"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Username Handle (@):</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-orange-400 font-mono">@</span>
                  <input 
                    type="text" 
                    required
                    placeholder="my_handle"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Account Type:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('user')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      role === 'user'
                        ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    Viewer / Buyer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('creator')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      role === 'creator'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    Creator / Uploader
                  </button>
                </div>
              </div>

              {/* Avatar Selection & Upload */}
              <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                    <span>Choose / Upload Avatar:</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-[10px] text-zinc-400 hover:text-orange-400 transition flex items-center gap-1"
                  >
                    <LinkIcon className="w-2.5 h-2.5" />
                    <span>{showUrlInput ? 'Hide URL input' : 'Image URL'}</span>
                  </button>
                </div>

                {/* Avatar Preview & Upload Trigger */}
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
                  <div className="relative shrink-0">
                    <img
                      src={selectedAvatar}
                      alt="Selected Avatar"
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-orange-500 shadow-md bg-zinc-900"
                    />
                    <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-emerald-500 text-white">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">Profile Avatar</p>
                    <p className="text-[10px] text-zinc-400 truncate">Upload photo or pick a preset</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-orange-600/20 shrink-0 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Avatar</span>
                  </button>
                </div>

                {/* Optional URL Input */}
                {showUrlInput && (
                  <div className="flex gap-1.5 pt-1">
                    <div className="relative flex-1">
                      <LinkIcon className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
                      <input
                        type="url"
                        placeholder="https://example.com/avatar.jpg"
                        value={customAvatarUrl}
                        onChange={(e) => setCustomAvatarUrl(e.target.value)}
                        className="w-full pl-8 pr-2 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleCustomUrlApply}
                      className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition"
                    >
                      Apply
                    </button>
                  </div>
                )}

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleAvatarFileUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Email Address:</label>
                <input 
                  type="email" 
                  required
                  placeholder="user@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Create Password:</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Bonus Gift Badge */}
              <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-xs">
                <Coins className="w-4 h-4 text-amber-300 fill-amber-300 shrink-0" />
                <span className="text-[11px] text-amber-300 font-bold">
                  🎁 Free 50 Bonus Tokens credited immediately upon registration!
                </span>
              </div>
            </>
          ) : (
            /* LOGIN MODE */
            <>
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Username or Email:</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                  <input 
                    type="text" 
                    required
                    placeholder="Enter username or email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Password:</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-3 py-3 rounded-2xl font-bold text-xs bg-gradient-to-r from-orange-500 to-emerald-500 text-white shadow-lg transition transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Processing...</span>
            ) : mode === 'register' ? (
              <>
                <span>Complete Registration & Enter</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Sign In to Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

