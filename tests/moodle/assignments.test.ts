import { describe, it, expect } from 'vitest';
import { MoodleClient } from '../../src/moodle/client.js';
import { getAssignments, getSubmissionStatus } from '../../src/moodle/assignments.js';
import {
  mswServer,
  http,
  HttpResponse,
  MOODLE_URL,
  MOODLE_TOKEN,
  WS_ENDPOINT,
} from '../helpers/server.js';

describe('getAssignments', () => {
  it('calls mod_assign_get_assignments with bracket-encoded courseids', async () => {
    let capturedBody = '';
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        capturedBody = await request.text();
        return HttpResponse.json({
          courses: [
            {
              id: 1,
              fullname: 'CS101',
              shortname: 'CS101',
              assignments: [
                {
                  id: 100,
                  cmid: 200,
                  course: 1,
                  name: 'HW1',
                  intro: 'do it',
                  duedate: 1751000000,
                  allowsubmissionsfromdate: 0,
                  gradingduedate: 0,
                  cutoffdate: 0,
                  grade: 100,
                },
              ],
            },
          ],
        });
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await getAssignments(client, [1, 2]);
    const params = new URLSearchParams(capturedBody);
    expect(params.get('wsfunction')).toBe('mod_assign_get_assignments');
    expect(params.get('courseids[0]')).toBe('1');
    expect(params.get('courseids[1]')).toBe('2');
    expect(result.courses[0]?.assignments[0]?.name).toBe('HW1');
  });
});

describe('getSubmissionStatus', () => {
  it('calls mod_assign_get_submission_status with assignid and userid', async () => {
    let capturedBody = '';
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        capturedBody = await request.text();
        return HttpResponse.json({
          lastattempt: { submission: { id: 1, status: 'submitted', timemodified: 1740000000 } },
        });
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const status = await getSubmissionStatus(client, 100, 42);
    const params = new URLSearchParams(capturedBody);
    expect(params.get('wsfunction')).toBe('mod_assign_get_submission_status');
    expect(params.get('assignid')).toBe('100');
    expect(params.get('userid')).toBe('42');
    expect(status.lastattempt?.submission?.status).toBe('submitted');
  });
});

import { saveSubmission, submitForGrading } from '../../src/moodle/assignments.js';

describe('saveSubmission', () => {
  it('posts plugindata for online text and files', async () => {
    let captured: URLSearchParams | undefined;
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        const body = await request.text();
        captured = new URLSearchParams(body);
        return HttpResponse.json([]);
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    await saveSubmission(client, 100, { text: '<p>hi</p>', textFormat: 1, fileItemId: 999 });
    expect(captured?.get('wsfunction')).toBe('mod_assign_save_submission');
    expect(captured?.get('assignmentid')).toBe('100');
    expect(captured?.get('plugindata[onlinetext_editor][text]')).toBe('<p>hi</p>');
    expect(captured?.get('plugindata[onlinetext_editor][format]')).toBe('1');
    expect(captured?.get('plugindata[onlinetext_editor][itemid]')).toBe('0');
    expect(captured?.get('plugindata[files_filemanager]')).toBe('999');
  });
});

describe('submitForGrading', () => {
  it('posts the assignment id with acceptsubmissionstatement=1', async () => {
    let captured: URLSearchParams | undefined;
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        captured = new URLSearchParams(await request.text());
        return HttpResponse.json([]);
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    await submitForGrading(client, 100);
    expect(captured?.get('wsfunction')).toBe('mod_assign_submit_for_grading');
    expect(captured?.get('assignmentid')).toBe('100');
    expect(captured?.get('acceptsubmissionstatement')).toBe('1');
  });
});
