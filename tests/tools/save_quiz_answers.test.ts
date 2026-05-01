import { describe, it, expect } from 'vitest';
import { MoodleClient } from '../../src/moodle/client.js';
import { saveQuizAnswersTool } from '../../src/tools/save_quiz_answers.js';
import {
  mswServer,
  http,
  HttpResponse,
  MOODLE_URL,
  MOODLE_TOKEN,
  WS_ENDPOINT,
} from '../helpers/server.js';

describe('save_quiz_answers tool', () => {
  it('encodes a multichoice single answer and saves it', async () => {
    let captured: URLSearchParams | undefined;
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        captured = new URLSearchParams(await request.text());
        return HttpResponse.json({ status: true, warnings: [] });
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await saveQuizAnswersTool.handler(
      {
        attempt_id: 555,
        answers: [
          {
            slot: 1,
            type: 'multichoice',
            multiselect: false,
            raw_form_fields: { slot: '1', qid: '42' },
            value: { option_index: 1 },
          },
        ],
      },
      { client, userId: 42 },
    );
    expect(result.isError).toBeFalsy();
    expect(captured?.get('wsfunction')).toBe('mod_quiz_save_attempt');
    expect(captured?.get('attemptid')).toBe('555');
    expect(captured?.get('data[0][name]')).toBe('q1:42_answer');
    expect(captured?.get('data[0][value]')).toBe('1');
  });

  it('rejects unsupported question types', async () => {
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await saveQuizAnswersTool.handler(
      {
        attempt_id: 555,
        answers: [
          {
            slot: 1,
            type: 'unsupported',
            raw_form_fields: { slot: '1', qid: '42' },
            value: { value: true },
          },
        ],
      },
      { client, userId: 42 },
    );
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toMatch(/unsupported question type/i);
  });
});
