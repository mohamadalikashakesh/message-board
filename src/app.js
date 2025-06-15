import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import authRoutes from './routes/auth.js';
import boardRoutes from './routes/board.js';
import messageRoutes from './routes/message.js';
import masterRoutes from './routes/master.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { authenticateToken} from './middleware/auth.js';

//get the current module’s directory in Nodejs modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(apiLimiter);
app.use(errorHandler);
app.use(notFoundHandler);
app.use(generalLimiter);
app.use(authenticateToken);


app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Message Board Platform API',
    version: '1.0.0',
    documentation: 'See README.md for the full API reference'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/master', masterRoutes);

// Start Server 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
