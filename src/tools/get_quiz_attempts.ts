import { z } from 'zod';
import type { ToolDefinition } from './types.js';
import { getUserQuizAttempts } from '../moodle/quizzes.js';
import { MoodleApiError } from '../errors.js';

const inputSchema = {
  quiz_id: z.number().int().positive(),
};

export const getQuizAttemptsTool: ToolDefinition<typeof inputSchema> = {
  name: 'get_quiz_attempts',
  description: "Get the student's attempts for a specific quiz, with scores and timestamps.",
  inputSchema,
  handler: async (args, ctx) => {
    try {
      const response = await getUserQuizAttempts(ctx.client, args.quiz_id, ctx.userId);

      const shaped = response.attempts.map((a) => ({
        id: a.id,
        attempt: a.attempt,
        state: a.state,
        timestart: a.timestart,
        timestart_iso: a.timestart ? new Date(a.timestart * 1000).toISOString() : null,
        timefinish: a.timefinish,
        timefinish_iso: a.timefinish ? new Date(a.timefinish * 1000).toISOString() : null,
        sumgrades: a.sumgrades,
      }));

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(shaped, null, 2) }],
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
