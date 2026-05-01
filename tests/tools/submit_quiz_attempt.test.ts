import { describe, it, expect } from 'vitest';
import { MoodleClient } from '../../src/moodle/client.js';
import { submitQuizAttemptTool } from '../../src/tools/submit_quiz_attempt.js';
import {
  mswServer,
  http,
  HttpResponse,
  MOODLE_URL,
  MOODLE_TOKEN,
  WS_ENDPOINT,
} from '../helpers/server.js';

describe('submit_quiz_attempt tool', () => {
  it('finalises the attempt with finishattempt=1', async () => {
    let captured: URLSearchParams | undefined;
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        captured = new URLSearchParams(await request.text());
        return HttpResponse.json({ state: 'finished', warnings: [] });
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await submitQuizAttemptTool.handler({ attempt_id: 555 }, { client, userId: 42 });
    expect(result.isError).toBeFalsy();
    expect(captured?.get('wsfunction')).toBe('mod_quiz_process_attempt');
    expect(captured?.get('finishattempt')).toBe('1');
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed.finalised).toBe(true);
    expect(parsed.state).toBe('finished');
  });
});
