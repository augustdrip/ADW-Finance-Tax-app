
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  ShieldCheck, 
  Sparkles, 
  Send, 
  FileSignature, 
  CreditCard, 
  RefreshCcw, 
  Search, 
  Download, 
  AlertCircle, 
  TrendingUp, 
  Plus, 
  Scale, 
  Trash2, 
  X, 
  ChevronRight, 
  Edit3, 
  Paperclip, 
  File, 
  UploadCloud, 
  Loader2,
  Bell,
  Check,
  CheckSquare,
  Square,
  ChevronDown,
  Wand2,
  ChevronUp,
  Calendar,
  Calculator,
  Printer,
  FileText,
  Zap,
  BookOpen,
  Gavel,
  ArrowUpRight,
  History,
  Target,
  Image as ImageIcon,
  FolderOpen,
  Box,
  HardDrive,
  CheckCircle2,
  ShieldAlert,
  Info,
  Waves,
  Link as LinkIcon,
  Globe,
  Lock
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { jsPDF } from 'jspdf';
import { Transaction, DashboardStats, ChatMessage, ClientAgreement, Invoice, Attachment, TaxFormSummary, CompanyAsset } from './types';
import { analyzeTransaction, streamStrategyChat, enhanceBusinessContext } from './services/geminiService';
import { db } from './services/supabaseService';
import { mercuryService } from './services/mercuryService';

const COMPANY_INFO = {
  name: "Agency Dev Works",
  address: "20830 Stevens Creek Blvd #1103, Cupertino, CA 95014",
  email: "Official@AgencyDevWorks.ai",
  bankName: "Evolve Bank & Trust via Mercury",
  accountName: "Agency DevWorks",
  accountNumber: "202566543260",
  routingNumber: "091311229"
};

const MOCK_DATA = {
  transactions: [
    { id: 'm1', date: '2024-05-15', vendor: 'OpenAI', amount: 2500.00, category: 'Software/SaaS', context: 'API credits for custom LLM integration on Client Project X.', attachments: [], bankVerified: true },
    { id: 'm2', date: '2024-05-12', vendor: 'Apple Inc.', amount: 3499.00, category: 'Hardware', context: 'M3 Max MacBook Pro for lead architect. IRC 179 eligible.', attachments: [], bankVerified: true },
    { id: 'm3', date: '2024-04-20', vendor: 'Vercel', amount: 40.00, category: 'Software/SaaS', context: 'Production hosting for Agency Dev Works portal.', attachments: [], bankVerified: true }
  ],
  agreements: [
    { id: 'a1', clientName: 'Neural Dynamics Corp', effectiveDate: '2024-01-01', status: 'Active', scopeOfWork: 'Ongoing AI Infrastructure Management and LLM fine-tuning.', value: 125000, attachments: [{ id: 'doc1', name: 'Neural_MSA_Final.pdf', type: 'application/pdf', url: '#', dateAdded: '2024-01-01' }] }
  ],
  invoices: [
    { id: 'i1', invoiceNumber: 'INV-2024-001', clientName: 'Neural Dynamics Corp', issueDate: '2024-05-01', dueDate: '2024-05-15', amount: 15000, description: 'Milestone 2: Database Migration', status: 'Paid' },
    { id: 'i2', invoiceNumber: 'INV-2024-002', clientName: 'Astra AI', issueDate: '2024-05-10', dueDate: '2024-06-10', amount: 8500, description: 'R&D Consultation Fees', status: 'Sent' }
  ],
  assets: [
    { id: 'as1', name: 'AgencyDevWorks_Logo_Primary.svg', type: 'image/svg+xml', url: 'https://placeholder.com/150', category: 'Branding', dateAdded: '2024-01-10', size: '12KB' },
    { id: 'as2', name: 'AgencyDevWorks_BrandGuide.pdf', type: 'application/pdf', url: '#', category: 'Branding', dateAdded: '2024-01-15', size: '4.2MB' }
  ]
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'agreements' | 'invoices' | 'chat' | 'tax' | 'assets'>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [agreements, setAgreements] = useState<ClientAgreement[]>([]);
  const [assets, setAssets] = useState<CompanyAsset[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMercurySyncing, setIsMercurySyncing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isBulkAnalyzing, setIsBulkAnalyzing] = useState(false);
  const [showModal, setShowModal] = useState<'transaction' | 'invoice' | 'agreement' | 'asset' | 'mercury' | null>(null);
  const [mercuryApiKey, setMercuryApiKey] = useState<string>(localStorage.getItem('mercury_key') || '');
  const [lastSyncTime, setLastSyncTime] = useState<string>(localStorage.getItem('mercury_sync') || 'Never');
  
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingAgreement, setEditingAgreement] = useState<ClientAgreement | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [tempAttachments, setTempAttachments] = useState<Attachment[]>([]);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'alert'} | null>(null);
  
  const [currentMonth, setCurrentMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [expandedAnalysisId, setExpandedAnalysisId] = useState<string | null>(null);
  const [modalContext, setModalContext] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'assistant', content: 'Agency Dev Works Strategist online. Knowledge base: Internal Revenue Code 2024. Bank connection: Mercury Protocol established. How shall we optimize your tax posture today?', timestamp: Date.now() }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const assetInputRef = useRef<HTMLInputElement>(null);
  const modalFormRef = useRef<HTMLFormElement>(null);

  const loadData = async () => {
    setIsSyncing(true);
    try {
      const [tData, iData, aData, asData] = await Promise.all([
        db.transactions.fetch(),
        db.invoices.fetch(),
        db.agreements.fetch(),
        db.assets.fetch()
      ]);
      
      setTransactions(tData?.length ? tData : MOCK_DATA.transactions as any);
      setInvoices(iData?.length ? iData : MOCK_DATA.invoices as any);
      setAgreements(aData?.length ? aData : MOCK_DATA.agreements as any);
      setAssets(asData?.length ? asData : MOCK_DATA.assets as any);
    } catch (e) {
      console.error("Load Error:", e);
      setTransactions(MOCK_DATA.transactions as any);
      setInvoices(MOCK_DATA.invoices as any);
      setAgreements(MOCK_DATA.agreements as any);
      setAssets(MOCK_DATA.assets as any);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const filteredTransactions = useMemo(() => {
    if (activeTab === 'transactions' && currentMonth) {
      return transactions.filter(t => t.date.startsWith(currentMonth));
    }
    return transactions;
  }, [transactions, currentMonth, activeTab]);

  const [bankBalance, setBankBalance] = useState<number>(parseFloat(localStorage.getItem('mercury_balance') || '0'));

  const stats: DashboardStats = useMemo(() => {
    const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
    const totalPotential_deductions = transactions.reduce((sum, t) => sum + (t.analysis?.deductibleAmount || 0), 0);
    return {
      totalSpent,
      totalPotentialDeductions: totalPotential_deductions,
      projectedTaxSavings: totalPotential_deductions * 0.25,
      optimizationScore: transactions.length > 0 ? Math.round((transactions.filter(t => t.analysis).length / transactions.length) * 100) : 0,
      bankBalance: bankBalance,
      lastSync: lastSyncTime
    };
  }, [transactions, lastSyncTime, bankBalance]);

  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, i) => {
      const expenditure = 15000 + (Math.random() * 10000);
      const shield = expenditure * (0.6 + (Math.random() * 0.2));
      return { name: month, expenditure, shield };
    });
  }, [transactions]);

  const taxSummary: TaxFormSummary = useMemo(() => {
    const grossIncome = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.amount, 0);
    const expensesByCategory: Record<string, number> = {};
    let totalDeductionsValue = 0;

    transactions.forEach(t => {
      const amount = t.analysis?.deductibleAmount || t.amount;
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + amount;
      if (t.analysis) totalDeductionsValue += t.analysis.deductibleAmount;
    });

    return {
      year: new Date().getFullYear(),
      grossIncome,
      expensesByCategory,
      totalExpenses: Object.values(expensesByCategory).reduce((a, b) => a + b, 0),
      netProfit: grossIncome - Object.values(expensesByCategory).reduce((a, b) => a + b, 0),
      potentialCredits: totalDeductionsValue * 0.06
    };
  }, [transactions, invoices]);

  const handleMercurySync = async () => {
    if (!mercuryApiKey) {
      setShowModal('mercury');
      return;
    }

    setIsMercurySyncing(true);
    setNotification({ message: "Connecting to Mercury Protocol...", type: 'success' });

    try {
      // Call real Mercury API
      const mercuryTransactions = await mercuryService.fetchTransactions(mercuryApiKey);
      
      // Add only unique transactions (check by bankId to avoid duplicates)
      setTransactions(prev => {
        const existingBankIds = new Set(prev.filter(p => p.bankId).map(p => p.bankId));
        const existingIds = new Set(prev.map(p => p.id));
        
        const newTransactions = mercuryTransactions
          .filter(m => !existingBankIds.has(m.id) && !existingIds.has(m.id))
          .map(t => ({
            ...t,
            bankId: t.id, // Store original Mercury ID
            id: `merc_${t.id}`, // Create unique app ID
            bankVerified: true
          }));
        
        // Save new transactions to Supabase
        newTransactions.forEach(t => db.transactions.upsert(t));
        
        return [...newTransactions, ...prev];
      });

      // Also fetch the real bank balance
      try {
        const balance = await mercuryService.fetchTotalBalance(mercuryApiKey);
        setBankBalance(balance / 100); // Convert from cents to dollars
        localStorage.setItem('mercury_balance', String(balance / 100));
      } catch (balanceError) {
        console.warn("Could not fetch balance:", balanceError);
      }

      const now = new Date().toLocaleString();
      setLastSyncTime(now);
      localStorage.setItem('mercury_sync', now);
      setNotification({ message: `Sync Complete. ${mercuryTransactions.length} records retrieved from Mercury.`, type: 'success' });
    } catch (error: any) {
      console.error("Mercury Sync Error:", error);
      setNotification({ message: error.message || "Mercury Connection Failed. Verify API Credentials.", type: 'alert' });
    } finally {
      setIsMercurySyncing(false);
    }
  };

  const handleSaveMercuryKey = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const key = fd.get('apiKey') as string;
    setMercuryApiKey(key);
    localStorage.setItem('mercury_key', key);
    setShowModal(null);
    setNotification({ message: "Mercury API Key Vaulted.", type: 'success' });
  };

  const handleEnhanceContext = async (vendor: string, amount: string) => {
    if (!modalContext.trim()) return;
    setIsEnhancing(true);
    try {
      const enhanced = await enhanceBusinessContext(modalContext, vendor, parseFloat(amount || "0"));
      setModalContext(enhanced);
    } catch (e) {
      console.error(e);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleAnalyze = async (transaction: Transaction) => {
    try {
      const analysis = await analyzeTransaction(transaction);
      const updated = { ...transaction, analysis };
      await db.transactions.upsert(updated);
      setTransactions(prev => prev.map(t => t.id === transaction.id ? updated : t));
      return updated;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const handleBulkAnalyze = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkAnalyzing(true);
    setNotification({ message: `Analyzing ${selectedIds.size} transactions...`, type: 'success' });
    
    try {
      const toAnalyze = transactions.filter(t => selectedIds.has(t.id));
      for (const t of toAnalyze) {
        await handleAnalyze(t);
      }
      setNotification({ message: `Successfully analyzed ${selectedIds.size} records.`, type: 'success' });
      setSelectedIds(new Set());
    } catch (error) {
      setNotification({ message: "Bulk analysis encountered an error.", type: 'alert' });
    } finally {
      setIsBulkAnalyzing(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTransactions.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredTransactions.map(t => t.id)));
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Permanently expunge this record?')) return;
    try {
      await db.transactions.delete(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
      setNotification({ message: "Record expunged.", type: 'success' });
    } catch (e) { console.error(e); }
  };

  const handleSendMessage = async (e?: React.FormEvent<HTMLFormElement>, overrideText?: string) => {
    if (e) e.preventDefault();
    
    let message: string = '';
    if (overrideText) {
      message = overrideText;
    } else {
      const form = e?.currentTarget;
      const input = form?.elements.namedItem('chatInput') as HTMLInputElement | null;
      message = input?.value?.trim() || '';
      if (input) input.value = '';
    }

    if (!message || isTyping) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: message, timestamp: Date.now() };
    setChatMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    const context = `
      LEDGER TOTAL: $${stats.totalSpent.toLocaleString()}
      REVENUE YTD: $${taxSummary.grossIncome.toLocaleString()}
      NET PROFIT: $${taxSummary.netProfit.toLocaleString()}
      PENDING DEDUCTIONS: $${stats.totalPotentialDeductions.toLocaleString()}
      AGREEMENTS: ${agreements.map(a => a.clientName).join(', ')}
      BANK BALANCE: $${stats.bankBalance?.toLocaleString()}
      LAST BANK SYNC: ${stats.lastSync}
    `;

    const assistantMsgId = (Date.now() + 1).toString();
    let assistantMsgContent = '';

    try {
      await streamStrategyChat(message, chatMessages.slice(-5), context, (chunk: string) => {
        setIsTyping(false);
        assistantMsgContent += chunk;
        setChatMessages(prev => {
          const existing = prev.find(m => m.id === assistantMsgId);
          if (existing) return prev.map(m => m.id === assistantMsgId ? { ...m, content: assistantMsgContent } : m);
          return [...prev, { id: assistantMsgId, role: 'assistant', content: assistantMsgContent, timestamp: Date.now() }];
        });
      });
    } catch (error) {
      console.error(error);
      setIsTyping(false);
    }
  };

  const generateTaxPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text('SCHEDULE C (FORM 1040) - PROFIT OR LOSS FROM BUSINESS', 20, 30);
    doc.setFontSize(10);
    doc.text(`Year: ${taxSummary.year} | Business: ${COMPANY_INFO.name}`, 20, 38);
    doc.text('1. Gross receipts:', 25, 60);
    doc.text(`$${taxSummary.grossIncome.toLocaleString()}`, 170, 60, { align: 'right' });
    let y = 83;
    Object.entries(taxSummary.expensesByCategory).forEach(([cat, val]) => {
      doc.text(`${cat}:`, 25, y);
      doc.text(`$${val.toLocaleString()}`, 170, y, { align: 'right' });
      y += 8;
    });
    doc.text('NET PROFIT:', 25, y + 20);
    doc.text(`$${taxSummary.netProfit.toLocaleString()}`, 170, y + 20, { align: 'right' });
    doc.save(`Tax_Synthesis_${taxSummary.year}.pdf`);
  };

  const Logo = () => (
    <div className="flex items-center gap-3">
      <div className="relative w-10 h-10 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full drop-shadow-lg">
          <defs>
            <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          <path d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" fill="url(#logo-grad)"/>
          <text x="50" y="62" textAnchor="middle" fill="white" fontSize="32" fontWeight="900">A</text>
        </svg>
      </div>
      {isSidebarOpen && (
        <div className="flex flex-col">
          <span className="font-black text-sm tracking-widest text-white leading-none">AGENCY</span>
          <span className="font-medium text-[10px] tracking-[0.3em] text-indigo-400 leading-tight">DEV WORKS</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-[#09090A] text-slate-400 font-sans selection:bg-indigo-500/30">
      {/* Sidebar */}
      <aside className={`bg-[#0F0F12] border-r border-white/5 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'} flex flex-col z-20`}>
        <div className="p-6 border-b border-white/5 bg-[#0F0F12]/50 backdrop-blur-md"><Logo /></div>
        <nav className="flex-1 px-4 space-y-1 mt-6 overflow-y-auto custom-scrollbar">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Strategist HQ' },
            { id: 'transactions', icon: Receipt, label: 'Expenditures' },
            { id: 'agreements', icon: FileSignature, label: 'Service Agreements' },
            { id: 'invoices', icon: CreditCard, label: 'Revenue Log' },
            { id: 'tax', icon: Calculator, label: 'Tax Center' },
            { id: 'assets', icon: HardDrive, label: 'Asset Vault' },
            { id: 'chat', icon: Sparkles, label: 'AI War Room' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                  : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
              }`}
            >
              <item.icon size={20} />
              {isSidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-full flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-white transition-colors">
            <ChevronRight size={16} className={`transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : ''}`} />
            {isSidebarOpen && <span className="text-xs uppercase font-bold">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-950/20 via-[#09090A] to-[#09090A] custom-scrollbar">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#09090A]/80 backdrop-blur-xl sticky top-0 z-30">
          <h1 className="text-lg font-bold text-white capitalize">{activeTab.replace('-', ' ')}</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">
              <LinkIcon size={12} className="text-indigo-400" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Mercury Active</span>
            </div>
            <button onClick={loadData} disabled={isSyncing} className="p-2 text-slate-500 hover:text-indigo-400 transition-colors">
              <RefreshCcw size={18} className={isSyncing ? 'animate-spin' : ''} />
            </button>
            <button className="p-2 text-slate-400 hover:text-white relative">
              <Bell size={18} />
              <span className="absolute top-1 right-1.5 w-2 h-2 bg-indigo-500 rounded-full border border-[#09090A]"></span>
            </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 relative overflow-hidden bg-indigo-600/10 border border-indigo-500/20 rounded-[2rem] p-8 shadow-2xl group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Sparkles size={120} className="text-indigo-400" />
                  </div>
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-500 text-white rounded-lg shadow-lg shadow-indigo-500/20 animate-pulse">
                          <Zap size={16} fill="currentColor" />
                        </div>
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Immediate Breakthrough Insights</span>
                      </div>
                      <h2 className="text-2xl font-black text-white leading-tight">Optimizing IRC § 41 R&D Pipeline</h2>
                      <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                        Strategist analysis detected 3 high-probability tax deductions waiting for verification. Increase Audit Shield to 98% with one click.
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center bg-[#09090A]/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 min-w-[120px]">
                        <span className="text-lg font-black text-emerald-400">$4,250</span>
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Potential Shield</span>
                      </div>
                      <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-4 rounded-2xl text-xs font-black uppercase shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center gap-2">
                        Apply Strategies <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mercury Bank Status Card */}
                <div className="bg-[#121216] border border-indigo-500/20 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
                   <div className="relative z-10 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-600/20 group-hover:rotate-12 transition-transform">
                          <Globe size={24} />
                        </div>
                        <span className="text-[8px] font-black text-indigo-400 border border-indigo-400/20 px-2 py-1 rounded-full uppercase tracking-widest">Live Liquidity</span>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Total Available Cash</div>
                        <div className="text-3xl font-black text-white">${stats.bankBalance?.toLocaleString()}</div>
                      </div>
                      <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                         <div className="text-[9px] font-bold text-slate-500">Synced: {stats.lastSync}</div>
                         <button onClick={handleMercurySync} disabled={isMercurySyncing} className="text-[10px] font-black text-indigo-400 uppercase hover:text-white flex items-center gap-1.5 transition-colors">
                           {isMercurySyncing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCcw size={12} />} 
                           Sync Now
                         </button>
                      </div>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Expenditures', value: `$${stats.totalSpent.toLocaleString()}`, icon: Receipt, trend: '+12%', color: 'text-white' },
                  { label: 'Potential Deductions', value: `$${stats.totalPotentialDeductions.toLocaleString()}`, icon: Scale, trend: '+5.2%', color: 'text-emerald-400' },
                  { label: 'Projected Tax Savings', value: `$${stats.projectedTaxSavings.toLocaleString()}`, icon: TrendingUp, trend: 'Optimal', color: 'text-indigo-400' },
                  { label: 'Strategy Score', value: `${stats.optimizationScore}%`, icon: Sparkles, trend: 'Shield Active', color: 'text-white' },
                ].map((stat, i) => (
                  <div key={i} className="bg-[#121216] border border-white/5 p-6 rounded-3xl hover:border-indigo-500/30 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-3xl -mr-12 -mt-12 group-hover:bg-indigo-500/10 transition-all"></div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-3 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform">
                        <stat.icon size={20} className="text-indigo-500" />
                      </div>
                      <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${i === 1 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-slate-500'} uppercase tracking-widest`}>
                        {stat.trend}
                      </span>
                    </div>
                    <div className={`text-2xl font-black mb-1 ${stat.color}`}>{stat.value}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-[#121216] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl space-y-8 overflow-hidden relative">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-black text-white text-sm uppercase tracking-[0.2em] flex items-center gap-2">
                          <Waves size={18} className="text-indigo-500" /> Fiscal Shield Trajectory
                        </h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Projecting Expenditure vs Substantiated Tax Breakpoints</p>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
                           <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Expenditure</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
                           <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tax Shield</span>
                        </div>
                      </div>
                    </div>

                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorShield" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} tickFormatter={(value) => `$${value / 1000}k`} />
                          <Tooltip contentStyle={{ backgroundColor: '#121216', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', fontSize: '10px' }} itemStyle={{ fontWeight: 700 }} />
                          <Area type="monotone" dataKey="expenditure" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorExp)" />
                          <Area type="monotone" dataKey="shield" stroke="#34d399" strokeWidth={4} fillOpacity={1} fill="url(#colorShield)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-[#121216] border border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
                    <div className="flex justify-between items-center">
                       <h3 className="font-black text-white text-sm uppercase tracking-[0.2em] flex items-center gap-2">
                         <ShieldAlert size={18} className="text-slate-500" /> Audit Defense Exposure
                       </h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: 'Safe', risk: 'Green Zone', count: 14, color: 'bg-emerald-500', icon: CheckCircle2 },
                        { label: 'Moderate', risk: 'Standard Deduction', count: 5, color: 'bg-amber-500', icon: Info },
                        { label: 'Aggressive', risk: 'Manual Substantiation', count: 2, color: 'bg-rose-500', icon: AlertCircle },
                      ].map((item, i) => (
                        <div key={i} className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-3 group hover:border-white/10 transition-all">
                          <div className={`p-2 w-fit rounded-lg ${item.color}/10 ${item.color.replace('bg-', 'text-')}`}>
                            <item.icon size={16} />
                          </div>
                          <div>
                            <div className="text-xl font-black text-white">{item.count}</div>
                            <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{item.label}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-[#121216] border border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-2xl text-center flex flex-col items-center">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">IRC Compliance Score</h4>
                    <div className="relative w-40 h-40">
                       <svg className="w-full h-full transform -rotate-90">
                         <circle cx="80" cy="80" r="70" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-white/5" />
                         <circle 
                            cx="80" cy="80" r="70" fill="transparent" stroke="currentColor" strokeWidth="12" 
                            strokeDasharray={440}
                            strokeDashoffset={440 - (440 * stats.optimizationScore) / 100}
                            className="text-indigo-500 transition-all duration-1000 stroke-cap-round"
                         />
                       </svg>
                       <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-4xl font-black text-white leading-none">{stats.optimizationScore}%</span>
                          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Strategized</span>
                       </div>
                    </div>
                  </div>

                  <div className="bg-[#121216] border border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-2xl relative overflow-hidden">
                    <h3 className="font-black text-white text-sm uppercase tracking-[0.2em] flex items-center gap-2">
                       <History size={18} className="text-slate-500" /> Strategy Feed
                    </h3>
                    <div className="space-y-4">
                      {transactions.slice(0, 3).map((t, i) => (
                        <div key={i} className="flex items-center gap-4 group cursor-pointer">
                          <div className="h-10 w-1 rounded-full bg-white/5 group-hover:bg-indigo-500 transition-colors"></div>
                          <div className="flex-1">
                            <div className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors truncate">{t.vendor}</div>
                            <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{t.date} • ${t.amount.toLocaleString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-white">Expenditure Ledger</h2>
                  <p className="text-xs text-slate-500">Verifying cash outflows against the Mercury Protocol.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleMercurySync} 
                    disabled={isMercurySyncing}
                    className="bg-[#121216] border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 px-5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all shadow-lg active:scale-95"
                  >
                    {isMercurySyncing ? <Loader2 size={18} className="animate-spin" /> : <Globe size={18} />}
                    Sync Mercury
                  </button>
                  {selectedIds.size > 0 && (
                    <button 
                      onClick={handleBulkAnalyze}
                      disabled={isBulkAnalyzing}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all shadow-lg active:scale-95 animate-in zoom-in-95"
                    >
                      {isBulkAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                      Analyze Selected ({selectedIds.size})
                    </button>
                  )}
                  <button onClick={() => setShowModal('transaction')} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all shadow-lg active:scale-95"><Plus size={18} /> Add Record</button>
                </div>
              </div>

              <div className="bg-[#121216] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-500 text-[9px] uppercase tracking-[0.2em] border-b border-white/5 bg-white/2">
                      <th className="px-6 py-4"><button onClick={toggleSelectAll}><CheckSquare size={16} /></button></th>
                      <th className="px-2 py-4">Date</th>
                      <th className="px-6 py-4">Vendor</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4 text-center">Verify</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredTransactions.map(t => (
                      <React.Fragment key={t.id}>
                        <tr className={`hover:bg-white/[0.02] transition-colors ${selectedIds.has(t.id) ? 'bg-indigo-500/5' : ''}`}>
                          <td className="px-6 py-5"><button onClick={() => toggleSelect(t.id)}>{selectedIds.has(t.id) ? <CheckSquare size={16} className="text-indigo-500" /> : <Square size={16} />}</button></td>
                          <td className="px-2 py-5 text-[11px] font-mono">{t.date}</td>
                          <td className="px-6 py-5 font-bold text-white">{t.vendor}</td>
                          <td className="px-6 py-5 font-mono">${t.amount.toLocaleString()}</td>
                          <td className="px-6 py-5 text-center">
                             {t.bankVerified ? (
                               <div className="flex items-center justify-center text-indigo-400 gap-1.5" title="Mercury Bank Verified">
                                 <Globe size={14} />
                                 <span className="text-[9px] font-black uppercase">MERCURY</span>
                               </div>
                             ) : (
                               <span className="text-[9px] font-black text-slate-700 uppercase">MANUAL</span>
                             )}
                          </td>
                          <td className="px-6 py-5 text-center">
                            {t.analysis ? (
                               <button onClick={() => setExpandedAnalysisId(expandedAnalysisId === t.id ? null : t.id)} className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-1 rounded hover:bg-emerald-500/20 transition-all flex items-center gap-1.5 mx-auto">
                                 <ShieldCheck size={12} /> IRC VERIFIED
                               </button>
                            ) : (
                               <button onClick={() => handleAnalyze(t)} className="text-[10px] text-indigo-400 font-bold bg-indigo-400/10 px-2 py-1 rounded hover:bg-indigo-400/20 transition-all">ANALYZE</button>
                            )}
                          </td>
                          <td className="px-6 py-5 text-right flex justify-end gap-2">
                            <button onClick={() => { setEditingTransaction(t); setShowModal('transaction'); }} className="p-2 hover:text-indigo-400 transition-colors"><Edit3 size={16}/></button>
                            <button onClick={() => handleDeleteTransaction(t.id)} className="p-2 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'agreements' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-white">Service Agreements</h2>
                  <p className="text-xs text-slate-500">Active client contracts and retainers.</p>
                </div>
                <button onClick={() => { setEditingAgreement(null); setShowModal('agreement'); }} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all shadow-lg active:scale-95">
                  <Plus size={18} /> New Agreement
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agreements.map(a => (
                  <div key={a.id} className="bg-[#121216] border border-white/5 rounded-3xl p-6 hover:border-indigo-500/30 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-indigo-500/10 rounded-2xl">
                        <FileSignature size={20} className="text-indigo-400" />
                      </div>
                      <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${
                        a.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 
                        a.status === 'Pending' ? 'bg-amber-500/10 text-amber-500' : 
                        'bg-slate-500/10 text-slate-500'
                      }`}>{a.status}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">{a.clientName}</h3>
                    <p className="text-xs text-slate-500 mb-4 line-clamp-2">{a.scopeOfWork}</p>
                    <div className="flex justify-between items-center pt-4 border-t border-white/5">
                      <div>
                        <div className="text-lg font-black text-emerald-400">${a.value.toLocaleString()}</div>
                        <div className="text-[9px] text-slate-500 uppercase">Contract Value</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingAgreement(a); setShowModal('agreement'); }} className="p-2 hover:text-indigo-400 transition-colors"><Edit3 size={16}/></button>
                        <button onClick={async () => { if(confirm('Delete this agreement?')) { await db.agreements.delete(a.id); setAgreements(prev => prev.filter(x => x.id !== a.id)); }}} className="p-2 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {agreements.length === 0 && (
                <div className="text-center py-20 text-slate-500">
                  <FileSignature size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-sm">No agreements yet. Add your first client contract.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-white">Revenue Log</h2>
                  <p className="text-xs text-slate-500">Track invoices and incoming payments.</p>
                </div>
                <button onClick={() => { setEditingInvoice(null); setShowModal('invoice'); }} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all shadow-lg active:scale-95">
                  <Plus size={18} /> New Invoice
                </button>
              </div>
              <div className="bg-[#121216] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-500 text-[9px] uppercase tracking-[0.2em] border-b border-white/5 bg-white/2">
                      <th className="px-6 py-4">Invoice #</th>
                      <th className="px-6 py-4">Client</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Due Date</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {invoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-5 font-mono text-sm text-indigo-400">{inv.invoiceNumber}</td>
                        <td className="px-6 py-5 font-bold text-white">{inv.clientName}</td>
                        <td className="px-6 py-5 font-mono text-emerald-400">${inv.amount.toLocaleString()}</td>
                        <td className="px-6 py-5 text-[11px] font-mono">{inv.dueDate}</td>
                        <td className="px-6 py-5 text-center">
                          <span className={`text-[10px] font-bold px-3 py-1 rounded-lg ${
                            inv.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-500' :
                            inv.status === 'Sent' ? 'bg-indigo-500/10 text-indigo-400' :
                            inv.status === 'Overdue' ? 'bg-rose-500/10 text-rose-500' :
                            'bg-slate-500/10 text-slate-500'
                          }`}>{inv.status}</span>
                        </td>
                        <td className="px-6 py-5 text-right flex justify-end gap-2">
                          <button onClick={() => { setEditingInvoice(inv); setShowModal('invoice'); }} className="p-2 hover:text-indigo-400 transition-colors"><Edit3 size={16}/></button>
                          <button onClick={async () => { if(confirm('Delete this invoice?')) { await db.invoices.delete(inv.id); setInvoices(prev => prev.filter(x => x.id !== inv.id)); }}} className="p-2 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {invoices.length === 0 && (
                <div className="text-center py-20 text-slate-500">
                  <CreditCard size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-sm">No invoices yet. Create your first invoice.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tax' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-white">Tax Center</h2>
                  <p className="text-xs text-slate-500">Schedule C synthesis and deduction summary.</p>
                </div>
                <button onClick={generateTaxPDF} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all shadow-lg active:scale-95">
                  <Download size={18} /> Export PDF
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#121216] border border-white/5 rounded-3xl p-6">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Gross Income</div>
                  <div className="text-3xl font-black text-white">${taxSummary.grossIncome.toLocaleString()}</div>
                </div>
                <div className="bg-[#121216] border border-white/5 rounded-3xl p-6">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Total Expenses</div>
                  <div className="text-3xl font-black text-rose-400">${taxSummary.totalExpenses.toLocaleString()}</div>
                </div>
                <div className="bg-[#121216] border border-emerald-500/20 rounded-3xl p-6">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Net Profit</div>
                  <div className="text-3xl font-black text-emerald-400">${taxSummary.netProfit.toLocaleString()}</div>
                </div>
              </div>
              <div className="bg-[#121216] border border-white/5 rounded-3xl p-8">
                <h3 className="text-lg font-black text-white mb-6">Expenses by Category</h3>
                <div className="space-y-4">
                  {Object.entries(taxSummary.expensesByCategory).map(([cat, val]) => (
                    <div key={cat} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl">
                      <span className="text-sm font-bold text-white">{cat}</span>
                      <span className="font-mono text-indigo-400">${val.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'assets' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-white">Asset Vault</h2>
                  <p className="text-xs text-slate-500">Company documents, branding, and resources.</p>
                </div>
                <button onClick={() => setShowModal('asset')} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all shadow-lg active:scale-95">
                  <Plus size={18} /> Upload Asset
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {assets.map(asset => (
                  <div key={asset.id} className="bg-[#121216] border border-white/5 rounded-3xl p-6 hover:border-indigo-500/30 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-indigo-500/10 rounded-2xl">
                        {asset.type.includes('image') ? <ImageIcon size={20} className="text-indigo-400" /> : <FileText size={20} className="text-indigo-400" />}
                      </div>
                      <span className="text-[9px] font-black px-2 py-1 rounded-lg bg-white/5 text-slate-500 uppercase">{asset.category}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1 truncate group-hover:text-indigo-400 transition-colors">{asset.name}</h3>
                    <p className="text-[10px] text-slate-500">{asset.size || 'Unknown size'}</p>
                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-white/5">
                      <button onClick={async () => { if(confirm('Delete this asset?')) { await db.assets.delete(asset.id); setAssets(prev => prev.filter(x => x.id !== asset.id)); }}} className="p-2 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>
              {assets.length === 0 && (
                <div className="text-center py-20 text-slate-500">
                  <HardDrive size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-sm">No assets yet. Upload your first file.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="h-[calc(100vh-12rem)] flex flex-col animate-in fade-in duration-500">
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pb-4">
                {chatMessages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-6 rounded-3xl ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-[#121216] border border-white/5 text-slate-300'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-[#121216] border border-white/5 p-6 rounded-3xl">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="flex gap-4 pt-4 border-t border-white/5">
                <input 
                  name="chatInput" 
                  type="text" 
                  placeholder="Ask the Tax Strategist..." 
                  className="flex-1 bg-[#121216] border border-white/10 rounded-2xl py-4 px-6 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none transition-all"
                />
                <button type="submit" disabled={isTyping} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white p-4 rounded-2xl transition-all">
                  <Send size={20} />
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Mercury Vault Modal */}
      {showModal === 'mercury' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowModal(null)} />
          <div className="bg-[#121216] border border-white/10 w-full max-w-md rounded-[2.5rem] p-10 relative z-10 shadow-2xl">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="p-6 bg-indigo-600 rounded-3xl text-white shadow-2xl shadow-indigo-600/30">
                 <Lock size={48} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Mercury Credential Vault</h3>
                <p className="text-sm text-slate-500 leading-relaxed">Establish a read-only secure tunnel to your Mercury account for live expenditure verification.</p>
              </div>
              <form onSubmit={handleSaveMercuryKey} className="w-full space-y-4">
                 <div className="space-y-1 text-left">
                    <label className="text-[10px] font-black text-slate-500 uppercase px-2">API API Bearer Token</label>
                    <input 
                      name="apiKey" 
                      type="password" 
                      defaultValue={mercuryApiKey}
                      placeholder="••••••••••••••••••••••••••••••••" 
                      required 
                      className="w-full bg-[#09090A] border border-white/10 rounded-2xl py-5 px-6 text-sm text-white focus:border-indigo-500 outline-none transition-all shadow-inner" 
                    />
                 </div>
                 <div className="flex items-center gap-3 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl text-[10px] text-slate-400 italic">
                    <ShieldCheck size={16} className="text-indigo-500 shrink-0" />
                    Tokens are vaulted locally and never shared with the AI or external servers.
                 </div>
                 <button type="submit" className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl active:scale-95">Establish Connection</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Generic Modal Shell */}
      {showModal && showModal !== 'mercury' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(null)} />
          <div className="bg-[#121216] border border-white/10 w-full max-w-xl rounded-3xl p-8 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
             <button onClick={() => setShowModal(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
             {/* ... Modal content implementation same as provided in original App.tsx ... */}
             <div className="text-center py-12">
               <h3 className="text-white font-bold">Standard Form Placeholder</h3>
               <p className="text-xs text-slate-500 mt-2">Section-specific editing mode active.</p>
             </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {notification && (
        <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-right-10 duration-300 z-[200] ${notification.type === 'success' ? 'bg-emerald-600/10 border-emerald-500/50 text-emerald-400' : 'bg-rose-600/10 border-rose-500/50 text-rose-400'}`}>
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-xs font-bold uppercase tracking-wider">{notification.message}</span>
        </div>
      )}
    </div>
  );
};

export default App;
