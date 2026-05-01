import { z } from 'zod';
import type { ToolDefinition } from './types.js';
import { getCourseGrades } from '../moodle/grades.js';
import { getMyCourses } from '../moodle/courses.js';
import { MoodleApiError } from '../errors.js';

const inputSchema = {
  course_id: z.number().int().positive().optional(),
};

export const getGradesTool: ToolDefinition<typeof inputSchema> = {
  name: 'get_grades',
  description:
    "Get the student's grade report for one course or all enrolled courses. Returns per-course grade items with formatted grades, percentages, and feedback.",
  inputSchema,
  handler: async (args, ctx) => {
    try {
      const courses =
        args.course_id !== undefined
          ? [{ id: args.course_id, fullname: '' }]
          : (await getMyCourses(ctx.client, ctx.userId)).map((c) => ({
              id: c.id,
              fullname: c.fullname,
            }));

      const reports = await Promise.all(
        courses.map(async (c) => {
          const r = await getCourseGrades(ctx.client, c.id, ctx.userId);
          const usergrade = r.usergrades[0];
          return {
            course_id: c.id,
            course_name: c.fullname || '',
            items:
              usergrade?.gradeitems.map((g) => ({
                itemname: g.itemname,
                itemtype: g.itemtype,
                gradeformatted: g.gradeformatted,
                grademax: g.grademax,
                percentageformatted: g.percentageformatted,
                feedback: g.feedback,
                weightformatted: g.weightformatted,
              })) ?? [],
          };
        }),
      );

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(reports, null, 2) }],
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
