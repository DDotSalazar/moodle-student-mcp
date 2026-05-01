import { z } from 'zod';
import type { ToolDefinition } from './types.js';
import { saveAttempt } from '../moodle/quizzes.js';
import { encodeAnswer } from '../moodle/quiz_answers.js';
import type { ParsedQuestion, QuestionType } from '../moodle/quiz_questions.js';
import { MoodleApiError } from '../errors.js';

const answerSchema = z.object({
  slot: z.number().int().positive(),
  type: z.enum([
    'multichoice',
    'truefalse',
    'shortanswer',
    'essay',
    'numerical',
    'match',
    'ddwtos',
    'unsupported',
  ]),
  multiselect: z.boolean().optional(),
  raw_form_fields: z.object({ slot: z.string(), qid: z.string() }),
  value: z.unknown(),
});

const inputSchema = {
  attempt_id: z.number().int().positive(),
  answers: z.array(answerSchema).min(1),
};

export const saveQuizAnswersTool: ToolDefinition<typeof inputSchema> = {
  name: 'save_quiz_answers',
  description:
    'Save answers to one or more questions in an in-progress quiz attempt. Does not finalise the attempt; can be called repeatedly. Each answer must include the type, raw_form_fields, and value as returned by start_quiz_attempt.',
  inputSchema,
  handler: async (args, ctx) => {
    try {
      const data: Array<{ name: string; value: string }> = [];
      for (const a of args.answers) {
        const fakeQuestion: ParsedQuestion = {
          slot: a.slot,
          type: a.type as QuestionType,
          text: '',
          html: '',
          images: [],
          multiselect: a.multiselect,
          raw_form_fields: a.raw_form_fields,
        };
        const encoded = encodeAnswer(fakeQuestion, a.value as never);
        data.push(...encoded);
      }

      await saveAttempt(ctx.client, args.attempt_id, data);

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              { saved: true, slots: args.answers.map((a) => a.slot), warnings: [] },
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
      if (err instanceof Error) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${err.message}` }],
          isError: true,
        };
      }
      throw err;
    }
  },
};
