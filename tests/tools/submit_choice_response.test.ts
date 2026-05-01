import { describe, it, expect } from 'vitest';
import { MoodleClient } from '../../src/moodle/client.js';
import { submitChoiceResponseTool } from '../../src/tools/submit_choice_response.js';
import {
  mswServer,
  http,
  HttpResponse,
  MOODLE_URL,
  MOODLE_TOKEN,
  WS_ENDPOINT,
} from '../helpers/server.js';

describe('submit_choice_response tool', () => {
  it('submits a single choice response', async () => {
    let captured: URLSearchParams | undefined;
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        captured = new URLSearchParams(await request.text());
        return HttpResponse.json({ answers: [{ id: 1 }], warnings: [] });
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await submitChoiceResponseTool.handler(
      { choice_id: 50, response_ids: [10] },
      { client, userId: 42 },
    );
    expect(result.isError).toBeFalsy();
    expect(captured?.get('responses[0]')).toBe('10');
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed.submitted).toBe(true);
    expect(parsed.answers).toEqual([10]);
  });
});
