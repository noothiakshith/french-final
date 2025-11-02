import { PrismaClient } from '@prisma/client';

// Create a single, shared instance of the PrismaClient
const prisma = new PrismaClient();

export default prisma;