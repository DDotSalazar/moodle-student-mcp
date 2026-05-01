import { describe, it, expect } from 'vitest';
import { MoodleClient } from '../../src/moodle/client.js';
import { getMyCourses, getCourseContents } from '../../src/moodle/courses.js';
import { mswServer, http, HttpResponse, MOODLE_URL, MOODLE_TOKEN, WS_ENDPOINT } from '../helpers/server.js';

describe('getMyCourses', () => {
  it('calls core_enrol_get_users_courses with the userid', async () => {
    let capturedBody = '';
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        capturedBody = await request.text();
        return HttpResponse.json([
          { id: 1, fullname: 'Intro to CS', shortname: 'CS101', startdate: 1735689600, enddate: 1751673600, progress: 50, lastaccess: 1740000000 },
        ]);
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const courses = await getMyCourses(client, 42);
    const params = new URLSearchParams(capturedBody);
    expect(params.get('wsfunction')).toBe('core_enrol_get_users_courses');
    expect(params.get('userid')).toBe('42');
    expect(courses).toHaveLength(1);
    expect(courses[0]?.fullname).toBe('Intro to CS');
  });
});

describe('getCourseContents', () => {
  it('calls core_course_get_contents with the courseid', async () => {
    let capturedBody = '';
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        capturedBody = await request.text();
        return HttpResponse.json([{ id: 10, name: 'Section 1', summary: '', visible: 1, modules: [] }]);
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const sections = await getCourseContents(client, 7);
    const params = new URLSearchParams(capturedBody);
    expect(params.get('wsfunction')).toBe('core_course_get_contents');
    expect(params.get('courseid')).toBe('7');
    expect(sections).toHaveLength(1);
    expect(sections[0]?.name).toBe('Section 1');
  });
});
