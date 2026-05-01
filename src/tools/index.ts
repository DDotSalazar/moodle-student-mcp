import type { ToolDefinition } from './types.js';
import { listCoursesTool } from './list_courses.js';
import { getCourseContentsTool } from './get_course_contents.js';
import { listAssignmentsTool } from './list_assignments.js';
import { getAssignmentTool } from './get_assignment.js';
import { getGradesTool } from './get_grades.js';
import { listUpcomingEventsTool } from './list_upcoming_events.js';
import { listUpcomingDeadlinesTool } from './list_upcoming_deadlines.js';
import { listQuizzesTool } from './list_quizzes.js';
import { getQuizAttemptsTool } from './get_quiz_attempts.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const allTools: ToolDefinition<any>[] = [
  listCoursesTool,
  getCourseContentsTool,
  listAssignmentsTool,
  getAssignmentTool,
  getGradesTool,
  listUpcomingEventsTool,
  listUpcomingDeadlinesTool,
  listQuizzesTool,
  getQuizAttemptsTool,
];

export type { ToolContext, ToolDefinition, ToolResult } from './types.js';
