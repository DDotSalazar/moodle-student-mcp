import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { MoodleClient } from '../../src/moodle/client.js';
import { getCourseContentsTool } from '../../src/tools/get_course_contents.js';
import { mswServer, http, HttpResponse, MOODLE_URL, MOODLE_TOKEN, WS_ENDPOINT } from '../helpers/server.js';

describe('get_course_contents tool', () => {
  it('returns sections for the requested course', async () => {
    let capturedCourseId: string | null = null;
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        const body = await request.text();
        capturedCourseId = new URLSearchParams(body).get('courseid');
        return HttpResponse.json([{ id: 10, name: 'Section 1', summary: '', visible: 1, modules: [] }]);
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await getCourseContentsTool.handler({ course_id: 7 }, { client, userId: 42 });
    expect(capturedCourseId).toBe('7');
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed[0].name).toBe('Section 1');
  });

  it('rejects bad input via the input schema', () => {
    const schema = z.object(getCourseContentsTool.inputSchema);
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ course_id: 'not-a-number' }).success).toBe(false);
    expect(schema.safeParse({ course_id: 7 }).success).toBe(true);
  });
});
