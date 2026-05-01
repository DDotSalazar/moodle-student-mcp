import { describe, it, expect } from 'vitest';
import { MoodleClient } from '../../src/moodle/client.js';
import { postForumReplyTool } from '../../src/tools/post_forum_reply.js';
import {
  mswServer,
  http,
  HttpResponse,
  MOODLE_URL,
  MOODLE_TOKEN,
  WS_ENDPOINT,
} from '../helpers/server.js';

describe('post_forum_reply tool', () => {
  it('posts a reply and returns the new post id', async () => {
    mswServer.use(http.post(WS_ENDPOINT, () => HttpResponse.json({ postid: 8000, warnings: [] })));
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await postForumReplyTool.handler(
      { post_id: 5, subject: 'Re: Hi', message: 'Reply' },
      { client, userId: 42 },
    );
    expect(result.isError).toBeFalsy();
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed.post_id).toBe(8000);
  });
});
