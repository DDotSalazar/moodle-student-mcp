import { describe, it, expect } from 'vitest';
import { MoodleClient } from '../../src/moodle/client.js';
import { getGradesTool } from '../../src/tools/get_grades.js';
import { mswServer, http, HttpResponse, MOODLE_URL, MOODLE_TOKEN, WS_ENDPOINT } from '../helpers/server.js';

describe('get_grades tool', () => {
  it('returns grades for a single course', async () => {
    let capturedCourseId: string | null = null;
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        const body = await request.text();
        const params = new URLSearchParams(body);
        if (params.get('wsfunction') === 'gradereport_user_get_grade_items') {
          capturedCourseId = params.get('courseid');
          return HttpResponse.json({
            usergrades: [{ courseid: 7, userid: 42, userfullname: 'Stu Dent', gradeitems: [{ itemname: 'HW1', itemtype: 'mod', gradeformatted: '85.0', graderaw: 85, grademax: 100, percentageformatted: '85.0 %', feedback: '' }] }],
          });
        }
        return HttpResponse.json({});
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await getGradesTool.handler({ course_id: 7 }, { client, userId: 42 });
    expect(capturedCourseId).toBe('7');
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].course_id).toBe(7);
    expect(parsed[0].items[0].itemname).toBe('HW1');
  });

  it('fans out across all courses when course_id is omitted', async () => {
    const calls: string[] = [];
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        const body = await request.text();
        const params = new URLSearchParams(body);
        const fn = params.get('wsfunction')!;
        calls.push(`${fn}:${params.get('courseid') ?? ''}`);
        if (fn === 'core_enrol_get_users_courses') {
          return HttpResponse.json([
            { id: 1, fullname: 'A', shortname: 'A', startdate: 0, enddate: 0 },
            { id: 2, fullname: 'B', shortname: 'B', startdate: 0, enddate: 0 },
          ]);
        }
        if (fn === 'gradereport_user_get_grade_items') {
          const cid = Number(params.get('courseid'));
          return HttpResponse.json({ usergrades: [{ courseid: cid, userid: 42, userfullname: 'Stu', gradeitems: [] }] });
        }
        return HttpResponse.json({});
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await getGradesTool.handler({}, { client, userId: 42 });
    expect(calls).toContain('core_enrol_get_users_courses:');
    expect(calls).toContain('gradereport_user_get_grade_items:1');
    expect(calls).toContain('gradereport_user_get_grade_items:2');
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed).toHaveLength(2);
  });
});
