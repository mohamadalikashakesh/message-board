import express from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

const app = express();
app.use(express.json())

//Generate JWT token
const generateToken = (userData) => {
  return jwt.sign(userData, process.env.JWT_SECRET );
};

//Base authentication middleware
// middleware function authenticateToken, which is used to authenticate requests by validating the JWT (JSON Web Token)
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET );
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
//requireRole middleware is used to enforce role-based access control by checking if the authenticated user has the required role to access a route
export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Master user authentication middleware
export const masterAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.email !== process.env.MASTER_EMAIL) {
      return res.status(403).json({ error: 'Master access required' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};


export { generateToken }; 