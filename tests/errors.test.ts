import { describe, it, expect } from 'vitest';
import { ConfigError, MoodleApiError } from '../src/errors.js';

describe('ConfigError', () => {
  it('has the correct name and message', () => {
    const err = new ConfigError('missing MOODLE_URL');
    expect(err.name).toBe('ConfigError');
    expect(err.message).toBe('missing MOODLE_URL');
    expect(err).toBeInstanceOf(Error);
  });
});

describe('MoodleApiError', () => {
  it('captures code, message, and context', () => {
    const err = new MoodleApiError('invalidtoken', 'Token is invalid', {
      wsfunction: 'core_webservice_get_site_info',
      httpStatus: 200,
      originalMessage: 'Invalid token - token not found',
    });
    expect(err.name).toBe('MoodleApiError');
    expect(err.code).toBe('invalidtoken');
    expect(err.message).toBe('Token is invalid');
    expect(err.context.wsfunction).toBe('core_webservice_get_site_info');
    expect(err.context.httpStatus).toBe(200);
    expect(err.context.originalMessage).toBe('Invalid token - token not found');
  });

  it('works with no context', () => {
    const err = new MoodleApiError('NETWORK', 'connection refused');
    expect(err.code).toBe('NETWORK');
    expect(err.context).toEqual({});
  });
});
