'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Badge, Button, Card } from '@/components/ui';
import { Cover } from '@/components/media';
import { useToast } from '@/components/toast';
import { useT } from '@/i18n/client';
import type { MessageKey } from '@/i18n/messages/en';
import type { DepartmentDefinition } from '@/types/scenario';

export type SessionSummary = {
  id: string;
  departmentSlug: string;
  status: string;
  /** Steps finished and steps in the scenario, where the caller has them. */
  completedSteps?: number;
  totalSteps?: number;
};

const GLYPHS: Record<string, string> = {
  marketing: '◆',
  sales: '▲',
  'product-management': '●',
  strategy: '◇',
  'human-resources': '■',
};

/**
 * Choose up to three departments and start or resume their bootcamps.
 *
 * `variant="desk"` is the same chooser as the reception desk opens it over the
 * office: no cover pictures or office link, the department being played marked
 * as such, and `onOpenSession` deciding where a started or resumed bootcamp
 * goes. Sessions are never deleted here — switching department only opens a
 * different session, so every department keeps its own progress.
 */
export function DepartmentChooser({
  departments,
  initialSelection,
  sessions,
  variant = 'page',
  currentSessionId = null,
  onOpenSession,
}: {
  departments: DepartmentDefinition[];
  initialSelection: string[];
  sessions: SessionSummary[];
  variant?: 'page' | 'desk';
  currentSessionId?: string | null;
  onOpenSession?: (sessionId: string) => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const t = useT();
  const [selected, setSelected] = useState<string[]>(initialSelection);
  const [busy, setBusy] = useState<string | null>(null);

  const desk = variant === 'desk';
  const sessionFor = (slug: string) =>
    sessions.find((s) => s.departmentSlug === slug) ?? null;
  const openSession = (sessionId: string) =>
    onOpenSession ? onOpenSession(sessionId) : router.push(`/office?session=${sessionId}`);

  function toggle(slug: string) {
    setSelected((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= 3) {
        toast.push({
          tone: 'warn',
          title: t('chooser.limitTitle'),
          description: t('chooser.limitBody'),
        });
        return prev;
      }
      return [...prev, slug];
    });
  }

  async function saveSelection() {
    setBusy('selection');
    try {
      const response = await fetch('/api/departments/selection', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ departmentSlugs: selected }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? t('chooser.saveFailed'));
      toast.push({ tone: 'success', title: t('chooser.saved') });
      router.refresh();
    } catch (cause) {
      toast.push({
        tone: 'danger',
        title: t('chooser.saveFailed'),
        description: cause instanceof Error ? cause.message : undefined,
      });
    } finally {
      setBusy(null);
    }
  }

  async function startBootcamp(slug: string) {
    setBusy(slug);
    try {
      const existing = sessionFor(slug);
      if (existing) {
        openSession(existing.id);
        setBusy(null);
        return;
      }
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ departmentSlug: slug }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? t('chooser.startFailed'));
      openSession(data.session.id);
    } catch (cause) {
      toast.push({
        tone: 'danger',
        title: t('chooser.startFailed'),
        description: cause instanceof Error ? cause.message : undefined,
      });
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-sunken px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex gap-1" aria-hidden>
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                className={`h-1.5 w-7 rounded-full transition-colors duration-300 ${
                  index < selected.length ? 'bg-brand-500' : 'bg-sunken'
                }`}
              />
            ))}
          </div>
          <p className="text-[11px] text-muted">
            {t('chooser.selected.before')}
            <span className="font-semibold text-strong">{selected.length}</span>
            {t('chooser.selected.after')} · {t('chooser.buildNote')}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={saveSelection}
          loading={busy === 'selection'}
          disabled={selected.length === 0}
        >
          {t('chooser.save')}
        </Button>
      </div>

      <div className={`grid gap-4 ${desk ? 'sm:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2 xl:grid-cols-3'}`}>
        {departments.map((department) => {
          const isSelected = selected.includes(department.slug);
          const session = sessionFor(department.slug);
          const playable = department.status === 'playable';
          const current = !!session && session.id === currentSessionId;
          const hasProgress = session?.totalSteps !== undefined && session.completedSteps !== undefined;

          return (
            <Card
              key={department.slug}
              data-department-slug={department.slug}
              data-department-status={department.status}
              data-department-session={session?.status ?? 'none'}
              data-department-current={current ? 'true' : undefined}
              accent={department.accentColor}
              interactive
              className={`flex flex-col transition-shadow duration-200 ${
                isSelected ? 'border-brand-500/60 shadow-lg shadow-brand-600/10' : ''
              }`}
            >
              <Cover
                src={department.coverImage}
                alt=""
                className={`${desk ? 'h-20' : 'h-32'} border-b border-line`}
                overlay={
                  <>
                    <span
                      className="absolute inset-x-0 bottom-0 h-px"
                      style={{ background: department.accentColor, opacity: 0.35 }}
                    />
                    <span className="absolute right-3 top-3 flex gap-1.5">
                      {current ? <Badge tone="brand">{t('desk.current')}</Badge> : null}
                      {playable ? (
                        <Badge tone="success" dot>
                          {t('chooser.playable')}
                        </Badge>
                      ) : (
                        <Badge tone="muted">{t('chooser.comingSoon')}</Badge>
                      )}
                    </span>
                  </>
                }
              />

              <button
                type="button"
                onClick={() => toggle(department.slug)}
                aria-pressed={isSelected}
                className="flex flex-1 cursor-pointer flex-col p-5 text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="grid size-8 place-items-center rounded-xl text-sm"
                      style={{
                        color: department.accentColor,
                        backgroundColor: `${department.accentColor}1f`,
                      }}
                      aria-hidden
                    >
                      {GLYPHS[department.slug] ?? '◆'}
                    </span>
                    <div>
                      <div
                        className="text-sm font-semibold"
                        style={{ color: department.accentColor }}
                      >
                        {department.name}
                      </div>
                      <div className="text-[11px] text-muted">{department.tagline}</div>
                    </div>
                  </div>

                  <span
                    className={`grid size-5 shrink-0 place-items-center rounded-md border text-[10px] transition-all duration-150 ${
                      isSelected
                        ? 'border-brand-500 bg-brand-500 text-white'
                        : 'border-line-strong text-transparent'
                    }`}
                    aria-hidden
                  >
                    ✓
                  </span>
                </div>

                <p className="mt-4 text-sm font-medium text-strong">
                  {department.projectTitle}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  {department.description}
                </p>

                <dl className="mt-auto space-y-1.5 pt-4 text-[11px]">
                  {[
                    [t('chooser.coreQuestion'), department.coreQuestion],
                    [t('chooser.finalOutput'), department.finalOutput],
                    [
                      t('chooser.startingPoint'),
                      department.productKey
                        ? t('chooser.productExists')
                        : t('chooser.noProduct'),
                    ],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-3">
                      <dt className="shrink-0 text-subtle">{label}</dt>
                      <dd className="text-right text-body">{value}</dd>
                    </div>
                  ))}
                </dl>
              </button>

              <div className="border-t border-line px-5 py-3.5">
                {playable ? (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => startBootcamp(department.slug)}
                      loading={busy === department.slug}
                      className="flex-1"
                    >
                      {current ? t('desk.continueHere') : session ? t('chooser.resume') : t('chooser.start')}
                    </Button>
                    {session ? (
                      <span className="flex shrink-0 flex-col items-end gap-0.5">
                        <Badge tone={session.status === 'completed' ? 'success' : 'brand'} dot>
                          {t(`sessionStatus.${session.status}` as MessageKey)}
                        </Badge>
                        {hasProgress ? (
                          <span className="text-[10px] tabular-nums text-muted">
                            {t('desk.progress', { done: session.completedSteps!, total: session.totalSteps! })}
                          </span>
                        ) : null}
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <span className="text-[11px] text-subtle">
                    {t('chooser.notAuthored')}
                  </span>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {desk ? null : (
      <div className="flex justify-end">
        <Link
          href="/office"
          className="text-xs text-muted underline-offset-4 transition-colors hover:text-strong hover:underline"
        >
          {t('chooser.officeLink')}
        </Link>
      </div>
      )}
    </div>
  );
}
