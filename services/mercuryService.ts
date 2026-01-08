
import { Transaction } from "../types";

const MERCURY_API_BASE = "https://api.mercury.com/api/v1";

/**
 * Interface for Mercury's API Transaction format
 */
interface MercuryTransaction {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  postedAt: string;
  counterpartyName: string;
  description: string;
  kind: string;
}

/**
 * Service to interact with Mercury Bank API
 */
export const mercuryService = {
  /**
   * Fetches transactions from Mercury. 
   * Note: In a production environment, this would call a backend proxy to protect the API key.
   */
  async fetchTransactions(apiKey: string): Promise<Transaction[]> {
    if (!apiKey) throw new Error("Mercury API Key is required.");

    try {
      const response = await fetch(`${MERCURY_API_BASE}/transactions?limit=100`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch from Mercury");
      }

      const data = await response.json();
      return this.mapMercuryToInternal(data.transactions);
    } catch (error) {
      console.error("Mercury API Error:", error);
      throw error;
    }
  },

  /**
   * Maps Mercury API response to our internal Transaction type
   */
  mapMercuryToInternal(mercuryData: MercuryTransaction[]): Transaction[] {
    return mercuryData.map(item => ({
      id: item.id,
      date: item.postedAt ? item.postedAt.split('T')[0] : item.createdAt.split('T')[0],
      vendor: item.counterpartyName || "Unknown Vendor",
      amount: Math.abs(item.amount), // Mercury uses negative for outflows
      category: this.guessCategory(item.description, item.counterpartyName),
      context: `Imported from Mercury: ${item.description}`,
      attachments: []
    }));
  },

  /**
   * Helper to guess category based on vendor name/description
   */
  guessCategory(description: string, vendor: string): string {
    const text = (description + " " + vendor).toLowerCase();
    if (text.includes("aws") || text.includes("vercel") || text.includes("openai") || text.includes("github")) return "Software/SaaS";
    if (text.includes("apple") || text.includes("best buy") || text.includes("dell")) return "Hardware";
    if (text.includes("facebook") || text.includes("google ads") || text.includes("linkedin")) return "Advertising";
    if (text.includes("legal") || text.includes("cpa") || text.includes("law")) return "Legal/Professional";
    return "Operations";
  }
};
