import { z } from 'zod';
import { prisma } from '../config/index.js';

// Helper function to check board access for viewing (allows frozen boards for existing members)
export const checkBoardAccess = async (boardId, userId) => {
  const board = await prisma.board.findUnique({
    where: { board_id: boardId }
  });

  if (!board) return { error: 'Board not found', status: 404 };
  
  // For frozen boards, only existing members can view messages
  if (board.status === 'frozen') {
    // Check if user is admin of the frozen board
    if (board.board_admin === userId) return { board };
    
    // Check if user is a member of the frozen board
    const membership = await prisma.boardmember.findUnique({
      where: { board_id_user_id: { board_id: boardId, user_id: userId } }
    });
    
    if (!membership) {
      return { error: 'Cannot view messages from frozen board - you are not a member', status: 403 };
    }
    
    return { board };
  }
  
  // For active boards, normal access rules apply
  if (board.board_public) return { board };

  const membership = await prisma.boardmember.findUnique({
    where: { board_id_user_id: { board_id: boardId, user_id: userId } }
  });

  if (!membership && board.board_admin !== userId) {
    return { error: 'Access denied to private board', status: 403 };
  }

  return { board };
};

// Helper function to check board access for posting (prevents posting on frozen boards)
export const checkBoardPostAccess = async (boardId, userId) => {
  const board = await prisma.board.findUnique({
    where: { board_id: boardId }
  });

  if (!board) return { error: 'Board not found', status: 404 };
  if (board.status === 'frozen') return { error: 'Cannot post on frozen board', status: 403 };

  // Check if user is admin of the board
  if (board.board_admin === userId) return { board };

  // Check if user is a member of the board
  const membership = await prisma.boardmember.findUnique({
    where: { board_id_user_id: { board_id: boardId, user_id: userId } }
  });

  if (!membership) {
    return { error: 'You must be a member or admin of this board to post messages', status: 403 };
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