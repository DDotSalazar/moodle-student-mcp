import { describe, it, expect } from 'vitest';
import { MoodleClient } from '../../src/moodle/client.js';
import { getSiteInfo } from '../../src/moodle/site.js';
import { mswServer, http, HttpResponse, MOODLE_URL, MOODLE_TOKEN, WS_ENDPOINT } from '../helpers/server.js';

describe('getSiteInfo', () => {
  it('calls core_webservice_get_site_info and returns userid', async () => {
    let capturedBody = '';
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        capturedBody = await request.text();
        return HttpResponse.json({ sitename: 'Test Moodle', username: 'student1', firstname: 'Stu', lastname: 'Dent', fullname: 'Stu Dent', userid: 42, release: '4.3', version: '2023100900' });
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const info = await getSiteInfo(client);
    const params = new URLSearchParams(capturedBody);
    expect(params.get('wsfunction')).toBe('core_webservice_get_site_info');
    expect(info.userid).toBe(42);
    expect(info.sitename).toBe('Test Moodle');
  });
});
