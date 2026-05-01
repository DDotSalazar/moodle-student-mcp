import type { MoodleClient } from './client.js';
import type { UpcomingViewResponse, ActionEventsResponse } from './types.js';

export function getUpcomingEvents(client: MoodleClient): Promise<UpcomingViewResponse> {
  return client.call<UpcomingViewResponse>('core_calendar_get_calendar_upcoming_view', {});
}

export function getActionEvents(client: MoodleClient, timesortFrom: number, timesortTo: number, limitNum: number): Promise<ActionEventsResponse> {
  return client.call<ActionEventsResponse>('core_calendar_get_action_events_by_timesort', {
    timesortfrom: timesortFrom,
    timesortto: timesortTo,
    limitnum: limitNum,
  });
}
