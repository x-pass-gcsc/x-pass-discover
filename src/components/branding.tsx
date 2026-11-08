'use client';

import { useT } from '@/i18n/client';
import { Badge } from './ui';

/**
 * Client-safe chrome.
 *
 * These live apart from `AppShell` on purpose: the shell resolves the current
 * user and therefore pulls in `server-only`, while the wordmark and the runtime
 * badges are rendered inside client components too. Keeping them in separate
 * modules is what stops a client bundle from reaching the session code. It is a
 * client module so the runtime badges can speak the student's language.
 */

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const box = size === 'sm' ? 'size-7 text-xs' : 'size-8 text-sm';
  return (
    <span className="flex items-center gap-2.5">
      <span
        className={`grid ${box} place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 font-bold text-white shadow-sm shadow-brand-600/30`}
      >
        X
      </span>
      <span className="text-sm font-semibold tracking-tight text-strong">
        X-PASS <span className="font-normal text-muted">Discover</span>
      </span>
    </span>
  );
}

export function RuntimeBadges({
  persistence,
  persistenceLabel,
  persistenceIsEphemeral,
  ai,
  aiLabel,
  aiModeDowngraded,
}: {
  /** `neon` / `file` / `memory`; the label is the English fallback. */
  persistence?: string;
  persistenceLabel: string;
  persistenceIsEphemeral?: boolean;
  /** `openai` / `mock`; an OpenAI label keeps its model name as written. */
  ai?: string;
  aiLabel: string;
  aiModeDowngraded?: boolean;
}) {
  const t = useT();
  const persistenceText =
    persistence === 'memory'
      ? t('runtime.memory')
      : persistence === 'file'
        ? t('runtime.file')
        : persistenceLabel;
  const aiText = ai === 'mock' ? t('runtime.mock') : aiLabel;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge
        tone={persistenceIsEphemeral ? 'warn' : 'muted'}
        dot
        title={persistenceIsEphemeral ? t('runtime.ephemeralTitle') : t('runtime.persistenceTitle')}
      >
        {persistenceText}
      </Badge>
      <Badge tone={aiModeDowngraded ? 'warn' : 'muted'} dot title={t('runtime.aiTitle')}>
        {aiText}
        {aiModeDowngraded ? t('runtime.keyMissing') : ''}
      </Badge>
    </div>
  );
}
