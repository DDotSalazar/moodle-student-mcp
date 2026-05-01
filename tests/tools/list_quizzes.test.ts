import { describe, it, expect } from 'vitest';
import { MoodleClient } from '../../src/moodle/client.js';
import { listQuizzesTool } from '../../src/tools/list_quizzes.js';
import { mswServer, http, HttpResponse, MOODLE_URL, MOODLE_TOKEN, WS_ENDPOINT } from '../helpers/server.js';

describe('list_quizzes tool', () => {
  it('returns quizzes joined with course name', async () => {
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        const body = await request.text();
        const params = new URLSearchParams(body);
        if (params.get('wsfunction') === 'core_enrol_get_users_courses') {
          return HttpResponse.json([{ id: 7, fullname: 'CS101', shortname: 'CS101', startdate: 0, enddate: 0 }]);
        }
        if (params.get('wsfunction') === 'mod_quiz_get_quizzes_by_courses') {
          return HttpResponse.json({ quizzes: [{ id: 11, course: 7, coursemodule: 22, name: 'Midterm', intro: '', timeopen: 0, timeclose: 0, timelimit: 3600, attempts: 1, grade: 100 }] });
        }
        return HttpResponse.json({});
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await listQuizzesTool.handler({}, { client, userId: 42 });
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed[0].course_id).toBe(7);
    expect(parsed[0].course_name).toBe('CS101');
    expect(parsed[0].quiz_id).toBe(11);
    expect(parsed[0].name).toBe('Midterm');
  });
});
