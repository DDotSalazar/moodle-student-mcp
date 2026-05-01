import { describe, it, expect } from 'vitest';
import { MoodleClient } from '../../src/moodle/client.js';
import { sendMessageTool } from '../../src/tools/send_message.js';
import {
  mswServer,
  http,
  HttpResponse,
  MOODLE_URL,
  MOODLE_TOKEN,
  WS_ENDPOINT,
} from '../helpers/server.js';

describe('send_message tool', () => {
  it('sends a DM and returns message id and timestamp', async () => {
    mswServer.use(
      http.post(WS_ENDPOINT, () =>
        HttpResponse.json([
          { msgid: 12345, useridfrom: 42, conversationid: 7, timecreated: 1751000000 },
        ]),
      ),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await sendMessageTool.handler(
      { to_user_id: 99, text: 'hello' },
      { client, userId: 42 },
    );
    expect(result.isError).toBeFalsy();
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed.message_id).toBe(12345);
    expect(parsed.sent_at_iso).toBe('2025-06-27T04:53:20.000Z');
  });
});
