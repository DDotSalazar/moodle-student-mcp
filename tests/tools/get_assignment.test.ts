import { describe, it, expect } from 'vitest';
import { MoodleClient } from '../../src/moodle/client.js';
import { getAssignmentTool } from '../../src/tools/get_assignment.js';
import { mswServer, http, HttpResponse, MOODLE_URL, MOODLE_TOKEN, WS_ENDPOINT } from '../helpers/server.js';

describe('get_assignment tool', () => {
  it('returns the assignment plus submission status', async () => {
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        const body = await request.text();
        const params = new URLSearchParams(body);
        const fn = params.get('wsfunction');
        if (fn === 'mod_assign_get_assignments') {
          return HttpResponse.json({
            courses: [{ id: 1, fullname: 'CS101', shortname: 'CS101', assignments: [{ id: 100, cmid: 200, course: 1, name: 'HW1', intro: 'desc', duedate: 1751000000, allowsubmissionsfromdate: 0, gradingduedate: 0, cutoffdate: 0, grade: 100 }] }],
          });
        }
        if (fn === 'mod_assign_get_submission_status') {
          return HttpResponse.json({ lastattempt: { submission: { id: 1, status: 'submitted', timemodified: 0 } }, feedback: { gradefordisplay: '85.0' } });
        }
        return HttpResponse.json({});
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await getAssignmentTool.handler({ assignment_id: 100, course_id: 1 }, { client, userId: 42 });
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed.assignment.name).toBe('HW1');
    expect(parsed.submission.lastattempt.submission.status).toBe('submitted');
    expect(parsed.submission.feedback.gradefordisplay).toBe('85.0');
  });

  it('returns isError when assignment not found in course', async () => {
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        const body = await request.text();
        const params = new URLSearchParams(body);
        const fn = params.get('wsfunction');
        if (fn === 'mod_assign_get_assignments') {
          return HttpResponse.json({ courses: [{ id: 1, fullname: 'CS101', shortname: 'CS101', assignments: [] }] });
        }
        return HttpResponse.json({});
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await getAssignmentTool.handler({ assignment_id: 999, course_id: 1 }, { client, userId: 42 });
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toMatch(/not found/i);
  });
});
