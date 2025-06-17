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

// checks whether the user making the request has the permissions to modify board
export const requireBoardAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const boardId = parseInt(req.params.boardId);
    if (isNaN(boardId)) {
      return res.status(400).json({ error: 'Invalid board ID' });
    }

    const board = await prisma.board.findUnique({
      where: { board_id: boardId }
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    if (board.board_admin !== req.user.userId && req.user.role !== 'master') {
      return res.status(403).json({ error: 'Only board admin can perform this action' });
    }

    req.board = board;
    next();
  } catch (error) {
    console.error('Board admin check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


export { generateToken }; 