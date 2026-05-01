import { describe, it, expect } from 'vitest';
import { MoodleClient } from '../../src/moodle/client.js';
import { listUpcomingEventsTool } from '../../src/tools/list_upcoming_events.js';
import { mswServer, http, HttpResponse, MOODLE_URL, MOODLE_TOKEN, WS_ENDPOINT } from '../helpers/server.js';

describe('list_upcoming_events tool', () => {
  it('returns events filtered by days_ahead', async () => {
    const now = Math.floor(Date.now() / 1000);
    mswServer.use(
      http.post(WS_ENDPOINT, () =>
        HttpResponse.json({
          events: [
            { id: 1, name: 'Soon', description: '', eventtype: 'course', timestart: now + 60 * 60, timeduration: 0, courseid: 7 },
            { id: 2, name: 'Far', description: '', eventtype: 'course', timestart: now + 86400 * 60, timeduration: 0, courseid: 7 },
          ],
        }),
      ),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await listUpcomingEventsTool.handler({ days_ahead: 7 }, { client, userId: 42 });
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe('Soon');
    expect(parsed[0].timestart_iso).toBeDefined();
  });

  it('defaults days_ahead to 14', async () => {
    const now = Math.floor(Date.now() / 1000);
    mswServer.use(
      http.post(WS_ENDPOINT, () =>
        HttpResponse.json({
          events: [
            { id: 1, name: 'A', description: '', eventtype: 'course', timestart: now + 86400 * 10, timeduration: 0 },
            { id: 2, name: 'B', description: '', eventtype: 'course', timestart: now + 86400 * 20, timeduration: 0 },
          ],
        }),
      ),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await listUpcomingEventsTool.handler({}, { client, userId: 42 });
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe('A');
  });
});
