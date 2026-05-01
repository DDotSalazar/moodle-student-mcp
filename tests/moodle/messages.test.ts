import { describe, it, expect } from 'vitest';
import { MoodleClient } from '../../src/moodle/client.js';
import { sendInstantMessages, markMessageRead } from '../../src/moodle/messages.js';
import {
  mswServer,
  http,
  HttpResponse,
  MOODLE_URL,
  MOODLE_TOKEN,
  WS_ENDPOINT,
} from '../helpers/server.js';

describe('messages wrappers', () => {
  it('sendInstantMessages posts a single message with html format', async () => {
    let captured: URLSearchParams | undefined;
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        captured = new URLSearchParams(await request.text());
        return HttpResponse.json([
          { msgid: 12345, useridfrom: 42, conversationid: 7, timecreated: 1700000000 },
        ]);
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const r = await sendInstantMessages(client, 99, 'hello there');
    expect(captured?.get('wsfunction')).toBe('core_message_send_instant_messages');
    expect(captured?.get('messages[0][touserid]')).toBe('99');
    expect(captured?.get('messages[0][text]')).toBe('hello there');
    expect(captured?.get('messages[0][textformat]')).toBe('1');
    expect(r[0].msgid).toBe(12345);
  });

  it('markMessageRead with no timeread defaults to current epoch', async () => {
    let captured: URLSearchParams | undefined;
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        captured = new URLSearchParams(await request.text());
        return HttpResponse.json({ messageid: 12345, warnings: [] });
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    await markMessageRead(client, 12345);
    expect(captured?.get('wsfunction')).toBe('core_message_mark_message_read');
    expect(captured?.get('messageid')).toBe('12345');
    expect(Number(captured?.get('timeread') ?? 0)).toBeGreaterThan(0);
  });
});
