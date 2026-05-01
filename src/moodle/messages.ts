import type { MoodleClient } from './client.js';

export interface SentMessage {
  msgid: number;
  useridfrom: number;
  conversationid: number;
  timecreated: number;
}

export function sendInstantMessages(
  client: MoodleClient,
  toUserId: number,
  text: string,
): Promise<SentMessage[]> {
  return client.call<SentMessage[]>('core_message_send_instant_messages', {
    'messages[0][touserid]': toUserId,
    'messages[0][text]': text,
    'messages[0][textformat]': 1,
  });
}

export function markMessageRead(
  client: MoodleClient,
  messageId: number,
  timeRead?: number,
): Promise<{ messageid: number; warnings: unknown[] }> {
  return client.call('core_message_mark_message_read', {
    messageid: messageId,
    timeread: timeRead ?? Math.floor(Date.now() / 1000),
  });
}
