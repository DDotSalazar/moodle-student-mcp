import { describe, it, expect } from 'vitest';
import { MoodleClient } from '../../src/moodle/client.js';
import { getCourseGrades } from '../../src/moodle/grades.js';
import { mswServer, http, HttpResponse, MOODLE_URL, MOODLE_TOKEN, WS_ENDPOINT } from '../helpers/server.js';

describe('getCourseGrades', () => {
  it('calls gradereport_user_get_grade_items with courseid and userid', async () => {
    let capturedBody = '';
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        capturedBody = await request.text();
        return HttpResponse.json({
          usergrades: [{ courseid: 7, userid: 42, userfullname: 'Student Test', gradeitems: [{ itemname: 'HW1', itemtype: 'mod', gradeformatted: '85.0', graderaw: 85, grademax: 100, percentageformatted: '85.0 %', feedback: 'Nice work' }] }],
        });
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await getCourseGrades(client, 7, 42);
    const params = new URLSearchParams(capturedBody);
    expect(params.get('wsfunction')).toBe('gradereport_user_get_grade_items');
    expect(params.get('courseid')).toBe('7');
    expect(params.get('userid')).toBe('42');
    expect(result.usergrades[0]?.gradeitems[0]?.gradeformatted).toBe('85.0');
  });
});
