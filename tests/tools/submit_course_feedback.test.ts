import { describe, it, expect } from 'vitest';
import { MoodleClient } from '../../src/moodle/client.js';
import { submitCourseFeedbackTool } from '../../src/tools/submit_course_feedback.js';
import {
  mswServer,
  http,
  HttpResponse,
  MOODLE_URL,
  MOODLE_TOKEN,
  WS_ENDPOINT,
} from '../helpers/server.js';

describe('submit_course_feedback tool', () => {
  it('walks pages until completed: true', async () => {
    let pageCalls = 0;
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        const params = new URLSearchParams(await request.text());
        const fn = params.get('wsfunction') ?? '';
        if (fn === 'mod_feedback_get_items') {
          return HttpResponse.json({
            items: [
              {
                id: 1,
                feedback: 30,
                type: 'multichoice',
                name: 'q1',
                position: 0,
                dependvalue: '',
              },
              {
                id: 2,
                feedback: 30,
                type: 'shortanswer',
                name: 'q2',
                position: 1,
                dependvalue: '',
              },
            ],
            warnings: [],
          });
        }
        if (fn === 'mod_feedback_process_page') {
          pageCalls++;
          if (pageCalls < 2) {
            return HttpResponse.json({ jumpto: 1, completed: false, warnings: [] });
          }
          return HttpResponse.json({
            jumpto: -1,
            completed: true,
            completionpagecontents: 'Thanks!',
            warnings: [],
          });
        }
        return HttpResponse.json({});
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await submitCourseFeedbackTool.handler(
      {
        feedback_id: 30,
        responses: [
          { item_id: 1, value: 'Good' },
          { item_id: 2, value: 'great course' },
        ],
      },
      { client, userId: 42 },
    );
    expect(result.isError).toBeFalsy();
    expect(pageCalls).toBe(2);
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed.submitted).toBe(true);
    expect(parsed.completion_page_contents).toBe('Thanks!');
  });
});
