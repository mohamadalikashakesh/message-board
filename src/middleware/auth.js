import jwt from 'jsonwebtoken';
import { prisma, config } from '../config/index.js';


//Generate JWT token
const generateToken = (userData) => {
  return jwt.sign(userData, config.jwtSecret, { expiresIn: '24h' });
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

    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
