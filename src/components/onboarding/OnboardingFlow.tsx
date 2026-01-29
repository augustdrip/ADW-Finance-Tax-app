/**
 * Onboarding Flow
 * Guides new users through setup:
 * 1. Welcome & Company Info
 * 2. Connect Bank (Plaid)
 * 3. Review Accounts
 * 4. Tax Profile
 * 5. Feature Tour
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlaidLink } from 'react-plaid-link';
import {
  ChevronRight,
  ChevronLeft,
  Building2,
  CreditCard,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Sparkles,
  Calculator,
  Receipt,
  Brain,
  TrendingUp,
  ArrowRight,
  Zap,
  ExternalLink,
  AlertCircle,
  Landmark
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { plaidService, PlaidAccount } from '../../../services/plaidService';

type OnboardingStep = 'welcome' | 'bank' | 'accounts' | 'tax' | 'tour' | 'complete';

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
}

export function OnboardingFlow() {
  const { user, profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [loading, setLoading] = useState(false);
  
  // Form data
  const [companyName, setCompanyName] = useState(profile?.company_name || '');
  const [taxStatus, setTaxStatus] = useState(profile?.tax_filing_status || 'sole_prop');
  const [businessCategory, setBusinessCategory] = useState(profile?.business_category || 'technology');
  const [state, setState] = useState(profile?.state || 'CA');
  
  // Plaid data
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<PlaidAccount[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  // Get Plaid link token on mount
  useEffect(() => {
    if (user && currentStep === 'bank') {
      plaidService.createLinkToken(user.id)
        .then(setLinkToken)
        .catch(console.error);
    }
  }, [user, currentStep]);

  // Plaid Link configuration
  const { open: openPlaidLink, ready: plaidReady } = usePlaidLink({
    token: linkToken,
    onSuccess: async (publicToken, metadata) => {
      if (!user) return;
      setLoading(true);
      try {
        const result = await plaidService.exchangePublicToken(publicToken, user.id);
        setConnectedAccounts(result.accounts);
        setSelectedAccounts(result.accounts.map(a => a.account_id));
        setCurrentStep('accounts');
      } catch (e) {
        console.error('Plaid link error:', e);
      } finally {
        setLoading(false);
      }
    },
    onExit: (error) => {
      if (error) {
        console.error('Plaid link exit error:', error);
      }
    },
  });

  const steps: { id: OnboardingStep; label: string }[] = [
    { id: 'welcome', label: 'Welcome' },
    { id: 'bank', label: 'Bank' },
    { id: 'accounts', label: 'Accounts' },
    { id: 'tax', label: 'Tax' },
    { id: 'tour', label: 'Tour' },
  ];

  const currentIndex = steps.findIndex(s => s.id === currentStep);
  const progress = ((currentIndex + 1) / steps.length) * 100;

  const goToStep = (step: OnboardingStep) => setCurrentStep(step);
  const nextStep = () => {
    const next = steps[currentIndex + 1];
    if (next) setCurrentStep(next.id);
  };
  const prevStep = () => {
    const prev = steps[currentIndex - 1];
    if (prev) setCurrentStep(prev.id);
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      await updateProfile({
        company_name: companyName,
        tax_filing_status: taxStatus,
        business_category: businessCategory,
        state,
        onboarding_completed: true,
      });
      setCurrentStep('complete');
      setTimeout(() => navigate('/'), 2000);
    } catch (e) {
      console.error('Failed to complete onboarding:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08080a] flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-white/5 z-50">
        <motion.div 
          className="h-full bg-indigo-600"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <span className="text-lg font-bold text-white">ADW Finance</span>
        </div>
        
        {/* Step indicators */}
        <div className="hidden md:flex items-center gap-2">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < currentIndex ? 'bg-indigo-600 text-white' :
                i === currentIndex ? 'bg-indigo-600/20 text-indigo-400 border-2 border-indigo-600' :
                'bg-white/5 text-slate-500'
              }`}>
                {i < currentIndex ? <CheckCircle2 size={16} /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-1 ${i < currentIndex ? 'bg-indigo-600' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {/* Welcome Step */}
          {currentStep === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-lg"
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="w-20 h-20 bg-indigo-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                >
                  <Sparkles size={40} className="text-indigo-400" />
                </motion.div>
                <h1 className="text-3xl font-black text-white mb-3">Welcome to ADW Finance</h1>
                <p className="text-slate-400">Let's get your account set up in just a few steps</p>
              </div>

              <div className="bg-[#0c0c0f] border border-white/10 rounded-2xl p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">Company Name</label>
                  <div className="relative">
                    <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Your Company Name"
                      className="w-full bg-[#121216] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">Business Type</label>
                  <select
                    value={taxStatus}
                    onChange={(e) => setTaxStatus(e.target.value)}
                    className="w-full bg-[#121216] border border-white/10 rounded-xl py-4 px-4 text-white focus:border-indigo-500 outline-none transition-all"
                  >
                    <option value="sole_prop">Sole Proprietor</option>
                    <option value="llc">LLC</option>
                    <option value="s_corp">S-Corp</option>
                    <option value="c_corp">C-Corp</option>
                    <option value="partnership">Partnership</option>
                  </select>
                </div>

                <button
                  onClick={nextStep}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  Continue <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Bank Connection Step */}
          {currentStep === 'bank' && (
            <motion.div
              key="bank"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-lg"
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="w-20 h-20 bg-emerald-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                >
                  <Landmark size={40} className="text-emerald-400" />
                </motion.div>
                <h1 className="text-3xl font-black text-white mb-3">Connect Your Bank</h1>
                <p className="text-slate-400">Securely connect your business accounts to track expenses automatically</p>
              </div>

              <div className="bg-[#0c0c0f] border border-white/10 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                  <ShieldCheck size={20} className="text-emerald-400" />
                  <div className="text-sm">
                    <div className="text-emerald-400 font-bold">Bank-level security</div>
                    <div className="text-slate-500 text-xs">Powered by Plaid - trusted by millions</div>
                  </div>
                </div>

                <button
                  onClick={() => openPlaidLink()}
                  disabled={!plaidReady || loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <CreditCard size={20} />
                      Connect Bank Account
                    </>
                  )}
                </button>

                <button
                  onClick={nextStep}
                  className="w-full text-slate-500 hover:text-white text-sm transition-colors"
                >
                  Skip for now →
                </button>

                <button
                  onClick={prevStep}
                  className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-white text-sm transition-colors"
                >
                  <ChevronLeft size={16} /> Back
                </button>
              </div>
            </motion.div>
          )}

          {/* Account Selection Step */}
          {currentStep === 'accounts' && (
            <motion.div
              key="accounts"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-lg"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-black text-white mb-3">Select Accounts</h1>
                <p className="text-slate-400">Choose which accounts to track for expenses</p>
              </div>

              <div className="bg-[#0c0c0f] border border-white/10 rounded-2xl p-6 space-y-4">
                {connectedAccounts.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    No accounts connected yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {connectedAccounts.map((account) => (
                      <label
                        key={account.account_id}
                        className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                          selectedAccounts.includes(account.account_id)
                            ? 'bg-indigo-600/10 border-indigo-500/30'
                            : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedAccounts.includes(account.account_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAccounts([...selectedAccounts, account.account_id]);
                            } else {
                              setSelectedAccounts(selectedAccounts.filter(id => id !== account.account_id));
                            }
                          }}
                          className="w-5 h-5 rounded bg-[#121216] border-white/20 text-indigo-600"
                        />
                        <div className="flex-1">
                          <div className="font-bold text-white">{account.name}</div>
                          <div className="text-xs text-slate-500">
                            {account.type} ••••{account.mask}
                          </div>
                        </div>
                        {account.balances.current !== null && (
                          <div className="text-right">
                            <div className="font-bold text-white">
                              ${account.balances.current.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-slate-500">Current</div>
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                )}

                <button
                  onClick={nextStep}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  Continue <ChevronRight size={18} />
                </button>

                <button
                  onClick={prevStep}
                  className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-white text-sm transition-colors"
                >
                  <ChevronLeft size={16} /> Back
                </button>
              </div>
            </motion.div>
          )}

          {/* Tax Profile Step */}
          {currentStep === 'tax' && (
            <motion.div
              key="tax"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-lg"
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="w-20 h-20 bg-amber-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                >
                  <Calculator size={40} className="text-amber-400" />
                </motion.div>
                <h1 className="text-3xl font-black text-white mb-3">Tax Profile</h1>
                <p className="text-slate-400">Help us customize your tax strategy</p>
              </div>

              <div className="bg-[#0c0c0f] border border-white/10 rounded-2xl p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">Business Category</label>
                  <select
                    value={businessCategory}
                    onChange={(e) => setBusinessCategory(e.target.value)}
                    className="w-full bg-[#121216] border border-white/10 rounded-xl py-4 px-4 text-white focus:border-indigo-500 outline-none transition-all"
                  >
                    <option value="technology">Technology / Software</option>
                    <option value="consulting">Consulting / Services</option>
                    <option value="ecommerce">E-Commerce / Retail</option>
                    <option value="creative">Creative / Design</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="realestate">Real Estate</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">State</label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-[#121216] border border-white/10 rounded-xl py-4 px-4 text-white focus:border-indigo-500 outline-none transition-all"
                  >
                    <option value="CA">California</option>
                    <option value="TX">Texas</option>
                    <option value="FL">Florida</option>
                    <option value="NY">New York</option>
                    <option value="WA">Washington</option>
                    <option value="NV">Nevada</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <button
                  onClick={nextStep}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  Continue <ChevronRight size={18} />
                </button>

                <button
                  onClick={prevStep}
                  className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-white text-sm transition-colors"
                >
                  <ChevronLeft size={16} /> Back
                </button>
              </div>
            </motion.div>
          )}

          {/* Feature Tour Step */}
          {currentStep === 'tour' && (
            <motion.div
              key="tour"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-2xl"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-black text-white mb-3">You're All Set!</h1>
                <p className="text-slate-400">Here's what you can do with ADW Finance</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {[
                  { icon: TrendingUp, title: 'Track Expenses', desc: 'Automatic categorization with bank sync', color: 'emerald' },
                  { icon: Brain, title: 'AI Tax Strategist', desc: 'Get IRC-powered tax advice', color: 'indigo' },
                  { icon: Receipt, title: 'Receipt Vault', desc: 'Store and match receipts to transactions', color: 'amber' },
                  { icon: Calculator, title: 'Tax Estimates', desc: 'Real-time deduction tracking', color: 'purple' },
                ].map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-[#0c0c0f] border border-white/10 rounded-2xl p-5"
                  >
                    <div className={`p-3 rounded-xl bg-${feature.color}-500/10 w-fit mb-3`}>
                      <feature.icon size={24} className={`text-${feature.color}-400`} />
                    </div>
                    <h3 className="font-bold text-white mb-1">{feature.title}</h3>
                    <p className="text-sm text-slate-500">{feature.desc}</p>
                  </motion.div>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={prevStep}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <ChevronLeft size={18} /> Back
                </button>
                <button
                  onClick={completeOnboarding}
                  disabled={loading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      Go to Dashboard <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Complete Step */}
          {currentStep === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-24 h-24 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle2 size={48} className="text-emerald-400" />
              </motion.div>
              <h1 className="text-3xl font-black text-white mb-3">Welcome Aboard!</h1>
              <p className="text-slate-400">Redirecting to your dashboard...</p>
              <Loader2 size={24} className="animate-spin text-indigo-500 mx-auto mt-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default OnboardingFlow;
