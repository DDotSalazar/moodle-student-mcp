import type { MoodleClient } from './client.js';
import type { Course, CourseSection } from './types.js';

export function getMyCourses(client: MoodleClient, userId: number): Promise<Course[]> {
  return client.call<Course[]>('core_enrol_get_users_courses', { userid: userId });
}

export function getCourseContents(client: MoodleClient, courseId: number): Promise<CourseSection[]> {
  return client.call<CourseSection[]>('core_course_get_contents', { courseid: courseId });
}
