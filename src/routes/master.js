import express from 'express';
import { prisma } from '../config/index.js';
import { masterAuth } from '../middleware/auth.js'

const router = express.Router();

/**
 * Get all users
 * GET /api/master/users
 */
router.get('/users', masterAuth, async (req, res) => {
  try {
    const users = await prisma.account.findMany({
      include: {
        user: true,
        board: {
          select: {
            board_id: true,
            board_name: true,
            board_public: true,
            status: true
          }
        },
        message: {
          select: {
            message_id: true,
            message_text: true,
            timestamp: true,
            board: {
              select: {
                board_id: true,
                board_name: true
              }
            }
          }
        }
      }
    });

    res.json(users.map(user => ({
      userId: user.user_id,
      email: user.email,
      role: user.role,
      displayName: user.user.user_name,
      country: user.user.country,
      dateOfBirth: user.user.dob,
      isBoardAdmin: user.board.length > 0,
      boardCount: user.board.length,
      boards: user.board.map(board => ({
        id: board.board_id,
        name: board.board_name,
        isPublic: board.board_public,
        status: board.status
      })),
      messageCount: user.message.length,
      recentMessages: user.message
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5)
        .map(msg => ({
          id: msg.message_id,
          text: msg.message_text,
          timestamp: msg.timestamp,
          board: {
            id: msg.board.board_id,
            name: msg.board.board_name
          }
        }))
    })));
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * Update user
 * PUT /api/master/users/:userId
 */
router.put('/users/:userId', masterAuth, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { displayName, email, country, dateOfBirth, role } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await prisma.account.update({
      where: { user_id: userId },
      data: {
        email,
        role,
        user: {
          update: {
            user_name: displayName,
            country,
            dob: dateOfBirth ? new Date(dateOfBirth) : undefined
          }
        }
      },
      include: {
        user: true
      }
    });

    res.json({
      message: 'User updated successfully',
      user: {
        userId: user.user_id,
        email: user.email,
        role: user.role,
        displayName: user.user.user_name,
        country: user.user.country,
        dateOfBirth: user.user.dob
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});


export default router;
