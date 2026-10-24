import { BITE_HR_OFFER_POLICY, BITE_SALES_GUARDRAILS } from '@/content/company';
import type { AnswerValue } from '@/types/runtime';
import { computeDealEconomics } from './calculators';

/**
 * Guardrail evaluation.
 *
 * Guardrails WARN. They never silently correct an answer and never block a
 * save. `severity: 'violation'` means the answer breaks a BITE internal limit;
 * `severity: 'advisory'` means it is likely to fail somewhere else — on the
 * customer's side, or at an approval step. `category` names which.
 */

export type GuardrailSeverity = 'violation' | 'advisory';

export type GuardrailWarning = {
  key: string;
  severity: GuardrailSeverity;
  title: string;
  message: string;
  fieldKeys: string[];
  /** The badge the student sees, e.g. "QuickMart criteria". */
  category?: string;
};

type GuardrailCheck = (value: AnswerValue) => GuardrailWarning | null;

const g = BITE_SALES_GUARDRAILS;
const offer = BITE_HR_OFFER_POLICY;

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

const yen = (n: number) => `¥${Math.round(n).toLocaleString()}`;

const CHECKS: Record<string, GuardrailCheck> = {
  'wholesale-floor': (value) => {
    const wholesale = num(value.wholesale_price_yen);
    if (wholesale === null || wholesale >= g.minWholesalePriceYen) return null;
    return {
      key: 'wholesale-floor',
      severity: 'violation',
      title: 'Below BITE’s minimum wholesale price',
      message: `This condition is outside BITE’s current guardrail. The minimum wholesale price is ${yen(
        g.minWholesalePriceYen,
      )}; you have proposed ${yen(wholesale)}.`,
      fieldKeys: ['wholesale_price_yen'],
    };
  },

  'contribution-floor': (value) => {
    const { biteUnitContributionBeforeExtraYen } = computeDealEconomics({
      wholesalePriceYen: num(value.wholesale_price_yen),
    });
    if (
      biteUnitContributionBeforeExtraYen === null ||
      biteUnitContributionBeforeExtraYen >= g.minUnitContributionYen
    ) {
      return null;
    }
    return {
      key: 'contribution-floor',
      severity: 'violation',
      title: 'Unit contribution below the guardrail',
      message: `At this wholesale price BITE’s contribution before extra promotion is ${yen(
        biteUnitContributionBeforeExtraYen,
      )}, under the ${yen(g.minUnitContributionYen)} floor.`,
      fieldKeys: ['wholesale_price_yen'],
    };
  },

  'extra-promotion-cap': (value) => {
    const extra = num(value.extra_promotion_yen);
    if (extra === null || extra <= g.maxExtraPromotionYen) return null;
    return {
      key: 'extra-promotion-cap',
      severity: 'violation',
      title: 'Extra promotion exceeds the cap',
      message: `BITE can support at most ${yen(
        g.maxExtraPromotionYen,
      )}/unit of extra promotion. You have proposed ${yen(extra)}/unit.`,
      fieldKeys: ['extra_promotion_yen'],
    };
  },

  'min-production-run': (value) => {
    const quantity = num(value.initial_quantity);
    if (quantity === null || quantity >= g.minProductionRunUnits) return null;
    return {
      key: 'min-production-run',
      severity: 'violation',
      title: 'Below the minimum production run',
      message: `BITE’s minimum production run is ${g.minProductionRunUnits.toLocaleString()} units. You have proposed ${quantity.toLocaleString()}.`,
      fieldKeys: ['initial_quantity'],
    };
  },

  'payment-terms': (value) => {
    const days = num(value.payment_terms_days);
    if (days === null || days <= g.maxPaymentTermDays) return null;
    return {
      key: 'payment-terms',
      severity: 'violation',
      title: 'Payment terms exceed BITE’s limit',
      message: `BITE can accept up to ${g.maxPaymentTermDays} days. You have agreed ${days} days.`,
      fieldKeys: ['payment_terms_days'],
    };
  },

  // --- advisory: QuickMart-side criteria, not BITE guardrails --------------

  'retail-margin-advisory': (value) => {
    const { retailMarginRate } = computeDealEconomics({
      wholesalePriceYen: num(value.wholesale_price_yen),
      retailPriceYen: num(value.retail_price_yen),
    });
    if (retailMarginRate === null || retailMarginRate >= 0.35) return null;
    return {
      key: 'retail-margin-advisory',
      severity: 'advisory',
      category: 'QuickMart criteria',
      title: 'Retail margin is below QuickMart’s stated target',
      message: `QuickMart targets a retail margin of 35% or more. This structure gives them ${(
        retailMarginRate * 100
      ).toFixed(1)}%.`,
      fieldKeys: ['wholesale_price_yen', 'retail_price_yen'],
    };
  },

  'retail-price-advisory': (value) => {
    const retail = num(value.retail_price_yen);
    if (retail === null || retail <= 300) return null;
    return {
      key: 'retail-price-advisory',
      severity: 'advisory',
      category: 'QuickMart criteria',
      title: 'Retail price is above QuickMart’s stated ceiling',
      message: `QuickMart’s stated target is a retail price of ¥300 or lower. You have proposed ${yen(
        retail,
      )}.`,
      fieldKeys: ['retail_price_yen'],
    };
  },

  // --- HR: BITE offer policy ------------------------------------------------

  'offer-band-ceiling': (value) => {
    const base = num(value.proposed_base_salary_yen);
    if (base === null || base <= offer.bandMaxYen) return null;
    return {
      key: 'offer-band-ceiling',
      severity: 'violation',
      category: 'Outside BITE offer policy',
      title: 'Base salary is above the band',
      message: `This condition is outside BITE’s current offer policy. The band for this role tops out at ${yen(
        offer.bandMaxYen,
      )}; you have proposed ${yen(base)}.`,
      fieldKeys: ['proposed_base_salary_yen'],
    };
  },

  'offer-band-floor': (value) => {
    const base = num(value.proposed_base_salary_yen);
    if (base === null || base >= offer.bandMinYen) return null;
    return {
      key: 'offer-band-floor',
      severity: 'violation',
      category: 'Outside BITE offer policy',
      title: 'Base salary is below the band',
      message: `This condition is outside BITE’s current offer policy. The band for this role starts at ${yen(
        offer.bandMinYen,
      )}; you have proposed ${yen(base)}.`,
      fieldKeys: ['proposed_base_salary_yen'],
    };
  },

  'sign-on-cap': (value) => {
    const bonus = num(value.sign_on_bonus_yen);
    if (bonus === null || bonus <= offer.signOnCapYen) return null;
    return {
      key: 'sign-on-cap',
      severity: 'violation',
      category: 'Outside BITE offer policy',
      title: 'Sign-on bonus exceeds the cap',
      message: `BITE can offer a sign-on bonus of at most ${yen(
        offer.signOnCapYen,
      )}. You have proposed ${yen(bonus)}.`,
      fieldKeys: ['sign_on_bonus_yen'],
    };
  },

  'above-midpoint-justification': (value) => {
    const base = num(value.proposed_base_salary_yen);
    const justification =
      typeof value.offer_justification === 'string' ? value.offer_justification.trim() : '';
    if (base === null || base <= offer.bandMidYen || justification.length > 0) return null;
    return {
      key: 'above-midpoint-justification',
      severity: 'advisory',
      category: 'Needs approval',
      title: 'Above the midpoint without a justification',
      message: `Offers above the ${yen(
        offer.bandMidYen,
      )} midpoint go to the HR director with a written, job-related justification. You have not written one yet.`,
      fieldKeys: ['proposed_base_salary_yen', 'offer_justification'],
    };
  },
};

export function evaluateGuardrails(
  guardrailKeys: string[] | undefined,
  value: AnswerValue,
): GuardrailWarning[] {
  if (!guardrailKeys?.length) return [];
  return guardrailKeys
    .map((key) => CHECKS[key]?.(value) ?? null)
    .filter((w): w is GuardrailWarning => w !== null);
}

export function hasViolations(warnings: GuardrailWarning[]): boolean {
  return warnings.some((w) => w.severity === 'violation');
}
