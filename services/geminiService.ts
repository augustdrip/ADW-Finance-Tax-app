
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
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 4000 },
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA,
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
    return JSON.parse(response.text || '{}') as TaxAnalysis;
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
      model: "gemini-3-flash-preview",
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
      model: "gemini-3-pro-preview",
      contents: fullPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingBudget: 12000 },
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
