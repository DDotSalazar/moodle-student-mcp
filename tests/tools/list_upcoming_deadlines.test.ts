import { describe, it, expect } from 'vitest';
import { MoodleClient } from '../../src/moodle/client.js';
import { listUpcomingDeadlinesTool } from '../../src/tools/list_upcoming_deadlines.js';
import { mswServer, http, HttpResponse, MOODLE_URL, MOODLE_TOKEN, WS_ENDPOINT } from '../helpers/server.js';

describe('list_upcoming_deadlines tool', () => {
  it('calls action_events_by_timesort with the right window and returns shaped events', async () => {
    let capturedFrom: string | null = null;
    let capturedTo: string | null = null;
    let capturedLimit: string | null = null;
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        const body = await request.text();
        const params = new URLSearchParams(body);
        if (params.get('wsfunction') === 'core_calendar_get_action_events_by_timesort') {
          capturedFrom = params.get('timesortfrom');
          capturedTo = params.get('timesortto');
          capturedLimit = params.get('limitnum');
          return HttpResponse.json({
            events: [
              { id: 99, name: 'HW1 due', description: '', modulename: 'assign', instance: 100, timestart: 1751000000, course: { id: 7, fullname: 'CS101', shortname: 'CS101' }, action: { name: 'Submit assignment', url: 'https://moodle/example', itemcount: 1, actionable: true } },
            ],
          });
        }
        return HttpResponse.json({});
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await listUpcomingDeadlinesTool.handler({ days_ahead: 7, limit: 10 }, { client, userId: 42 });
    expect(capturedFrom).toBeTruthy();
    expect(capturedTo).toBeTruthy();
    expect(capturedLimit).toBe('10');
    expect(Number(capturedTo) - Number(capturedFrom)).toBe(7 * 86400);
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed[0].course_name).toBe('CS101');
    expect(parsed[0].action.name).toBe('Submit assignment');
    expect(parsed[0].timestart_iso).toBeDefined();
  });

  it('uses defaults: 14 days, 25 events', async () => {
    let capturedLimit: string | null = null;
    let capturedFrom: string | null = null;
    let capturedTo: string | null = null;
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        const body = await request.text();
        const params = new URLSearchParams(body);
        capturedFrom = params.get('timesortfrom');
        capturedTo = params.get('timesortto');
        capturedLimit = params.get('limitnum');
        return HttpResponse.json({ events: [] });
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    await listUpcomingDeadlinesTool.handler({}, { client, userId: 42 });
    expect(capturedLimit).toBe('25');
    expect(Number(capturedTo) - Number(capturedFrom)).toBe(14 * 86400);
  });
});
