import { describe, expect, it } from 'vitest';
import { parseWebEnv, parseWebServerEnv } from './index.js';

describe('env-config', () => {
  it('parses web env with defaults', () => {
    const env = parseWebEnv({});
    expect(env.NEXT_PUBLIC_APP_NAME).toBe('Creative Factory');
    expect(env.NEXT_PUBLIC_API_URL).toBe('http://localhost:8000');
  });
});

describe('env-config: empty values (Vercel project created with blank variables)', () => {
  it('treats empty or blank strings as unset, so defaults apply', () => {
    const env = parseWebServerEnv({
      NEXT_PUBLIC_APP_NAME: '',
      NEXT_PUBLIC_API_URL: '',
      NODE_ENV: '',
      PORT: ' ',
    });
    expect(env).toEqual({
      NEXT_PUBLIC_APP_NAME: 'Creative Factory',
      NEXT_PUBLIC_API_URL: 'http://localhost:8000',
      NODE_ENV: 'development',
      PORT: 3000,
    });
  });

  it('still rejects a value that is set but not a URL', () => {
    expect(() => parseWebEnv({ NEXT_PUBLIC_API_URL: 'not a url' })).toThrow();
  });
});
