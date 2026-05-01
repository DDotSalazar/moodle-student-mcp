import { z } from 'zod';
import type { ToolDefinition } from './types.js';
import { addDiscussionPost } from '../moodle/forum.js';
import { MoodleApiError } from '../errors.js';

const inputSchema = {
  post_id: z.number().int().positive(),
  subject: z.string().min(1),
  message: z.string().min(1),
  message_format: z.enum(['html', 'plain']).optional(),
};

export const postForumReplyTool: ToolDefinition<typeof inputSchema> = {
  name: 'post_forum_reply',
  description: 'Reply to an existing forum post.',
  inputSchema,
  handler: async (args, ctx) => {
    try {
      const r = await addDiscussionPost(ctx.client, {
        postId: args.post_id,
        subject: args.subject,
        message: args.message,
        messageFormat: args.message_format === 'plain' ? 0 : 1,
      });
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ post_id: r.postid, warnings: r.warnings ?? [] }, null, 2),
          },
        ],
      };
    } catch (err) {
      if (err instanceof MoodleApiError) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${err.message}` }],
          isError: true,
        };
      }
      throw err;
    }
  },
};
