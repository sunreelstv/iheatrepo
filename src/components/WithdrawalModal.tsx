import React, { useState } from 'react';
import { 
  X, Building2, CreditCard, DollarSign, Coins, ShieldCheck, 
  CheckCircle2, AlertCircle, ArrowUpRight, History 
} from 'lucide-react';
import { UserAccount, PayoutRequest } from '../types';
import { createPayoutRequest, getStoredPayoutRequests } from '../utils/storage';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeUser: UserAccount;
  onAccountUpdate: (updated: UserAccount) => void;
}

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({
  isOpen,
  onClose,
  activeUser,
  onAccountUpdate,
}) => {
  const [method, setMethod] = useState<'paypal' | 'bank_transfer'>('paypal');
  const [tokensToExchange, setTokensToExchange] = useState<number>(activeUser?.earnedTokens || 500);
  const [paypalEmail, setPaypalEmail] = useState(activeUser?.paypalEmail || 'creator@paypal.com');
  
  // Bank details state
  const [bankName, setBankName] = useState(activeUser?.bankDetails?.bankName || 'Chase Bank');
  const [accountHolder, setAccountHolder] = useState(activeUser?.bankDetails?.accountHolder || activeUser?.displayName || '');
  const [accountNumber, setAccountNumber] = useState(activeUser?.bankDetails?.accountNumber || '8842019920');
  const [swiftCode, setSwiftCode] = useState(activeUser?.bankDetails?.swiftCode || 'CHASUS33XXX');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const payoutHistory: PayoutRequest[] = getStoredPayoutRequests().filter(
    req => req.creatorUsername.toLowerCase() === activeUser.username.toLowerCase()
  );

  const calculatedUSD = (tokensToExchange * 0.10).toFixed(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (tokensToExchange <= 0) {
      setFeedback({ type: 'error', message: 'Enter a valid amount of earned tokens.' });
      return;
    }

    let destDetails = '';
    if (method === 'paypal') {
      if (!paypalEmail.includes('@')) {
        setFeedback({ type: 'error', message: 'Please enter a valid PayPal email address.' });
        return;
      }
      destDetails = `PayPal: ${paypalEmail}`;
    } else {
      if (!accountNumber || !swiftCode) {
        setFeedback({ type: 'error', message: 'Please complete all bank transfer fields.' });
        return;
      }
      destDetails = `${bankName} (${accountHolder}) - Account: ${accountNumber}, SWIFT: ${swiftCode}`;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const res = createPayoutRequest(tokensToExchange, method, destDetails);
      setIsSubmitting(false);

      if (res.success) {
        setFeedback({ 
          type: 'success', 
          message: `Payout request of $${calculatedUSD} USD via ${method === 'paypal' ? 'PayPal' : 'Bank Transfer'} submitted successfully!` 
        });
        // Update user account state
        onAccountUpdate({
          ...activeUser,
          earnedTokens: Math.max(0, activeUser.earnedTokens - tokensToExchange),
          earningsUSD: Math.max(0, activeUser.earningsUSD - parseFloat(calculatedUSD))
        });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Payout request failed.' });
      }
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-zinc-950 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-black shadow-lg">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Creator Earnings & Payouts
            </h2>
            <p className="text-xs text-zinc-400">
              Withdraw your earned tokens to your PayPal account or direct Bank Wire.
            </p>
          </div>
        </div>

        {/* Balance Card */}
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-500/30 grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-zinc-400">Earned Tokens:</span>
            <div className="flex items-center gap-1.5 mt-1 text-lg font-black text-amber-300 font-mono">
              <Coins className="w-5 h-5" />
              <span>{activeUser.earnedTokens}</span>
            </div>
          </div>
          <div>
            <span className="text-xs text-zinc-400">Cashable Balance:</span>
            <div className="flex items-center gap-1 mt-1 text-lg font-black text-emerald-400 font-mono">
              <DollarSign className="w-5 h-5" />
              <span>${(activeUser.earnedTokens * 0.10).toFixed(2)} USD</span>
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`mt-4 p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
            feedback.type === 'success' 
              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300' 
              : 'bg-red-500/20 border border-red-500/40 text-red-300'
          }`}>
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Withdrawal Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Method Selector */}
          <div>
            <label className="text-xs font-bold text-zinc-300 mb-2 block">
              1. Withdrawal Destination Method:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMethod('paypal')}
                className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                  method === 'paypal'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-md'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-4 h-4 text-blue-400" />
                <span>PayPal Account</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('bank_transfer')}
                className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                  method === 'bank_transfer'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-md'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>Direct Bank Wire</span>
              </button>
            </div>
          </div>

          {/* Tokens to Cash out Input */}
          <div>
            <label className="text-xs font-bold text-zinc-300 mb-1 block">
              2. Amount of Earned Tokens to Cash Out:
            </label>
            <div className="relative">
              <input 
                type="number"
                min={100}
                max={activeUser.earnedTokens}
                value={tokensToExchange}
                onChange={(e) => setTokensToExchange(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
              />
              <span className="absolute right-4 top-2.5 text-xs text-emerald-400 font-bold font-mono">
                = ${calculatedUSD} USD
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">
              Conversion Rate: 1 Token = $0.10 USD (Min payout: 100 Tokens / $10 USD)
            </p>
          </div>

          {/* Destination Form Fields */}
          {method === 'paypal' ? (
            <div>
              <label className="text-xs font-bold text-zinc-300 mb-1 block">
                PayPal Account Email:
              </label>
              <input 
                type="email"
                required
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
                placeholder="payouts@paypal.com"
                className="w-full px-4 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          ) : (
            <div className="space-y-3 p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <h4 className="text-xs font-bold text-emerald-400">Bank Transfer Account Details:</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Bank Name:</label>
                  <input 
                    type="text" 
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Account Holder Name:</label>
                  <input 
                    type="text" 
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Account / IBAN Number:</label>
                  <input 
                    type="text" 
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">SWIFT / Routing Code:</label>
                  <input 
                    type="text" 
                    value={swiftCode}
                    onChange={(e) => setSwiftCode(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || tokensToExchange > activeUser.earnedTokens}
            className="w-full py-3.5 rounded-full font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-xl shadow-emerald-600/25 transition transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            id="submit-payout-btn"
          >
            {isSubmitting ? (
              <span>Submitting Request...</span>
            ) : (
              <>
                <span>Submit Payout Request (${calculatedUSD} USD)</span>
                <ArrowUpRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Payout History Section */}
        {payoutHistory.length > 0 && (
          <div className="mt-6 pt-4 border-t border-zinc-800">
            <h4 className="text-xs font-bold text-zinc-300 mb-2 flex items-center gap-1.5">
              <History className="w-4 h-4 text-emerald-400" />
              <span>Recent Payout Requests</span>
            </h4>
            <div className="space-y-2">
              {payoutHistory.map((req) => (
                <div key={req.id} className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">${req.amountUSD.toFixed(2)} USD ({req.tokensExchanged} Tokens)</div>
                    <div className="text-[10px] text-zinc-400 font-mono truncate max-w-[220px]">
                      {req.destinationDetails}
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                    req.status === 'approved' 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                      : req.status === 'rejected'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
