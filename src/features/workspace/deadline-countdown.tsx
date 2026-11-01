'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui';
import { useT } from '@/i18n/client';

/**
 * Live countdown to the 24-hour deadline. Pure presentation — nothing in the
 * engine expires a session yet, so this informs rather than enforces.
 */
export function DeadlineCountdown({ deadlineAt }: { deadlineAt: string }) {
  const t = useT();
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setRemaining(new Date(deadlineAt).getTime() - Date.now());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [deadlineAt]);

  if (remaining === null) {
    return <span className="font-mono text-[11px] text-muted">—</span>;
  }

  if (remaining <= 0) {
    return (
      <Badge tone="danger" dot>
        {t('deadline.passed')}
      </Badge>
    );
  }

  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const tone = hours < 3 ? 'warn' : 'muted';

  return (
    <Badge tone={tone} dot title={new Date(deadlineAt).toLocaleString()}>
      {t('deadline.left', { hours, minutes: String(minutes).padStart(2, '0') })}
    </Badge>
  );
}
