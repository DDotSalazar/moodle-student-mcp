import type { MoodleClient } from './client.js';
import type { QuizzesResponse, QuizAttemptsResponse } from './types.js';

export function getQuizzesByCourses(
  client: MoodleClient,
  courseIds: number[],
): Promise<QuizzesResponse> {
  return client.call<QuizzesResponse>('mod_quiz_get_quizzes_by_courses', { courseids: courseIds });
}

export function getUserQuizAttempts(
  client: MoodleClient,
  quizId: number,
  userId: number,
): Promise<QuizAttemptsResponse> {
  return client.call<QuizAttemptsResponse>('mod_quiz_get_user_attempts', {
    quizid: quizId,
    userid: userId,
  });
}

export interface StartAttemptResponse {
  attempt: { id: number; state: string; timestart: number; layout: string };
  warnings: unknown[];
}

export interface AttemptSummary {
  id: number;
  quiz: number;
  state: string;
  timestart: number;
  timefinish: number;
}

export interface GetAttemptDataResponse {
  attempt: { id: number; state?: string; timestart?: number };
  questions: Array<{ slot: number; type: string; html: string; page: number }>;
  nextpage: number;
  warnings: unknown[];
}

export interface ProcessAttemptResponse {
  state: string;
  warnings: unknown[];
}

export function startAttempt(client: MoodleClient, quizId: number): Promise<StartAttemptResponse> {
  return client.call<StartAttemptResponse>('mod_quiz_start_attempt', { quizid: quizId });
}

export async function getUnfinishedAttempt(
  client: MoodleClient,
  quizId: number,
  userId: number,
): Promise<AttemptSummary | null> {
  const r = await client.call<{ attempts: AttemptSummary[] }>('mod_quiz_get_user_attempts', {
    quizid: quizId,
    userid: userId,
    status: 'unfinished',
  });
  return r.attempts.find((a) => a.state === 'inprogress' || a.state === 'overdue') ?? null;
}

export function getAttemptData(
  client: MoodleClient,
  attemptId: number,
  page: number,
): Promise<GetAttemptDataResponse> {
  return client.call<GetAttemptDataResponse>('mod_quiz_get_attempt_data', {
    attemptid: attemptId,
    page,
  });
}

export function saveAttempt(
  client: MoodleClient,
  attemptId: number,
  data: Array<{ name: string; value: string }>,
): Promise<{ status: boolean; warnings: unknown[] }> {
  const params: Record<string, unknown> = { attemptid: attemptId };
  data.forEach((d, i) => {
    params[`data[${i}][name]`] = d.name;
    params[`data[${i}][value]`] = d.value;
  });
  return client.call('mod_quiz_save_attempt', params);
}

export function processAttempt(
  client: MoodleClient,
  attemptId: number,
  data: Array<{ name: string; value: string }>,
  finalise: boolean,
): Promise<ProcessAttemptResponse> {
  const params: Record<string, unknown> = {
    attemptid: attemptId,
    finishattempt: finalise ? 1 : 0,
    timeup: 0,
  };
  data.forEach((d, i) => {
    params[`data[${i}][name]`] = d.name;
    params[`data[${i}][value]`] = d.value;
  });
  return client.call('mod_quiz_process_attempt', params);
}
