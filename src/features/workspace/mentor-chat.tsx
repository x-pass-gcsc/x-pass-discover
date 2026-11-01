'use client';

import { useState } from 'react';
import { Portrait } from '@/components/media';
import { ChatPanel } from '@/features/ai/chat-panel';
import { useT } from '@/i18n/client';
import type { PublicPersona } from '@/types/ai';
import type { SessionView, StepView } from '@/types/session-view';

/**
 * The senior at the student's elbow. A BITE colleague who is wired into the
 * current step answers questions about it; the conversation only opens when the
 * student actually asks, so glancing at the window leaves no trace in the log.
 */
export function MentorChat({
  sessionId,
  step,
  personas,
  onSessionUpdate,
}: {
  sessionId: string;
  step: StepView;
  personas: PublicPersona[];
  onSessionUpdate: (view: SessionView) => void;
}) {
  const t = useT();
  const [askingIn, setAskingIn] = useState<string | null>(null);

  // A conversation partner of this step is the meeting itself, not a mentor.
  const meeting = new Set(
    step.tasks.filter((task) => task.kind === 'ai_conversation').map((task) => task.personaKey),
  );
  const mentor =
    personas.find(
      (p) => p.organization === 'BITE' && p.stepKeys.includes(step.key) && !meeting.has(p.key),
    ) ?? null;

  return (
    <section
      className="overflow-hidden rounded-xl border border-line bg-surface shadow-card"
      data-testid="mentor-chat"
    >
      <h3 className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <span className="flex items-center gap-2 text-sm font-bold text-brand-600">
          {mentor ? <Portrait src={mentor.portrait} alt="" size={28} ring={mentor.avatarColor} /> : null}
          {t('work.mentor')}
        </span>
        {mentor ? <span className="truncate text-[11px] text-muted">{mentor.name}</span> : null}
      </h3>
      {!mentor ? (
        <p className="px-4 py-4 text-[12px] leading-relaxed text-muted">{t('work.mentorBusy')}</p>
      ) : askingIn === step.key ? (
        <ChatPanel
          key={`${mentor.key}:${step.key}`}
          sessionId={sessionId}
          stepKey={step.key}
          persona={mentor}
          minStudentMessages={0}
          onSessionUpdate={onSessionUpdate}
          compact
        />
      ) : (
        <div className="space-y-3 px-4 py-4">
          <p className="relative rounded-2xl rounded-tl-md bg-brand-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-strong">
            {t('work.mentorHello', { title: step.title })}
          </p>
          <button
            type="button"
            onClick={() => setAskingIn(step.key)}
            data-testid="ask-mentor"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-brand-300 bg-surface px-3 py-2 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50"
          >
            ✨ {t('work.askMentor')}
          </button>
        </div>
      )}
    </section>
  );
}
