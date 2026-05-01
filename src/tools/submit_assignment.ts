import { z } from 'zod';
import type { ToolDefinition } from './types.js';
import { saveSubmission, submitForGrading } from '../moodle/assignments.js';
import { MoodleApiError } from '../errors.js';

const inputSchema = {
  assignment_id: z.number().int().positive(),
  text: z.string().optional(),
  text_format: z.enum(['html', 'plain']).optional(),
  files: z.array(z.string().min(1)).optional(),
  submit_for_grading: z.boolean().optional(),
};

export const submitAssignmentTool: ToolDefinition<typeof inputSchema> = {
  name: 'submit_assignment',
  description:
    'Save a draft submission for an assignment with optional online text and file attachments. Saves as a draft by default; pass submit_for_grading: true to finalise after saving. Files must be local absolute paths.',
  inputSchema,
  handler: async (args, ctx) => {
    if (!args.text && (!args.files || args.files.length === 0)) {
      return {
        content: [
          { type: 'text' as const, text: 'Error: provide text or files (or both) to submit.' },
        ],
        isError: true,
      };
    }

    try {
      let fileItemId: number | undefined;
      let filesUploaded = 0;
      if (args.files && args.files.length > 0) {
        const upload = await ctx.client.uploadFiles(args.files);
        fileItemId = upload.itemid;
        filesUploaded = upload.uploaded.length;
      }

      await saveSubmission(ctx.client, args.assignment_id, {
        text: args.text,
        textFormat: args.text_format === 'plain' ? 0 : 1,
        fileItemId,
      });

      let finalised = false;
      if (args.submit_for_grading) {
        await submitForGrading(ctx.client, args.assignment_id);
        finalised = true;
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              { saved: true, finalised, files_uploaded: filesUploaded, warnings: [] },
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
