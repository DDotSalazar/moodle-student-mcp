import type { MoodleClient } from './client.js';

export interface ChoiceResponse {
  answers: Array<{ id: number }>;
  warnings: unknown[];
}

export function submitChoiceResponse(
  client: MoodleClient,
  choiceId: number,
  responseIds: number[],
): Promise<ChoiceResponse> {
  return client.call<ChoiceResponse>('mod_choice_submit_choice_response', {
    choiceid: choiceId,
    responses: responseIds,
  });
}
