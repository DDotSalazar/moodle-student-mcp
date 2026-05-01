import type { MoodleClient } from './client.js';
import type { AssignmentsResponse, SubmissionStatus } from './types.js';

export function getAssignments(client: MoodleClient, courseIds: number[]): Promise<AssignmentsResponse> {
  return client.call<AssignmentsResponse>('mod_assign_get_assignments', { courseids: courseIds });
}

export function getSubmissionStatus(client: MoodleClient, assignId: number, userId: number): Promise<SubmissionStatus> {
  return client.call<SubmissionStatus>('mod_assign_get_submission_status', { assignid: assignId, userid: userId });
}
