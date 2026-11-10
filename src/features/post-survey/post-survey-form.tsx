'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card } from '@/components/ui';
import { useToast } from '@/components/toast';
import {
  A6_OPTIONS,
  A7_OPTIONS,
  B2_OPTIONS,
  B3_OPTIONS,
  B7_OPTIONS,
  C2_OPTIONS,
  C5_OPTIONS,
  CAREER_DEPARTMENTS,
  LIMITS,
  finalIssues,
  progressOf,
  type ComparisonAnswers,
  type DepartmentAnswers,
  type ExperienceAnswers,
  type PostSurveyAnswers,
  type PostSurveyIssue,
} from '@/content/post-survey';
import { useT } from '@/i18n/client';
import type { MessageKey } from '@/i18n/messages/en';
import { ChoiceInput, Question, ScaleInput, SingleInput, TextInput } from './inputs';

export type SurveyDepartment = {
  slug: string;
  name: string;
  projectTitle: string;
  finalOutput: string;
  accentColor: string;
  /** The completed session, to open the student's own work from. */
  sessionId: string;
  /** The title of what the student submitted there, if anything. */
  submissionTitle: string | null;
};

type Step = 'intro' | `a${number}` | 'b' | 'c' | 'review';

/**
 * The post-survey form: an introduction, one card per department (part A),
 * the comparison (part B), the X-PASS experience (part C) and a review before
 * submitting. Answers are saved as the student goes (after a pause, on every
 * step change, and on demand), and restored from the server when they come
 * back. The same rules as the server (`content/post-survey.ts`) decide what
 * is missing. Nothing from the pre-survey, the recommendation or any
 * evaluation is shown here.
 */
export function PostSurveyForm({
  departments,
  allDepartments,
  initialAnswers,
}: {
  departments: SurveyDepartment[];
  /** Every department, for "which jobs are you considering" (B4). */
  allDepartments: Array<{ slug: string; name: string }>;
  initialAnswers: PostSurveyAnswers;
}) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const slugs = departments.map((d) => d.slug);
  const [answers, setAnswers] = useState<PostSurveyAnswers>(initialAnswers);
  const [step, setStep] = useState<Step>('intro');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [submitting, setSubmitting] = useState(false);
  const dirty = useRef(false);
  const latest = useRef(answers);
  latest.current = answers;

  const progress = progressOf(answers, slugs);
  const issues = useMemo(() => finalIssues(answers, slugs), [answers, slugs]);

  const save = useCallback(async () => {
    if (!dirty.current) return true;
    dirty.current = false;
    setSaveState('saving');
    try {
      const response = await fetch('/api/post-survey', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(latest.current),
      });
      if (!response.ok) throw new Error((await response.json()).error);
      setSaveState('saved');
      return true;
    } catch (cause) {
      dirty.current = true;
      setSaveState('error');
      toast.push({
        tone: 'danger',
        title: t('post.saveFailed'),
        description: cause instanceof Error ? cause.message : undefined,
      });
      return false;
    }
  }, [t, toast]);

  // Save after a short pause in answering.
  useEffect(() => {
    if (!dirty.current) return;
    const timer = window.setTimeout(() => void save(), 1200);
    return () => window.clearTimeout(timer);
  }, [answers, save]);

  const go = (next: Step) => {
    void save();
    setStep(next);
    window.scrollTo({ top: 0 });
  };

  const setDept = (slug: string, patch: Partial<DepartmentAnswers>) => {
    dirty.current = true;
    setAnswers((prev) => ({
      ...prev,
      departmentAnswers: { ...prev.departmentAnswers, [slug]: { ...prev.departmentAnswers[slug], ...patch } },
    }));
  };
  const setB = (patch: Partial<ComparisonAnswers>) => {
    dirty.current = true;
    setAnswers((prev) => ({ ...prev, comparisonAnswers: { ...prev.comparisonAnswers, ...patch } }));
  };
  const setC = (patch: Partial<ExperienceAnswers>) => {
    dirty.current = true;
    setAnswers((prev) => ({ ...prev, experienceAnswers: { ...prev.experienceAnswers, ...patch } }));
  };

  async function submit() {
    setSubmitting(true);
    try {
      const response = await fetch('/api/post-survey/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(answers),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? t('post.submitFailed'));
      dirty.current = false;
      toast.push({ tone: 'success', title: t('post.submitted') });
      router.refresh();
    } catch (cause) {
      toast.push({
        tone: 'danger',
        title: t('post.submitFailed'),
        description: cause instanceof Error ? cause.message : undefined,
      });
      setSubmitting(false);
    }
  }

  const opts = (prefix: string, values: readonly string[]) =>
    values.map((value) => ({ value, label: t(`${prefix}.${value}` as MessageKey) }));

  const steps: Array<[Step, string]> = [
    ...departments.map((d, i) => [`a${i}` as Step, d.name] as [Step, string]),
    ['b', t('post.part.b')],
    ['c', t('post.part.c')],
    ['review', t('post.review')],
  ];
  const stepIndex = steps.findIndex(([key]) => key === step);
  const stepFor = (issue: PostSurveyIssue): Step => {
    const slugIndex = slugs.findIndex((slug) => issue.path.startsWith(`${slug}.`));
    if (slugIndex >= 0) return `a${slugIndex}`;
    return issue.path.startsWith('b') ? 'b' : 'c';
  };

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-sunken px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-strong" data-testid="post-progress">
          {t('post.progress', progress)}
        </p>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
          <div className="h-full rounded-full bg-brand-500" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
        </div>
      </div>
      <span className="text-[11px] text-muted" aria-live="polite" data-testid="post-save-state">
        {saveState === 'saving' ? t('post.saving') : saveState === 'saved' ? t('post.saved') : ''}
      </span>
      <Button size="sm" variant="secondary" onClick={() => { dirty.current = true; void save(); }} data-testid="post-save">
        {t('post.saveDraft')}
      </Button>
    </div>
  );

  const nav = (prev: Step | null, next: Step | null) => (
    <div className="flex flex-wrap justify-between gap-3">
      {prev ? (
        <Button variant="secondary" onClick={() => go(prev)}>
          {t('post.back')}
        </Button>
      ) : (
        <span />
      )}
      {next ? (
        <Button onClick={() => go(next)} data-testid="post-next">
          {t('post.next')}
        </Button>
      ) : null}
    </div>
  );

  if (step === 'intro') {
    return (
      <Card className="mx-auto max-w-2xl p-6" data-testid="post-intro">
        <h2 className="text-lg font-bold text-strong">{t('post.intro.title')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-body">{t('post.intro.body')}</p>
        <ol className="mt-4 space-y-1 text-xs text-muted">
          <li>{t('post.part.a')}</li>
          <li>{t('post.part.b')}</li>
          <li>{t('post.part.c')}</li>
        </ol>
        <p className="mt-4 text-xs text-muted">{t('post.progress', progress)}</p>
        <div className="mt-5 flex justify-end">
          <Button onClick={() => setStep('a0')} data-testid="post-start">
            {t('post.intro.start')}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4" data-testid="post-survey-form" data-step={step}>
      {header}
      <ol className="flex flex-wrap gap-1.5" aria-label={t('post.title')}>
        {steps.map(([key, label], index) => (
          <li key={key}>
            <button
              type="button"
              onClick={() => go(key)}
              aria-current={key === step ? 'step' : undefined}
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                key === step ? 'border-brand-500 bg-brand-50 text-brand-700' : index < stepIndex ? 'border-line text-body' : 'border-line text-muted'
              }`}
            >
              {label}
            </button>
          </li>
        ))}
      </ol>

      {departments.map((department, index) => {
        if (step !== `a${index}`) return null;
        const a = answers.departmentAnswers[department.slug] ?? {};
        const id = (key: string) => `${department.slug}.${key}`;
        const scaleQ = (key: 'a1' | 'a2' | 'a3' | 'a4' | 'a5', mid = false) => (
          <Question id={id(key)} label={t(`post.${key}.q` as MessageKey)}>
            <ScaleInput
              name={id(key)}
              value={a[key]}
              onChange={(value) => setDept(department.slug, { [key]: value })}
              low={t(`post.${key}.low` as MessageKey)}
              high={t(`post.${key}.high` as MessageKey)}
              mid={mid ? t('post.a5.mid') : undefined}
            />
          </Question>
        );
        return (
          <section key={department.slug} className="space-y-3" data-department-answers={department.slug}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{t('post.part.a')}</p>
            <Card className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base font-bold" style={{ color: department.accentColor }}>
                    {department.name}
                  </h2>
                  <p className="mt-0.5 text-xs text-body">
                    {t('post.project')}: {department.projectTitle}
                  </p>
                  <p className="text-xs text-muted">
                    {t('post.finalOutput')}: {department.finalOutput}
                  </p>
                  {department.submissionTitle ? (
                    <p className="mt-1 text-xs text-strong">
                      {t('post.submission', { title: department.submissionTitle })}
                    </p>
                  ) : null}
                </div>
                <Link
                  href={`/office?session=${department.sessionId}&work=1`}
                  target="_blank"
                  className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-[11px] font-semibold text-brand-600 hover:bg-sunken"
                >
                  {t('post.viewWork')} ↗
                </Link>
              </div>
              <p className="mt-3 text-[11px] text-muted">{t('post.partA.lead')}</p>
            </Card>
            {scaleQ('a1')}
            {scaleQ('a2')}
            {scaleQ('a3')}
            {scaleQ('a4')}
            {scaleQ('a5', true)}
            <Question id={id('a6')} label={t('post.a6.q')} hint={t('post.pickUpTo')}>
              <ChoiceInput
                name={id('a6')}
                options={opts('post.a6.opt', A6_OPTIONS)}
                value={a.a6}
                onChange={(value) => setDept(department.slug, { a6: value as DepartmentAnswers['a6'] })}
                max={LIMITS.maxPicks}
                exclusive={['none']}
              />
              {a.a6?.includes('other') ? (
                <TextInput label={t('post.otherPlaceholder')} value={a.a6Other} onChange={(v) => setDept(department.slug, { a6Other: v })} maxLength={LIMITS.shortText} />
              ) : null}
            </Question>
            <Question id={id('a7')} label={t('post.a7.q')} hint={t('post.pickUpTo')}>
              <ChoiceInput
                name={id('a7')}
                options={opts('post.a7.opt', A7_OPTIONS)}
                value={a.a7}
                onChange={(value) => setDept(department.slug, { a7: value as DepartmentAnswers['a7'] })}
                max={LIMITS.maxPicks}
                exclusive={['none']}
              />
              {a.a7?.includes('other') ? (
                <TextInput label={t('post.otherPlaceholder')} value={a.a7Other} onChange={(v) => setDept(department.slug, { a7Other: v })} maxLength={LIMITS.shortText} />
              ) : null}
            </Question>
            <Question id={id('a8')} label={t('post.a8.q')} hint={t('post.optional')}>
              <TextInput label={t('post.a8.q')} value={a.a8} onChange={(v) => setDept(department.slug, { a8: v })} maxLength={LIMITS.longText} rows={3} />
            </Question>
            {nav(index === 0 ? null : (`a${index - 1}` as Step), index < departments.length - 1 ? (`a${index + 1}` as Step) : 'b')}
          </section>
        );
      })}

      {step === 'b' ? (
        <section className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{t('post.part.b')}</p>
          <Question id="b1" label={t('post.b1.q')}>
            <SingleInput
              name="b1Mode"
              options={opts('post.b1.mode', ['ranked', 'undecided', 'none'])}
              value={answers.comparisonAnswers.b1Mode}
              onChange={(value) => setB({ b1Mode: value as ComparisonAnswers['b1Mode'] })}
            />
            {answers.comparisonAnswers.b1Mode === 'ranked' ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-3" data-testid="post-b1-order">
                {[0, 1, 2].map((place) => {
                  const order = answers.comparisonAnswers.b1Order ?? [];
                  return (
                    <label key={place} className="text-[11px] text-muted">
                      {t('post.b1.place', { n: place + 1 })}
                      <select
                        value={order[place] ?? ''}
                        onChange={(e) => {
                          // Three places, kept in position; an unfilled place is ''.
                          const next = [0, 1, 2].map((i) => order[i] ?? '');
                          next[place] = e.target.value;
                          setB({ b1Order: next });
                        }}
                        className="mt-1 block w-full rounded-lg border border-line-strong bg-surface px-2 py-2 text-xs text-strong"
                        data-place={place + 1}
                      >
                        <option value="">{t('post.b1.choose')}</option>
                        {departments.map((d) => (
                          <option key={d.slug} value={d.slug} disabled={order.includes(d.slug) && order[place] !== d.slug}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                })}
              </div>
            ) : null}
          </Question>
          {answers.comparisonAnswers.b1Mode === 'ranked' ? (
            <Question id="b2" label={t('post.b2.q')} hint={t('post.pickUpTo')}>
              <ChoiceInput
                name="b2"
                options={opts('post.b2.opt', B2_OPTIONS)}
                value={answers.comparisonAnswers.b2}
                onChange={(value) => setB({ b2: value as ComparisonAnswers['b2'] })}
                max={LIMITS.maxPicks}
              />
              {answers.comparisonAnswers.b2?.includes('other') ? (
                <TextInput label={t('post.otherPlaceholder')} value={answers.comparisonAnswers.b2Other} onChange={(v) => setB({ b2Other: v })} maxLength={LIMITS.shortText} />
              ) : null}
            </Question>
          ) : null}
          <Question id="b3" label={t('post.b3.q')}>
            <SingleInput name="b3" options={opts('post.b3.opt', B3_OPTIONS)} value={answers.comparisonAnswers.b3} onChange={(value) => setB({ b3: value as ComparisonAnswers['b3'] })} />
            {answers.comparisonAnswers.b3 === 'yes' ? (
              <TextInput label={t('post.b3.text')} value={answers.comparisonAnswers.b3Text} onChange={(v) => setB({ b3Text: v })} maxLength={LIMITS.longText} />
            ) : null}
          </Question>
          <Question id="b4" label={t('post.b4.q')} hint={t('post.pickAny')}>
            <ChoiceInput
              name="b4"
              options={[
                ...CAREER_DEPARTMENTS.map((slug) => ({ value: slug, label: allDepartments.find((d) => d.slug === slug)?.name ?? slug })),
                { value: 'other', label: t('post.b4.opt.other') },
                { value: 'none', label: t('post.b4.opt.none') },
              ]}
              value={answers.comparisonAnswers.b4}
              onChange={(value) => setB({ b4: value as ComparisonAnswers['b4'] })}
              max={null}
              exclusive={['none']}
            />
            {answers.comparisonAnswers.b4?.includes('other') ? (
              <TextInput label={t('post.otherPlaceholder')} value={answers.comparisonAnswers.b4Other} onChange={(v) => setB({ b4Other: v })} maxLength={LIMITS.shortText} />
            ) : null}
          </Question>
          <Question id="b5" label={t('post.b5.q')}>
            <ScaleInput name="b5" value={answers.comparisonAnswers.b5} onChange={(v) => setB({ b5: v })} low={t('post.b5.low')} high={t('post.b5.high')} />
          </Question>
          <Question id="b6" label={t('post.b6.q')}>
            <ScaleInput name="b6" value={answers.comparisonAnswers.b6} onChange={(v) => setB({ b6: v })} low={t('post.b6.low')} high={t('post.b6.high')} />
          </Question>
          <Question id="b7" label={t('post.b7.q')} hint={t('post.pickUpTo')}>
            <ChoiceInput
              name="b7"
              options={opts('post.b7.opt', B7_OPTIONS)}
              value={answers.comparisonAnswers.b7}
              onChange={(value) => setB({ b7: value as ComparisonAnswers['b7'] })}
              max={LIMITS.maxPicks}
              exclusive={['decided']}
            />
            {answers.comparisonAnswers.b7?.includes('other') ? (
              <TextInput label={t('post.otherPlaceholder')} value={answers.comparisonAnswers.b7Other} onChange={(v) => setB({ b7Other: v })} maxLength={LIMITS.shortText} />
            ) : null}
          </Question>
          {nav(`a${departments.length - 1}` as Step, 'c')}
        </section>
      ) : null}

      {step === 'c' ? (
        <section className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{t('post.part.c')}</p>
          <Question id="c1" label={t('post.c1.q')}>
            <ScaleInput name="c1" value={answers.experienceAnswers.c1} onChange={(v) => setC({ c1: v })} low={t('post.c1.low')} high={t('post.c1.high')} />
          </Question>
          <Question id="c2" label={t('post.c2.q')}>
            <SingleInput name="c2" options={opts('post.c2.opt', C2_OPTIONS)} value={answers.experienceAnswers.c2} onChange={(v) => setC({ c2: v as ExperienceAnswers['c2'] })} />
            <TextInput label={`${t('post.c2.detail')} (${t('post.optional')})`} value={answers.experienceAnswers.c2Detail} onChange={(v) => setC({ c2Detail: v })} maxLength={LIMITS.longText} />
          </Question>
          <Question id="c3" label={t('post.c3.q')}>
            <ScaleInput
              name="c3"
              value={typeof answers.experienceAnswers.c3 === 'number' ? answers.experienceAnswers.c3 : undefined}
              onChange={(v) => setC({ c3: v })}
              low={t('post.c3.low')}
              high={t('post.c3.high')}
            />
            <label className="mt-2 flex items-center gap-2 text-xs text-body">
              <input
                type="checkbox"
                checked={answers.experienceAnswers.c3 === 'not_used'}
                onChange={(e) => setC({ c3: e.target.checked ? 'not_used' : undefined })}
                className="accent-brand-600"
              />
              {t('post.c3.notUsed')}
            </label>
          </Question>
          <Question id="c4" label={t('post.c4.q')}>
            <ScaleInput name="c4" value={answers.experienceAnswers.c4} onChange={(v) => setC({ c4: v })} low={t('post.c4.low')} high={t('post.c4.high')} />
          </Question>
          <Question id="c5" label={t('post.c5.q')}>
            <SingleInput name="c5" options={opts('post.c5.opt', C5_OPTIONS)} value={answers.experienceAnswers.c5} onChange={(v) => setC({ c5: v as ExperienceAnswers['c5'] })} />
          </Question>
          <Question id="c6" label={t('post.c6.best')} hint={t('post.optional')}>
            <TextInput label={t('post.c6.best')} value={answers.experienceAnswers.c6Best} onChange={(v) => setC({ c6Best: v })} maxLength={LIMITS.longText} />
            <TextInput label={t('post.c6.change')} value={answers.experienceAnswers.c6Change} onChange={(v) => setC({ c6Change: v })} maxLength={LIMITS.longText} />
          </Question>
          <Question id="c7" label={t('post.c7.q')} hint={t('post.optional')}>
            <TextInput label={t('post.c7.q')} value={answers.experienceAnswers.c7} onChange={(v) => setC({ c7: v })} maxLength={LIMITS.longText} rows={3} />
          </Question>
          {nav('b', 'review')}
        </section>
      ) : null}

      {step === 'review' ? (
        <Card className="space-y-4 p-5" data-testid="post-review">
          <h2 className="text-base font-bold text-strong">{t('post.review.title')}</h2>
          {issues.length > 0 ? (
            <div data-testid="post-missing">
              <p className="text-xs text-body">{t('post.review.missing', { count: issues.length })}</p>
              <ul className="mt-2 space-y-1 text-xs">
                {issues.map((issue) => (
                  <li key={`${issue.path}-${issue.code}`} className="flex items-center justify-between gap-3">
                    <span className="text-muted">{labelFor(issue, departments, t)}</span>
                    <button type="button" onClick={() => go(stepFor(issue))} className="text-brand-600 hover:underline">
                      {t('post.review.goTo')}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-body">{t('post.review.body')}</p>
          )}
          <div className="flex flex-wrap justify-between gap-3">
            <Button variant="secondary" onClick={() => go('c')}>
              {t('post.back')}
            </Button>
            <Button onClick={submit} loading={submitting} disabled={issues.length > 0} data-testid="post-submit">
              {t('post.submit')}
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

/** "Sales — How interesting was the work itself?" for a missing answer. */
function labelFor(
  issue: PostSurveyIssue,
  departments: SurveyDepartment[],
  t: ReturnType<typeof useT>,
): string {
  const [first, second] = issue.path.split('.');
  const department = departments.find((d) => d.slug === first);
  const key = (department ? second : first).replace(/Other$/, '');
  const question = t(`post.${key}.q` as MessageKey);
  return department ? `${department.name} — ${question}` : question;
}
