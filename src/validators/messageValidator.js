import { z } from 'zod';
import { prisma } from '../config/index.js';

// Helper function to check board access
export const checkBoardAccess = async (boardId, userId) => {
  const board = await prisma.board.findUnique({
    where: { board_id: boardId }
  });

  if (!board) return { error: 'Board not found', status: 404 };
  if (board.status === 'frozen') return { error: 'Cannot access frozen board', status: 403 };
  if (board.board_public) return { board };

  const membership = await prisma.boardmember.findUnique({
    where: { board_id_user_id: { board_id: boardId, user_id: userId } }
  });

  if (!membership && board.board_admin !== userId) {
    return { error: 'Access denied to private board', status: 403 };
  }

  return { board };
};

// Helper function to format message response
export const formatMessage = (message) => ({
  id: message.message_id,
  text: message.message_text,
  userIds: message.user_ids,
  author: {
    id: message.admin_id,
    name: message.account.user.user_name,
    country: message.account.user.country
  },
  timestamp: message.timestamp
});

// Create message schema
export const createMessageSchema = z.object({
  boardId: z.number().int().positive('Invalid board ID'),
  messageText: z.string()
    .min(1, 'Message text is required')
    .max(1000, 'Message text must be less than 1000 characters')
    .transform(text => text.trim()),
  userIds: z.string().optional().transform(ids => ids || '')
});

// Reply to message schema
export const replyMessageSchema = z.object({
  messageText: z.string()
    .min(1, 'Message text is required')
    .max(1000, 'Message text must be less than 1000 characters')
    .transform(text => text.trim())
}); 