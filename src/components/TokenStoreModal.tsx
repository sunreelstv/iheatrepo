import React, { useState } from 'react';
import { 
  X, Coins, CreditCard, Building2, CheckCircle2, ShieldCheck, 
  Sparkles, ArrowRight, Wallet, Lock, Unlock, AlertCircle 
} from 'lucide-react';
import { TokenPackage, PaymentMethod, UserAccount } from '../types';
import { buyTokens } from '../utils/storage';

interface TokenStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeUser: UserAccount;
  onAccountUpdate: (updated: UserAccount) => void;
  targetClipToUnlock?: { id: string; title: string; priceTokens: number } | null;
  onUnlockSuccess?: () => void;
}

const TOKEN_PACKAGES: TokenPackage[] = [
  { id: 'pack-1', tokens: 100, priceUSD: 9.99, bonusTokens: 0 },
  { id: 'pack-2', tokens: 500, priceUSD: 44.99, bonusTokens: 50, isPopular: true },
  { id: 'pack-3', tokens: 1200, priceUSD: 99.99, bonusTokens: 200 },
  { id: 'pack-4', tokens: 3000, priceUSD: 229.99, bonusTokens: 600 },
];

export const TokenStoreModal: React.FC<TokenStoreModalProps> = ({
  isOpen,
  onClose,
  activeUser,
  onAccountUpdate,
  targetClipToUnlock,
  onUnlockSuccess,
}) => {
  const [selectedPack, setSelectedPack] = useState<TokenPackage>(TOKEN_PACKAGES[1]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paypal');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Bank transfer simulation inputs
  const [bankReference, setBankReference] = useState('');

  if (!isOpen) return null;

  const handlePurchase = () => {
    setIsProcessing(true);
    setSuccessMessage('');

    setTimeout(() => {
      const totalTokens = selectedPack.tokens + selectedPack.bonusTokens;
      const updatedAccount = buyTokens(totalTokens, selectedPack.priceUSD, paymentMethod);
      onAccountUpdate(updatedAccount);
      setIsProcessing(false);
      
      setSuccessMessage(`Success! Added ${totalTokens} Tokens via ${paymentMethod === 'paypal' ? 'PayPal' : 'Bank Transfer'}.`);

      if (onUnlockSuccess && targetClipToUnlock && updatedAccount.tokensBalance >= targetClipToUnlock.priceTokens) {
        setTimeout(() => {
          onUnlockSuccess();
          onClose();
        }, 1200);
      }
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-orange-500/30 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white shadow-lg">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Token Store & Wallet
            </h2>
            <p className="text-xs text-zinc-400">
              Buy tokens to unlock exclusive VIP paywalled clips and tip creators.
            </p>
          </div>
        </div>

        {/* Balance Badge */}
        <div className="mt-4 p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-zinc-300">Your Token Balance:</span>
          </div>
          <span className="text-base font-black text-amber-300 font-mono">
            {activeUser.tokensBalance} Tokens
          </span>
        </div>

        {/* Target Unlock Banner if triggered from paywalled post */}
        {targetClipToUnlock && (
          <div className="mt-3 p-3 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-orange-300">
              <Lock className="w-4 h-4 text-orange-400 shrink-0" />
              <span>Unlocking: <strong className="text-white">{targetClipToUnlock.title}</strong></span>
            </div>
            <span className="text-xs font-bold text-amber-300 bg-orange-500/20 px-2.5 py-1 rounded-full">
              {targetClipToUnlock.priceTokens} Tokens Needed
            </span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Select Token Package Grid */}
        <div className="mt-5">
          <label className="text-xs font-bold text-zinc-300 mb-2 block">
            1. Select Token Pack:
          </label>
          <div className="grid grid-cols-2 gap-3">
            {TOKEN_PACKAGES.map((pkg) => {
              const isSelected = selectedPack.id === pkg.id;
              return (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPack(pkg)}
                  className={`relative p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                    isSelected 
                      ? 'bg-orange-500/15 border-orange-500 text-white shadow-lg shadow-orange-500/10' 
                      : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  {pkg.isPopular && (
                    <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow">
                      BEST VALUE
                    </span>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5 font-black text-base text-amber-300">
                      <Coins className="w-4 h-4" />
                      <span>{pkg.tokens}</span>
                      {pkg.bonusTokens > 0 && (
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded-md font-bold">
                          +{pkg.bonusTokens} Bonus
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      {pkg.tokens + pkg.bonusTokens} total tokens
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-zinc-800/60 font-mono font-bold text-sm text-white">
                    ${pkg.priceUSD} USD
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Method Selector (PayPal vs Bank Transfer) */}
        <div className="mt-5">
          <label className="text-xs font-bold text-zinc-300 mb-2 block">
            2. Choose Payment Method:
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* PayPal */}
            <button
              onClick={() => setPaymentMethod('paypal')}
              className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                paymentMethod === 'paypal'
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-md'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4 text-blue-400" />
              <span>PayPal Checkout</span>
            </button>

            {/* Bank Wire Transfer */}
            <button
              onClick={() => setPaymentMethod('bank_transfer')}
              className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                paymentMethod === 'bank_transfer'
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-md'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Direct Bank Wire</span>
            </button>
          </div>

          {/* Payment Method Details */}
          {paymentMethod === 'paypal' && (
            <div className="mt-3 p-3 rounded-xl bg-blue-950/30 border border-blue-800/40 text-xs text-blue-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Instant token delivery protected by PayPal Seller Guarantee.</span>
            </div>
          )}

          {paymentMethod === 'bank_transfer' && (
            <div className="mt-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 space-y-1 font-mono">
              <div className="font-bold text-emerald-400 font-sans mb-1">Bank Wiring Details:</div>
              <p>Bank: Chase International Bank</p>
              <p>IBAN: US91 CHAS 0082 1192 8820</p>
              <p>SWIFT/BIC: CHASUS33XXX</p>
              <p className="text-[10px] text-zinc-400 font-sans pt-1">
                Enter your transaction wire reference below for instant verification:
              </p>
              <input 
                type="text" 
                placeholder="e.g. WIRE-8849201"
                value={bankReference}
                onChange={(e) => setBankReference(e.target.value)}
                className="w-full mt-1 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs font-mono"
              />
            </div>
          )}
        </div>

        {/* Purchase CTA */}
        <div className="mt-6 pt-4 border-t border-zinc-800">
          <button
            onClick={handlePurchase}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-full font-bold text-sm bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-xl shadow-orange-500/25 transition transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            id="confirm-buy-tokens-btn"
          >
            {isProcessing ? (
              <span>Processing Payment...</span>
            ) : (
              <>
                <span>Complete Purchase (${selectedPack.priceUSD} USD)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
