import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { prisma } from '../config/index.js';
import { createMessageSchema, replyMessageSchema, checkBoardAccess, checkBoardPostAccess, formatMessage } from '../validators/messageValidator.js';

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

/**
 * Create a new message on a board
 * POST /api/messages
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { boardId, messageText, userIds } = createMessageSchema.parse(req.body);

    const accessCheck = await checkBoardPostAccess(boardId, req.user.userId);
    if (accessCheck.error) return res.status(accessCheck.status).json({ error: accessCheck.error });

    const message = await prisma.message.create({
      data: {
        board_id: boardId,
        user_ids: userIds,
        admin_id: req.user.userId,
        message_text: messageText
      },
      include: {
        account: { select: { user: { select: { user_name: true, country: true } } } }
      }
    });

    res.status(201).json({
      message: 'Message posted successfully',
      data: { ...formatMessage(message), boardId: message.board_id }
    });
  } catch (error) {
    console.error('Error creating message:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors.map(err => ({ field: err.path.join('.'), message: err.message }))
      });
    }
    res.status(500).json({ error: 'Failed to create message' });
  }
});

export default router; 

/**
 * Reply to a specific message
 * POST /api/messages/:messageId/reply
 */
router.post('/:messageId/reply', authenticateToken, async (req, res) => {
  try {
    const messageId = parseInt(req.params.messageId);
    if (isNaN(messageId)) return res.status(400).json({ error: 'Invalid message ID' });

    const { messageText } = replyMessageSchema.parse(req.body);

    const originalMessage = await prisma.message.findUnique({
      where: { message_id: messageId },
      include: { board: true }
    });

    if (!originalMessage) return res.status(404).json({ error: 'Message not found' });

    const accessCheck = await checkBoardAccess(originalMessage.board.board_id, req.user.userId);
    if (accessCheck.error) return res.status(accessCheck.status).json({ error: accessCheck.error });

    const replyMessage = await prisma.message.create({
      data: {
        board_id: originalMessage.board.board_id,
        user_ids: '',
        admin_id: req.user.userId,
        message_text: messageText
      },
      include: {
        account: { select: { user: { select: { user_name: true, country: true } } } }
      }
    });

    res.status(201).json({
      message: 'Reply posted successfully',
      data: {
        ...formatMessage(replyMessage),
        boardId: replyMessage.board_id,
        replyTo: { id: originalMessage.message_id, text: originalMessage.message_text }
      }
    });
  } catch (error) {
    console.error('Error creating reply:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors.map(err => ({ field: err.path.join('.'), message: err.message }))
      });
    }
    res.status(500).json({ error: 'Failed to create reply' });
  }
});