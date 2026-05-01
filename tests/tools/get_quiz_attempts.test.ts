import { describe, it, expect } from 'vitest';
import { MoodleClient } from '../../src/moodle/client.js';
import { getQuizAttemptsTool } from '../../src/tools/get_quiz_attempts.js';
import { mswServer, http, HttpResponse, MOODLE_URL, MOODLE_TOKEN, WS_ENDPOINT } from '../helpers/server.js';

describe('get_quiz_attempts tool', () => {
  it('returns the user attempts for a quiz', async () => {
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        const body = await request.text();
        const params = new URLSearchParams(body);
        expect(params.get('wsfunction')).toBe('mod_quiz_get_user_attempts');
        expect(params.get('quizid')).toBe('11');
        expect(params.get('userid')).toBe('42');
        return HttpResponse.json({
          attempts: [{ id: 1, quiz: 11, userid: 42, attempt: 1, state: 'finished', timestart: 1740000000, timefinish: 1740003600, sumgrades: 90 }],
        });
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await getQuizAttemptsTool.handler({ quiz_id: 11 }, { client, userId: 42 });
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed[0].state).toBe('finished');
    expect(parsed[0].sumgrades).toBe(90);
    expect(parsed[0].timestart_iso).toBeDefined();
  });
});
