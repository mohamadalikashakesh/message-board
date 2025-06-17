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
    const { displayName, pass, email, country, dateOfBirth, role } = req.body;

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
            pass,
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
        password: user.pass,
        dateOfBirth: user.user.dob
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * Get all boards
 * GET /api/master/boards
 */
router.get('/boards', masterAuth, async (req, res) => {
  try {
    const boards = await prisma.board.findMany({
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
        },
        boardmember: {
          select: {
            user: {
              select: {
                user_name: true
              }
            }
          }
        },
        message: {
          select: {
            message_id: true
          }
        }
      },
      orderBy: {
        board_id: 'desc'
      }
    });

    res.json(boards.map(board => ({
      id: board.board_id,
      name: board.board_name,
      isPublic: board.board_public,
      status: board.status,
      admin: {
        id: board.board_admin,
        name: board.account.user.user_name,
        country: board.account.user.country
      },
      memberCount: board.boardmember.length,
      messageCount: board.message.length,
      members: board.boardmember.map(member => ({
        name: member.user.user_name
      }))
    })));
  } catch (error) {
    console.error('Error fetching boards:', error);
    res.status(500).json({ error: 'Failed to fetch boards' });
  }
});

/**
 * Update board
 * PUT /api/master/boards/:boardId
 */
router.put('/boards/:boardId', masterAuth, async (req, res) => {
  try {
    const boardId = parseInt(req.params.boardId);
    const { name, isPublic, status, adminId } = req.body;

    if (isNaN(boardId)) {
      return res.status(400).json({ error: 'Invalid board ID' });
    }

    // Check if board exists
    const existingBoard = await prisma.board.findUnique({
      where: { board_id: boardId }
    });

    if (!existingBoard) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // If changing admin, verify the new admin exists
    if (adminId) {
      const newAdmin = await prisma.account.findUnique({
        where: { user_id: adminId }
      });

      if (!newAdmin) {
        return res.status(400).json({ error: 'New admin user not found' });
      }
    }

    // Update board
    const updatedBoard = await prisma.board.update({
      where: { board_id: boardId },
      data: {
        board_name: name,
        board_public: isPublic,
        status,
        board_admin: adminId
      },
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
      }
    });

    res.json({
      message: 'Board updated successfully',
      board: {
        id: updatedBoard.board_id,
        name: updatedBoard.board_name,
        isPublic: updatedBoard.board_public,
        status: updatedBoard.status,
        admin: {
          id: updatedBoard.board_admin,
          name: updatedBoard.account.user.user_name,
          country: updatedBoard.account.user.country
        }
      }
    });
  } catch (error) {
    console.error('Error updating board:', error);
    res.status(500).json({ error: 'Failed to update board' });
  }
});

/**
 * Ban user from a board
 * POST /api/master/boards/:boardId/ban/:userId
 */
router.post('/boards/:boardId/ban/:userId', masterAuth, async (req, res) => {
  try {
    const boardId = parseInt(req.params.boardId);
    const userId = parseInt(req.params.userId);

    if (isNaN(boardId) || isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid board ID or user ID' });
    }

    // Check if user is already banned
    const existingBan = await prisma.banneduser.findFirst({
      where: {
        board_id: boardId,
        user_id: userId
      }
    });

    if (existingBan) {
      return res.status(400).json({ error: 'User is already banned from this board' });
    }

    // Create the ban
    await prisma.banneduser.create({
      data: {
        board_id: boardId,
        user_id: userId
      }
    });

    res.json({ message: 'User banned from board successfully' });
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({ error: 'Failed to ban user' });
  }
});

/**
 * Unban user from a board
 * DELETE /api/master/boards/:boardId/ban/:userId
 */
router.delete('/boards/:boardId/ban/:userId', masterAuth, async (req, res) => {
  try {
    const boardId = parseInt(req.params.boardId);
    const userId = parseInt(req.params.userId);

    if (isNaN(boardId) || isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid board ID or user ID' });
    }

    // Check if ban exists
    const ban = await prisma.banneduser.findFirst({
      where: {
        board_id: boardId,
        user_id: userId
      }
    });

    if (!ban) {
      return res.status(404).json({ error: 'User is not banned from this board' });
    }

    // Remove the ban
    await prisma.banneduser.delete({
      where: {
        board_id_user_id: {
          board_id: boardId,
          user_id: userId
        }
      }
    });

    res.json({ message: 'User unbanned from board successfully' });
  } catch (error) {
    console.error('Error unbanning user:', error);
    res.status(500).json({ error: 'Failed to unban user' });
  }
});

export default router;
