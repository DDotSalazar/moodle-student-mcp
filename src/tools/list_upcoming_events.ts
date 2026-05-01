import { z } from 'zod';
import type { ToolDefinition } from './types.js';
import { getUpcomingEvents } from '../moodle/calendar.js';
import { MoodleApiError } from '../errors.js';

const inputSchema = {
  days_ahead: z.number().int().min(1).max(90).optional(),
};

export const listUpcomingEventsTool: ToolDefinition<typeof inputSchema> = {
  name: 'list_upcoming_events',
  description:
    'List upcoming calendar events for the student over the next N days (default 14, max 90). Includes both action items and general events such as class meetings.',
  inputSchema,
  handler: async (args, ctx) => {
    try {
      const days = args.days_ahead ?? 14;
      const now = Math.floor(Date.now() / 1000);
      const cutoff = now + days * 86400;

      const response = await getUpcomingEvents(ctx.client);

      const filtered = response.events
        .filter((e) => e.timestart <= cutoff)
        .map((e) => ({
          id: e.id,
          name: e.name,
          type: e.eventtype,
          course_id: e.courseid ?? e.course?.id,
          course_name: e.course?.fullname,
          timestart: e.timestart,
          timestart_iso: new Date(e.timestart * 1000).toISOString(),
          description: e.description,
        }));

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(filtered, null, 2) }],
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
