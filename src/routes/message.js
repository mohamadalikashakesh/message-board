import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { prisma } from '../config/index.js';

const router = express.Router();

/**
 * Get messages for all boards the user has access to
 * GET /api/messages
 * - Returns messages from public boards and private boards where user is a member
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Get all boards the user has access to
    const accessibleBoards = await prisma.board.findMany({
      where: {
        OR: [
          { board_public: true }, // Public boards
          {
            board_public: false,
            boardmember: {
              some: {
                user_id: req.user.userId
              }
            }
          }, // Private boards where user is a member
          {
            board_admin: req.user.userId // Boards where user is admin
          }
        ],
        status: 'active' // Only active boards
      },
      include: {
        message: {
          include: {
            account: {
              select: {
                user: {
                  select: {
                    user_name: true,
                    country: true
                  }
                }
              }
            }
          },
          orderBy: {
            timestamp: 'desc'
          },
        }
      },
      orderBy: {
        board_id: 'desc'
      }
    });

    const result = accessibleBoards.map(board => ({
      boardId: board.board_id,
      boardName: board.board_name,
      isPublic: board.board_public,
      messageCount: board.message.length,
      latestMessages: board.message.map(message => ({
        id: message.message_id,
        text: message.message_text,
        author: {
          id: message.admin_id,
          name: message.account.user.user_name,
          country: message.account.user.country
        },
        timestamp: message.timestamp
      }))
    }));

    res.json({
      accessibleBoards: result
    });
  } catch (error) {
    console.error('Error fetching accessible messages:', error);
    res.status(500).json({ error: 'Failed to fetch accessible messages' });
  }
});

export default router; 