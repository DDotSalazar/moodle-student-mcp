import type { MoodleClient } from './client.js';
import type { GradeReportResponse } from './types.js';

export function getCourseGrades(client: MoodleClient, courseId: number, userId: number): Promise<GradeReportResponse> {
  return client.call<GradeReportResponse>('gradereport_user_get_grade_items', { courseid: courseId, userid: userId });
}
