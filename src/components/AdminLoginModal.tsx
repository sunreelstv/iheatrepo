import React, { useState, useEffect } from 'react';
import { 
  X, ShieldCheck, Lock, User, KeyRound, Check, AlertCircle, 
  Sparkles, Save, ShieldAlert, ArrowRight, RefreshCw 
} from 'lucide-react';
import { 
  getAdminCredentials, saveAdminCredentials, verifyAdminCredentials, saveStoredUserAccount 
} from '../utils/storage';
import { UserAccount } from '../types';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin: () => void;
  activeUser: UserAccount;
  onAccountUpdate: (updated: UserAccount) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin,
  activeUser,
  onAccountUpdate,
}) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  // Edit Credential States
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [editSuccessMsg, setEditSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setEditSuccessMsg('');
      setIsEditMode(false);
      const currentCreds = getAdminCredentials();
      setUsernameInput(currentCreds.username);
      setPasswordInput('');
      setNewUsername(currentCreds.username);
      setNewPassword(currentCreds.password);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (verifyAdminCredentials(usernameInput, passwordInput)) {
      // Elevate account to Master Admin role
      const updated = saveStoredUserAccount({
        role: 'admin',
        displayName: 'Master Superadmin',
        username: usernameInput.trim(),
        isVerified: true,
      });
      onAccountUpdate(updated);
      onSuccessLogin();
      onClose();
    } else {
      setErrorMsg('Invalid admin credentials! Default username: admin | Default password: admin');
    }
  };

  const handleUpdateAdminCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setEditSuccessMsg('');
    setErrorMsg('');

    if (!newUsername.trim() || !newPassword.trim()) {
      setErrorMsg('Username and Password cannot be blank.');
      return;
    }

    saveAdminCredentials({
      username: newUsername.trim(),
      password: newPassword.trim(),
    });

    setUsernameInput(newUsername.trim());
    setPasswordInput(newPassword.trim());
    setEditSuccessMsg('✅ Admin credentials updated successfully!');
    setTimeout(() => {
      setIsEditMode(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-zinc-950 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center pb-4 border-b border-zinc-800">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-black shadow-lg mb-2">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
            <span>Admin Portal Access</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              /admin
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            System Superadmin Authentication & Config
          </p>
        </div>

        {/* Default Credential Info Banner */}
        <div className="mt-4 p-3 rounded-2xl bg-zinc-900 border border-emerald-500/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="text-[11px] text-zinc-300">
              Default Login: <span className="text-emerald-400 font-mono font-bold">admin</span> / <span className="text-emerald-400 font-mono font-bold">admin</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditMode(!isEditMode)}
            className="text-[10px] font-bold text-orange-400 hover:text-orange-300 underline shrink-0"
          >
            {isEditMode ? 'Back to Login' : 'Edit Credentials'}
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mt-3 p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {editSuccessMsg && (
          <div className="mt-3 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{editSuccessMsg}</span>
          </div>
        )}

        {/* EDIT ADMIN CREDENTIALS FORM */}
        {isEditMode ? (
          <form onSubmit={handleUpdateAdminCredentials} className="mt-4 space-y-3">
            <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-[11px] text-orange-300 mb-2">
              ⚠️ <strong>Security Config:</strong> Set your new master admin username and password for Hostinger deployment.
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">New Admin Username:</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                <input 
                  type="text" 
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                  placeholder="e.g., admin or super_owner"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">New Admin Password:</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                <input 
                  type="text" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Enter new strong password"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save New Credentials
              </button>
              <button
                type="button"
                onClick={() => setIsEditMode(false)}
                className="py-2.5 px-4 rounded-xl font-bold text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          /* STANDARD ADMIN LOGIN FORM */
          <form onSubmit={handleAdminLogin} className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">Admin Username:</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                <input 
                  type="text" 
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  required
                  placeholder="admin"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">Admin Password:</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                <input 
                  type="password" 
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 w-full py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black shadow-lg transition flex items-center justify-center gap-2"
            >
              <span>Authenticate & Launch Admin Panel</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
