import { z } from 'zod';
import type { ToolDefinition } from './types.js';
import { getFeedbackItems, processFeedbackPage } from '../moodle/feedback.js';
import { MoodleApiError } from '../errors.js';

const responseSchema = z.object({
  item_id: z.number().int().positive(),
  value: z.union([z.string(), z.number(), z.array(z.string())]),
});

const inputSchema = {
  feedback_id: z.number().int().positive(),
  responses: z.array(responseSchema).min(1),
};

const MAX_PAGES = 50;

export const submitCourseFeedbackTool: ToolDefinition<typeof inputSchema> = {
  name: 'submit_course_feedback',
  description:
    'Submit responses to a feedback form. Walks pages internally; provide all responses up-front.',
  inputSchema,
  handler: async (args, ctx) => {
    try {
      await getFeedbackItems(ctx.client, args.feedback_id);
      let page = 0;
      let completed = false;
      let completionContents: string | undefined;

      while (!completed && page < MAX_PAGES) {
        const flat = args.responses.map((r) => ({
          itemId: r.item_id,
          value: Array.isArray(r.value) ? r.value.join(',') : r.value,
        }));
        const r = await processFeedbackPage(ctx.client, args.feedback_id, page, flat);
        completed = r.completed;
        completionContents = r.completionpagecontents;
        if (completed) break;
        if (r.jumpto < 0) break;
        page = r.jumpto;
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              { submitted: completed, completion_page_contents: completionContents },
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
