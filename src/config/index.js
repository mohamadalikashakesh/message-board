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
// Application configuration
const config = {
  // Server configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // JWT configuration
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',

  // Rate limiting
  rateLimitWindow: 15 * 60 * 1000, // 15 minutes
  rateLimitMax: 100, // 100 requests per window
};

// Handle process termination
process.on('beforeExit', async () => {
  if (prisma) {
    await prisma.$disconnect();
    console.log('Disconnected from database');
  }
});

export { prisma, config }; 