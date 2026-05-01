import { describe, it, expect } from 'vitest';
import { MoodleClient } from '../../src/moodle/client.js';
import { getQuizzesByCourses, getUserQuizAttempts } from '../../src/moodle/quizzes.js';
import {
  mswServer,
  http,
  HttpResponse,
  MOODLE_URL,
  MOODLE_TOKEN,
  WS_ENDPOINT,
} from '../helpers/server.js';

describe('getQuizzesByCourses', () => {
  it('calls mod_quiz_get_quizzes_by_courses with bracket-encoded courseids', async () => {
    let capturedBody = '';
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        capturedBody = await request.text();
        return HttpResponse.json({
          quizzes: [
            {
              id: 11,
              course: 7,
              coursemodule: 22,
              name: 'Midterm',
              intro: '',
              timeopen: 0,
              timeclose: 0,
              timelimit: 3600,
              attempts: 1,
              grade: 100,
            },
          ],
        });
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
        return HttpResponse.json({
          attempts: [
            {
              id: 1,
              quiz: 11,
              userid: 42,
              attempt: 1,
              state: 'finished',
              timestart: 1740000000,
              timefinish: 1740003600,
              sumgrades: 90,
            },
          ],
        });
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

import {
  startAttempt,
  getUnfinishedAttempt,
  getAttemptData,
  saveAttempt,
  processAttempt,
} from '../../src/moodle/quizzes.js';

describe('quiz attempt flow wrappers', () => {
  it('startAttempt calls mod_quiz_start_attempt with quizid', async () => {
    let captured: URLSearchParams | undefined;
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        captured = new URLSearchParams(await request.text());
        return HttpResponse.json({
          attempt: { id: 555, state: 'inprogress', timestart: 1, layout: '1,0' },
          warnings: [],
        });
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await startAttempt(client, 10);
    expect(captured?.get('wsfunction')).toBe('mod_quiz_start_attempt');
    expect(captured?.get('quizid')).toBe('10');
    expect(result.attempt.id).toBe(555);
  });

  it('getUnfinishedAttempt returns the first in-progress attempt or null', async () => {
    mswServer.use(
      http.post(WS_ENDPOINT, () =>
        HttpResponse.json({
          attempts: [{ id: 600, quiz: 10, state: 'inprogress', timestart: 100, timefinish: 0 }],
        }),
      ),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const a = await getUnfinishedAttempt(client, 10, 42);
    expect(a?.id).toBe(600);
  });

  it('getUnfinishedAttempt returns null when none in progress', async () => {
    mswServer.use(http.post(WS_ENDPOINT, () => HttpResponse.json({ attempts: [] })));
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    expect(await getUnfinishedAttempt(client, 10, 42)).toBeNull();
  });

  it('getAttemptData fetches a page of questions', async () => {
    let captured: URLSearchParams | undefined;
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        captured = new URLSearchParams(await request.text());
        return HttpResponse.json({
          attempt: { id: 555 },
          questions: [{ slot: 1, type: 'multichoice', html: '<div></div>', page: 0 }],
          nextpage: -1,
          warnings: [],
        });
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await getAttemptData(client, 555, 0);
    expect(captured?.get('wsfunction')).toBe('mod_quiz_get_attempt_data');
    expect(captured?.get('attemptid')).toBe('555');
    expect(captured?.get('page')).toBe('0');
    expect(result.nextpage).toBe(-1);
  });

  it('saveAttempt encodes data array correctly', async () => {
    let captured: URLSearchParams | undefined;
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        captured = new URLSearchParams(await request.text());
        return HttpResponse.json({ status: true, warnings: [] });
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    await saveAttempt(client, 555, [
      { name: 'q1:42_answer', value: '1' },
      { name: 'q2:43_answer', value: 'Paris' },
    ]);
    expect(captured?.get('wsfunction')).toBe('mod_quiz_save_attempt');
    expect(captured?.get('attemptid')).toBe('555');
    expect(captured?.get('data[0][name]')).toBe('q1:42_answer');
    expect(captured?.get('data[0][value]')).toBe('1');
    expect(captured?.get('data[1][name]')).toBe('q2:43_answer');
  });

  it('processAttempt with finishattempt=1 finalises', async () => {
    let captured: URLSearchParams | undefined;
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        captured = new URLSearchParams(await request.text());
        return HttpResponse.json({ state: 'finished', warnings: [] });
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const r = await processAttempt(client, 555, [], true);
    expect(captured?.get('wsfunction')).toBe('mod_quiz_process_attempt');
    expect(captured?.get('finishattempt')).toBe('1');
    expect(captured?.get('timeup')).toBe('0');
    expect(r.state).toBe('finished');
  });
});
