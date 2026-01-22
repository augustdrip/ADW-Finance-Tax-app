import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from './lib/prisma';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - Fetch all transactions
    if (req.method === 'GET') {
      const transactions = await prisma.transactions.findMany({
        orderBy: { date: 'desc' }
      });
      return res.status(200).json(transactions);
    }

    // POST - Create new transaction
    if (req.method === 'POST') {
      const data = req.body;
      const transaction = await prisma.transactions.create({
        data: {
          date: data.date,
          vendor: data.vendor,
          amount: parseFloat(data.amount),
          category: data.category,
          context: data.context || null,
          attachments: data.attachments || [],
          bankVerified: data.bankVerified || false,
          bankId: data.bankId || null,
          madeBy: data.madeBy || null,
          receipts: data.receipts || []
        }
      });
      return res.status(201).json(transaction);
    }

    // PUT - Update transaction
    if (req.method === 'PUT') {
      const { id, ...data } = req.body;
      const transaction = await prisma.transactions.update({
        where: { id },
        data: {
          date: data.date,
          vendor: data.vendor,
          amount: parseFloat(data.amount),
          category: data.category,
          context: data.context,
          attachments: data.attachments,
          bankVerified: data.bankVerified,
          bankId: data.bankId,
          madeBy: data.madeBy,
          receipts: data.receipts
        }
      });
      return res.status(200).json(transaction);
    }

    // DELETE - Delete transaction
    if (req.method === 'DELETE') {
      const { id } = req.body;
      await prisma.transactions.delete({
        where: { id }
      });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Transaction API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
