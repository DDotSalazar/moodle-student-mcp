import { z } from 'zod';
import type { ToolDefinition } from './types.js';
import { sendInstantMessages } from '../moodle/messages.js';
import { MoodleApiError } from '../errors.js';

const inputSchema = {
  to_user_id: z.number().int().positive(),
  text: z.string().min(1),
};

export const sendMessageTool: ToolDefinition<typeof inputSchema> = {
  name: 'send_message',
  description: 'Send a direct message to another Moodle user.',
  inputSchema,
  handler: async (args, ctx) => {
    try {
      const sent = await sendInstantMessages(ctx.client, args.to_user_id, args.text);
      const first = sent[0];
      if (!first) {
        return {
          content: [{ type: 'text' as const, text: 'Error: Moodle returned no message id.' }],
          isError: true,
        };
      }
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                message_id: first.msgid,
                sent_at_iso: new Date(first.timecreated * 1000).toISOString(),
              },
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
