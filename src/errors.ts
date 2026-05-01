export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

export interface MoodleApiErrorContext {
  wsfunction?: string;
  httpStatus?: number;
  originalMessage?: string;
}

export class MoodleApiError extends Error {
  readonly code: string;
  readonly context: MoodleApiErrorContext;

  constructor(code: string, message: string, context: MoodleApiErrorContext = {}) {
    super(message);
    this.name = 'MoodleApiError';
    this.code = code;
    this.context = context;
  }
}
