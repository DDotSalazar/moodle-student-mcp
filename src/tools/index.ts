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
import { submitAssignmentTool } from './submit_assignment.js';
import { startQuizAttemptTool } from './start_quiz_attempt.js';
import { saveQuizAnswersTool } from './save_quiz_answers.js';
import { submitQuizAttemptTool } from './submit_quiz_attempt.js';
import { startForumDiscussionTool } from './start_forum_discussion.js';
import { postForumReplyTool } from './post_forum_reply.js';
import { sendMessageTool } from './send_message.js';
import { markMessagesReadTool } from './mark_messages_read.js';
import { submitChoiceResponseTool } from './submit_choice_response.js';
import { submitCourseFeedbackTool } from './submit_course_feedback.js';
import { createCalendarEventTool } from './create_calendar_event.js';

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
  submitAssignmentTool,
  startQuizAttemptTool,
  saveQuizAnswersTool,
  submitQuizAttemptTool,
  startForumDiscussionTool,
  postForumReplyTool,
  sendMessageTool,
  markMessagesReadTool,
  submitChoiceResponseTool,
  submitCourseFeedbackTool,
  createCalendarEventTool,
];

export type { ToolContext, ToolDefinition, ToolResult } from './types.js';
