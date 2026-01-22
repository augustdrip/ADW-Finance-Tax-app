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
    // GET - Fetch all agreements
    if (req.method === 'GET') {
      const agreements = await prisma.agreements.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json(agreements);
    }

    // POST - Create new agreement
    if (req.method === 'POST') {
      const data = req.body;
      const agreement = await prisma.agreements.create({
        data: {
          clientName: data.clientName,
          scopeOfWork: data.scopeOfWork,
          value: parseFloat(data.value) || 0,
          status: data.status || 'active',
          effectiveDate: data.effectiveDate,
          expirationDate: data.expirationDate || null,
          notes: data.notes || null,
          attachments: data.attachments || []
        }
      });
      return res.status(201).json(agreement);
    }

    // PUT - Update agreement
    if (req.method === 'PUT') {
      const { id, ...data } = req.body;
      const agreement = await prisma.agreements.update({
        where: { id },
        data: {
          clientName: data.clientName,
          scopeOfWork: data.scopeOfWork,
          value: parseFloat(data.value) || 0,
          status: data.status,
          effectiveDate: data.effectiveDate,
          expirationDate: data.expirationDate,
          notes: data.notes,
          attachments: data.attachments
        }
      });
      return res.status(200).json(agreement);
    }

    // DELETE - Delete agreement
    if (req.method === 'DELETE') {
      const { id } = req.body;
      await prisma.agreements.delete({
        where: { id }
      });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Agreement API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
