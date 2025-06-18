import { z } from 'zod';

// Message text validation schema
export const messageTextSchema = z
  .string()
  .min(1, 'Message text is required')
  .max(1000, 'Message text must be less than 1000 characters')
  .transform(text => text.trim());

// Board ID validation schema
export const boardIdSchema = z
  .number()
  .int()
  .positive('Invalid board ID');

// User IDs validation schema (optional comma-separated list)
export const userIdsSchema = z
  .string()
  .optional()
  .transform(ids => ids || '');

// Create message schema
export const createMessageSchema = z.object({
  boardId: boardIdSchema,
  messageText: messageTextSchema,
  userIds: userIdsSchema
});

// Reply to message schema
export const replyMessageSchema = z.object({
  messageText: messageTextSchema
}); 