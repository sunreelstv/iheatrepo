import React, { useState, useRef } from 'react';
import { 
  X, ShieldCheck, Upload, FileText, CheckCircle2, AlertCircle, 
  Sparkles, Clock, Lock, ArrowRight, Image as ImageIcon, Check
} from 'lucide-react';
import { UserAccount, KycStatus } from '../types';
import { saveStoredUserAccount } from '../utils/storage';
import { saveUserProfileToSupabase } from '../utils/supabase';

interface KycModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeUser: UserAccount;
  onAccountUpdate: (updated: UserAccount) => void;
  onComplete?: () => void;
}

export const KycModal: React.FC<KycModalProps> = ({
  isOpen,
  onClose,
  activeUser,
  onAccountUpdate,
  onComplete,
}) => {
  const [photoIdUrl, setPhotoIdUrl] = useState<string>(activeUser.kycPhotoIdUrl || '');
  const [photoIdName, setPhotoIdName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setErrorMsg('Please upload a valid document or image (JPG, PNG, WEBP, or PDF).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Document file size must be under 10MB.');
      return;
    }

    setPhotoIdName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setPhotoIdUrl(result);
        setErrorMsg('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitKyc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoIdUrl) {
      setErrorMsg('Please upload a copy of your Photo ID (Driver\'s License, Passport, or National ID).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    setTimeout(() => {
      const updatedAccount: UserAccount = {
        ...activeUser,
        role: 'creator',
        kycStatus: 'pending',
        kycPhotoIdUrl: photoIdUrl,
        isMonetizationEnabled: true,
        kycSubmittedDate: new Date().toISOString(),
      };

      saveStoredUserAccount(updatedAccount);
      saveUserProfileToSupabase(updatedAccount).catch(err => console.warn('Supabase profile sync error:', err));
      onAccountUpdate(updatedAccount);

      setIsSubmitting(false);
      setSuccessMsg('🎉 Photo ID submitted! Your creator KYC is pending backend admin verification. You can post for free now!');
      
      setTimeout(() => {
        if (onComplete) onComplete();
        onClose();
      }, 1500);
    }, 600);
  };

  const handleSkipKycPostFree = () => {
    const updatedAccount: UserAccount = {
      ...activeUser,
      role: 'creator',
      kycStatus: activeUser.kycStatus || 'none',
      isMonetizationEnabled: false,
    };

    saveStoredUserAccount(updatedAccount);
    saveUserProfileToSupabase(updatedAccount).catch(err => console.warn('Supabase profile sync error:', err));
    onAccountUpdate(updatedAccount);

    if (onComplete) onComplete();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-orange-500/40 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center pb-4 border-b border-zinc-800">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-lg mb-2">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Creator Verification & Monetization (KYC)
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            To monetize steams and earn tokens, creators must submit Photo ID verification for backend admin approval.
          </p>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300 font-bold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Status Indicator if Pending / Verified */}
        {activeUser.kycStatus === 'pending' && (
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center gap-3 text-xs text-amber-300">
            <Clock className="w-5 h-5 text-amber-400 animate-spin shrink-0" />
            <div>
              <p className="font-bold">KYC Verification Pending</p>
              <p className="text-[11px] text-amber-200/80">Your Photo ID is under review by backend administrators. You can publish free steams while waiting for token paywall activation.</p>
            </div>
          </div>
        )}

        {activeUser.kycStatus === 'verified' && (
          <div className="mt-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 flex items-center gap-3 text-xs text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold">Verified Creator Account</p>
              <p className="text-[11px] text-emerald-200/80">Your Photo ID has been verified by backend admin! Full token monetization & paywall features are unlocked on your account.</p>
            </div>
          </div>
        )}

        {/* KYC Form */}
        <form onSubmit={handleSubmitKyc} className="mt-4 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-200 block">
              Upload Official Photo ID (Driver's License, Passport, or National ID):
            </label>
            <p className="text-[11px] text-zinc-400">
              Clear image showing your full name and photo. Stored securely for backend admin verification.
            </p>
          </div>

          <input 
            type="file" 
            ref={fileInputRef}
            accept="image/*,application/pdf"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 ${
              photoIdUrl 
                ? 'border-emerald-500/60 bg-emerald-500/5' 
                : 'border-zinc-800 hover:border-orange-500/50 bg-zinc-900/50 hover:bg-zinc-900'
            }`}
          >
            {photoIdUrl ? (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-emerald-400">Photo ID Attached!</p>
                <p className="text-[11px] text-zinc-400 font-mono truncate max-w-xs">{photoIdName || 'id_document_photo.jpg'}</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-3 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition"
                >
                  Change Document
                </button>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-200">Click to upload Photo ID Document</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">JPG, PNG, WEBP or PDF up to 10MB</p>
                </div>
              </>
            )}
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={isSubmitting || !photoIdUrl}
              className="w-full py-3 rounded-2xl font-bold text-xs bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg transition transform active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Submitting to Backend Admin...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Submit Photo ID & Request Monetization</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSkipKycPostFree}
              className="w-full py-2.5 rounded-2xl font-medium text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition flex items-center justify-center gap-2"
            >
              <span>Post For Free (Complete KYC Later)</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
