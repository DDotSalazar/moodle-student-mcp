import type { MoodleClient } from './client.js';
import type { UpcomingViewResponse, ActionEventsResponse } from './types.js';

export function getUpcomingEvents(client: MoodleClient): Promise<UpcomingViewResponse> {
  return client.call<UpcomingViewResponse>('core_calendar_get_calendar_upcoming_view', {});
}

export function getActionEvents(
  client: MoodleClient,
  timesortFrom: number,
  timesortTo: number,
  limitNum: number,
): Promise<ActionEventsResponse> {
  return client.call<ActionEventsResponse>('core_calendar_get_action_events_by_timesort', {
    timesortfrom: timesortFrom,
    timesortto: timesortTo,
    limitnum: limitNum,
  });
}

export interface CreateUserEventInput {
  name: string;
  description?: string;
  timestart: number; // epoch seconds
  durationSeconds?: number;
  courseId?: number;
}

export interface CreatedEvent {
  id: number;
  name: string;
  timestart: number;
}

export function createUserEvent(
  client: MoodleClient,
  input: CreateUserEventInput,
): Promise<{ events: CreatedEvent[]; warnings: unknown[] }> {
  const params: Record<string, unknown> = {
    'events[0][name]': input.name,
    'events[0][description]': input.description ?? '',
    'events[0][format]': 1,
    'events[0][eventtype]': 'user',
    'events[0][timestart]': input.timestart,
    'events[0][timeduration]': input.durationSeconds ?? 0,
  };
  if (input.courseId !== undefined) {
    params['events[0][courseid]'] = input.courseId;
  }
  return client.call('core_calendar_create_calendar_events', params);
}
