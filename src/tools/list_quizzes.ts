import { z } from 'zod';
import type { ToolDefinition } from './types.js';
import { getQuizzesByCourses } from '../moodle/quizzes.js';
import { getMyCourses } from '../moodle/courses.js';
import { MoodleApiError } from '../errors.js';

const inputSchema = {
  course_ids: z.array(z.number().int().positive()).optional(),
};

export const listQuizzesTool: ToolDefinition<typeof inputSchema> = {
  name: 'list_quizzes',
  description:
    "List quizzes across the student's courses, with open/close times and attempt limits.",
  inputSchema,
  handler: async (args, ctx) => {
    try {
      const courses = args.course_ids
        ? args.course_ids.map((id) => ({ id, fullname: '' }))
        : (await getMyCourses(ctx.client, ctx.userId)).map((c) => ({
            id: c.id,
            fullname: c.fullname,
          }));

      const courseNamesById = new Map(courses.map((c) => [c.id, c.fullname]));
      const response = await getQuizzesByCourses(
        ctx.client,
        courses.map((c) => c.id),
      );

      const shaped = response.quizzes.map((q) => ({
        course_id: q.course,
        course_name: courseNamesById.get(q.course) ?? '',
        quiz_id: q.id,
        name: q.name,
        intro: q.intro,
        timeopen: q.timeopen,
        timeopen_iso: q.timeopen ? new Date(q.timeopen * 1000).toISOString() : null,
        timeclose: q.timeclose,
        timeclose_iso: q.timeclose ? new Date(q.timeclose * 1000).toISOString() : null,
        attempts_allowed: q.attempts,
        time_limit: q.timelimit,
        grade: q.grade,
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
