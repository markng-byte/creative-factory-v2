/**
 * Puts the Growth hook into the brief before compiling, so the storyboard tells the hook's story whatever
 * brief source is configured: the hook text becomes the core message and the big idea. Everything else in
 * the brief (audience, objectives, tone, constraints) is kept. When the brief has no core message, the
 * highest-listed message carries the hook instead.
 */
import type { CreativeBriefSource } from '@creative-factory/creative-ir-compiler';

type Brief = NonNullable<Awaited<ReturnType<CreativeBriefSource['getById']>>>;

export function briefWithHook(brief: Brief, hookText: string): Brief {
  const text = hookText.trim();
  const core = brief.keyMessages.findIndex((m) => String(m.type) === 'core_message');
  const at = core >= 0 ? core : 0;
  return {
    ...brief,
    keyMessages: brief.keyMessages.map((m, i) => (i === at ? { ...m, content: text } : m)),
    messagingFramework: { ...brief.messagingFramework, bigIdea: text },
  };
}

export function hookBriefSource(
  source: CreativeBriefSource,
  hookText: string,
): CreativeBriefSource {
  return {
    async getById(id) {
      const brief = await source.getById(id);
      return brief ? briefWithHook(brief, hookText) : brief;
    },
  };
}
