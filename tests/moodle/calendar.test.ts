import { describe, it, expect } from 'vitest';
import { MoodleClient } from '../../src/moodle/client.js';
import { getUpcomingEvents, getActionEvents } from '../../src/moodle/calendar.js';
import {
  mswServer,
  http,
  HttpResponse,
  MOODLE_URL,
  MOODLE_TOKEN,
  WS_ENDPOINT,
} from '../helpers/server.js';

describe('getUpcomingEvents', () => {
  it('calls core_calendar_get_calendar_upcoming_view', async () => {
    let capturedBody = '';
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        capturedBody = await request.text();
        return HttpResponse.json({
          events: [
            {
              id: 1,
              name: 'Lecture',
              description: '',
              eventtype: 'course',
              timestart: 1751000000,
              timeduration: 3600,
              courseid: 7,
            },
          ],
        });
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await getUpcomingEvents(client);
    const params = new URLSearchParams(capturedBody);
    expect(params.get('wsfunction')).toBe('core_calendar_get_calendar_upcoming_view');
    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.name).toBe('Lecture');
  });
});

describe('getActionEvents', () => {
  it('calls core_calendar_get_action_events_by_timesort with the right window and limit', async () => {
    let capturedBody = '';
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        capturedBody = await request.text();
        return HttpResponse.json({
          events: [
            {
              id: 99,
              name: 'HW1 due',
              description: '',
              modulename: 'assign',
              instance: 100,
              timestart: 1751000000,
              course: { id: 7, fullname: 'CS101', shortname: 'CS101' },
              action: {
                name: 'Submit assignment',
                url: 'https://...',
                itemcount: 1,
                actionable: true,
              },
            },
          ],
        });
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const result = await getActionEvents(client, 1700000000, 1701000000, 25);
    const params = new URLSearchParams(capturedBody);
    expect(params.get('wsfunction')).toBe('core_calendar_get_action_events_by_timesort');
    expect(params.get('timesortfrom')).toBe('1700000000');
    expect(params.get('timesortto')).toBe('1701000000');
    expect(params.get('limitnum')).toBe('25');
    expect(result.events[0]?.action?.name).toBe('Submit assignment');
  });
});

import { createUserEvent } from '../../src/moodle/calendar.js';

describe('createUserEvent', () => {
  it('posts a personal calendar event with eventtype=user', async () => {
    let captured: URLSearchParams | undefined;
    mswServer.use(
      http.post(WS_ENDPOINT, async ({ request }) => {
        captured = new URLSearchParams(await request.text());
        return HttpResponse.json({
          events: [{ id: 999, name: 'Study', timestart: 1751000000 }],
          warnings: [],
        });
      }),
    );
    const client = new MoodleClient(MOODLE_URL, MOODLE_TOKEN);
    const r = await createUserEvent(client, {
      name: 'Study',
      description: 'Calculus chapter 3',
      timestart: 1751000000,
      durationSeconds: 3600,
    });
    expect(captured?.get('wsfunction')).toBe('core_calendar_create_calendar_events');
    expect(captured?.get('events[0][name]')).toBe('Study');
    expect(captured?.get('events[0][description]')).toBe('Calculus chapter 3');
    expect(captured?.get('events[0][eventtype]')).toBe('user');
    expect(captured?.get('events[0][timestart]')).toBe('1751000000');
    expect(captured?.get('events[0][timeduration]')).toBe('3600');
    expect(r.events[0].id).toBe(999);
  });
});
