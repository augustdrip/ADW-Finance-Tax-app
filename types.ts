
export interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
  dateAdded: string;
}

export interface CompanyAsset {
  id: string;
  name: string;
  type: string;
  url: string;
  category: 'Branding' | 'Legal' | 'Marketing' | 'Internal';
  dateAdded: string;
  size?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Transaction {
  id: string;
  date: string;
  vendor: string;
  amount: number;
  category: string;
  subCategory?: string;
  context?: string;
  analysis?: TaxAnalysis;
  attachments: Attachment[];
  bankVerified?: boolean; // Added for Mercury Integration
  bankId?: string;       // Original Mercury Transaction ID
  madeBy?: string;       // Who made this expense (e.g., "Ali", "Mustafa", etc.)
}

export interface TaxAnalysis {
  status: 'Analyzed' | 'Needs Review';
  deductionPotential: 'High' | 'Medium' | 'Low' | 'None';
  deductibleAmount: number;
  legalBasis: string;
  strategy: string;
  actionSteps: string[];
  riskLevel: 'Safe' | 'Moderate' | 'Aggressive';
  citedSections: string[];
}

export interface ClientAgreement {
  id: string;
  clientName: string;
  effectiveDate: string;
  expirationDate?: string;
  status: 'Active' | 'Pending' | 'Expired';
  scopeOfWork: string;
  value: number;
  notes?: string;
  attachments: Attachment[];
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  description: string;
  status: 'Paid' | 'Sent' | 'Draft' | 'Overdue';
}

export interface DashboardStats {
  totalSpent: number;
  totalPotentialDeductions: number;
  projectedTaxSavings: number;
  optimizationScore: number;
  bankBalance?: number; // Added for live cash feed
  lastSync?: string;    // Timestamp of last Mercury sync
}

export interface TaxFormSummary {
  year: number;
  grossIncome: number;
  expensesByCategory: Record<string, number>;
  scheduleC: Record<string, number>;
  totalExpenses: number;
  netProfit: number;
  potentialCredits: number;
  estimatedSelfEmploymentTax: number;
  estimatedQBI: number;
}
