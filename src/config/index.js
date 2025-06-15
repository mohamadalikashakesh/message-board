import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

// Database configuration
let prisma;

try {
  prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  // Test the connection
  prisma.$connect()
    .then(() => {
      console.log('Successfully connected to database');
    })
    .catch((error) => {
      console.error('Failed to connect to database:', error);
      process.exit(1);
    });
} catch (error) {
  console.error('Failed to initialize Prisma client:', error);
  process.exit(1);
}
