import { z } from 'zod';
import type { ToolDefinition } from './types.js';
import { getAssignments, getSubmissionStatus } from '../moodle/assignments.js';
import { MoodleApiError } from '../errors.js';

const inputSchema = {
  assignment_id: z.number().int().positive(),
  course_id: z.number().int().positive(),
};

export const getAssignmentTool: ToolDefinition<typeof inputSchema> = {
  name: 'get_assignment',
  description:
    "Get full details for one assignment plus the student's own submission status, files, grade, and feedback. Requires both assignment_id and course_id (use list_assignments or list_courses to find these).",
  inputSchema,
  handler: async (args, ctx) => {
    try {
      const [assignmentsResponse, submission] = await Promise.all([
        getAssignments(ctx.client, [args.course_id]),
        getSubmissionStatus(ctx.client, args.assignment_id, ctx.userId),
      ]);

      const course = assignmentsResponse.courses.find((c) => c.id === args.course_id);
      const assignment = course?.assignments.find((a) => a.id === args.assignment_id);

      if (!assignment) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: Assignment ${args.assignment_id} not found in course ${args.course_id}.`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                assignment: {
                  ...assignment,
                  course_name: course?.fullname,
                  duedate_iso: assignment.duedate
                    ? new Date(assignment.duedate * 1000).toISOString()
                    : null,
                },
                submission,
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
