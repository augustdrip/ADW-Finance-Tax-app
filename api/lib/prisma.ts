import { PrismaClient } from '@prisma/client';

// Create a single Prisma client instance
const prisma = new PrismaClient();

export { prisma };
export default prisma;
