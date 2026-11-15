'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Markdown } from '@/components/markdown';
import { useT } from '@/i18n/client';
import type { SenpaiProvider } from '@/lib/env';
import { announceSenpaiOpen } from './events';

type Turn = { role: 'student' | 'senpai'; content: string };

const MAX_STORED_TURNS = 60;
const MAX_CHARS = 2000;

/** Which bootcamp the student is looking at, if any, for the senpai's context. */
function currentSessionId(pathname: string): string | null {
  const fromPath = pathname.match(/^\/(?:workspace|session)\/([^/?#]+)/)?.[1];
  if (fromPath) return decodeURIComponent(fromPath);
  return new URLSearchParams(window.location.search).get('session');
}

function readStored(key: string): Turn[] {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed)
      ? parsed.filter(
          (t): t is Turn =>
            !!t &&
            typeof t === 'object' &&
            (t.role === 'student' || t.role === 'senpai') &&
            typeof t.content === 'string',
        )
      : [];
  } catch {
    return [];
  }
}

/**
 * The AI senpai: a floating button on every signed-in page that opens a chat
 * with a senior colleague. The conversation lives in this browser only (per
 * account), is never logged as evidence, and does not touch any bootcamp.
 */
export function SenpaiWidget({
  userId,
  displayName,
  provider,
}: {
  userId: string;
  displayName: string;
  provider: SenpaiProvider;
}) {
  const t = useT();
  const pathname = usePathname();
  const storageKey = `xpass-senpai:${userId}`;
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Which account's chat is loaded. Saving waits for it, or the empty first
  // render would overwrite the stored conversation before it is read.
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  useEffect(() => {
    setTurns(readStored(storageKey));
    setLoadedKey(storageKey);
  }, [storageKey]);

  useEffect(() => {
    if (loadedKey !== storageKey) return;
    // Saved as it streams, so a reload mid-answer keeps what was said so far.
    const kept = turns.filter((turn) => turn.content.trim()).slice(-MAX_STORED_TURNS);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(kept));
    } catch {
      // Private mode or full storage: the chat still works for this visit.
    }
  }, [turns, storageKey, loadedKey]);

  useEffect(() => {
    announceSenpaiOpen(open);
    if (open) inputRef.current?.focus();
  }, [open]);
  useEffect(() => () => announceSenpaiOpen(false), []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [turns, open]);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  async function ask(text: string) {
    const question = text.trim();
    if (!question || streaming) return;
    if (question.length > MAX_CHARS) {
      setError(t('senpai.tooLong'));
      return;
    }
    setError(null);
    setDraft('');
    const history: Turn[] = [...turns, { role: 'student', content: question }];
    setTurns([...history, { role: 'senpai', content: '' }]);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;
    let reply = '';
    try {
      const response = await fetch('/api/senpai', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          turns: history.filter((turn) => turn.content.trim()),
          path: pathname,
          sessionId: currentSessionId(pathname),
        }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        const data = (await response.json().catch(() => ({}))) as {
          code?: string;
          details?: { retryAfterSeconds?: number };
        };
        throw new Error(
          data.code === 'rate_limited'
            ? t('senpai.rateLimited', { seconds: data.details?.retryAfterSeconds ?? 60 })
            : data.code === 'too_long'
              ? t('senpai.tooLong')
              : data.code === 'declined'
                ? t('senpai.declined')
                : t('senpai.error'),
        );
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        const shown = reply;
        setTurns([...history, { role: 'senpai', content: shown }]);
      }
      reply += decoder.decode();
      if (!reply.trim()) throw new Error(t('senpai.error'));
      setTurns([...history, { role: 'senpai', content: reply }]);
    } catch (cause) {
      if (controller.signal.aborted) {
        setTurns(reply.trim() ? [...history, { role: 'senpai', content: reply }] : history);
      } else {
        // Leave the question out so it can be sent again from the box.
        setTurns(turns);
        setDraft(question);
        setError(cause instanceof Error ? cause.message : t('senpai.error'));
      }
    } finally {
      abortRef.current = null;
      setStreaming(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void ask(draft);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends; Shift+Enter is a new line; IME conversion is left alone.
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void ask(draft);
    }
  }

  function reset() {
    abortRef.current?.abort();
    setTurns([]);
    setError(null);
  }

  const suggestions = [t('senpai.suggest1'), t('senpai.suggest2'), t('senpai.suggest3')];

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          data-testid="senpai-open"
          className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full border border-brand-300 bg-surface px-4 py-2.5 text-sm font-bold text-brand-600 shadow-float transition-transform hover:-translate-y-0.5 hover:bg-brand-50"
        >
          <span aria-hidden className="grid h-7 w-7 place-items-center rounded-full bg-brand-600 text-sm text-white">
            先
          </span>
          {t('senpai.open')}
        </button>
      ) : (
        <section
          role="dialog"
          aria-label={t('senpai.title')}
          data-testid="senpai-panel"
          data-provider={provider}
          className="fixed inset-x-2 bottom-2 z-50 flex max-h-[min(640px,calc(100dvh-1rem))] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-float sm:inset-x-auto sm:bottom-4 sm:left-4 sm:w-[380px]"
        >
          <header className="flex items-center gap-3 border-b border-line bg-brand-50 px-4 py-3">
            <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-600 font-bold text-white">
              先
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-strong">{t('senpai.title')}</h2>
              <p className="truncate text-[11px] text-muted">{t('senpai.subtitle')}</p>
            </div>
            {turns.length ? (
              <button
                type="button"
                onClick={reset}
                data-testid="senpai-reset"
                className="rounded-md px-2 py-1 text-[11px] text-muted hover:bg-surface hover:text-strong"
              >
                {t('senpai.clear')}
              </button>
            ) : null}
            <button
              type="button"
              onClick={close}
              aria-label={t('senpai.close')}
              data-testid="senpai-close"
              className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-surface hover:text-strong"
            >
              ✕
            </button>
          </header>

          {provider === 'mock' ? (
            <p className="border-b border-line bg-sunken px-4 py-1.5 text-[11px] text-muted" data-testid="senpai-offline">
              {t('senpai.offline')}
            </p>
          ) : null}

          <div ref={scrollRef} className="min-h-[200px] flex-1 space-y-3 overflow-y-auto px-4 py-4" data-testid="senpai-messages">
            <Bubble role="senpai">{t('senpai.hello', { name: displayName })}</Bubble>
            {turns.map((turn, index) =>
              turn.role === 'senpai' && !turn.content ? (
                <p key={index} className="text-xs text-muted" data-testid="senpai-thinking">
                  {t('senpai.thinking')}
                </p>
              ) : (
                <Bubble key={index} role={turn.role}>
                  {turn.role === 'senpai' ? <Markdown source={turn.content} /> : turn.content}
                </Bubble>
              ),
            )}
            {!turns.length ? (
              <div className="flex flex-col items-start gap-2 pt-1">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void ask(s)}
                    className="rounded-full border border-brand-300 px-3 py-1.5 text-left text-xs text-brand-600 hover:bg-brand-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <form onSubmit={onSubmit} className="border-t border-line px-3 py-3">
            {error ? (
              <p className="mb-2 text-xs text-danger-600" role="alert" data-testid="senpai-error">
                {error}
              </p>
            ) : null}
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                rows={2}
                maxLength={MAX_CHARS}
                placeholder={t('senpai.placeholder')}
                data-testid="senpai-input"
                className="min-h-[44px] flex-1 resize-none rounded-lg border border-line bg-surface px-3 py-2 text-sm text-strong outline-none focus:border-brand-300"
              />
              <button
                type="submit"
                disabled={!draft.trim() || streaming}
                data-testid="senpai-send"
                className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
              >
                {t('senpai.send')}
              </button>
            </div>
            <p className="mt-1.5 text-[10px] text-muted">{t('senpai.notScored')}</p>
          </form>
        </section>
      )}
    </>
  );
}

function Bubble({ role, children }: { role: Turn['role']; children: React.ReactNode }) {
  return role === 'student' ? (
    <div className="ml-8 whitespace-pre-wrap rounded-2xl rounded-tr-md bg-brand-600 px-3.5 py-2.5 text-[13px] leading-relaxed text-white" data-testid="senpai-student">
      {children}
    </div>
  ) : (
    <div className="prose-senpai mr-6 rounded-2xl rounded-tl-md bg-brand-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-strong" data-testid="senpai-reply">
      {children}
    </div>
  );
}
