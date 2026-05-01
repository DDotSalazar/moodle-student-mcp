import type { MoodleClient } from './client.js';
import type { AssignmentsResponse, SubmissionStatus } from './types.js';

export function getAssignments(
  client: MoodleClient,
  courseIds: number[],
): Promise<AssignmentsResponse> {
  return client.call<AssignmentsResponse>('mod_assign_get_assignments', { courseids: courseIds });
}

export function getSubmissionStatus(
  client: MoodleClient,
  assignId: number,
  userId: number,
): Promise<SubmissionStatus> {
  return client.call<SubmissionStatus>('mod_assign_get_submission_status', {
    assignid: assignId,
    userid: userId,
  });
}

export interface SaveSubmissionInput {
  text?: string;
  textFormat?: 0 | 1; // 0 = plain, 1 = html
  fileItemId?: number;
}

export function saveSubmission(
  client: MoodleClient,
  assignmentId: number,
  input: SaveSubmissionInput,
): Promise<unknown[]> {
  const params: Record<string, unknown> = { assignmentid: assignmentId };
  if (input.text !== undefined) {
    params['plugindata[onlinetext_editor][text]'] = input.text;
    params['plugindata[onlinetext_editor][format]'] = input.textFormat ?? 1;
    params['plugindata[onlinetext_editor][itemid]'] = 0;
  }
  if (input.fileItemId !== undefined) {
    params['plugindata[files_filemanager]'] = input.fileItemId;
  }
  return client.call<unknown[]>('mod_assign_save_submission', params);
}

export function submitForGrading(client: MoodleClient, assignmentId: number): Promise<unknown[]> {
  return client.call<unknown[]>('mod_assign_submit_for_grading', {
    assignmentid: assignmentId,
    acceptsubmissionstatement: 1,
  });
}
