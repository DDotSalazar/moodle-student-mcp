import { z } from 'zod';
import type { ToolDefinition } from './types.js';
import { getCourseContents } from '../moodle/courses.js';
import { MoodleApiError } from '../errors.js';

export const getCourseContentsTool: ToolDefinition<{ course_id: z.ZodNumber }> = {
  name: 'get_course_contents',
  description:
    'Get the structure of a course (sections, modules, files, links, descriptions). Use this to see what content and resources are inside a course the student is enrolled in.',
  inputSchema: {
    course_id: z.number().int().positive(),
  },
  handler: async (args, ctx) => {
    try {
      const sections = await getCourseContents(ctx.client, args.course_id);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(sections, null, 2) }],
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
