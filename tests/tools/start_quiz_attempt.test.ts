import { describe, it, expect } from 'vitest';
import { MoodleClient } from '../../src/moodle/client.js';
import { startQuizAttemptTool } from '../../src/tools/start_quiz_attempt.js';
import {
  mswServer,
  http,
  HttpResponse,
  MOODLE_URL,
  MOODLE_TOKEN,
  WS_ENDPOINT,
} from '../helpers/server.js';

const oneQuestionHtml = `<div class="que multichoice">
  <div class="qtext"><p>Pick A</p></div>
  <div class="answer"><input type="radio" name="q1:42_answer" value="0"/> A</div>
</div>`;

describe('start_quiz_attempt tool', () => {
  it('starts a new attempt and returns normalised questions', async () => {
    const calls: string[] = [];
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        const params = new URLSearchParams(await request.text());
        const fn = params.get('wsfunction') ?? '';
        calls.push(fn);
        if (fn === 'mod_quiz_get_user_attempts') return HttpResponse.json({ attempts: [] });
        if (fn === 'mod_quiz_start_attempt')
          return HttpResponse.json({
            attempt: { id: 555, state: 'inprogress', timestart: 1, layout: '1' },
            warnings: [],
          });
        if (fn === 'mod_quiz_get_attempt_data')
          return HttpResponse.json({
            attempt: { id: 555, state: 'inprogress', timestart: 1 },
            questions: [{ slot: 1, type: 'multichoice', html: oneQuestionHtml, page: 0 }],
            nextpage: -1,
            warnings: [],
          });
        return HttpResponse.json({});
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await startQuizAttemptTool.handler({ quiz_id: 10 }, { client, userId: 42 });
    expect(result.isError).toBeFalsy();
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed.attempt_id).toBe(555);
    expect(parsed.questions).toHaveLength(1);
    expect(parsed.questions[0].type).toBe('multichoice');
    expect(parsed.questions[0].raw_form_fields).toEqual({ slot: '1', qid: '42' });
    expect(calls[0]).toBe('mod_quiz_get_user_attempts');
    expect(calls[1]).toBe('mod_quiz_start_attempt');
    expect(calls[2]).toBe('mod_quiz_get_attempt_data');
  });

  it('resumes an in-progress attempt without calling start_attempt', async () => {
    const calls: string[] = [];
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        const fn = new URLSearchParams(await request.text()).get('wsfunction') ?? '';
        calls.push(fn);
        if (fn === 'mod_quiz_get_user_attempts')
          return HttpResponse.json({
            attempts: [{ id: 600, quiz: 10, state: 'inprogress', timestart: 100, timefinish: 0 }],
          });
        if (fn === 'mod_quiz_get_attempt_data')
          return HttpResponse.json({
            attempt: { id: 600, state: 'inprogress', timestart: 100 },
            questions: [],
            nextpage: -1,
            warnings: [],
          });
        return HttpResponse.json({});
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await startQuizAttemptTool.handler({ quiz_id: 10 }, { client, userId: 42 });
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed.attempt_id).toBe(600);
    expect(calls).not.toContain('mod_quiz_start_attempt');
  });

  it('walks multiple pages until nextpage is -1', async () => {
    let pages = 0;
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        const params = new URLSearchParams(await request.text());
        const fn = params.get('wsfunction') ?? '';
        if (fn === 'mod_quiz_get_user_attempts') return HttpResponse.json({ attempts: [] });
        if (fn === 'mod_quiz_start_attempt')
          return HttpResponse.json({
            attempt: { id: 700, state: 'inprogress', timestart: 1, layout: '1,2' },
            warnings: [],
          });
        if (fn === 'mod_quiz_get_attempt_data') {
          const page = Number(params.get('page'));
          pages++;
          return HttpResponse.json({
            attempt: { id: 700 },
            questions: [
              {
                slot: page + 1,
                type: 'truefalse',
                html:
                  '<div class="que truefalse"><input name="q' +
                  (page + 1) +
                  ':99_answer" value="1"/></div>',
                page,
              },
            ],
            nextpage: page === 0 ? 1 : -1,
            warnings: [],
          });
        }
        return HttpResponse.json({});
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await startQuizAttemptTool.handler({ quiz_id: 10 }, { client, userId: 42 });
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed.questions).toHaveLength(2);
    expect(pages).toBe(2);
  });
});
