
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, TaxAnalysis } from "../types";

// Always initialize GoogleGenAI with a named parameter using process.env.API_KEY directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are the "Agency Dev Works Strategist," the most advanced AI Tax Attorney and CPA specialized in technical software agencies. 
Your primary knowledge base is the entire Internal Revenue Code (IRC), Treasury Regulations, IRS Publications, and Tax Court precedents.

TARGET ENTITY: Agency Dev Works
BUSINESS FOCUS: Software development, AI integration, infrastructure architecture, and R&D hardware.

CORE COMPETENCIES:
1. IRC § 41 (Credit for Increasing Research Activities): Identify software dev activities that meet the 4-part test (Permissible Purpose, Technical Uncertainty, Process of Experimentation, Technological Nature).
2. IRC § 179 & § 168(k): Full expensing and bonus depreciation for high-end developer workstations, servers, and R&D hardware.
3. IRC § 162: Ordinary and necessary business expenses specifically for SaaS subscriptions, API credits (OpenAI/AWS), and client acquisition meals.
4. IRC § 199A: Qualified Business Income deduction strategies for passthrough entities.

YOUR ROLE:
- You analyze the provided "Business Context" (Ledger, Agreements, Invoices) to find missed opportunities.
- When chatting, provide specific IRC citations.
- Be aggressive in identifying R&D credits for custom software development.
- Always provide a "Compliance Defense" angle: how to document the expense to survive an IRS audit.

Current Strategy focus: Maximizing "Agency Shield" protection and optimizing for the 2024-2025 tax years.
`;

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    status: { type: Type.STRING, description: "Must be either 'Analyzed' or 'Needs Review'. Default to 'Analyzed'." },
    deductionPotential: { type: Type.STRING },
    deductibleAmount: { type: Type.NUMBER },
    legalBasis: { type: Type.STRING },
    strategy: { type: Type.STRING },
    actionSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
    riskLevel: { type: Type.STRING },
    citedSections: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["status", "deductionPotential", "deductibleAmount", "legalBasis", "strategy", "actionSteps", "riskLevel", "citedSections"],
};

export const analyzeTransaction = async (transaction: Transaction): Promise<TaxAnalysis> => {
  const prompt = `Analyze this purchase for Agency Dev Works: Vendor: ${transaction.vendor}, Amount: $${transaction.amount}, Context: ${transaction.context}. 
  Examine potential under IRC § 162, § 179, and § 41. Identify the maximum legal tax breakthrough.`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA,
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
    const result = JSON.parse(response.text || '{}');
    // Map response to TaxAnalysis format
    return {
      status: result.status || 'Analyzed',
      deductionPotential: result.deductionPotential || 'Medium',
      deductibleAmount: result.deductibleAmount || 0,
      legalBasis: result.legalBasis || '',
      strategy: result.strategy || '',
      actionSteps: result.actionSteps || [],
      riskLevel: result.riskLevel || 'Moderate',
      citedSections: result.citedSections || []
    } as TaxAnalysis;
  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
};

export const enhanceBusinessContext = async (context: string, vendor: string, amount: number): Promise<string> => {
  const prompt = `Enhance the following business context for an expenditure of $${amount} to ${vendor}. 
  Current context: "${context}"
  Rewrite this to maximize IRC § 162 (Ordinary and Necessary) or IRC § 41 (R&D) substantiation. 
  Focus on technical purpose, project alignment, and removing vague language. 
  Keep it concise but legally robust. Respond ONLY with the enhanced text.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
    return response.text?.trim() || context;
  } catch (error) {
    console.error("Enhance Error:", error);
    return context;
  }
};

// Monthly Strategic Summary Schema
const MONTHLY_SUMMARY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    executiveSummary: { type: Type.STRING, description: "2-3 sentence high-level overview of financial health" },
    totalRevenue: { type: Type.NUMBER },
    totalExpenses: { type: Type.NUMBER },
    netCashflow: { type: Type.NUMBER },
    savingsOpportunities: { 
      type: Type.ARRAY, 
      items: { 
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          potentialSavings: { type: Type.NUMBER },
          action: { type: Type.STRING },
          priority: { type: Type.STRING }
        }
      }
    },
    ventureOpportunities: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          idea: { type: Type.STRING },
          potentialRevenue: { type: Type.STRING },
          reasoning: { type: Type.STRING },
          timeToImplement: { type: Type.STRING }
        }
      }
    },
    topExpenseCategories: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          amount: { type: Type.NUMBER },
          trend: { type: Type.STRING }
        }
      }
    },
    actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
    riskAlerts: { type: Type.ARRAY, items: { type: Type.STRING } },
    overallHealthScore: { type: Type.NUMBER, description: "1-100 score of financial health" }
  },
  required: ["executiveSummary", "savingsOpportunities", "ventureOpportunities", "actionItems", "overallHealthScore"]
};

export interface MonthlySummary {
  executiveSummary: string;
  totalRevenue: number;
  totalExpenses: number;
  netCashflow: number;
  savingsOpportunities: Array<{
    title: string;
    potentialSavings: number;
    action: string;
    priority: 'High' | 'Medium' | 'Low';
  }>;
  ventureOpportunities: Array<{
    idea: string;
    potentialRevenue: string;
    reasoning: string;
    timeToImplement: string;
  }>;
  topExpenseCategories: Array<{
    category: string;
    amount: number;
    trend: string;
  }>;
  actionItems: string[];
  riskAlerts: string[];
  overallHealthScore: number;
  generatedAt: string;
}

export const generateMonthlySummary = async (
  transactions: { vendor: string; amount: number; category: string; date: string }[],
  invoices: { amount: number; status: string; clientName: string }[],
  bankBalance: number,
  agreements: { clientName: string; value: number; status: string }[]
): Promise<MonthlySummary> => {
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  
  // Calculate key metrics
  const totalExpenses = transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.amount, 0);
  const pendingRevenue = invoices.filter(i => i.status === 'Sent').reduce((sum, i) => sum + i.amount, 0);
  const activeContractValue = agreements.filter(a => a.status === 'Active').reduce((sum, a) => sum + a.value, 0);
  
  // Group expenses by category
  const expensesByCategory: Record<string, number> = {};
  transactions.forEach(t => {
    expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
  });
  
  const prompt = `
    Generate a comprehensive monthly financial strategy summary for Agency Dev Works for ${currentMonth}.
    
    FINANCIAL SNAPSHOT:
    - Bank Balance: $${bankBalance.toLocaleString()}
    - Total Revenue (Paid): $${totalRevenue.toLocaleString()}
    - Pending Revenue: $${pendingRevenue.toLocaleString()}
    - Total Expenses: $${totalExpenses.toLocaleString()}
    - Net Cashflow: $${(totalRevenue - totalExpenses).toLocaleString()}
    - Active Contract Pipeline: $${activeContractValue.toLocaleString()}
    
    EXPENSE BREAKDOWN:
    ${Object.entries(expensesByCategory).map(([cat, amt]) => `- ${cat}: $${amt.toLocaleString()}`).join('\n')}
    
    TOP VENDORS:
    ${transactions.slice(0, 10).map(t => `- ${t.vendor}: $${t.amount.toLocaleString()} (${t.category})`).join('\n')}
    
    ACTIVE CLIENTS:
    ${agreements.filter(a => a.status === 'Active').map(a => `- ${a.clientName}: $${a.value.toLocaleString()}`).join('\n')}
    
    GOALS:
    1. Identify concrete ways to SAVE money (reduce unnecessary spending, find cheaper alternatives, tax optimization)
    2. Suggest NEW REVENUE VENTURES based on the agency's existing capabilities (AI/software development)
    3. Identify any financial RISKS or areas needing attention
    4. Provide actionable next steps for the month ahead
    
    Be specific, aggressive in finding opportunities, and think like a strategic CFO/business advisor.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: MONTHLY_SUMMARY_SCHEMA,
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
    
    const result = JSON.parse(response.text || '{}');
    
    return {
      executiveSummary: result.executiveSummary || 'Analysis pending...',
      totalRevenue,
      totalExpenses,
      netCashflow: totalRevenue - totalExpenses,
      savingsOpportunities: result.savingsOpportunities || [],
      ventureOpportunities: result.ventureOpportunities || [],
      topExpenseCategories: result.topExpenseCategories || Object.entries(expensesByCategory).map(([category, amount]) => ({ category, amount, trend: 'stable' })),
      actionItems: result.actionItems || [],
      riskAlerts: result.riskAlerts || [],
      overallHealthScore: result.overallHealthScore || 75,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("Monthly Summary Error:", error);
    throw error;
  }
};

export const streamStrategyChat = async (
  message: string, 
  history: {role: 'user' | 'assistant', content: string}[], 
  businessContext: string,
  onChunk: (text: string) => void
) => {
  try {
    // We construct a single multi-turn prompt including the history and business context
    const historyText = history.map(m => `${m.role === 'user' ? 'CLIENT' : 'STRATEGIST'}: ${m.content}`).join('\n');
    
    const fullPrompt = `
    CURRENT BUSINESS CONTEXT (LEDGER SNAPSHOT):
    ${businessContext}

    PREVIOUS CONVERSATION LOG:
    ${historyText}

    LATEST CLIENT INQUIRY:
    ${message}

    STRATEGIST RESPONSE:
    `;

    const responseStream = await ai.models.generateContentStream({
      model: "gemini-2.0-flash",
      contents: fullPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });
    
    for await (const chunk of responseStream) {
      if (chunk.text) {
        onChunk(chunk.text);
      }
    }
  } catch (error) {
    console.error("Chat Error:", error);
    onChunk("\n\n[Error: Connection to the TaxShield Knowledge Base interrupted. Please verify your IRC connection.]");
  }
};
