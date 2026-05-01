import { z } from 'zod';
import type { ToolDefinition } from './types.js';
import { submitChoiceResponse } from '../moodle/choice.js';
import { MoodleApiError } from '../errors.js';

const inputSchema = {
  choice_id: z.number().int().positive(),
  response_ids: z.array(z.number().int().positive()).min(1),
};

export const submitChoiceResponseTool: ToolDefinition<typeof inputSchema> = {
  name: 'submit_choice_response',
  description: 'Submit a response to an in-course poll (mod_choice). Replaces any prior response.',
  inputSchema,
  handler: async (args, ctx) => {
    try {
      const r = await submitChoiceResponse(ctx.client, args.choice_id, args.response_ids);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                submitted: true,
                answers: args.response_ids,
                warnings: r.warnings ?? [],
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
