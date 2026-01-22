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
    // GET - Fetch all assets
    if (req.method === 'GET') {
      const assets = await prisma.assets.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json(assets);
    }

    // POST - Create new asset
    if (req.method === 'POST') {
      const data = req.body;
      const asset = await prisma.assets.create({
        data: {
          name: data.name,
          type: data.type,
          url: data.url,
          category: data.category,
          dateAdded: data.dateAdded || new Date().toISOString().split('T')[0],
          size: data.size || null
        }
      });
      return res.status(201).json(asset);
    }

    // PUT - Update asset
    if (req.method === 'PUT') {
      const { id, ...data } = req.body;
      const asset = await prisma.assets.update({
        where: { id },
        data: {
          name: data.name,
          type: data.type,
          url: data.url,
          category: data.category,
          dateAdded: data.dateAdded,
          size: data.size
        }
      });
      return res.status(200).json(asset);
    }

    // DELETE - Delete asset
    if (req.method === 'DELETE') {
      const { id } = req.body;
      await prisma.assets.delete({
        where: { id }
      });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Asset API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
