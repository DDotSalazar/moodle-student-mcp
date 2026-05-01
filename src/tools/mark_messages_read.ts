import { z } from 'zod';
import type { ToolDefinition } from './types.js';
import { markMessageRead } from '../moodle/messages.js';

const inputSchema = {
  message_ids: z.array(z.number().int().positive()).min(1),
};

export const markMessagesReadTool: ToolDefinition<typeof inputSchema> = {
  name: 'mark_messages_read',
  description: 'Mark one or more messages as read.',
  inputSchema,
  handler: async (args, ctx) => {
    const failed: number[] = [];
    let marked = 0;
    await Promise.all(
      args.message_ids.map(async (id) => {
        try {
          await markMessageRead(ctx.client, id);
          marked++;
        } catch {
          failed.push(id);
        }
      }),
    );
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ marked, failed: failed.sort((a, b) => a - b) }, null, 2),
        },
      ],
    };
  },
};
