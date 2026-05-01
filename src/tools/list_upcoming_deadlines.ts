import { z } from 'zod';
import type { ToolDefinition } from './types.js';
import { getActionEvents } from '../moodle/calendar.js';
import { MoodleApiError } from '../errors.js';

const inputSchema = {
  days_ahead: z.number().int().min(1).max(90).optional(),
  limit: z.number().int().min(1).max(100).optional(),
};

export const listUpcomingDeadlinesTool: ToolDefinition<typeof inputSchema> = {
  name: 'list_upcoming_deadlines',
  description:
    "List the student's upcoming action items (assignment submissions, quiz attempts, lesson deadlines) sorted by due date. Matches the Moodle dashboard Timeline. Defaults to 14 days, up to 25 items.",
  inputSchema,
  handler: async (args, ctx) => {
    try {
      const days = args.days_ahead ?? 14;
      const limit = args.limit ?? 25;
      const now = Math.floor(Date.now() / 1000);

      const response = await getActionEvents(ctx.client, now, now + days * 86400, limit);

      const shaped = response.events.map((e) => ({
        id: e.id,
        name: e.name,
        course_id: e.course?.id,
        course_name: e.course?.fullname,
        modulename: e.modulename,
        instance: e.instance,
        timestart: e.timestart,
        timestart_iso: new Date(e.timestart * 1000).toISOString(),
        action: e.action,
        description: e.description,
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
