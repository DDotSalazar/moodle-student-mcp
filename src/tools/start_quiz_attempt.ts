import { z } from 'zod';
import type { ToolDefinition } from './types.js';
import { startAttempt, getUnfinishedAttempt, getAttemptData } from '../moodle/quizzes.js';
import { parseQuestion } from '../moodle/quiz_questions.js';
import { MoodleApiError } from '../errors.js';

const inputSchema = {
  quiz_id: z.number().int().positive(),
};

export const startQuizAttemptTool: ToolDefinition<typeof inputSchema> = {
  name: 'start_quiz_attempt',
  description:
    'Start a new attempt at a quiz, or resume the in-progress attempt if one exists. Returns the attempt id plus a normalised list of questions across all pages, including raw_form_fields needed by save_quiz_answers. Password-protected quizzes are not supported.',
  inputSchema,
  handler: async (args, ctx) => {
    try {
      const existing = await getUnfinishedAttempt(ctx.client, args.quiz_id, ctx.userId);
      let attemptId: number;
      let state = 'inprogress';
      let timestart = 0;
      if (existing) {
        attemptId = existing.id;
        state = existing.state;
        timestart = existing.timestart;
      } else {
        const started = await startAttempt(ctx.client, args.quiz_id);
        attemptId = started.attempt.id;
        state = started.attempt.state;
        timestart = started.attempt.timestart;
      }

      const allQuestions = [];
      let page = 0;
      while (page >= 0) {
        const data = await getAttemptData(ctx.client, attemptId, page);
        for (const q of data.questions) {
          allQuestions.push(parseQuestion(q.slot, q.html, ctx.client.token));
        }
        page = data.nextpage;
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                attempt_id: attemptId,
                quiz_id: args.quiz_id,
                state,
                timestart,
                questions: allQuestions,
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
