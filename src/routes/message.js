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



export default router; 