import { z } from 'zod';
import type { ToolDefinition } from './types.js';
import { createUserEvent } from '../moodle/calendar.js';
import { MoodleApiError } from '../errors.js';

const inputSchema = {
  name: z.string().min(1),
  description: z.string().optional(),
  timestart: z.string().min(1),
  duration_seconds: z.number().int().nonnegative().optional(),
  course_id: z.number().int().positive().optional(),
};

export const createCalendarEventTool: ToolDefinition<typeof inputSchema> = {
  name: 'create_calendar_event',
  description: 'Create a personal calendar event for the authenticated student.',
  inputSchema,
  handler: async (args, ctx) => {
    const ms = Date.parse(args.timestart);
    if (Number.isNaN(ms)) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'Error: timestart must be an ISO 8601 datetime string.',
          },
        ],
        isError: true,
      };
    }
    try {
      const r = await createUserEvent(ctx.client, {
        name: args.name,
        description: args.description,
        timestart: Math.floor(ms / 1000),
        durationSeconds: args.duration_seconds,
        courseId: args.course_id,
      });
      const ev = r.events[0];
      if (!ev) {
        return {
          content: [{ type: 'text' as const, text: 'Error: Moodle returned no event.' }],
          isError: true,
        };
      }
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ event_id: ev.id }, null, 2),
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
