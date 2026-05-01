import { MoodleApiError } from '../errors.js';
import type { MoodleErrorBody } from './types.js';

const FRIENDLY_MESSAGES: Record<string, string> = {
  invalidtoken:
    'Your Moodle token is invalid or expired. Generate a new token in your Moodle profile and update MOODLE_TOKEN.',
  accessexception:
    'Your Moodle token is invalid or expired. Generate a new token in your Moodle profile and update MOODLE_TOKEN.',
  accessdenied:
    "Your token does not have permission for this action. Make sure the token's external service includes the required Moodle Web Service functions.",
  nopermissions:
    "Your token does not have permission for this action. Make sure the token's external service includes the required Moodle Web Service functions.",
  dml_missing_record_exception: 'The requested item was not found. Check the ID.',
};

function encodeParams(params: Record<string, unknown>): URLSearchParams {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      value.forEach((v, i) => {
        if (v !== undefined && v !== null) {
          sp.append(`${key}[${i}]`, String(v));
        }
      });
    } else {
      sp.append(key, String(value));
    }
  }
  return sp;
}

function isMoodleErrorBody(body: unknown): body is MoodleErrorBody {
  return (
    typeof body === 'object' &&
    body !== null &&
    'exception' in body &&
    'errorcode' in body &&
    'message' in body
  );
}

export class MoodleClient {
  readonly baseUrl: string;
  readonly token: string;
  readonly debug: boolean;

  constructor(baseUrl: string, token: string, debug = false) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.token = token;
    this.debug = debug;
  }

  async call<T>(wsfunction: string, params: Record<string, unknown>): Promise<T> {
    const url = `${this.baseUrl}/webservice/rest/server.php`;
    const body = encodeParams({
      wstoken: this.token,
      wsfunction,
      moodlewsrestformat: 'json',
      ...params,
    });

    if (this.debug) {
      console.error(`[moodle-student-mcp] -> ${wsfunction}`, params);
    }

    const start = Date.now();
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body,
      });
    } catch (err) {
      throw new MoodleApiError(
        'NETWORK',
        `Could not reach Moodle at ${this.baseUrl}: ${err instanceof Error ? err.message : String(err)}`,
        { wsfunction },
      );
    }

    const elapsed = Date.now() - start;

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new MoodleApiError(
        'HTTP_ERROR',
        `Moodle returned HTTP ${response.status} for ${wsfunction}`,
        { wsfunction, httpStatus: response.status, originalMessage: text },
      );
    }

    const data: unknown = await response.json();

    if (this.debug) {
      console.error(`[moodle-student-mcp] <- ${wsfunction} ${elapsed}ms`);
    }

    if (isMoodleErrorBody(data)) {
      const friendly = FRIENDLY_MESSAGES[data.errorcode] ?? data.message;
      throw new MoodleApiError(data.errorcode, friendly, {
        wsfunction,
        httpStatus: response.status,
        originalMessage: data.message,
      });
    }

    return data as T;
  }
}
