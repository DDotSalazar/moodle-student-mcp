import { describe, it, expect } from 'vitest';
import { MoodleClient } from '../../src/moodle/client.js';
import { startForumDiscussionTool } from '../../src/tools/start_forum_discussion.js';
import {
  mswServer,
  http,
  HttpResponse,
  MOODLE_URL,
  MOODLE_TOKEN,
  WS_ENDPOINT,
} from '../helpers/server.js';

describe('start_forum_discussion tool', () => {
  it('starts a discussion and returns the new discussion id', async () => {
    let captured: URLSearchParams | undefined;
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        captured = new URLSearchParams(await request.text());
        return HttpResponse.json({ discussionid: 7000, warnings: [] });
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await startForumDiscussionTool.handler(
      { forum_id: 1, subject: 'Hi', message: '<p>Hello</p>' },
      { client, userId: 42 },
    );
    expect(result.isError).toBeFalsy();
    expect(captured?.get('wsfunction')).toBe('mod_forum_add_discussion');
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed.discussion_id).toBe(7000);
  });
});
