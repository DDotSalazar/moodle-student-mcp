import type { MoodleClient } from './client.js';
import type { QuizzesResponse, QuizAttemptsResponse } from './types.js';

export function getQuizzesByCourses(client: MoodleClient, courseIds: number[]): Promise<QuizzesResponse> {
  return client.call<QuizzesResponse>('mod_quiz_get_quizzes_by_courses', { courseids: courseIds });
}

export function getUserQuizAttempts(client: MoodleClient, quizId: number, userId: number): Promise<QuizAttemptsResponse> {
  return client.call<QuizAttemptsResponse>('mod_quiz_get_user_attempts', { quizid: quizId, userid: userId });
}
