import { describe, it, expect } from 'vitest';
import { loadConfig } from '../src/config.js';
import { ConfigError } from '../src/errors.js';

describe('loadConfig', () => {
  it('reads required env vars', () => {
    const cfg = loadConfig({
      MOODLE_URL: 'https://moodle.example.test',
      MOODLE_TOKEN: 'abc123',
    });
    expect(cfg.url).toBe('https://moodle.example.test');
    expect(cfg.token).toBe('abc123');
    expect(cfg.debug).toBe(false);
  });

  it('trims trailing slash on URL', () => {
    const cfg = loadConfig({
      MOODLE_URL: 'https://moodle.example.test/',
      MOODLE_TOKEN: 'abc',
    });
    expect(cfg.url).toBe('https://moodle.example.test');
  });

  it('enables debug when MOODLE_DEBUG=1', () => {
    const cfg = loadConfig({
      MOODLE_URL: 'https://moodle.example.test',
      MOODLE_TOKEN: 'abc',
      MOODLE_DEBUG: '1',
    });
    expect(cfg.debug).toBe(true);
  });

  it('does not enable debug for other values', () => {
    const cfg = loadConfig({
      MOODLE_URL: 'https://moodle.example.test',
      MOODLE_TOKEN: 'abc',
      MOODLE_DEBUG: 'true',
    });
    expect(cfg.debug).toBe(false);
  });

  it('throws ConfigError when MOODLE_URL is missing', () => {
    expect(() => loadConfig({ MOODLE_TOKEN: 'abc' })).toThrow(ConfigError);
    expect(() => loadConfig({ MOODLE_TOKEN: 'abc' })).toThrowError(/MOODLE_URL/);
  });

  it('throws ConfigError when MOODLE_TOKEN is missing', () => {
    expect(() =>
      loadConfig({ MOODLE_URL: 'https://moodle.example.test' }),
    ).toThrowError(/MOODLE_TOKEN/);
  });

  it('throws ConfigError when MOODLE_URL is empty', () => {
    expect(() =>
      loadConfig({ MOODLE_URL: '', MOODLE_TOKEN: 'abc' }),
    ).toThrowError(/MOODLE_URL/);
  });
});
