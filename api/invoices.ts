import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from './lib/prisma';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - Fetch all invoices
    if (req.method === 'GET') {
      const invoices = await prisma.invoices.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json(invoices);
    }

    // POST - Create new invoice
    if (req.method === 'POST') {
      const data = req.body;
      const invoice = await prisma.invoices.create({
        data: {
          invoiceNumber: data.invoiceNumber || `INV-${Date.now()}`,
          clientName: data.clientName,
          amount: parseFloat(data.amount) || 0,
          status: data.status || 'pending',
          dueDate: data.dueDate,
          items: data.items || null,
          notes: data.notes || null
        }
      });
      return res.status(201).json(invoice);
    }

    // PUT - Update invoice
    if (req.method === 'PUT') {
      const { id, ...data } = req.body;
      const invoice = await prisma.invoices.update({
        where: { id },
        data: {
          invoiceNumber: data.invoiceNumber,
          clientName: data.clientName,
          amount: parseFloat(data.amount) || 0,
          status: data.status,
          dueDate: data.dueDate,
          items: data.items,
          notes: data.notes
        }
      });
      return res.status(200).json(invoice);
    }

    // DELETE - Delete invoice
    if (req.method === 'DELETE') {
      const { id } = req.body;
      await prisma.invoices.delete({
        where: { id }
      });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Invoice API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
