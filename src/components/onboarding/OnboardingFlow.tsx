/**
 * Onboarding Flow - QuickBooks Style
 * Enhanced multi-step questionnaire for new client onboarding
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
  Landmark,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Briefcase,
  DollarSign,
  Calendar,
  Users,
  FileText,
  Package,
  Target,
  CheckSquare,
  Wallet,
  Percent,
  Clock
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { plaidService, PlaidAccount } from '../../../services/plaidService';

type OnboardingStep = 
  | 'welcome' 
  | 'business-details'
  | 'contact-info'
  | 'financial-profile'
  | 'tax-setup'
  | 'services'
  | 'bank' 
  | 'accounts' 
  | 'complete';

interface FormData {
  // Business Details
  companyName: string;
  businessType: string;
  industry: string;
  naicsCode: string;
  ein: string;
  website: string;
  yearEstablished: string;
  
  // Contact Info
  contactName: string;
  contactTitle: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  
  // Financial Profile
  annualRevenue: string;
  employeeCount: string;
  accountingMethod: 'cash' | 'accrual';
  fiscalYearEnd: string;
  previousSoftware: string;
  hasPreviousAccountant: boolean;
  previousAccountantName: string;
  
  // Tax Setup
  taxFilingStatus: string;
  dependents: string;
  taxYearEnd: string;
  salesTaxRequired: boolean;
  payrollRequired: boolean;
  
  // Services
  servicesNeeded: {
    bookkeeping: boolean;
    taxPreparation: boolean;
    taxPlanning: boolean;
    payroll: boolean;
    financialStatements: boolean;
    auditSupport: boolean;
    consulting: boolean;
    other: boolean;
  };
  otherServices: string;
}

export function OnboardingFlow() {
  const { user, profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    companyName: profile?.company_name || '',
    businessType: profile?.tax_filing_status || 'sole_prop',
    industry: profile?.business_category || 'technology',
    naicsCode: '',
    ein: '',
    website: '',
    yearEstablished: '',
    contactName: profile?.full_name || '',
    contactTitle: '',
    email: profile?.email || '',
    phone: '',
    address: '',
    city: '',
    state: profile?.state || 'CA',
    zip: '',
    annualRevenue: '',
    employeeCount: '',
    accountingMethod: 'cash',
    fiscalYearEnd: '12-31',
    previousSoftware: '',
    hasPreviousAccountant: false,
    previousAccountantName: '',
    taxFilingStatus: 'single',
    dependents: '',
    taxYearEnd: '12-31',
    salesTaxRequired: false,
    payrollRequired: false,
    servicesNeeded: {
      bookkeeping: false,
      taxPreparation: false,
      taxPlanning: false,
      payroll: false,
      financialStatements: false,
      auditSupport: false,
      consulting: false,
      other: false
    },
    otherServices: ''
  });

  // Plaid setup
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<PlaidAccount[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  useEffect(() => {
    if (user && currentStep === 'bank') {
      plaidService.createLinkToken(user.id)
        .then(setLinkToken)
        .catch(console.error);
    }
  }, [user, currentStep]);

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
      if (error) console.error('Plaid link exit error:', error);
    },
  });

  const steps: { id: OnboardingStep; label: string; icon: any }[] = [
    { id: 'welcome', label: 'Welcome', icon: Sparkles },
    { id: 'business-details', label: 'Business', icon: Building2 },
    { id: 'contact-info', label: 'Contact', icon: User },
    { id: 'financial-profile', label: 'Financials', icon: DollarSign },
    { id: 'tax-setup', label: 'Tax Setup', icon: Calculator },
    { id: 'services', label: 'Services', icon: CheckSquare },
    { id: 'bank', label: 'Connect Bank', icon: Landmark },
  ];

  const currentIndex = steps.findIndex(s => s.id === currentStep);
  const progress = ((currentIndex + 1) / steps.length) * 100;

  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    const nextSteps: OnboardingStep[] = [
      'welcome', 'business-details', 'contact-info', 'financial-profile', 
      'tax-setup', 'services', 'bank', 'accounts', 'complete'
    ];
    const currentIdx = nextSteps.indexOf(currentStep);
    if (currentIdx < nextSteps.length - 1) {
      setCurrentStep(nextSteps[currentIdx + 1]);
    }
  };

  const prevStep = () => {
    const nextSteps: OnboardingStep[] = [
      'welcome', 'business-details', 'contact-info', 'financial-profile', 
      'tax-setup', 'services', 'bank', 'accounts', 'complete'
    ];
    const currentIdx = nextSteps.indexOf(currentStep);
    if (currentIdx > 0) {
      setCurrentStep(nextSteps[currentIdx - 1]);
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      // Try to update profile, but don't block onboarding if it fails
      const updatePromise = updateProfile({
        company_name: formData.companyName,
        tax_filing_status: formData.businessType,
        business_category: formData.industry,
        state: formData.state,
        onboarding_completed: true,
      });
      
      // Set a timeout so we don't hang forever
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile update timeout')), 5000)
      );
      
      await Promise.race([updatePromise, timeoutPromise]).catch(e => {
        console.warn('Profile update failed, continuing anyway:', e);
      });
      
      // Always proceed to complete step
      setCurrentStep('complete');
      setTimeout(() => navigate('/'), 2000);
    } catch (e) {
      console.error('Failed to complete onboarding:', e);
      // Still navigate to dashboard on error
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'welcome':
        return formData.companyName && formData.businessType;
      case 'business-details':
        return formData.industry && formData.yearEstablished;
      case 'contact-info':
        return formData.contactName && formData.email && formData.phone && formData.address;
      case 'financial-profile':
        return formData.annualRevenue && formData.employeeCount;
      case 'tax-setup':
        return formData.taxFilingStatus;
      case 'services':
        return Object.values(formData.servicesNeeded).some(v => v);
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-[#08080a] flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-white/5 z-50">
        <motion.div 
          className="h-full bg-gradient-to-r from-indigo-600 to-purple-600"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Header */}
      <header className="p-6 border-b border-white/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl">
              <ShieldCheck size={24} className="text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-white">ADW Finance</span>
              <p className="text-slate-500 text-xs">Client Onboarding</p>
            </div>
          </div>
          
          {/* Step indicators */}
          <div className="hidden lg:flex items-center gap-1">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex flex-col items-center transition-all ${
                    i <= currentIndex ? 'opacity-100' : 'opacity-50'
                  }`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      i < currentIndex ? 'bg-emerald-500/20 text-emerald-400' :
                      i === currentIndex ? 'bg-indigo-600 text-white' :
                      'bg-white/5 text-slate-500'
                    }`}>
                      {i < currentIndex ? <CheckCircle2 size={20} /> : <Icon size={20} />}
                    </div>
                    <span className={`text-[10px] mt-1 ${
                      i === currentIndex ? 'text-indigo-400' : 'text-slate-500'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-1 ${
                      i < currentIndex ? 'bg-emerald-500/50' : 'bg-white/10'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-slate-500 text-sm">
            Step {currentIndex + 1} of {steps.length}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6 overflow-auto">
        <AnimatePresence mode="wait">
          {/* Welcome Step */}
          {currentStep === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-2xl"
            >
              <div className="text-center mb-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="w-24 h-24 bg-gradient-to-br from-indigo-600/30 to-purple-600/30 rounded-3xl flex items-center justify-center mx-auto mb-6"
                >
                  <Sparkles size={48} className="text-indigo-400" />
                </motion.div>
                <h1 className="text-4xl font-black text-white mb-4">
                  Let's Get You Set Up
                </h1>
                <p className="text-slate-400 text-lg">
                  Tell us about your business so we can customize your experience
                </p>
              </div>

              <div className="bg-[#0c0c0f] border border-white/10 rounded-2xl p-8 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Company Name *
                    </label>
                    <div className="relative">
                      <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => updateField('companyName', e.target.value)}
                        placeholder="Acme Corporation"
                        className="w-full bg-[#121216] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Business Type *
                    </label>
                    <select
                      value={formData.businessType}
                      onChange={(e) => updateField('businessType', e.target.value)}
                      className="w-full bg-[#121216] border border-white/10 rounded-xl py-4 px-4 text-white focus:border-indigo-500 outline-none transition-all appearance-none"
                    >
                      <option value="sole_prop">Sole Proprietorship</option>
                      <option value="llc">Limited Liability Company (LLC)</option>
                      <option value="s_corp">S Corporation</option>
                      <option value="c_corp">C Corporation</option>
                      <option value="partnership">Partnership</option>
                      <option value="nonprofit">Non-Profit Organization</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  Get Started <ArrowRight size={20} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Business Details Step */}
          {currentStep === 'business-details' && (
            <motion.div
              key="business-details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-3xl"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Building2 size={32} className="text-indigo-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Business Details</h2>
                <p className="text-slate-400">Tell us more about your company</p>
              </div>

              <div className="bg-[#0c0c0f] border border-white/10 rounded-2xl p-8 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Industry *
                    </label>
                    <select
                      value={formData.industry}
                      onChange={(e) => updateField('industry', e.target.value)}
                      className="w-full bg-[#121216] border border-white/10 rounded-xl py-4 px-4 text-white focus:border-indigo-500 outline-none transition-all"
                    >
                      <option value="">Select industry...</option>
                      <option value="technology">Technology / Software</option>
                      <option value="consulting">Consulting / Professional Services</option>
                      <option value="healthcare">Healthcare / Medical</option>
                      <option value="retail">Retail / E-Commerce</option>
                      <option value="manufacturing">Manufacturing</option>
                      <option value="construction">Construction / Real Estate</option>
                      <option value="hospitality">Hospitality / Food Service</option>
                      <option value="creative">Creative / Design</option>
                      <option value="marketing">Marketing / Advertising</option>
                      <option value="finance">Financial Services</option>
                      <option value="legal">Legal Services</option>
                      <option value="education">Education / Training</option>
                      <option value="transportation">Transportation / Logistics</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Year Established *
                    </label>
                    <input
                      type="number"
                      value={formData.yearEstablished}
                      onChange={(e) => updateField('yearEstablished', e.target.value)}
                      placeholder="2020"
                      min="1900"
                      max={new Date().getFullYear()}
                      className="w-full bg-[#121216] border border-white/10 rounded-xl py-4 px-4 text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      EIN (Tax ID)
                    </label>
                    <input
                      type="text"
                      value={formData.ein}
                      onChange={(e) => updateField('ein', e.target.value)}
                      placeholder="XX-XXXXXXX"
                      className="w-full bg-[#121216] border border-white/10 rounded-xl py-4 px-4 text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none transition-all"
                    />
                    <p className="text-slate-600 text-xs mt-1">Your Employer Identification Number</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Website
                    </label>
                    <div className="relative">
                      <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => updateField('website', e.target.value)}
                        placeholder="www.yourcompany.com"
                        className="w-full bg-[#121216] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={prevStep}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <ChevronLeft size={18} /> Back
                  </button>
                  <button
                    onClick={nextStep}
                    disabled={!canProceed()}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    Continue <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Contact Info Step */}
          {currentStep === 'contact-info' && (
            <motion.div
              key="contact-info"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-3xl"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <User size={32} className="text-purple-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Contact Information</h2>
                <p className="text-slate-400">How can we reach you?</p>
              </div>

              <div className="bg-[#0c0c0f] border border-white/10 rounded-2xl p-8 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Primary Contact Name *
                    </label>
                    <div className="relative">
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        value={formData.contactName}
                        onChange={(e) => updateField('contactName', e.target.value)}
                        placeholder="John Doe"
                        className="w-full bg-[#121216] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Job Title
                    </label>
                    <div className="relative">
                      <Briefcase size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        value={formData.contactTitle}
                        onChange={(e) => updateField('contactTitle', e.target.value)}
                        placeholder="Owner / CEO"
                        className="w-full bg-[#121216] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        placeholder="john@company.com"
                        className="w-full bg-[#121216] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        placeholder="(555) 123-4567"
                        className="w-full bg-[#121216] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Business Address *
                  </label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      placeholder="123 Business Street"
                      className="w-full bg-[#121216] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      placeholder="City"
                      className="w-full bg-[#121216] border border-white/10 rounded-xl py-4 px-4 text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      State *
                    </label>
                    <select
                      value={formData.state}
                      onChange={(e) => updateField('state', e.target.value)}
                      className="w-full bg-[#121216] border border-white/10 rounded-xl py-4 px-4 text-white focus:border-indigo-500 outline-none transition-all"
                    >
                      <option value="CA">California</option>
                      <option value="TX">Texas</option>
                      <option value="FL">Florida</option>
                      <option value="NY">New York</option>
                      <option value="WA">Washington</option>
                      <option value="NV">Nevada</option>
                      <option value="AZ">Arizona</option>
                      <option value="CO">Colorado</option>
                      <option value="OR">Oregon</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      value={formData.zip}
                      onChange={(e) => updateField('zip', e.target.value)}
                      placeholder="12345"
                      className="w-full bg-[#121216] border border-white/10 rounded-xl py-4 px-4 text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={prevStep}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <ChevronLeft size={18} /> Back
                  </button>
                  <button
                    onClick={nextStep}
                    disabled={!canProceed()}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    Continue <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Financial Profile Step */}
          {currentStep === 'financial-profile' && (
            <motion.div
              key="financial-profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-3xl"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-emerald-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <DollarSign size={32} className="text-emerald-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Financial Profile</h2>
                <p className="text-slate-400">Help us understand your financial situation</p>
              </div>

              <div className="bg-[#0c0c0f] border border-white/10 rounded-2xl p-8 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Estimated Annual Revenue *
                    </label>
                    <div className="relative">
                      <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <select
                        value={formData.annualRevenue}
                        onChange={(e) => updateField('annualRevenue', e.target.value)}
                        className="w-full bg-[#121216] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:border-indigo-500 outline-none transition-all"
                      >
                        <option value="">Select range...</option>
                        <option value="0-50k">$0 - $50,000</option>
                        <option value="50k-100k">$50,000 - $100,000</option>
                        <option value="100k-250k">$100,000 - $250,000</option>
                        <option value="250k-500k">$250,000 - $500,000</option>
                        <option value="500k-1m">$500,000 - $1,000,000</option>
                        <option value="1m-5m">$1,000,000 - $5,000,000</option>
                        <option value="5m+">$5,000,000+</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Number of Employees *
                    </label>
                    <div className="relative">
                      <Users size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <select
                        value={formData.employeeCount}
                        onChange={(e) => updateField('employeeCount', e.target.value)}
                        className="w-full bg-[#121216] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:border-indigo-500 outline-none transition-all"
                      >
                        <option value="">Select...</option>
                        <option value="0">Just me (0 employees)</option>
                        <option value="1-5">1-5 employees</option>
                        <option value="6-10">6-10 employees</option>
                        <option value="11-25">11-25 employees</option>
                        <option value="26-50">26-50 employees</option>
                        <option value="50+">50+ employees</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Accounting Method
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => updateField('accountingMethod', 'cash')}
                        className={`py-4 px-4 rounded-xl border transition-all ${
                          formData.accountingMethod === 'cash'
                            ? 'border-indigo-500 bg-indigo-500/10 text-white'
                            : 'border-white/10 bg-[#121216] text-slate-400 hover:border-white/20'
                        }`}
                      >
                        <div className="font-semibold">Cash</div>
                        <div className="text-xs opacity-70">Record when paid</div>
                      </button>
                      <button
                        onClick={() => updateField('accountingMethod', 'accrual')}
                        className={`py-4 px-4 rounded-xl border transition-all ${
                          formData.accountingMethod === 'accrual'
                            ? 'border-indigo-500 bg-indigo-500/10 text-white'
                            : 'border-white/10 bg-[#121216] text-slate-400 hover:border-white/20'
                        }`}
                      >
                        <div className="font-semibold">Accrual</div>
                        <div className="text-xs opacity-70">Record when earned</div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Fiscal Year End
                    </label>
                    <div className="relative">
                      <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <select
                        value={formData.fiscalYearEnd}
                        onChange={(e) => updateField('fiscalYearEnd', e.target.value)}
                        className="w-full bg-[#121216] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:border-indigo-500 outline-none transition-all"
                      >
                        <option value="12-31">December 31 (Calendar Year)</option>
                        <option value="01-31">January 31</option>
                        <option value="03-31">March 31</option>
                        <option value="06-30">June 30</option>
                        <option value="09-30">September 30</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Current Accounting Software
                  </label>
                  <select
                    value={formData.previousSoftware}
                    onChange={(e) => updateField('previousSoftware', e.target.value)}
                    className="w-full bg-[#121216] border border-white/10 rounded-xl py-4 px-4 text-white focus:border-indigo-500 outline-none transition-all"
                  >
                    <option value="">Select software (if any)...</option>
                    <option value="quickbooks">QuickBooks Online</option>
                    <option value="quickbooks-desktop">QuickBooks Desktop</option>
                    <option value="xero">Xero</option>
                    <option value="freshbooks">FreshBooks</option>
                    <option value="wave">Wave</option>
                    <option value="excel">Excel / Spreadsheets</option>
                    <option value="none">None / Starting fresh</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasPreviousAccountant}
                      onChange={(e) => updateField('hasPreviousAccountant', e.target.checked)}
                      className="w-5 h-5 rounded bg-[#121216] border-white/20 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-slate-300">Have you worked with an accountant or bookkeeper before?</span>
                  </label>

                  {formData.hasPreviousAccountant && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="pl-8"
                    >
                      <input
                        type="text"
                        value={formData.previousAccountantName}
                        onChange={(e) => updateField('previousAccountantName', e.target.value)}
                        placeholder="Previous accountant/firm name"
                        className="w-full bg-[#121216] border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none transition-all"
                      />
                    </motion.div>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={prevStep}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <ChevronLeft size={18} /> Back
                  </button>
                  <button
                    onClick={nextStep}
                    disabled={!canProceed()}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    Continue <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tax Setup Step */}
          {currentStep === 'tax-setup' && (
            <motion.div
              key="tax-setup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-3xl"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-amber-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calculator size={32} className="text-amber-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Tax Setup</h2>
                <p className="text-slate-400">Let's configure your tax preferences</p>
              </div>

              <div className="bg-[#0c0c0f] border border-white/10 rounded-2xl p-8 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-3">
                    Personal Tax Filing Status
                  </label>
                  <div className="grid md:grid-cols-2 gap-3">
                    {[
                      { value: 'single', label: 'Single' },
                      { value: 'married_joint', label: 'Married Filing Jointly' },
                      { value: 'married_separate', label: 'Married Filing Separately' },
                      { value: 'head_household', label: 'Head of Household' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateField('taxFilingStatus', option.value)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          formData.taxFilingStatus === option.value
                            ? 'border-indigo-500 bg-indigo-500/10 text-white'
                            : 'border-white/10 bg-[#121216] text-slate-400 hover:border-white/20'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Number of Dependents
                    </label>
                    <input
                      type="number"
                      value={formData.dependents}
                      onChange={(e) => updateField('dependents', e.target.value)}
                      placeholder="0"
                      min="0"
                      className="w-full bg-[#121216] border border-white/10 rounded-xl py-4 px-4 text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Last Tax Year Filed
                    </label>
                    <select
                      value={formData.taxYearEnd}
                      onChange={(e) => updateField('taxYearEnd', e.target.value)}
                      className="w-full bg-[#121216] border border-white/10 rounded-xl py-4 px-4 text-white focus:border-indigo-500 outline-none transition-all"
                    >
                      <option value="">Select year...</option>
                      <option value="2024">2024</option>
                      <option value="2023">2023</option>
                      <option value="2022">2022</option>
                      <option value="2021">2021</option>
                      <option value="never">Never Filed</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.salesTaxRequired}
                      onChange={(e) => updateField('salesTaxRequired', e.target.checked)}
                      className="w-5 h-5 rounded bg-[#121216] border-white/20 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-slate-300">Do you collect sales tax?</span>
                      <p className="text-slate-500 text-xs">Required for retail, e-commerce, and some service businesses</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.payrollRequired}
                      onChange={(e) => updateField('payrollRequired', e.target.checked)}
                      className="w-5 h-5 rounded bg-[#121216] border-white/20 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-slate-300">Do you need payroll services?</span>
                      <p className="text-slate-500 text-xs">For businesses with W-2 employees</p>
                    </div>
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={prevStep}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <ChevronLeft size={18} /> Back
                  </button>
                  <button
                    onClick={nextStep}
                    disabled={!canProceed()}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    Continue <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Services Step */}
          {currentStep === 'services' && (
            <motion.div
              key="services"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-3xl"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckSquare size={32} className="text-blue-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Services You Need</h2>
                <p className="text-slate-400">Select all that apply</p>
              </div>

              <div className="bg-[#0c0c0f] border border-white/10 rounded-2xl p-8 space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { key: 'bookkeeping', label: 'Monthly Bookkeeping', desc: 'Ongoing transaction recording and reconciliation' },
                    { key: 'taxPreparation', label: 'Tax Preparation', desc: 'Business and personal tax return filing' },
                    { key: 'taxPlanning', label: 'Tax Planning', desc: 'Strategic tax saving recommendations' },
                    { key: 'payroll', label: 'Payroll Services', desc: 'Employee payroll and tax filings' },
                    { key: 'financialStatements', label: 'Financial Statements', desc: 'Compiled or reviewed statements' },
                    { key: 'auditSupport', label: 'Audit Support', desc: 'Representation during IRS audits' },
                    { key: 'consulting', label: 'Business Consulting', desc: 'Financial advisory and growth planning' },
                  ].map((service) => (
                    <label
                      key={service.key}
                      className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                        formData.servicesNeeded[service.key as keyof typeof formData.servicesNeeded]
                          ? 'border-indigo-500 bg-indigo-500/10'
                          : 'border-white/10 bg-[#121216] hover:border-white/20'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.servicesNeeded[service.key as keyof typeof formData.servicesNeeded]}
                        onChange={(e) => {
                          updateField('servicesNeeded', {
                            ...formData.servicesNeeded,
                            [service.key]: e.target.checked
                          });
                        }}
                        className="w-5 h-5 rounded bg-[#121216] border-white/20 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                      />
                      <div>
                        <p className="text-white font-medium">{service.label}</p>
                        <p className="text-slate-500 text-sm">{service.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <label className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                  formData.servicesNeeded.other
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-white/10 bg-[#121216] hover:border-white/20'
                }`}>
                  <input
                    type="checkbox"
                    checked={formData.servicesNeeded.other}
                    onChange={(e) => {
                      updateField('servicesNeeded', {
                        ...formData.servicesNeeded,
                        other: e.target.checked
                      });
                    }}
                    className="w-5 h-5 rounded bg-[#121216] border-white/20 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                  />
                  <div className="flex-1">
                    <p className="text-white font-medium">Other Services</p>
                    {formData.servicesNeeded.other && (
                      <input
                        type="text"
                        value={formData.otherServices}
                        onChange={(e) => updateField('otherServices', e.target.value)}
                        placeholder="Please describe..."
                        className="w-full mt-2 bg-[#121216] border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none transition-all"
                      />
                    )}
                  </div>
                </label>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={prevStep}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <ChevronLeft size={18} /> Back
                  </button>
                  <button
                    onClick={nextStep}
                    disabled={!canProceed()}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    Continue <ChevronRight size={18} />
                  </button>
                </div>
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
              className="w-full max-w-2xl"
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="w-24 h-24 bg-gradient-to-br from-emerald-600/30 to-teal-600/30 rounded-3xl flex items-center justify-center mx-auto mb-6"
                >
                  <Landmark size={48} className="text-emerald-400" />
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-3">Connect Your Bank</h2>
                <p className="text-slate-400">Securely connect your accounts for automatic transaction import</p>
              </div>

              <div className="bg-[#0c0c0f] border border-white/10 rounded-2xl p-8 space-y-6">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-white/5 rounded-xl">
                    <Receipt className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                    <p className="text-white text-sm font-medium">Auto-import</p>
                    <p className="text-slate-500 text-xs">Transactions synced daily</p>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-xl">
                    <Brain className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <p className="text-white text-sm font-medium">Smart Categorization</p>
                    <p className="text-slate-500 text-xs">AI-powered expense sorting</p>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-xl">
                    <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                    <p className="text-white text-sm font-medium">Bank-level Security</p>
                    <p className="text-slate-500 text-xs">256-bit encryption</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                  <ShieldCheck size={24} className="text-emerald-400" />
                  <div>
                    <div className="text-emerald-400 font-bold">Secure Connection</div>
                    <div className="text-slate-500 text-sm">Powered by Plaid - trusted by 12,000+ financial institutions</div>
                  </div>
                </div>

                <button
                  onClick={() => openPlaidLink()}
                  disabled={!plaidReady || loading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <>
                      <CreditCard size={24} />
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
              className="w-full max-w-2xl"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-3">Select Accounts</h2>
                <p className="text-slate-400">Choose which accounts to track for your business</p>
              </div>

              <div className="bg-[#0c0c0f] border border-white/10 rounded-2xl p-8 space-y-6">
                {connectedAccounts.length === 0 ? (
                  <div className="text-center py-12">
                    <Wallet className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500">No accounts connected</p>
                    <button
                      onClick={() => setCurrentStep('bank')}
                      className="mt-4 text-indigo-400 hover:text-indigo-300"
                    >
                      Go back to connect a bank
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {connectedAccounts.map((account) => (
                        <label
                          key={account.account_id}
                          className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                            selectedAccounts.includes(account.account_id)
                              ? 'bg-indigo-600/10 border-indigo-500/50'
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
                              <div className="text-[10px] text-slate-500">Current Balance</div>
                            </div>
                          )}
                        </label>
                      ))}
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={() => setCurrentStep('bank')}
                        className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 px-6 rounded-xl transition-all"
                      >
                        Connect Another Bank
                      </button>
                      <button
                        onClick={completeOnboarding}
                        disabled={loading}
                        className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <Loader2 size={20} className="animate-spin" />
                        ) : (
                          <>
                            Complete Setup <CheckCircle2 size={18} />
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}

                {connectedAccounts.length === 0 && (
                  <button
                    onClick={completeOnboarding}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        Complete Setup <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                )}
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
                className="w-28 h-28 bg-gradient-to-br from-emerald-600/30 to-teal-600/30 rounded-full flex items-center justify-center mx-auto mb-8"
              >
                <CheckCircle2 size={56} className="text-emerald-400" />
              </motion.div>
              <h1 className="text-4xl font-black text-white mb-4">You're All Set!</h1>
              <p className="text-slate-400 text-lg mb-2">Welcome to ADW Finance, {formData.contactName || 'valued client'}!</p>
              <p className="text-slate-500">Taking you to your dashboard...</p>
              <Loader2 size={32} className="animate-spin text-indigo-500 mx-auto mt-8" />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default OnboardingFlow;
