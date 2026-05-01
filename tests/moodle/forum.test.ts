import { describe, it, expect } from 'vitest';
import { MoodleClient } from '../../src/moodle/client.js';
import { addDiscussion, addDiscussionPost } from '../../src/moodle/forum.js';
import {
  mswServer,
  http,
  HttpResponse,
  MOODLE_URL,
  MOODLE_TOKEN,
  WS_ENDPOINT,
} from '../helpers/server.js';

describe('forum wrappers', () => {
  it('addDiscussion posts subject + message + options', async () => {
    let captured: URLSearchParams | undefined;
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        captured = new URLSearchParams(await request.text());
        return HttpResponse.json({ discussionid: 7000, warnings: [] });
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const r = await addDiscussion(client, {
      forumId: 1,
      subject: 'Hi',
      message: '<p>Hello</p>',
      messageFormat: 1,
    });
    expect(captured?.get('wsfunction')).toBe('mod_forum_add_discussion');
    expect(captured?.get('forumid')).toBe('1');
    expect(captured?.get('subject')).toBe('Hi');
    expect(captured?.get('message')).toBe('<p>Hello</p>');
    expect(captured?.get('options[0][name]')).toBe('messageformat');
    expect(captured?.get('options[0][value]')).toBe('1');
    expect(r.discussionid).toBe(7000);
  });

  it('addDiscussionPost replies to a post', async () => {
    let captured: URLSearchParams | undefined;
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        captured = new URLSearchParams(await request.text());
        return HttpResponse.json({ postid: 8000, warnings: [] });
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const r = await addDiscussionPost(client, {
      postId: 5,
      subject: 'Re: Hi',
      message: 'Reply',
      messageFormat: 0,
    });
    expect(captured?.get('wsfunction')).toBe('mod_forum_add_discussion_post');
    expect(captured?.get('postid')).toBe('5');
    expect(captured?.get('options[0][value]')).toBe('0');
    expect(r.postid).toBe(8000);
  });
});
