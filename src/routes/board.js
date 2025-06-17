import express from 'express';
import { authenticateToken, requireBoardAdmin } from '../middleware/auth.js';
import { validateBoardTitle, validateBoardDescription, validateMessageContent } from '../validators/board.js';
import { prisma } from '../config/index.js';

const router = express.Router();

/**
 * Create a new board
 * POST /api/boards
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, isPrivate } = req.body;

    // Validate input
    validateBoardTitle(title);
    validateBoardDescription(description);

    const board = await prisma.board.create({
      data: {
        board_name: title,
        board_admin: req.user.userId,
        board_public: !isPrivate,
        status: 'active'
      }
    });

    res.status(201).json({
      message: 'Board created successfully',
      board: {
        id: board.board_id,
        title: board.board_name,
        isPrivate: !board.board_public,
        status: board.status,
        createdAt: board.created_at
      }
    });
  } catch (error) {
    console.error('Board creation error:', error);
    res.status(400).json({ error: error.message || 'Failed to create board' });
  }
});

/**
 * Update a board
 * PUT /api/boards/:boardId
 */
router.put('/:boardId', authenticateToken, requireBoardAdmin, async (req, res) => {
  try {
    const boardId = parseInt(req.params.boardId);
    if (isNaN(boardId)) {
      return res.status(400).json({ error: 'Invalid board ID' });
    }

    const { title, description, isPrivate } = req.body;

    if (title) validateBoardTitle(title);
    if (description) validateBoardDescription(description);

    const board = await prisma.board.update({
      where: { board_id: boardId },
      data: {
        board_name: title,
        board_public: !isPrivate
      }
    });

    res.json({
      message: 'Board updated successfully',
      board: {
        id: board.board_id,
        title: board.board_name,
        isPrivate: !board.board_public,
        status: board.status,
        createdAt: board.created_at
      }
    });
  } catch (error) {
    console.error('Board update error:', error);
    res.status(400).json({ error: error.message || 'Failed to update board' });
  }
});

/**
 * Delete a board
 * DELETE /api/boards/:boardId
 */
router.delete('/:boardId', authenticateToken, requireBoardAdmin, async (req, res) => {
  try {
    const boardId = parseInt(req.params.boardId);
    if (isNaN(boardId)) {
      return res.status(400).json({ error: 'Invalid board ID' });
    }

    await prisma.board.delete({
      where: { board_id: boardId }
    });

    res.json({ message: 'Board deleted successfully' });
  } catch (error) {
    console.error('Board deletion error:', error);
    res.status(500).json({ error: 'Failed to delete board' });
  }
});

/**
 * Get all available boards
 * GET /api/boards
 */
router.get('/', async (req, res) => {
  try {
    const boards = await prisma.board.findMany({
      where: {
        status: 'active'
      },
      orderBy: {
        board_id: 'desc'
      },
      select: {
        board_id: true,
        board_name: true,
        board_public: true,
        status: true,
        board_admin: true
      }
    });

    res.json({
      boards: boards.map(board => ({
        id: board.board_id,
        title: board.board_name,
        isPrivate: !board.board_public,
        status: board.status,
        adminId: board.board_admin
      }))
    });
  } catch (error) {
    console.error('Error fetching boards:', error);
    res.status(500).json({ error: 'Failed to fetch boards' });
  }
});

/**
 * Join a board
 * POST /api/boards/:boardId/join
 */
router.post('/:boardId/join', authenticateToken, async (req, res) => {
  try {
    const boardId = parseInt(req.params.boardId);
    if (isNaN(boardId)) {
      return res.status(400).json({ error: 'Invalid board ID' });
    }

    // Check if board exists and is active
    const board = await prisma.board.findUnique({
      where: { board_id: boardId }
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }
    // Check if user is already a member
    const existingMembership = await prisma.boardmember.findUnique({
      where: {
        board_id_user_id: {
          board_id: boardId,
          user_id: req.user.userId
        }
      }
    });

    if (existingMembership) {
      return res.status(400).json({ error: 'You are already a member of this board' });
    }
    // Create board membership
    const membership = await prisma.boardmember.create({
      data: {
        board_id: boardId,
        user_id: req.user.userId
      }
    });

    res.status(201).json({
      message: 'Successfully joined the board',
      membership: {
        boardId: membership.board_id,
        userId: membership.user_id,
        joinedAt: membership.joined_at
      }
    });
  } catch (error) {
    console.error('Error joining board:', error);
    res.status(500).json({ error: 'Failed to join board' });
  }
});

/**
 * Leave a board
 * DELETE /api/boards/:boardId/join
 */
router.delete('/:boardId/join', authenticateToken, async (req, res) => {
  try {
    const boardId = parseInt(req.params.boardId);
    if (isNaN(boardId)) {
      return res.status(400).json({ error: 'Invalid board ID' });
    }

    // Check if board exists
    const board = await prisma.board.findUnique({
      where: { board_id: boardId }
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Check if user is a member
    const membership = await prisma.boardmember.findUnique({
      where: {
        board_id_user_id: {
          board_id: boardId,
          user_id: req.user.userId
        }
      }
    });

    if (!membership) {
      return res.status(400).json({ error: 'You are not a member of this board' });
    }

    // Delete board membership
    await prisma.boardmember.delete({
      where: {
        board_id_user_id: {
          board_id: boardId,
          user_id: req.user.userId
        }
      }
    });

    res.json({
      message: 'Successfully left the board',
      boardId: boardId
    });
  } catch (error) {
    console.error('Error leaving board:', error);
    res.status(500).json({ error: 'Failed to leave board' });
  }
});

export default router;