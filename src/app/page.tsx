import Link from 'next/link';
import Image from 'next/image';
import { Logo, RuntimeBadges } from '@/components/branding';
import { AccountMenu } from '@/features/auth/account-menu';
import { Cover } from '@/components/media';
import { Badge, Card } from '@/components/ui';
import { MEDIA } from '@/content/media';
import { listLocalizedDepartments } from '@/content/departments';
import type { MessageKey } from '@/i18n/messages/en';
import { getLocale, getT } from '@/i18n/server';
import { getCurrentUser } from '@/lib/auth/session';
import { runtimeModeSummary } from '@/lib/env';

/** Research → Interview → Decide → Revise, as `landing.flow.<n>.*` messages. */
const FLOW = [1, 2, 3, 4] as const;

/**
 * The revision band. Each claim here describes behaviour that exists: saves are
 * versioned in `task_answer_revisions` alongside the value they replaced, and
 * behaviour logs are evidence rather than points.
 */
const REVISION_POINTS = [1, 2, 3] as const;

export default async function LandingPage() {
  const user = await getCurrentUser();
  const runtime = runtimeModeSummary();
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const departments = listLocalizedDepartments(locale);
  const departmentName = (slug: string) => departments.find((d) => d.slug === slug)?.name ?? slug;

  return (
    <div className="mx-auto max-w-6xl px-5 pb-20 pt-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Logo />
        <div className="flex flex-wrap items-center gap-3">
          <RuntimeBadges
            persistence={runtime.persistence}
            persistenceLabel={runtime.persistenceLabel}
            persistenceIsEphemeral={runtime.persistenceIsEphemeral}
            ai={runtime.ai}
            aiLabel={runtime.aiLabel}
            aiModeDowngraded={runtime.aiModeDowngraded}
          />
          <AccountMenu />
        </div>
      </header>

      <section className="mt-16 grid animate-fade-up items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
        <Badge tone="brand" dot>
          {t('landing.badge')}
        </Badge>

        <h1 className="mt-6 text-[2.75rem] font-bold leading-[1.08] tracking-tight text-strong sm:text-6xl">
          {t('landing.h1a')}
          <br />
          {t('landing.h1b')}
          <br />
          <span className="bg-gradient-to-r from-brand-400 via-brand-300 to-accent-400 bg-clip-text text-transparent">
            {t('landing.h1c')}
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-body">
          {t('landing.lead')}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={user ? '/office' : '/signup'}
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand-600/25 transition-colors hover:bg-brand-500"
          >
            {user ? t('landing.continue') : t('landing.createAccount')}
          </Link>
          <Link
            href="/office"
            className="rounded-xl border border-line-strong bg-surface px-5 py-2.5 text-sm font-medium text-body shadow-card transition-colors hover:border-subtle hover:bg-sunken hover:text-strong"
          >
            {t('landing.visitOffice')}
          </Link>
          {user ? null : (
            <Link
              href="/login"
              className="text-sm text-muted underline-offset-4 transition-colors hover:text-strong hover:underline"
            >
              {t('landing.signInPrompt')}
            </Link>
          )}
          </div>
        </div>

        {/* The company is a place before it is a product, so the front door leads. */}
        <Cover
          src={MEDIA.companyExterior.src}
          alt={t('media.companyExterior')}
          priority
          className="h-64 rounded-2xl border border-line shadow-raised sm:h-80"
          overlay={
            <span className="absolute bottom-3 left-3 rounded-lg bg-white/90 px-2.5 py-1 text-[11px] font-medium text-body shadow-card">
              {t('landing.hq')}
            </span>
          }
        />
      </section>

      <section className="mt-16 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FLOW.map((n) => (
          <Card key={n} className="p-4">
            <span className="font-mono text-[11px] text-subtle">
              0{n}
            </span>
            <p className="mt-2 text-sm font-semibold text-strong">{t(`landing.flow.${n}.title` as MessageKey)}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">{t(`landing.flow.${n}.body` as MessageKey)}</p>
          </Card>
        ))}
      </section>

      <section className="mt-16">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
            {t('landing.sameCompany')}
          </h2>
          <span className="text-[11px] text-subtle">
            {t('landing.choose')}
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((department) => (
            <Card key={department.slug} interactive className="overflow-hidden">
              <div className="relative h-24 border-b border-line">
                <Image
                  src={department.coverImage}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 360px"
                  className="object-cover"
                />
              </div>
              <div className="p-4">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-sm font-semibold"
                  style={{ color: department.accentColor }}
                >
                  {department.name}
                </span>
                {department.status === 'playable' ? (
                  <Badge tone="success" dot>
                    {t('chooser.playable')}
                  </Badge>
                ) : (
                  <Badge tone="muted">{t('chooser.comingSoon')}</Badge>
                )}
              </div>
              <p className="mt-2.5 text-xs font-medium text-strong">
                {department.projectTitle}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                {department.coreQuestion}
              </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/*
        One dark band in an otherwise light page, and it earns it: revising a
        decision is the part of the work most products leave out, and a dusk
        photograph is the one frame here that can carry white type.
      */}
      <section className="relative mt-16 overflow-hidden rounded-3xl border border-line shadow-raised">
        <Image
          src={MEDIA.decisionDesk.src}
          alt={t('media.decisionDesk')}
          fill
          sizes="(max-width: 1024px) 100vw, 1152px"
          className="object-cover"
          style={{ objectPosition: '50% 42%' }}
        />
        {/*
          A flat base plus a horizontal wash, for the same reason HeroBanner
          layers its overlay: a single gradient that reaches full transparency
          leaves a visible band where it ends.
        */}
        <div className="absolute inset-0 bg-[#0b1220]/35" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(94deg, rgba(11,18,32,0.94) 0%, rgba(11,18,32,0.90) 42%, rgba(11,18,32,0.74) 64%, rgba(11,18,32,0.42) 86%, rgba(11,18,32,0.32) 100%)',
          }}
        />

        <div className="relative px-7 py-12 sm:px-10 sm:py-14">
          <Badge tone="brand" dot className="bg-white/95">
            {t('landing.revision.badge')}
          </Badge>
          <h2 className="mt-5 max-w-xl text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
            {t('landing.revision.title')}
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/75">
            {t('landing.revision.body')}
          </p>

          <dl className="mt-8 grid max-w-2xl gap-x-7 gap-y-5 sm:grid-cols-3">
            {REVISION_POINTS.map((n) => (
              <div key={n} className="border-t border-white/20 pt-3">
                <dt className="text-xs font-semibold text-white">{t(`landing.revision.${n}.term` as MessageKey)}</dt>
                <dd className="mt-1 text-xs leading-relaxed text-white/70">
                  {t(`landing.revision.${n}.detail` as MessageKey)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mt-16 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-strong">
            {t('landing.likeFit.title')}
          </h3>
          <p className="mt-2.5 text-xs leading-relaxed text-muted">{t('landing.likeFit.body')}</p>
          <div className="mt-4 overflow-hidden rounded-xl border border-line">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-sunken">
                  <th className="px-3 py-2 text-left font-medium text-muted">{t('common.department')}</th>
                  <th className="px-3 py-2 text-right font-medium text-muted">LIKE</th>
                  <th className="px-3 py-2 text-right font-medium text-muted">SKILL FIT</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['marketing', '91', '83'],
                  ['product-management', '78', '89'],
                  ['strategy', '84', '86'],
                ].map(([slug, like, fit]) => (
                  <tr key={slug} className="border-t border-line">
                    <td className="px-3 py-2 text-body">{departmentName(slug)}</td>
                    <td className="px-3 py-2 text-right font-mono text-strong">{like}</td>
                    <td className="px-3 py-2 text-right font-mono text-strong">{fit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[10px] text-subtle">
            {t('landing.illustrative')}
          </p>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-strong">{t('welcome.notTitle')}</h3>
          <ul className="mt-3 space-y-2 text-xs text-muted">
            {[t('welcome.not1'), t('welcome.not2'), t('welcome.not3'), t('welcome.not4'), t('welcome.not5')].map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <span className="text-body" aria-hidden>
                  ✕
                </span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-line pt-4 text-xs leading-relaxed text-body">
            {t('welcome.isTitle')}
          </p>
        </Card>
      </section>
    </div>
  );
}
