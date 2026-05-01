import type { MoodleClient } from './client.js';

export interface FeedbackItem {
  id: number;
  feedback: number;
  type: string;
  name: string;
  position: number;
  dependvalue: string;
}

export interface ProcessPageResponse {
  jumpto: number;
  completed: boolean;
  completionpagecontents?: string;
  warnings: unknown[];
}

export function getFeedbackItems(
  client: MoodleClient,
  feedbackId: number,
): Promise<{ items: FeedbackItem[]; warnings: unknown[] }> {
  return client.call('mod_feedback_get_items', { feedbackid: feedbackId });
}

export function processFeedbackPage(
  client: MoodleClient,
  feedbackId: number,
  page: number,
  responses: Array<{ itemId: number; value: string | number }>,
): Promise<ProcessPageResponse> {
  const params: Record<string, unknown> = { feedbackid: feedbackId, page };
  responses.forEach((r, i) => {
    params[`responses[${i}][name]`] = String(r.itemId);
    params[`responses[${i}][value]`] = String(r.value);
  });
  return client.call<ProcessPageResponse>('mod_feedback_process_page', params);
}
