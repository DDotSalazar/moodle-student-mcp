import { describe, it, expect } from 'vitest';
import { MoodleClient } from '../../src/moodle/client.js';
import { mswServer, http, HttpResponse, MOODLE_URL, MOODLE_TOKEN, WS_ENDPOINT } from '../helpers/server.js';

describe('MoodleClient', () => {
  it('POSTs form-encoded params with token, function, and json format', async () => {
    let capturedBody = '';
    let capturedContentType: string | null = null;
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        capturedBody = await request.text();
        capturedContentType = request.headers.get('content-type');
        return HttpResponse.json({ ok: true });
      }),
    );

    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await client.call<{ ok: boolean }>('core_webservice_get_site_info', {});

    expect(result.ok).toBe(true);
    expect(capturedContentType).toContain('application/x-www-form-urlencoded');
    const params = new URLSearchParams(capturedBody);
    expect(params.get('wstoken')).toBe(MOODLE_TOKEN);
    expect(params.get('wsfunction')).toBe('core_webservice_get_site_info');
    expect(params.get('moodlewsrestformat')).toBe('json');
  });

  it('flattens array params into Moodle bracket notation', async () => {
    let capturedBody = '';
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        capturedBody = await request.text();
        return HttpResponse.json([]);
      }),
    );

    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    await client.call('mod_assign_get_assignments', { courseids: [1, 2, 3] });

    const params = new URLSearchParams(capturedBody);
    expect(params.get('courseids[0]')).toBe('1');
    expect(params.get('courseids[1]')).toBe('2');
    expect(params.get('courseids[2]')).toBe('3');
  });

  it('omits undefined params', async () => {
    let capturedBody = '';
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        capturedBody = await request.text();
        return HttpResponse.json({});
      }),
    );

    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    await client.call('foo', { a: 1, b: undefined, c: 'x' });

    const params = new URLSearchParams(capturedBody);
    expect(params.get('a')).toBe('1');
    expect(params.has('b')).toBe(false);
    expect(params.get('c')).toBe('x');
  });

  it('detects Moodle error body and throws MoodleApiError with friendly message', async () => {
    mswServer.use(
      http.post(WS_ENDPOINT, () =>
        HttpResponse.json({
          exception: 'moodle_exception',
          errorcode: 'invalidtoken',
          message: 'Invalid token - token not found',
        }),
      ),
    );

    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    await expect(
      client.call('core_webservice_get_site_info', {}),
    ).rejects.toMatchObject({
      name: 'MoodleApiError',
      code: 'invalidtoken',
      message: expect.stringContaining('invalid or expired'),
      context: expect.objectContaining({
        wsfunction: 'core_webservice_get_site_info',
        originalMessage: 'Invalid token - token not found',
      }),
    });
  });

  it('passes through unknown error codes with the original message', async () => {
    mswServer.use(
      http.post(WS_ENDPOINT, () =>
        HttpResponse.json({
          exception: 'moodle_exception',
          errorcode: 'something_unexpected',
          message: 'Something bad happened',
        }),
      ),
    );

    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    await expect(client.call('foo', {})).rejects.toMatchObject({
      code: 'something_unexpected',
      message: 'Something bad happened',
    });
  });

  it('throws MoodleApiError on HTTP non-2xx', async () => {
    mswServer.use(
      http.post(WS_ENDPOINT, () => HttpResponse.text('Server error', { status: 500 })),
    );

    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    await expect(client.call('foo', {})).rejects.toMatchObject({
      name: 'MoodleApiError',
      code: 'HTTP_ERROR',
      context: expect.objectContaining({ httpStatus: 500 }),
    });
  });

  it('wraps network errors as MoodleApiError code NETWORK', async () => {
    mswServer.use(
      http.post(WS_ENDPOINT, () => HttpResponse.error()),
    );

    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    await expect(client.call('foo', {})).rejects.toMatchObject({
      name: 'MoodleApiError',
      code: 'NETWORK',
    });
  });

  it.each([
    ['notopenforsubmissions', /not open for new submissions/i],
    ['submissionsclosed', /submissions are closed/i],
    ['nopermissiontoaddpost', /permission to post/i],
    ['cannotsendmessage', /could not send the message/i],
    ['attemptalreadyclosed', /already been finalised/i],
    ['quizalreadystarted', /in-progress attempt/i],
    ['feedback_completed', /already completed this feedback/i],
    ['cannotsavetempfile', /file upload failed/i],
    ['passwordrequired', /requires a password/i],
  ])('maps %s to a friendly message', async (errorcode, expected) => {
    mswServer.use(
      http.post(WS_ENDPOINT, () =>
        HttpResponse.json({ exception: 'moodle_exception', errorcode, message: 'raw moodle text' }),
      ),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    await expect(client.call('any_function', {})).rejects.toMatchObject({
      code: errorcode,
      message: expect.stringMatching(expected),
    });
  });
});
