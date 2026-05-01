import { z } from 'zod';
import type { ToolDefinition } from './types.js';
import { addDiscussion } from '../moodle/forum.js';
import { MoodleApiError } from '../errors.js';

const inputSchema = {
  forum_id: z.number().int().positive(),
  subject: z.string().min(1),
  message: z.string().min(1),
  message_format: z.enum(['html', 'plain']).optional(),
};

export const startForumDiscussionTool: ToolDefinition<typeof inputSchema> = {
  name: 'start_forum_discussion',
  description: 'Start a new discussion thread in a forum.',
  inputSchema,
  handler: async (args, ctx) => {
    try {
      const r = await addDiscussion(ctx.client, {
        forumId: args.forum_id,
        subject: args.subject,
        message: args.message,
        messageFormat: args.message_format === 'plain' ? 0 : 1,
      });
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              { discussion_id: r.discussionid, warnings: r.warnings ?? [] },
              null,
              2,
            ),
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
