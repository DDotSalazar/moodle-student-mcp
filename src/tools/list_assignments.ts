import { z } from 'zod';
import type { ToolDefinition } from './types.js';
import { getAssignments, getSubmissionStatus } from '../moodle/assignments.js';
import { getMyCourses } from '../moodle/courses.js';
import { MoodleApiError } from '../errors.js';

const inputSchema = {
  course_ids: z.array(z.number().int().positive()).optional(),
  include_submission_status: z.boolean().optional(),
};

export const listAssignmentsTool: ToolDefinition<typeof inputSchema> = {
  name: 'list_assignments',
  description:
    "List assignments across the student's courses with due dates and basic info. Optionally include the student's submission status per assignment.",
  inputSchema,
  handler: async (args, ctx) => {
    try {
      const courseIds =
        args.course_ids ?? (await getMyCourses(ctx.client, ctx.userId)).map((c) => c.id);

      const response = await getAssignments(ctx.client, courseIds);

      const flat = response.courses.flatMap((course) =>
        course.assignments.map((a) => ({
          course_id: course.id,
          course_name: course.fullname,
          assignment_id: a.id,
          cmid: a.cmid,
          name: a.name,
          intro: a.intro,
          duedate: a.duedate,
          duedate_iso: a.duedate ? new Date(a.duedate * 1000).toISOString() : null,
          allowsubmissionsfromdate: a.allowsubmissionsfromdate,
          gradingduedate: a.gradingduedate,
          cutoffdate: a.cutoffdate,
        })),
      );

      if (args.include_submission_status) {
        const enriched = await Promise.all(
          flat.map(async (a) => {
            const status = await getSubmissionStatus(ctx.client, a.assignment_id, ctx.userId);
            return {
              ...a,
              submission_status: status.lastattempt?.submission?.status ?? 'new',
              has_submitted: status.lastattempt?.submission?.status === 'submitted',
            };
          }),
        );
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(enriched, null, 2) }],
        };
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(flat, null, 2) }],
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
