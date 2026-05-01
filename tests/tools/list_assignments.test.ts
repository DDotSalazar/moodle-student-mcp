import { describe, it, expect } from 'vitest';
import { MoodleClient } from '../../src/moodle/client.js';
import { listAssignmentsTool } from '../../src/tools/list_assignments.js';
import { mswServer, http, HttpResponse, MOODLE_URL, MOODLE_TOKEN, WS_ENDPOINT } from '../helpers/server.js';

describe('list_assignments tool', () => {
  it('uses provided course_ids and flattens assignments with course_name', async () => {
    const capturedFn: string[] = [];
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        const body = await request.text();
        const fn = new URLSearchParams(body).get('wsfunction');
        if (fn) capturedFn.push(fn);
        if (fn === 'mod_assign_get_assignments') {
          return HttpResponse.json({
            courses: [{ id: 1, fullname: 'CS101', shortname: 'CS101', assignments: [{ id: 100, cmid: 200, course: 1, name: 'HW1', intro: 'do it', duedate: 1751000000, allowsubmissionsfromdate: 0, gradingduedate: 0, cutoffdate: 0, grade: 100 }] }],
          });
        }
        return HttpResponse.json({});
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await listAssignmentsTool.handler({ course_ids: [1] }, { client, userId: 42 });
    expect(capturedFn).toEqual(['mod_assign_get_assignments']);
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].course_name).toBe('CS101');
    expect(parsed[0].assignment_id).toBe(100);
    expect(parsed[0].name).toBe('HW1');
  });

  it('falls back to enrolled courses when no course_ids', async () => {
    const calls: string[] = [];
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        const body = await request.text();
        const params = new URLSearchParams(body);
        const fn = params.get('wsfunction')!;
        calls.push(fn);
        if (fn === 'core_enrol_get_users_courses') {
          return HttpResponse.json([{ id: 1, fullname: 'CS101', shortname: 'CS101', startdate: 0, enddate: 0 }]);
        }
        if (fn === 'mod_assign_get_assignments') {
          expect(params.get('courseids[0]')).toBe('1');
          return HttpResponse.json({ courses: [] });
        }
        return HttpResponse.json({});
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    await listAssignmentsTool.handler({}, { client, userId: 42 });
    expect(calls).toEqual(['core_enrol_get_users_courses', 'mod_assign_get_assignments']);
  });

  it('includes submission status when requested', async () => {
    const calls: string[] = [];
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        const body = await request.text();
        const params = new URLSearchParams(body);
        const fn = params.get('wsfunction')!;
        calls.push(fn);
        if (fn === 'mod_assign_get_assignments') {
          return HttpResponse.json({
            courses: [{ id: 1, fullname: 'CS101', shortname: 'CS101', assignments: [{ id: 100, cmid: 200, course: 1, name: 'HW1', intro: '', duedate: 0, allowsubmissionsfromdate: 0, gradingduedate: 0, cutoffdate: 0, grade: 100 }] }],
          });
        }
        if (fn === 'mod_assign_get_submission_status') {
          return HttpResponse.json({ lastattempt: { submission: { id: 1, status: 'submitted', timemodified: 0 } } });
        }
        return HttpResponse.json({});
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await listAssignmentsTool.handler({ course_ids: [1], include_submission_status: true }, { client, userId: 42 });
    expect(calls).toContain('mod_assign_get_submission_status');
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed[0].has_submitted).toBe(true);
  });
});
