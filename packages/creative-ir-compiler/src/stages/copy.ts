/**
 * Fixed copy written by the compiler itself (beat titles, connective narrative phrases, storyboard title suffix),
 * in the campaign's first language. Brief content is never translated here; only the compiler's own words follow
 * the language. Unknown languages fall back to English, so existing campaigns are unchanged.
 */

import type { StoryBeatKind } from '../model.js';

export interface CompilerCopy {
  readonly beatTitles: Record<StoryBeatKind, string>;
  readonly storyboardSuffix: string;
  readonly setup: (throughline: string) => string;
  readonly inciting: (message: string) => string;
  readonly rising: (message: string) => string;
  readonly climax: (message: string) => string;
  readonly resolution: (theme: string) => string;
}

const EN: CompilerCopy = {
  beatTitles: {
    setup: 'Setup',
    inciting: 'Inciting Moment',
    rising: 'Rising Action',
    climax: 'Climax',
    resolution: 'Resolution',
    'call-to-action': 'Call to Action',
  },
  storyboardSuffix: 'Storyboard',
  setup: (t) => `We open in the audience's world. ${t}`,
  inciting: (m) => `A tension emerges: ${m}`,
  rising: (m) => `The stakes rise as we prove the point — ${m}`,
  climax: (m) => `At peak intensity, the core message lands: ${m}`,
  resolution: (t) => `The tension resolves, reinforcing ${t}.`,
};

const VI: CompilerCopy = {
  beatTitles: {
    setup: 'Mở đầu',
    inciting: 'Vấn đề',
    rising: 'Chứng minh',
    climax: 'Thông điệp chính',
    resolution: 'Kết',
    'call-to-action': 'Kêu gọi',
  },
  storyboardSuffix: 'Storyboard',
  setup: (t) => `Bối cảnh của khách. ${t}`,
  inciting: (m) => `Điều khách đang vướng: ${m}`,
  rising: (m) => `Bằng chứng cụ thể: ${m}`,
  climax: (m) => `Điều quan trọng nhất: ${m}`,
  resolution: (t) => `Nhắc lại: ${t}.`,
};

export function compilerCopy(language: string | undefined): CompilerCopy {
  return (language ?? '').toLowerCase().startsWith('vi') ? VI : EN;
}
