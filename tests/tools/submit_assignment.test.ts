import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MoodleClient } from '../../src/moodle/client.js';
import { submitAssignmentTool } from '../../src/tools/submit_assignment.js';
import {
  mswServer,
  http,
  HttpResponse,
  MOODLE_URL,
  MOODLE_TOKEN,
  WS_ENDPOINT,
} from '../helpers/server.js';

describe('submit_assignment tool', () => {
  it('saves draft text without finalising by default', async () => {
    const calls: string[] = [];
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        const fn = new URLSearchParams(await request.text()).get('wsfunction') ?? '';
        calls.push(fn);
        return HttpResponse.json([]);
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await submitAssignmentTool.handler(
      { assignment_id: 100, text: '<p>essay</p>' },
      { client, userId: 42 },
    );
    expect(result.isError).toBeFalsy();
    expect(calls).toEqual(['mod_assign_save_submission']);
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed).toMatchObject({ saved: true, finalised: false, files_uploaded: 0 });
  });

  it('uploads files then submits draft when files provided', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'mscli-'));
    const filePath = join(dir, 'essay.pdf');
    writeFileSync(filePath, Buffer.from('pdf'));

    const calls: string[] = [];
    mswServer.use(
      http.post(`${MOODLE_URL}/webservice/upload.php`, () =>
        HttpResponse.json([{ itemid: 555, filename: 'essay.pdf', filesize: 3 }]),
      ),
      http.post(WS_ENDPOINT, async ({ request }) => {
        const fn = new URLSearchParams(await request.text()).get('wsfunction') ?? '';
        calls.push(fn);
        return HttpResponse.json([]);
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await submitAssignmentTool.handler(
      { assignment_id: 100, files: [filePath] },
      { client, userId: 42 },
    );
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed.files_uploaded).toBe(1);
    expect(calls).toEqual(['mod_assign_save_submission']);
    rmSync(dir, { recursive: true, force: true });
  });

  it('finalises when submit_for_grading is true', async () => {
    const calls: string[] = [];
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        const fn = new URLSearchParams(await request.text()).get('wsfunction') ?? '';
        calls.push(fn);
        return HttpResponse.json([]);
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await submitAssignmentTool.handler(
      { assignment_id: 100, text: '<p>final</p>', submit_for_grading: true },
      { client, userId: 42 },
    );
    expect(calls).toEqual(['mod_assign_save_submission', 'mod_assign_submit_for_grading']);
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed.finalised).toBe(true);
  });

  it('returns isError when neither text nor files provided', async () => {
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await submitAssignmentTool.handler(
      { assignment_id: 100 },
      { client, userId: 42 },
    );
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toMatch(/text or files/i);
  });
});
