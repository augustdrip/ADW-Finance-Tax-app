
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, TaxAnalysis } from "../types";
import { 
  IRC_KNOWLEDGE_BASE, 
  formatIRCForAI, 
  findIRCSections, 
  analyzeTransactionIRC,
  getCurrentYearLimits,
  TAX_LIMITS_COMPARISON
} from "../data/ircKnowledgeBase";

// Always initialize GoogleGenAI with a named parameter using process.env.API_KEY directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Generate a condensed IRC reference for the system prompt
const IRC_QUICK_REFERENCE = IRC_KNOWLEDGE_BASE
  .filter(s => s.businessRelevance === 'high')
  .map(s => `${s.section}: ${s.title} - ${s.summary.substring(0, 100)}...`)
  .join('\n');

const SYSTEM_INSTRUCTION = `
You are the "Agency Dev Works Strategist," the most advanced AI Tax Attorney and CPA specialized in technical software agencies. 
Your primary knowledge base is the entire Internal Revenue Code (IRC), Treasury Regulations, IRS Publications, and Tax Court precedents.

TARGET ENTITY: Agency Dev Works
BUSINESS FOCUS: Software development, AI integration, infrastructure architecture, and R&D hardware.

## INDEXED IRC KNOWLEDGE BASE (Key Sections for Business)
${IRC_QUICK_REFERENCE}

## CORE COMPETENCIES:
1. IRC § 41 (Credit for Increasing Research Activities): Identify software dev activities that meet the 4-part test (Permissible Purpose, Technical Uncertainty, Process of Experimentation, Technological Nature).
2. IRC § 179 & § 168(k): Full expensing and bonus depreciation for high-end developer workstations, servers, and R&D hardware. 2024 §179 limit: $1,220,000.
3. IRC § 162: Ordinary and necessary business expenses specifically for SaaS subscriptions, API credits (OpenAI/AWS), and client acquisition meals.
4. IRC § 199A: Qualified Business Income deduction - 20% of QBI for pass-through entities. SSTB phase-out at $191,950 (single) / $383,900 (MFJ).
5. IRC § 274: Meals 50% deductible, entertainment 0% deductible. Business gifts limited to $25/person/year.
6. IRC § 280A: Home office deduction - simplified method $5/sq ft up to 300 sq ft ($1,500 max).
7. IRC § 280F: Vehicle depreciation limits - 2024 Year 1: $12,200 (or $20,200 with bonus).
8. IRC § 1401: Self-employment tax 15.3% (12.4% SS + 2.9% Medicare). SS wage base 2024: $168,600.
9. IRC § 168(k): Bonus depreciation 60% (2024), 40% (2025), 20% (2026).
10. IRC § 174: R&D expenses must now be amortized over 5 years (domestic) - major change from pre-2022.

## YOUR ROLE:
- You analyze the provided "Business Context" (Ledger, Agreements, Invoices) to find missed opportunities.
- When chatting, ALWAYS provide specific IRC citations with section numbers.
- Be aggressive in identifying R&D credits for custom software development.
- Always provide a "Compliance Defense" angle: how to document the expense to survive an IRS audit.
- Reference the 2024 tax year limits and thresholds.
- For vehicle expenses, know the standard mileage rate is 67 cents/mile for 2024.
- For retirement plans, know Solo 401(k) limits: $23,000 employee + 25% employer = up to $69,000 total.

## KEY 2024 LIMITS TO REMEMBER:
- §179 Expensing: $1,220,000 (phase-out at $3,050,000)
- Standard Mileage: 67 cents/mile
- Business Gifts: $25/person/year
- Meals: 50% deductible
- Solo 401(k): $23,000 + $7,500 catch-up (50+) + 25% employer
- SEP IRA: 25% of compensation, max $69,000
- QBI Deduction: 20% of qualified business income
- Self-Employment Tax: 15.3% on 92.35% of net SE income
- Home Office Simplified: $5/sq ft, max 300 sq ft = $1,500

Current Strategy focus: Maximizing "Agency Shield" protection and optimizing for the 2024-2025 tax years.
`;

// Export function to get relevant IRC sections for a query
export function getRelevantIRCSections(query: string): string {
  const sections = findIRCSections(query);
  if (sections.length === 0) return '';
  return sections.map(s => 
    `**${s.section}: ${s.title}**\n${s.summary}\nKey Points:\n${s.keyPoints.map(p => `• ${p}`).join('\n')}`
  ).join('\n\n');
}

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
  // First, get IRC analysis from our knowledge base
  const ircAnalysis = analyzeTransactionIRC(
    transaction.vendor,
    transaction.category,
    transaction.amount,
    transaction.context
  );
  
  // Get relevant IRC sections text for the AI
  const relevantIRCText = ircAnalysis.relevantSections
    .map(s => `${s.section}: ${s.title} - ${s.summary}`)
    .join('\n');
  
  const currentLimits = getCurrentYearLimits('2025');
  
  const prompt = `Analyze this purchase for Agency Dev Works:
  
TRANSACTION DETAILS:
- Vendor: ${transaction.vendor}
- Amount: $${transaction.amount.toLocaleString()}
- Category: ${transaction.category}
- Context: ${transaction.context || 'No context provided'}

RELEVANT IRC SECTIONS FROM KNOWLEDGE BASE:
${relevantIRCText}

SUGGESTED SCHEDULE C LINE: ${ircAnalysis.scheduleCLine || 'TBD'}

2025 TAX LIMITS:
- §179 Max: $${currentLimits.section179_max.toLocaleString()}
- Standard Mileage: ${currentLimits.standardMileage}/mile
- Meals: 50% deductible
- Bonus Depreciation: ${currentLimits.bonusDepreciation}

INSTRUCTIONS:
1. Identify the maximum legal deduction under the relevant IRC sections
2. Provide specific IRC citations (e.g., "IRC §162(a)(1)")
3. Recommend compliance/documentation steps
4. Assess audit risk level
5. Suggest tax optimization strategies`;
  
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
    
    // Merge AI analysis with our IRC knowledge base analysis
    const citedSections = [
      ...(result.citedSections || []),
      ...ircAnalysis.relevantSections.map(s => s.section)
    ].filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates
    
    return {
      status: result.status || 'Analyzed',
      deductionPotential: result.deductionPotential || 'Medium',
      deductibleAmount: result.deductibleAmount || transaction.amount,
      legalBasis: result.legalBasis || ircAnalysis.deductionStrategy,
      strategy: result.strategy || '',
      actionSteps: [
        ...(result.actionSteps || []),
        ...ircAnalysis.complianceNotes
      ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 6),
      riskLevel: result.riskLevel || 'Low',
      citedSections: citedSections,
      scheduleCLine: ircAnalysis.scheduleCLine,
      ircSections: ircAnalysis.relevantSections.map(s => ({
        section: s.section,
        title: s.title,
        summary: s.summary
      }))
    } as TaxAnalysis;
  } catch (error) {
    console.error("Analysis Error:", error);
    // Fallback to IRC knowledge base analysis only
    return {
      status: 'Analyzed (Offline)',
      deductionPotential: 'Medium',
      deductibleAmount: transaction.amount,
      legalBasis: ircAnalysis.deductionStrategy || `Deductible under ${ircAnalysis.primarySection?.section || '§162'}`,
      strategy: `${ircAnalysis.scheduleCLine}. Document business purpose clearly.`,
      actionSteps: ircAnalysis.complianceNotes,
      riskLevel: 'Low',
      citedSections: ircAnalysis.relevantSections.map(s => s.section),
      scheduleCLine: ircAnalysis.scheduleCLine,
      ircSections: ircAnalysis.relevantSections.map(s => ({
        section: s.section,
        title: s.title,
        summary: s.summary
      }))
    } as TaxAnalysis;
  }
};

// Export IRC analysis for use in UI
export { analyzeTransactionIRC, getCurrentYearLimits, TAX_LIMITS_COMPARISON };

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
  agreements: { clientName: string; value: number; status: string }[],
  accountBalances?: { checking: number; savings: number; credit: number; creditAvailable?: number }
): Promise<MonthlySummary> => {
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const currentYear = new Date().getFullYear();
  
  // Calculate key metrics
  const totalExpenses = transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.amount, 0);
  const pendingRevenue = invoices.filter(i => i.status === 'Sent' || i.status === 'Draft').reduce((sum, i) => sum + i.amount, 0);
  const activeContractValue = agreements.filter(a => a.status === 'Active').reduce((sum, a) => sum + a.value, 0);
  
  // Group expenses by category
  const expensesByCategory: Record<string, number> = {};
  transactions.forEach(t => {
    expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
  });
  
  // Sort categories by amount (highest first)
  const sortedCategories = Object.entries(expensesByCategory)
    .sort(([, a], [, b]) => b - a);
  
  // Calculate monthly averages
  const uniqueMonths = new Set(transactions.map(t => t.date.substring(0, 7))).size || 1;
  const avgMonthlyExpenses = totalExpenses / uniqueMonths;
  
  // Get top vendors by spend
  const vendorTotals: Record<string, number> = {};
  transactions.forEach(t => {
    vendorTotals[t.vendor] = (vendorTotals[t.vendor] || 0) + t.amount;
  });
  const topVendors = Object.entries(vendorTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  // Tax-related calculations
  const potentialQBI = Math.max(0, (totalRevenue - totalExpenses) * 0.20); // 20% QBI deduction
  const estimatedSETax = Math.max(0, (totalRevenue - totalExpenses) * 0.9235 * 0.153); // 15.3% SE tax
  const mealsExpenses = expensesByCategory['Meals'] || expensesByCategory['Business Meals'] || 0;
  const mealsDeductible = mealsExpenses * 0.5; // Only 50% deductible
  
  const prompt = `
You are a strategic CFO and tax advisor for Agency Dev Works, a software/AI development agency.
Generate a comprehensive financial analysis and strategic recommendations for ${currentMonth}.

═══════════════════════════════════════════════════════
COMPLETE FINANCIAL SNAPSHOT
═══════════════════════════════════════════════════════

BANK ACCOUNTS:
${accountBalances ? `
- Checking Account: $${accountBalances.checking.toLocaleString()}
- Savings Account: $${accountBalances.savings.toLocaleString()}
- Credit Card Balance: $${accountBalances.credit.toLocaleString()} (owed)
${accountBalances.creditAvailable ? `- Credit Available: $${accountBalances.creditAvailable.toLocaleString()}` : ''}
- Total Liquid Cash: $${(accountBalances.checking + accountBalances.savings).toLocaleString()}
` : `- Total Bank Balance: $${bankBalance.toLocaleString()}`}

REVENUE METRICS:
- Revenue Collected (Paid Invoices): $${totalRevenue.toLocaleString()}
- Pending/Outstanding Invoices: $${pendingRevenue.toLocaleString()}
- Active Contract Pipeline Value: $${activeContractValue.toLocaleString()}
- Total Potential Revenue: $${(totalRevenue + pendingRevenue + activeContractValue).toLocaleString()}

EXPENSE METRICS:
- Total Expenses: $${totalExpenses.toLocaleString()}
- Average Monthly Burn: $${avgMonthlyExpenses.toLocaleString()}
- Number of Transactions: ${transactions.length}

PROFITABILITY:
- Net Profit: $${(totalRevenue - totalExpenses).toLocaleString()}
- Profit Margin: ${totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue * 100).toFixed(1) : 0}%
- Runway (months at current burn): ${avgMonthlyExpenses > 0 ? Math.floor(bankBalance / avgMonthlyExpenses) : 'N/A'}

═══════════════════════════════════════════════════════
EXPENSE BREAKDOWN BY CATEGORY
═══════════════════════════════════════════════════════
${sortedCategories.map(([cat, amt]) => `${cat}: $${amt.toLocaleString()} (${(amt / totalExpenses * 100).toFixed(1)}%)`).join('\n')}

═══════════════════════════════════════════════════════
TOP 10 VENDORS BY SPEND
═══════════════════════════════════════════════════════
${topVendors.map(([vendor, amt], i) => `${i + 1}. ${vendor}: $${amt.toLocaleString()}`).join('\n')}

═══════════════════════════════════════════════════════
ACTIVE CLIENT CONTRACTS
═══════════════════════════════════════════════════════
${agreements.filter(a => a.status === 'Active').map(a => `- ${a.clientName}: $${a.value.toLocaleString()}`).join('\n') || 'No active contracts'}

═══════════════════════════════════════════════════════
TAX IMPLICATIONS (${currentYear})
═══════════════════════════════════════════════════════
- Estimated Self-Employment Tax (15.3%): $${estimatedSETax.toLocaleString()}
- Potential QBI Deduction (20% of profit): $${potentialQBI.toLocaleString()}
- Meals Expenses (only 50% deductible): $${mealsExpenses.toLocaleString()} → $${mealsDeductible.toLocaleString()} deductible
- §179 Available (2025): $1,250,000 for equipment
- R&D Credit Potential: Software development may qualify under §41

═══════════════════════════════════════════════════════
ANALYSIS REQUIREMENTS
═══════════════════════════════════════════════════════

1. SAVINGS OPPORTUNITIES (find at least 3):
   - Identify specific vendors or categories where spending can be reduced
   - Suggest tax optimization strategies using IRC sections
   - Look for redundant subscriptions or services
   - Calculate potential annual savings for each opportunity

2. REVENUE VENTURE IDEAS (suggest at least 3):
   - Based on the agency's AI/software capabilities
   - Consider productizing services
   - Look at adjacent markets or client upsells
   - Estimate potential revenue for each idea

3. RISK ALERTS:
   - Cash flow concerns
   - Overdue invoices
   - Concentration risk (too dependent on one client?)
   - Upcoming tax obligations

4. ACTION ITEMS (provide at least 4 specific actions):
   - What should be done THIS WEEK
   - What should be done THIS MONTH
   - Each action should be concrete and actionable

Be aggressive in finding opportunities. Think like a CFO trying to maximize profit and minimize tax liability.
`;

  console.log("[AI Summary] Generating strategic summary with data:", {
    totalExpenses,
    totalRevenue,
    bankBalance,
    transactionCount: transactions.length,
    invoiceCount: invoices.length,
    agreementCount: agreements.length
  });

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
