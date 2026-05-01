import { describe, it, expect } from 'vitest';
import { MoodleClient } from '../../src/moodle/client.js';
import { submitChoiceResponse } from '../../src/moodle/choice.js';
import {
  mswServer,
  http,
  HttpResponse,
  MOODLE_URL,
  MOODLE_TOKEN,
  WS_ENDPOINT,
} from '../helpers/server.js';

describe('submitChoiceResponse', () => {
  it('posts choiceid and responses array', async () => {
    let captured: URLSearchParams | undefined;
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        captured = new URLSearchParams(await request.text());
        return HttpResponse.json({ answers: [{ id: 1 }], warnings: [] });
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    await submitChoiceResponse(client, 50, [10, 12]);
    expect(captured?.get('wsfunction')).toBe('mod_choice_submit_choice_response');
    expect(captured?.get('choiceid')).toBe('50');
    expect(captured?.get('responses[0]')).toBe('10');
    expect(captured?.get('responses[1]')).toBe('12');
  });
});
