import { useDemo } from '../context/DemoContext';
import { 
  UserCircle, ShieldCheck, TrendingUp, CheckCircle2, History, Settings, ArrowLeft, 
  Wallet, Gift, ArrowDownRight, Landmark, CreditCard, Building, Coffee, Loader2, 
  Check, Lock, AlertCircle, X, Coins, Smartphone, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const LOCAL_SHOPS = [
  { id: 'coffee', name: 'Third Wave Coffee - Koramangala', voucher: '$5.00 Coffee Voucher' },
  { id: 'bakery', name: 'HSR Corner Bakery', voucher: '$5.00 Bread & Cake Voucher' },
  { id: 'books', name: 'Indiranagar Book Cafe', voucher: '$5.00 Book & Beverage Voucher' },
];

const PROCESSING_PHASES = [
  "Initiating secure handshake with banking infrastructure...",
  "Validating civic contributor trust score and KYC limits...",
  "Writing transaction hash to municipal decentralised ledger...",
  "Disbursing funds instantly via chosen reward gateway..."
];

export function Profile() {
  const { trustScore, userRole, setRole, walletBalance, walletTransactions, redeemWallet } = useDemo();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);

  // Redeem modal states
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [payoutCategory, setPayoutCategory] = useState<'cash' | 'civic'>('cash');
  const [payoutMethod, setPayoutMethod] = useState<string>('paypal'); // paypal, venmo, cashapp, upi, transit, utility, coffee
  const [redeemAmount, setRedeemAmount] = useState<number>(5.00);
  const [payoutIdentifier, setPayoutIdentifier] = useState<string>('');
  const [selectedShop, setSelectedShop] = useState<string>('coffee');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  const handlePayoutSubmit = () => {
    const isLocalShop = payoutMethod === 'coffee';
    if (!payoutIdentifier && !isLocalShop) {
      return;
    }
    
    setIsProcessing(true);
    setProcessingStep(0);
    
    // Simulate steps
    const timer1 = setTimeout(() => setProcessingStep(1), 900);
    const timer2 = setTimeout(() => setProcessingStep(2), 1800);
    const timer3 = setTimeout(() => setProcessingStep(3), 2700);

    const timer4 = setTimeout(() => {
      setIsProcessing(false);
      setPayoutSuccess(true);
      
      let desc = '';
      let actualAmount = redeemAmount;
      if (payoutMethod === 'coffee') {
        const shop = LOCAL_SHOPS.find(s => s.id === selectedShop);
        desc = `Redeemed: ${shop?.voucher} (${shop?.name})`;
        actualAmount = 5.00;
      } else if (payoutMethod === 'paypal') {
        desc = `Redeemed to PayPal: ${payoutIdentifier}`;
      } else if (payoutMethod === 'venmo') {
        desc = `Redeemed to Venmo: ${payoutIdentifier}`;
      } else if (payoutMethod === 'cashapp') {
        desc = `Redeemed to CashApp: ${payoutIdentifier}`;
      } else if (payoutMethod === 'upi') {
        desc = `Redeemed via UPI ID: ${payoutIdentifier}`;
      } else if (payoutMethod === 'transit') {
        desc = `Transit Card Credit Added: SmartCard #${payoutIdentifier}`;
      } else if (payoutMethod === 'utility') {
        desc = `Utility Bill Credit Applied: Acct #${payoutIdentifier}`;
      }
      
      redeemWallet(actualAmount, desc);
    }, 3600);
  };

  const handleCloseModal = () => {
    setShowRedeemModal(false);
    setPayoutSuccess(false);
    setPayoutIdentifier('');
    setProcessingStep(0);
  };

  const isInsufficient = walletBalance < 5.00;
  const isAmountExceeded = redeemAmount > walletBalance && payoutMethod !== 'coffee';
  const isCoffeeExceeded = walletBalance < 5.00 && payoutMethod === 'coffee';
  const isButtonDisabled = isInsufficient || isAmountExceeded || isCoffeeExceeded || (!payoutIdentifier && payoutMethod !== 'coffee');

  return (
    <div className="flex flex-col bg-[#f8f9fc] dark:bg-slate-950 min-h-screen relative">
      <div className="bg-white dark:bg-slate-900 px-6 pt-6 pb-4 border-b border-[#e2e8f0] dark:border-slate-800 sticky top-0 z-10 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-1 -ml-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <UserCircle className="w-6 h-6 text-[#0f284b] dark:text-blue-400" />
            Profile
          </h1>
        </div>
        <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-full transition-colors ${showSettings ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
          <Settings className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6 flex flex-col gap-6">
        
        {showSettings && (
          <div className="bg-white dark:bg-slate-800 p-5 rounded-[24px] border border-[#e2e8f0] dark:border-slate-700 shadow-sm flex flex-col gap-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Settings</p>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Demo Role Switch</label>
              <div className="flex gap-2 bg-[#f8f9fc] dark:bg-slate-900 p-1.5 rounded-full border border-[#e2e8f0] dark:border-slate-700">
                <button 
                  onClick={() => setRole('citizen')}
                  className={`flex-1 py-2.5 px-3 rounded-full text-xs font-bold transition-all ${userRole === 'citizen' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-[#e2e8f0] dark:border-slate-700' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  Citizen
                </button>
                <button 
                  onClick={() => { setRole('admin'); navigate('/dashboard'); }}
                  className={`flex-1 py-2.5 px-3 rounded-full text-xs font-bold transition-all ${userRole === 'admin' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-[#e2e8f0] dark:border-slate-700' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  Reviewer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Civic Trust Header */}
        <div className="bg-[#0f284b] rounded-[32px] p-6 text-white shadow-sm relative overflow-hidden flex flex-col gap-1">
          <div className="absolute -top-4 -right-4 p-4 opacity-10">
            <ShieldCheck className="w-32 h-32" />
          </div>
          <div className="relative z-10 flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Civic Reliability Score</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-5xl font-black tracking-tight">{trustScore}</span>
              <span className="text-xs font-bold bg-white/10 px-2.5 py-1 rounded-full text-white flex items-center gap-1.5 backdrop-blur-sm border border-white/10">
                <TrendingUp className="w-3.5 h-3.5" /> Active Contributor
              </span>
            </div>
            <p className="text-xs font-medium text-slate-300 mt-2">High evidence quality standing.</p>
          </div>
        </div>

        {/* Civic Wallet Header */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[32px] p-6 text-white shadow-sm relative overflow-hidden flex flex-col gap-1 mt-2">
          <div className="absolute -bottom-6 -right-4 p-4 opacity-20">
            <Wallet className="w-32 h-32" />
          </div>
          <div className="relative z-10 flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100 flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" /> Civic Wallet
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-5xl font-black tracking-tight">${walletBalance.toFixed(2)}</span>
            </div>
            <p className="text-xs font-medium text-emerald-50 mt-2">Earned from verification bounties & civic contributions.</p>
            
            <div className="flex gap-2 mt-4">
              <button 
                onClick={() => setShowRedeemModal(true)}
                className="bg-white text-emerald-700 px-4 py-2.5 rounded-full text-xs font-bold shadow-sm hover:bg-emerald-50 transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Gift className="w-3.5 h-3.5" /> Redeem Civic Rewards
              </button>
            </div>
          </div>
        </div>

        {/* Weekly Activity */}
        <div className="flex flex-col gap-3">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2">Recent Impact</h2>
          <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-[#e2e8f0] dark:border-slate-800 shadow-sm p-5 grid grid-cols-3 gap-4 divide-x divide-slate-100 dark:divide-slate-800 text-center">
            <div className="flex flex-col gap-1 justify-center">
              <span className="text-2xl font-black text-[#0f284b] dark:text-blue-400">3</span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-wider">Reports Logged</span>
            </div>
            <div className="flex flex-col gap-1 justify-center">
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400">8</span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-wider">Evidence Accepted</span>
            </div>
            <div className="flex flex-col gap-1 justify-center">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">2</span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-wider">Cases Resolved</span>
            </div>
          </div>
        </div>

        {/* Contribution History */}
        <div className="flex flex-col gap-3">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" /> Operations Log
          </h2>
          <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-[#e2e8f0] dark:border-slate-800 shadow-sm flex flex-col divide-y divide-[#e2e8f0] dark:divide-slate-800 overflow-hidden">
            <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-default">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/30 shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Verified Evidence: Pothole</span>
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">2 hours ago - Indiranagar</span>
                </div>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-default">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center border border-blue-100 dark:border-blue-900/30 shrink-0">
                  <UserCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Submitted Report: Streetlight</span>
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">1 day ago - Koramangala</span>
                </div>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-default">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center border border-amber-100 dark:border-amber-900/30 shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Flagged Duplicate</span>
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">2 days ago - HSR Layout</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet History */}
        <div className="flex flex-col gap-3 pb-8">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5" /> Wallet History
          </h2>
          <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-[#e2e8f0] dark:border-slate-800 shadow-sm flex flex-col divide-y divide-[#e2e8f0] dark:divide-slate-800 overflow-hidden">
            {walletTransactions.map(tx => (
              <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-default">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 ${tx.type === 'earn' ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
                    {tx.type === 'earn' ? <TrendingUp className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{tx.description}</span>
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{tx.timestamp}</span>
                  </div>
                </div>
                <span className={`text-sm font-black ${tx.type === 'earn' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {tx.type === 'earn' ? '+' : '-'}${tx.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Payout / Reward Redeem Modal */}
      <AnimatePresence>
        {showRedeemModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={!isProcessing ? handleCloseModal : undefined}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ y: "100%", opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative bg-white dark:bg-slate-900 w-full sm:max-w-md max-h-[92vh] sm:max-h-[85vh] rounded-t-[32px] sm:rounded-[32px] border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden z-10"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Redeem Rewards</h3>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 font-medium mt-0.5">
                      <Lock className="w-3 h-3" /> Secure Municipal Payout Gate
                    </span>
                  </div>
                </div>
                {!isProcessing && (
                  <button onClick={handleCloseModal} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Scrollable Container */}
              <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
                
                {/* Normal Input state */}
                {!isProcessing && !payoutSuccess && (
                  <>
                    {/* Step 1: Wallet Balance & Threshold Check */}
                    <div className="bg-[#f8f9fc] dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex flex-col gap-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Your Current Balance:</span>
                        <span className="text-2xl font-black text-slate-900 dark:text-white">${walletBalance.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                        <span>Min Payout Threshold:</span>
                        <span className="text-emerald-600 dark:text-emerald-400">$5.00</span>
                      </div>
                    </div>

                    {isInsufficient && (
                      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-3 rounded-xl flex items-start gap-2.5">
                        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-amber-800 dark:text-amber-300">Minimum Payout Limit Unreached</span>
                          <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-normal font-medium">
                            A minimum balance of <strong>$5.00</strong> is required to proceed with withdrawals. This ensures transaction fee safety. Keep verifying reports!
                          </p>
                        </div>
                      </div>
                    )}

                    {!isInsufficient && (
                      <>
                        {/* Payout Category Selector */}
                        <div className="flex bg-[#f8f9fc] dark:bg-slate-950 p-1 rounded-full border border-slate-200/60 dark:border-slate-800/60">
                          <button
                            onClick={() => {
                              setPayoutCategory('cash');
                              setPayoutMethod('paypal');
                            }}
                            className={`flex-1 py-2 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5 ${payoutCategory === 'cash' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/30 dark:border-slate-700' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                          >
                            <Coins className="w-3.5 h-3.5" />
                            Direct Cash
                          </button>
                          <button
                            onClick={() => {
                              setPayoutCategory('civic');
                              setPayoutMethod('transit');
                            }}
                            className={`flex-1 py-2 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5 ${payoutCategory === 'civic' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/30 dark:border-slate-700' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                          >
                            <Building className="w-3.5 h-3.5" />
                            Civic & Local
                          </button>
                        </div>

                        {/* Step 2: Choosing specific payment gateway */}
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Payout Method</label>
                          
                          {payoutCategory === 'cash' ? (
                            <div className="grid grid-cols-2 gap-2">
                              {/* PayPal */}
                              <button
                                onClick={() => setPayoutMethod('paypal')}
                                className={`p-3 rounded-xl border flex flex-col gap-1 items-start text-left transition-all ${payoutMethod === 'paypal' ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-500 text-blue-900 dark:text-blue-300 font-bold' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}
                              >
                                <div className="flex items-center gap-1.5 font-bold text-xs">
                                  <Coins className="w-4 h-4 text-blue-500" /> PayPal
                                </div>
                                <span className="text-[9px] text-slate-400 leading-none">Voucher / Direct</span>
                              </button>
                              {/* Venmo */}
                              <button
                                onClick={() => setPayoutMethod('venmo')}
                                className={`p-3 rounded-xl border flex flex-col gap-1 items-start text-left transition-all ${payoutMethod === 'venmo' ? 'bg-sky-50/50 dark:bg-sky-950/20 border-sky-500 text-sky-900 dark:text-sky-300 font-bold' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}
                              >
                                <div className="flex items-center gap-1.5 font-bold text-xs">
                                  <Smartphone className="w-4 h-4 text-sky-500" /> Venmo
                                </div>
                                <span className="text-[9px] text-slate-400 leading-none">Instant Direct P2P</span>
                              </button>
                              {/* CashApp */}
                              <button
                                onClick={() => setPayoutMethod('cashapp')}
                                className={`p-3 rounded-xl border flex flex-col gap-1 items-start text-left transition-all ${payoutMethod === 'cashapp' ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-900 dark:text-emerald-300 font-bold' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}
                              >
                                <div className="flex items-center gap-1.5 font-bold text-xs">
                                  <Smartphone className="w-4 h-4 text-emerald-500" /> CashApp
                                </div>
                                <span className="text-[9px] text-slate-400 leading-none">$Cashtag payout</span>
                              </button>
                              {/* UPI */}
                              <button
                                onClick={() => setPayoutMethod('upi')}
                                className={`p-3 rounded-xl border flex flex-col gap-1 items-start text-left transition-all ${payoutMethod === 'upi' ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500 text-indigo-900 dark:text-indigo-300 font-bold' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}
                              >
                                <div className="flex items-center gap-1.5 font-bold text-xs">
                                  <Landmark className="w-4 h-4 text-indigo-500" /> UPI (India)
                                </div>
                                <span className="text-[9px] text-slate-400 leading-none">Instant Bank Transfer</span>
                              </button>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 gap-2">
                              {/* Transit SmartCard */}
                              <button
                                onClick={() => setPayoutMethod('transit')}
                                className={`p-3.5 rounded-xl border flex items-center justify-between text-left transition-all ${payoutMethod === 'transit' ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500 text-indigo-900 dark:text-indigo-300 font-bold' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <CreditCard className="w-5 h-5 text-indigo-500" />
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold leading-tight">Metro Transit Credit</span>
                                    <span className="text-[9px] text-slate-400 mt-0.5">Top-up local Bus/Metro SmartCard directly</span>
                                  </div>
                                </div>
                                <Check className={`w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 ${payoutMethod === 'transit' ? 'opacity-100' : 'opacity-0'}`} />
                              </button>

                              {/* Utility Bill Credit */}
                              <button
                                onClick={() => setPayoutMethod('utility')}
                                className={`p-3.5 rounded-xl border flex items-center justify-between text-left transition-all ${payoutMethod === 'utility' ? 'bg-teal-50/50 dark:bg-teal-950/20 border-teal-500 text-teal-900 dark:text-teal-300 font-bold' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <Building className="w-5 h-5 text-teal-500" />
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold leading-tight">Municipal Utility Discount</span>
                                    <span className="text-[9px] text-slate-400 mt-0.5">Deduct from your monthly city Water/Trash bill</span>
                                  </div>
                                </div>
                                <Check className={`w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 ${payoutMethod === 'utility' ? 'opacity-100' : 'opacity-0'}`} />
                              </button>

                              {/* Local Business Vouchers */}
                              <button
                                onClick={() => setPayoutMethod('coffee')}
                                className={`p-3.5 rounded-xl border flex items-center justify-between text-left transition-all ${payoutMethod === 'coffee' ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-500 text-amber-900 dark:text-amber-300 font-bold' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <Coffee className="w-5 h-5 text-amber-500" />
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold leading-tight">Local Business Coffee Voucher</span>
                                    <span className="text-[9px] text-slate-400 mt-0.5">Fixed $5 voucher for partnered neighborhood cafes</span>
                                  </div>
                                </div>
                                <Check className={`w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 ${payoutMethod === 'coffee' ? 'opacity-100' : 'opacity-0'}`} />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Step 3: Redeem Amount Select */}
                        {payoutMethod !== 'coffee' && (
                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Amount</label>
                            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                              <button
                                onClick={() => setRedeemAmount(5.00)}
                                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${redeemAmount === 5.00 ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/20 dark:border-slate-700' : 'text-slate-500'}`}
                              >
                                $5.00
                              </button>
                              <button
                                onClick={() => setRedeemAmount(10.00)}
                                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${redeemAmount === 10.00 ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/20 dark:border-slate-700' : 'text-slate-500'}`}
                                disabled={walletBalance < 10.00}
                              >
                                $10.00
                              </button>
                              <button
                                onClick={() => setRedeemAmount(walletBalance)}
                                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${redeemAmount === walletBalance ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/20 dark:border-slate-700' : 'text-slate-500'}`}
                              >
                                Full (${walletBalance.toFixed(2)})
                              </button>
                            </div>
                            {isAmountExceeded && (
                              <span className="text-[9px] text-rose-500 font-bold">⚠️ Selected amount exceeds your current wallet balance!</span>
                            )}
                          </div>
                        )}

                        {/* Step 4: Dynamic Credentials Input Form */}
                        <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          {payoutMethod === 'paypal' && (
                            <>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PayPal Email Address</label>
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-semibold">@</span>
                                <input
                                  type="email"
                                  value={payoutIdentifier}
                                  onChange={(e) => setPayoutIdentifier(e.target.value)}
                                  placeholder="user@example.com"
                                  className="w-full pl-8 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                              </div>
                            </>
                          )}

                          {payoutMethod === 'venmo' && (
                            <>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Venmo Username</label>
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-semibold">@</span>
                                <input
                                  type="text"
                                  value={payoutIdentifier}
                                  onChange={(e) => setPayoutIdentifier(e.target.value)}
                                  placeholder="venmo_username"
                                  className="w-full pl-8 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                              </div>
                            </>
                          )}

                          {payoutMethod === 'cashapp' && (
                            <>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CashApp $Cashtag</label>
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-semibold">$</span>
                                <input
                                  type="text"
                                  value={payoutIdentifier}
                                  onChange={(e) => setPayoutIdentifier(e.target.value)}
                                  placeholder="yourcashtag"
                                  className="w-full pl-8 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                              </div>
                            </>
                          )}

                          {payoutMethod === 'upi' && (
                            <>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">UPI Virtual Payment Address (VPA)</label>
                              <input
                                type="text"
                                value={payoutIdentifier}
                                onChange={(e) => setPayoutIdentifier(e.target.value)}
                                placeholder="name@upi"
                                className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                              />
                            </>
                          )}

                          {payoutMethod === 'transit' && (
                            <>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Metro SmartCard Number</label>
                              <input
                                type="text"
                                value={payoutIdentifier}
                                onChange={(e) => setPayoutIdentifier(e.target.value)}
                                placeholder="16-digit SmartCard ID"
                                className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                              />
                            </>
                          )}

                          {payoutMethod === 'utility' && (
                            <>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Municipal Account ID (Water/Trash)</label>
                              <input
                                type="text"
                                value={payoutIdentifier}
                                onChange={(e) => setPayoutIdentifier(e.target.value)}
                                placeholder="e.g. BLR-MUNI-9824"
                                className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                              />
                            </>
                          )}

                          {payoutMethod === 'coffee' && (
                            <>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Partner Shop</label>
                              <select
                                value={selectedShop}
                                onChange={(e) => setSelectedShop(e.target.value)}
                                className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                              >
                                {LOCAL_SHOPS.map(shop => (
                                  <option key={shop.id} value={shop.id}>
                                    {shop.name}
                                  </option>
                                ))}
                              </select>
                              <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl flex items-start gap-2 text-[10px] text-amber-800 dark:text-amber-400 mt-1 font-medium leading-relaxed">
                                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                                <span>Local business vouchers keep capital inside our neighborhood circular economy! High-fidelity instant ticket generated upon submission.</span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Submit Button */}
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={handlePayoutSubmit}
                          disabled={isButtonDisabled}
                          className="w-full mt-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 disabled:from-slate-200 disabled:to-slate-300 disabled:dark:from-slate-800 disabled:dark:to-slate-800 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:brightness-105 active:brightness-95 transition-all"
                        >
                          <Lock className="w-4 h-4" />
                          Confirm Secure Payout
                        </motion.button>
                      </>
                    )}
                  </>
                )}

                {/* Secure processing state */}
                {isProcessing && (
                  <div className="flex flex-col items-center justify-center py-10 text-center gap-6">
                    <div className="relative">
                      <Loader2 className="w-16 h-16 text-emerald-500 animate-spin" />
                      <Lock className="w-6 h-6 text-emerald-600 absolute inset-0 m-auto" />
                    </div>
                    <div className="flex flex-col gap-2 max-w-xs">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Processing Municipal Disbursal...</h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                        SECURE SANDBOX TRANSACTION
                      </p>
                    </div>

                    {/* Timeline Tracker */}
                    <div className="w-full flex flex-col gap-2 px-4 text-left border-t border-slate-100 dark:border-slate-800 pt-5">
                      {PROCESSING_PHASES.map((phase, idx) => (
                        <div key={idx} className="flex gap-2.5 items-start">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center mt-0.5 shrink-0 ${idx < processingStep ? 'bg-emerald-500 text-white' : idx === processingStep ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-300'}`}>
                            {idx < processingStep ? <Check className="w-2.5 h-2.5" /> : <span className="text-[8px] font-bold">{idx + 1}</span>}
                          </div>
                          <span className={`text-[10px] leading-normal font-medium ${idx === processingStep ? 'text-slate-900 dark:text-white font-bold' : idx < processingStep ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-400'}`}>
                            {phase}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Success view */}
                {payoutSuccess && (
                  <div className="flex flex-col items-center justify-center py-8 text-center gap-5 relative overflow-hidden">
                    {/* SVG Confetti Effect */}
                    <div className="absolute inset-0 -z-10 pointer-events-none opacity-60">
                      <svg className="w-full h-full" viewBox="0 0 400 300">
                        <circle cx="80" cy="50" r="4" fill="#10B981" className="animate-ping" />
                        <circle cx="320" cy="90" r="5" fill="#3B82F6" />
                        <rect x="50" y="200" width="8" height="8" fill="#F59E0B" transform="rotate(45 50 200)" />
                        <rect x="340" y="220" width="6" height="12" fill="#EC4899" transform="rotate(20 340 220)" />
                        <circle cx="200" cy="40" r="3" fill="#10B981" />
                      </svg>
                    </div>

                    <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg animate-bounce">
                      <Check className="w-8 h-8" />
                    </div>

                    <div className="flex flex-col gap-1">
                      <h4 className="text-lg font-black text-slate-900 dark:text-white">Payout Disbursed Successfully!</h4>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 justify-center">
                        <Sparkles className="w-3.5 h-3.5" /> Direct ledger audit clearance granted
                      </p>
                    </div>

                    <div className="bg-[#f8f9fc] dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 w-full flex flex-col gap-2.5 text-left text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-2">
                        <span className="font-semibold text-slate-400">Payout Method:</span>
                        <span className="font-bold text-slate-900 dark:text-white capitalize">{payoutMethod}</span>
                      </div>
                      {payoutMethod !== 'coffee' && (
                        <div className="flex justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-2">
                          <span className="font-semibold text-slate-400">Account ID:</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{payoutIdentifier}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-2">
                        <span className="font-semibold text-slate-400">Transaction Status:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">Processed (Instantly)</span>
                      </div>
                      <div className="flex justify-between pt-1 font-bold">
                        <span className="text-slate-400">Amount Redeemed:</span>
                        <span className="text-slate-900 dark:text-white text-sm">${payoutMethod === 'coffee' ? '5.00' : redeemAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCloseModal}
                      className="w-full mt-2 py-3 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Done
                    </motion.button>
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
