import { describe, it, expect } from 'vitest';
import { MoodleClient } from '../../src/moodle/client.js';
import { markMessagesReadTool } from '../../src/tools/mark_messages_read.js';
import {
  mswServer,
  http,
  HttpResponse,
  MOODLE_URL,
  MOODLE_TOKEN,
  WS_ENDPOINT,
} from '../helpers/server.js';

describe('mark_messages_read tool', () => {
  it('marks all ids and reports the count', async () => {
    let calls = 0;
    mswServer.use(
      http.post(WS_ENDPOINT, () => {
        calls++;
        return HttpResponse.json({ messageid: 1, warnings: [] });
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await markMessagesReadTool.handler(
      { message_ids: [1, 2, 3] },
      { client, userId: 42 },
    );
    expect(result.isError).toBeFalsy();
    expect(calls).toBe(3);
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed.marked).toBe(3);
    expect(parsed.failed).toEqual([]);
  });

  it('reports failed ids in the failed list when one call fails', async () => {
    let n = 0;
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        n++;
        const params = new URLSearchParams(await request.text());
        if (params.get('messageid') === '2') {
          return HttpResponse.json({
            exception: 'moodle_exception',
            errorcode: 'invalidaccess',
            message: 'no',
          });
        }
        return HttpResponse.json({ messageid: 1, warnings: [] });
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await markMessagesReadTool.handler(
      { message_ids: [1, 2, 3] },
      { client, userId: 42 },
    );
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed.marked).toBe(2);
    expect(parsed.failed).toEqual([2]);
    expect(n).toBe(3);
  });
});
