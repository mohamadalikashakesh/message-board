import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { prisma } from '../config/index.js';
import { createMessageSchema, replyMessageSchema, checkBoardAccess, formatMessage } from '../validators/messageValidator.js';

const router = express.Router();

/**
 * Get messages for all boards the user has access to
 * GET /api/messages
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const accessibleBoards = await prisma.board.findMany({
      where: {
        OR: [
          { board_public: true },
          { board_public: false, boardmember: { some: { user_id: req.user.userId } } },
          { board_admin: req.user.userId }
        ],
        status: 'active'
      },
      include: {
        message: {
          include: {
            account: { select: { user: { select: { user_name: true, country: true } } } }
          },
          orderBy: { timestamp: 'desc' },
          take: 5
        }
      },
      orderBy: { board_id: 'desc' }
    });

    const result = accessibleBoards.map(board => ({
      boardId: board.board_id,
      boardName: board.board_name,
      isPublic: board.board_public,
      messageCount: board.message?.length || 0,
      latestMessages: (board.message || []).map(formatMessage)
    }));

    res.json({ accessibleBoards: result });
  } catch (error) {
    console.error('Error fetching accessible messages:', error);
    res.status(500).json({ error: 'Failed to fetch accessible messages' });
  }
});

/**
 * Get messages for a specific board
 * GET /api/messages/:boardId
 */
router.get('/:boardId', authenticateToken, async (req, res) => {
  try {
    const boardId = parseInt(req.params.boardId);
    if (isNaN(boardId)) return res.status(400).json({ error: 'Invalid board ID' });

    const accessCheck = await checkBoardAccess(boardId, req.user.userId);
    if (accessCheck.error) return res.status(accessCheck.status).json({ error: accessCheck.error });

    const messages = await prisma.message.findMany({
      where: { board_id: boardId },
      include: {
        account: { select: { user: { select: { user_name: true, country: true } } } }
      },
      orderBy: { timestamp: 'asc' }
    });

    res.json({
      boardName: accessCheck.board.board_name,
      boardId: accessCheck.board.board_id,
      isPublic: accessCheck.board.board_public,
      messages: messages.map(formatMessage)
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});


export default router; 