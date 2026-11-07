import type { RoleScore } from '@/content/pre-survey-rubric-v1';
import type { MessageKey } from '@/i18n/messages/en';
import type { Translate } from '@/i18n/translate';

/**
 * One job's three Pre-LIKE areas as labelled bars, each 0–100. Shared by the
 * pre-survey result and the career report so both read the same way.
 */
export function PreLikeAreas({ role, name, t }: { role: RoleScore; name: string; t: Translate }) {
  return (
    <ul className="space-y-1">
      {role.dimensions.map((dimension) => {
        const area = t(`report.dim.${dimension.code}` as MessageKey);
        return (
          <li
            key={dimension.code}
            className="grid grid-cols-[minmax(0,1fr)_minmax(60px,1fr)_28px] items-center gap-2 text-[11px]"
          >
            <span className="truncate text-muted">{area}</span>
            <span
              className="h-1.5 overflow-hidden rounded-full bg-sunken"
              role="img"
              aria-label={t('report.preLike.area', { department: name, area, value: dimension.index0to100 })}
            >
              <span
                className="block h-full rounded-full bg-brand-400"
                style={{ width: `${Math.max(dimension.index0to100, 2)}%` }}
              />
            </span>
            <span className="text-right font-mono text-body">{dimension.index0to100}</span>
          </li>
        );
      })}
    </ul>
  );
}
