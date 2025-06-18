import express from 'express';
import { authenticateToken, requireBoardAdmin } from '../middleware/auth.js';
import { validateBoardTitle, validateBoardDescription, validateMessageContent } from '../validators/boardValidator.js';
import { calculateAge } from '../validators/authValidator.js';
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
router.get('/', authenticateToken, async (req, res) => {
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

    // Check if board exists
    const board = await prisma.board.findUnique({
      where: { board_id: boardId }
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Check if board is frozen
    if (board.status === 'frozen') {
      return res.status(403).json({ 
        error: 'Cannot join this board - Board is currently frozen',
        message: 'This board has been suspended.'
      });
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

    // If board is private, check if user is admin
    if (!board.board_public) {
      if (board.board_admin !== req.user.userId) {
        return res.status(403).json({ 
          error: 'This is a private board. Only the board admin can add members.',
          message: 'Please contact the board admin to request access.'
        });
      }
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

/**
 * Get all boards that the user has joined
 * GET /api/boards/joined
 */
router.get('/joined', authenticateToken, async (req, res) => {
  try {
    const joinedBoards = await prisma.boardmember.findMany({
      where: {
        user_id: req.user.userId
      },
      include: {
        board: {
          select: {
            board_id: true,
            board_name: true,
            board_public: true,
            status: true,
            board_admin: true
          }
        }
      },
      orderBy: {
        joined_at: 'desc'
      }
    });

    res.json({
      boards: joinedBoards.map(membership => ({
        id: membership.board.board_id,
        title: membership.board.board_name,
        isPrivate: !membership.board.board_public,
        status: membership.board.status,
        adminId: membership.board.board_admin,
        joinedAt: membership.joined_at
      }))
    });
  } catch (error) {
    console.error('Error fetching joined boards:', error);
    res.status(500).json({ error: 'Failed to fetch joined boards' });
  }
});

/**
 * Add member to private board (board admin only)
 * POST /api/boards/:boardId/members
 */
router.post('/:boardId/members', authenticateToken, async (req, res) => {
  try {
    const boardId = parseInt(req.params.boardId);
    const { userId } = req.body;

    if (isNaN(boardId) || !userId) {
      return res.status(400).json({ error: 'Invalid board ID or user ID' });
    }

    // Check if board exists and user is admin
    const board = await prisma.board.findUnique({
      where: { board_id: boardId }
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    if (board.board_admin !== req.user.userId) {
      return res.status(403).json({ error: 'Only board admin can add members' });
    }

    // Check if user is already a member
    const existingMembership = await prisma.boardmember.findUnique({
      where: {
        board_id_user_id: {
          board_id: boardId,
          user_id: userId
        }
      }
    });

    if (existingMembership) {
      return res.status(400).json({ error: 'User is already a member of this board' });
    }

    // Create board membership
    const membership = await prisma.boardmember.create({
      data: {
        board_id: boardId,
        user_id: userId
      }
    });

    res.status(201).json({
      message: 'Successfully added member to the board',
      membership: {
        boardId: membership.board_id,
        userId: membership.user_id,
        joinedAt: membership.joined_at
      }
    });
  } catch (error) {
    console.error('Error adding board member:', error);
    res.status(500).json({ error: 'Failed to add board member' });
  }
});

/**
 * Get board members information
 * GET /api/boards/:boardId/members
 */
router.get('/:boardId/members', authenticateToken, async (req, res) => {
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

    // Check if user is a member of the board
    const isMember = await prisma.boardmember.findUnique({
      where: {
        board_id_user_id: {
          board_id: boardId,
          user_id: req.user.userId
        }
      }
    });

    if (!isMember && board.board_admin !== req.user.userId) {
      return res.status(403).json({ error: 'You must be a member of this board to view its members' });
    }

    // Get all board members with their user information
    const members = await prisma.boardmember.findMany({
      where: {
        board_id: boardId
      },
      include: {
        user: {
          select: {
            user_name: true,
            dob: true,
            country: true
          }
        }
      },
      orderBy: {
        joined_at: 'asc'
      }
    });

    // Format the response
    const formattedMembers = members.map(member => ({
      displayName: member.user.user_name,
      age: member.user.dob ? calculateAge(member.user.dob) : null,
      country: member.user.country,
      dateJoined: member.joined_at,
      isAdmin: member.user_id === board.board_admin
    }));

    res.json({
      boardName: board.board_name,
      members: formattedMembers
    });
  } catch (error) {
    console.error('Error fetching board members:', error);
    res.status(500).json({ error: 'Failed to fetch board members' });
  }
});

/**
 * Ban user from board (board admin only)
 * POST /api/boards/:boardId/ban/:userId
 */
router.post('/:boardId/ban/:userId', authenticateToken, async (req, res) => {
  try {
    const boardId = parseInt(req.params.boardId);
    const userId = parseInt(req.params.userId);
    const { reason } = req.body;

    if (isNaN(boardId) || isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid board ID or user ID' });
    }

    // Check if board exists and user is admin
    const board = await prisma.board.findUnique({
      where: { board_id: boardId }
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    if (board.board_admin !== req.user.userId) {
      return res.status(403).json({ error: 'Only board admin can ban users' });
    }

    // Check if user to be banned exists
    const userToBan = await prisma.user.findUnique({
      where: { user_id: userId }
    });

    if (!userToBan) {
      return res.status(404).json({ error: 'User to ban not found' });
    }

    // Prevent board admin from banning themselves
    if (userId === req.user.userId) {
      return res.status(400).json({ error: 'Board admin cannot ban themselves from their own board' });
    }

    // Check if user is already banned from this board
    const existingBan = await prisma.banneduser.findUnique({
      where: {
        board_id_user_id: {
          board_id: boardId,
          user_id: userId
        }
      }
    });

    if (existingBan) {
      return res.status(400).json({ error: 'User is already banned from this board' });
    }

    // Check if user is a member of the board
    const membership = await prisma.boardmember.findUnique({
      where: {
        board_id_user_id: {
          board_id: boardId,
          user_id: userId
        }
      }
    });

    // Ban the user from the board
    await prisma.$transaction(async (tx) => {
      // Add user to banned list
      await tx.banneduser.create({
        data: {
          board_id: boardId,
          user_id: userId
        }
      });

      // Remove user from board members if they were a member
      if (membership) {
        await tx.boardmember.delete({
          where: {
            board_id_user_id: {
              board_id: boardId,
              user_id: userId
            }
          }
        });
      }
    });

    res.json({
      message: 'User banned from board successfully',
      bannedUser: {
        userId: userId,
        userName: userToBan.user_name,
        boardId: boardId,
        boardName: board.board_name,
        reason: reason || 'No reason provided'
      }
    });
  } catch (error) {
    console.error('Error banning user from board:', error);
    res.status(500).json({ error: 'Failed to ban user from board' });
  }
});

export default router;