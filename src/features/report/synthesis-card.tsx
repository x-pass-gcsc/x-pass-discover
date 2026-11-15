'use client';

import { useEffect, useState } from 'react';
import { Badge, Card } from '@/components/ui';
import { useT } from '@/i18n/client';
import type { Synthesis } from '@/services/report/synthesis';

/**
 * The overall summary at the top of the final report. It renders at once
 * with what the server has (a stored Claude summary, or the rules'), and —
 * when Claude can do better — asks for Claude's summary in the background
 * and swaps it in, so the page never waits on the API.
 */
export function SynthesisCard({ initial, canImprove }: { initial: Synthesis; canImprove: boolean }) {
  const t = useT();
  const [synthesis, setSynthesis] = useState(initial);
  const [improving, setImproving] = useState(canImprove);

  useEffect(() => {
    if (!canImprove) return;
    let cancelled = false;
    fetch('/api/report/synthesis', { method: 'POST' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data?.synthesis) setSynthesis(data.synthesis);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setImproving(false);
      });
    return () => {
      cancelled = true;
    };
  }, [canImprove]);

  return (
    <Card
      className="overflow-hidden"
      data-testid="report-synthesis"
      data-synthesis-source={synthesis.source}
      aria-busy={improving}
    >
      <div className="border-b border-line bg-gradient-to-r from-brand-50 to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-600">
            {t('report.synth.kicker')}
          </span>
          <Badge tone={synthesis.source === 'claude' ? 'brand' : 'muted'} className="ml-auto">
            {improving
              ? t('report.synth.improving')
              : synthesis.source === 'claude'
                ? t('report.synth.source.claude')
                : t('report.synth.source.rules')}
          </Badge>
        </div>
        <h2 className="mt-2 text-lg font-bold leading-snug text-strong" data-testid="report-synthesis-headline">
          {synthesis.headline}
        </h2>
      </div>
      <div className="grid gap-5 px-5 py-4 md:grid-cols-[1.6fr_1fr]">
        <div className="space-y-3 text-[13px] leading-relaxed text-body">
          {synthesis.paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        <div className="rounded-xl border border-line bg-sunken px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            {t('report.synth.nextTitle')}
          </p>
          <ol className="mt-2 space-y-2 text-xs leading-relaxed text-strong">
            {synthesis.nextSteps.map((step, index) => (
              <li key={index} className="flex gap-2">
                <span className="font-mono text-brand-600">{index + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <p className="border-t border-line px-5 py-2.5 text-[10px] leading-relaxed text-subtle">
        {t('report.synth.note')}
      </p>
    </Card>
  );
}
