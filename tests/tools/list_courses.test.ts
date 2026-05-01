import { describe, it, expect } from 'vitest';
import { MoodleClient } from '../../src/moodle/client.js';
import { listCoursesTool } from '../../src/tools/list_courses.js';
import { mswServer, http, HttpResponse, MOODLE_URL, MOODLE_TOKEN, WS_ENDPOINT } from '../helpers/server.js';

describe('list_courses tool', () => {
  it('returns enrolled courses as JSON text content', async () => {
    mswServer.use(
      http.post(WS_ENDPOINT, () =>
        HttpResponse.json([
          { id: 1, fullname: 'Intro to CS', shortname: 'CS101', startdate: 1735689600, enddate: 1751673600, progress: 50, lastaccess: 1740000000 },
        ]),
      ),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await listCoursesTool.handler({}, { client, userId: 42 });
    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed[0].fullname).toBe('Intro to CS');
  });

  it('returns isError on Moodle exception', async () => {
    mswServer.use(
      http.post(WS_ENDPOINT, () =>
        HttpResponse.json({ exception: 'moodle_exception', errorcode: 'invalidtoken', message: 'bad token' }),
      ),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await listCoursesTool.handler({}, { client, userId: 42 });
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toMatch(/invalid or expired/);
  });
});
