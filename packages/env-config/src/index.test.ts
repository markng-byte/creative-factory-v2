import { describe, expect, it } from 'vitest';
import { parseWebEnv } from './index.js';

describe('env-config', () => {
  it('parses web env with defaults', () => {
    const env = parseWebEnv({});
    expect(env.NEXT_PUBLIC_APP_NAME).toBe('Creative Factory');
    expect(env.NEXT_PUBLIC_API_URL).toBe('http://localhost:8000');
  });
});
