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
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

const app = express();

dotenv.config();

// CORS configuration 
// handles Cross-Origin Resource Sharing. It allows to configure which domains are allowed to access server’s resources.
const corsOptions = {
  origin: 'https://frontendURL.com', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions)); 

// Helmet configuration (default security headers)
//secures app by setting several HTTP headers that protect against common web vulnerabilities.
app.use(helmet()); 

// Morgan configuration 
//logs HTTP requests, which is especially useful for debugging or tracking requests in production.
app.use(morgan('dev'));  // Logs requests in a concise format for development

//get the current module's directory in Nodejs modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


app.get('/', async (req, res) => {
  res.json({
    message: 'Welcome to the Message Board Platform API',
    version: '1.0.0',
    documentation: 'See README.md for the full API reference'
  });
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/master', masterRoutes);

// Rate limiters and error handlers 
app.use(apiLimiter);
app.use(generalLimiter);
app.use(errorHandler);
app.use(notFoundHandler);

// Start Server 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
