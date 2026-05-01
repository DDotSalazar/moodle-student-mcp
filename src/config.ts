import { ConfigError } from './errors.js';

export interface Config {
  url: string;
  token: string;
  debug: boolean;
}

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  const rawUrl = (env.MOODLE_URL ?? '').trim();
  const token = (env.MOODLE_TOKEN ?? '').trim();

  if (!rawUrl) {
    throw new ConfigError(
      'MOODLE_URL is required. Set it to the base URL of your Moodle instance, e.g. https://moodle.your-school.edu',
    );
  }
  if (!token) {
    throw new ConfigError(
      'MOODLE_TOKEN is required. Generate a Web Service token in your Moodle profile and set it as MOODLE_TOKEN.',
    );
  }

  const url = rawUrl.replace(/\/+$/, '');
  const debug = env.MOODLE_DEBUG === '1';

  return { url, token, debug };
}
