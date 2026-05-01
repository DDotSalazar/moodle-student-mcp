import type { MoodleClient } from './client.js';

export interface AddDiscussionInput {
  forumId: number;
  subject: string;
  message: string;
  messageFormat?: 0 | 1;
}

export function addDiscussion(
  client: MoodleClient,
  input: AddDiscussionInput,
): Promise<{ discussionid: number; warnings: unknown[] }> {
  const fmt = input.messageFormat ?? 1;
  return client.call('mod_forum_add_discussion', {
    forumid: input.forumId,
    subject: input.subject,
    message: input.message,
    'options[0][name]': 'messageformat',
    'options[0][value]': fmt,
  });
}

export interface AddDiscussionPostInput {
  postId: number;
  subject: string;
  message: string;
  messageFormat?: 0 | 1;
}

export function addDiscussionPost(
  client: MoodleClient,
  input: AddDiscussionPostInput,
): Promise<{ postid: number; warnings: unknown[] }> {
  const fmt = input.messageFormat ?? 1;
  return client.call('mod_forum_add_discussion_post', {
    postid: input.postId,
    subject: input.subject,
    message: input.message,
    'options[0][name]': 'messageformat',
    'options[0][value]': fmt,
  });
}
