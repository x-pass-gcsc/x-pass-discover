'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { DepartmentChooser } from '@/features/departments/department-chooser';
import type { DepartmentDesk as DeskData } from '@/features/departments/load-desk';
import { useT } from '@/i18n/client';

const noSubscribe = () => () => undefined;

/**
 * The reception desk: the department chooser, opened over the office when the
 * student talks to reception. Escape or the close button puts them back where
 * they were standing; starting or resuming a bootcamp hands the session id to
 * `onOpenSession`, which switches the office to it without leaving the page.
 */
export function DepartmentDesk({
  desk,
  currentSessionId,
  onOpenSession,
  onClose,
}: {
  desk: DeskData;
  currentSessionId: string | null;
  onOpenSession: (sessionId: string) => void;
  onClose: () => void;
}) {
  const t = useT();
  const hydrated = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  // Portalled to <body> for the same reason as the work window: <main> keeps
  // a transform from its entrance animation.
  if (!hydrated) return null;
  return createPortal(
    <div
      // On a wide screen it sits under the one-line site header (z-30), so the
      // language and account menus stay usable. Narrower, the header wraps to
      // several lines and would hide the desk's own title and close button, so
      // the desk covers it instead.
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-[#0f1729]/45 px-2 pb-4 pt-3 backdrop-blur-[2px] sm:px-6 xl:z-20 xl:pt-[68px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="department-desk-title"
      data-testid="department-desk"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[1120px] animate-pop overflow-hidden rounded-xl border-2 border-[#1d2433] bg-canvas shadow-[0_30px_60px_-20px_rgba(15,23,41,0.6)]">
        <div className="flex items-center gap-3 bg-[#1d2433] px-4 py-2.5 text-white">
          <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-600 text-sm font-bold">
            B
          </span>
          <span className="min-w-0 flex-1">
            <h2 id="department-desk-title" className="truncate text-sm font-semibold">
              {t('desk.title')}
            </h2>
            <p className="truncate text-[11px] text-white/70 max-sm:hidden">{t('desk.subtitle')}</p>
          </span>
          <button
            type="button"
            onClick={onClose}
            data-testid="close-desk"
            className="flex shrink-0 items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20"
          >
            {t('desk.close')}
            <kbd className="rounded border border-white/20 px-1 font-mono text-[9px] font-normal text-white/60 max-sm:hidden">
              Esc
            </kbd>
          </button>
        </div>
        <div className="p-3 sm:p-5">
          <p className="mb-3 text-xs text-muted sm:hidden">{t('desk.subtitle')}</p>
          <DepartmentChooser
            departments={desk.departments}
            plan={desk.plan}
            preSurveyComplete={desk.preSurveyComplete}
            sessions={desk.sessions}
            currentSessionId={currentSessionId}
            onOpenSession={onOpenSession}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
