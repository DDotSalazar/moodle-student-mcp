import { z } from 'zod';
import type { ToolDefinition } from './types.js';
import { processAttempt } from '../moodle/quizzes.js';
import { MoodleApiError } from '../errors.js';

const inputSchema = {
  attempt_id: z.number().int().positive(),
};

export const submitQuizAttemptTool: ToolDefinition<typeof inputSchema> = {
  name: 'submit_quiz_attempt',
  description:
    'Finalise an in-progress quiz attempt for grading. After this, no further answers can be saved.',
  inputSchema,
  handler: async (args, ctx) => {
    try {
      const r = await processAttempt(ctx.client, args.attempt_id, [], true);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              { finalised: true, state: r.state, warnings: r.warnings ?? [] },
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
