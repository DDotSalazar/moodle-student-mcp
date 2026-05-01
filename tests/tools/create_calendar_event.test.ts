import { describe, it, expect } from 'vitest';
import { MoodleClient } from '../../src/moodle/client.js';
import { createCalendarEventTool } from '../../src/tools/create_calendar_event.js';
import {
  mswServer,
  http,
  HttpResponse,
  MOODLE_URL,
  MOODLE_TOKEN,
  WS_ENDPOINT,
} from '../helpers/server.js';

describe('create_calendar_event tool', () => {
  it('creates a personal event from an ISO timestamp', async () => {
    let captured: URLSearchParams | undefined;
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        captured = new URLSearchParams(await request.text());
        return HttpResponse.json({
          events: [{ id: 999, name: 'Study', timestart: 1751000000 }],
          warnings: [],
        });
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const iso = new Date(1751000000 * 1000).toISOString();
    const result = await createCalendarEventTool.handler(
      { name: 'Study', description: 'Calc', timestart: iso, duration_seconds: 3600 },
      { client, userId: 42 },
    );
    expect(result.isError).toBeFalsy();
    expect(captured?.get('events[0][timestart]')).toBe('1751000000');
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed.event_id).toBe(999);
  });

  it('rejects an unparseable timestart', async () => {
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await createCalendarEventTool.handler(
      { name: 'Study', timestart: 'not a date' },
      { client, userId: 42 },
    );
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toMatch(/timestart/i);
  });
});
