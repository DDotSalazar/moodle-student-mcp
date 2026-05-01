import { describe, it, expect } from 'vitest';
import { MoodleClient } from '../../src/moodle/client.js';
import { getFeedbackItems, processFeedbackPage } from '../../src/moodle/feedback.js';
import {
  mswServer,
  http,
  HttpResponse,
  MOODLE_URL,
  MOODLE_TOKEN,
  WS_ENDPOINT,
} from '../helpers/server.js';

describe('feedback wrappers', () => {
  it('getFeedbackItems calls mod_feedback_get_items', async () => {
    let captured: URLSearchParams | undefined;
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        captured = new URLSearchParams(await request.text());
        return HttpResponse.json({
          items: [
            { id: 1, feedback: 1, type: 'multichoice', name: 'Q1', position: 0, dependvalue: '' },
          ],
          warnings: [],
        });
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const r = await getFeedbackItems(client, 30);
    expect(captured?.get('wsfunction')).toBe('mod_feedback_get_items');
    expect(captured?.get('feedbackid')).toBe('30');
    expect(r.items.length).toBe(1);
  });

  it('processFeedbackPage encodes responses array correctly', async () => {
    let captured: URLSearchParams | undefined;
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        captured = new URLSearchParams(await request.text());
        return HttpResponse.json({
          jumpto: -1,
          completed: true,
          completionpagecontents: 'Thanks',
          warnings: [],
        });
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const r = await processFeedbackPage(client, 30, 0, [
      { itemId: 1, value: 'good' },
      { itemId: 2, value: 5 },
    ]);
    expect(captured?.get('wsfunction')).toBe('mod_feedback_process_page');
    expect(captured?.get('feedbackid')).toBe('30');
    expect(captured?.get('page')).toBe('0');
    expect(captured?.get('responses[0][name]')).toBe('1');
    expect(captured?.get('responses[0][value]')).toBe('good');
    expect(captured?.get('responses[1][value]')).toBe('5');
    expect(r.completed).toBe(true);
  });
});
