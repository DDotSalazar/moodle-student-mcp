import { describe, it, expect } from 'vitest';
import { MoodleClient } from '../../src/moodle/client.js';
import { getQuizzesByCourses, getUserQuizAttempts } from '../../src/moodle/quizzes.js';
import { mswServer, http, HttpResponse, MOODLE_URL, MOODLE_TOKEN, WS_ENDPOINT } from '../helpers/server.js';

describe('getQuizzesByCourses', () => {
  it('calls mod_quiz_get_quizzes_by_courses with bracket-encoded courseids', async () => {
    let capturedBody = '';
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        capturedBody = await request.text();
        return HttpResponse.json({ quizzes: [{ id: 11, course: 7, coursemodule: 22, name: 'Midterm', intro: '', timeopen: 0, timeclose: 0, timelimit: 3600, attempts: 1, grade: 100 }] });
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await getQuizzesByCourses(client, [7]);
    const params = new URLSearchParams(capturedBody);
    expect(params.get('wsfunction')).toBe('mod_quiz_get_quizzes_by_courses');
    expect(params.get('courseids[0]')).toBe('7');
    expect(result.quizzes[0]?.name).toBe('Midterm');
  });
});

describe('getUserQuizAttempts', () => {
  it('calls mod_quiz_get_user_attempts with quizid and userid', async () => {
    let capturedBody = '';
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        capturedBody = await request.text();
        return HttpResponse.json({ attempts: [{ id: 1, quiz: 11, userid: 42, attempt: 1, state: 'finished', timestart: 1740000000, timefinish: 1740003600, sumgrades: 90 }] });
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await getUserQuizAttempts(client, 11, 42);
    const params = new URLSearchParams(capturedBody);
    expect(params.get('wsfunction')).toBe('mod_quiz_get_user_attempts');
    expect(params.get('quizid')).toBe('11');
    expect(params.get('userid')).toBe('42');
    expect(result.attempts[0]?.state).toBe('finished');
  });
});
