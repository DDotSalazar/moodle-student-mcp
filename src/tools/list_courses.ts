import type { ToolDefinition } from './types.js';
import { getMyCourses } from '../moodle/courses.js';
import { MoodleApiError } from '../errors.js';

export const listCoursesTool: ToolDefinition = {
  name: 'list_courses',
  description: 'List all courses the authenticated student is currently enrolled in.',
  inputSchema: {},
  handler: async (_args, ctx) => {
    try {
      const courses = await getMyCourses(ctx.client, ctx.userId);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(courses, null, 2) }],
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
