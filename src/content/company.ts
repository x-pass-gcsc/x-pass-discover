/** BITE — the single fictional company all five departments work inside. */

export const BITE_COMPANY = {
  slug: 'bite',
  name: 'BITE',
  industry: 'Food & Beverage',
  profile:
    'BITE is a casual F&B brand operating stores, takeout, delivery and digital channels. Every X-PASS department works inside BITE — same company, different work.',
} as const;

/** Reference data: BITE Protein Drink product sheet. */
export const BITE_PROTEIN_DRINK = {
  slug: 'bite-protein-drink',
  name: 'BITE Protein Drink',
  summary:
    'A 330 ml refrigerated protein drink with 20 g of protein, positioned as a convenient breakfast / meal replacement for busy consumers in their 20s–30s.',
  attributes: {
    size: '330 ml',
    protein: '20 g',
    calories: '160 kcal',
    storage: 'Refrigerated',
    shelfLifeDays: 30,
    flavors: ['Milk Coffee', 'Cocoa'],
    recommendedRetailPriceYen: 298,
    standardWholesalePriceYen: 178,
    packSize: 12,
    coreTarget:
      'Busy consumers in their 20s–30s who may skip breakfast',
    strengths: [
      '20 g protein',
      'Can work as a convenient meal / breakfast replacement',
      'Smooth, easy-to-drink taste',
    ],
    limitations: [
      'Requires refrigerated shelf space',
      'Shorter shelf life than shelf-stable alternatives',
      'Retail price is close to ¥300',
      'Low brand awareness in Japan',
      'Limited initial production capacity',
    ],
  },
} as const;

/**
 * Marketing's product.
 *
 * TODO: the implementation pack names this product but supplies no spec sheet,
 * pricing or unit economics for it. Those stay empty rather than invented —
 * fill them in when the Marketing scenario is authored. What matters now is
 * that Marketing genuinely HAS a product, so `projects.product_id` being NULL
 * continues to mean only one thing: Product Management and Strategy do not
 * start from a product.
 */
export const SPICY_CRISPY_CHICKEN_BITES = {
  slug: 'spicy-crispy-chicken-bites',
  name: 'Spicy Crispy Chicken Bites',
  summary:
    'A spicy fried chicken snack item. Product details are not specified in the current implementation pack.',
  attributes: {},
} as const;

/** Every BITE product the seed should create. */
export const BITE_PRODUCTS = [
  BITE_PROTEIN_DRINK,
  SPICY_CRISPY_CHICKEN_BITES,
] as const;

/**
 * BITE unit economics. These constants are the single source for every
 * calculation in the Sales scenario — never re-type the numbers inline.
 */
export const BITE_UNIT_ECONOMICS = {
  recommendedRetailPriceYen: 298,
  standardWholesalePriceYen: 178,
  manufacturingCostYen: 92,
  coldLogisticsYen: 14,
  basePromotionYen: 12,
  /** 178 - 92 - 14 - 12 = 60 */
  baseContributionYen: 60,
} as const;

/** BITE internal sales guardrails. Known to the student, not to the buyer. */
export const BITE_SALES_GUARDRAILS = {
  minWholesalePriceYen: 165,
  /** Minimum unit contribution from price structure, before extra promotion. */
  minUnitContributionYen: 47,
  maxExtraPromotionYen: 10,
  fullReturnGuaranteeAllowed: false,
  maxPaymentTermDays: 45,
  minProductionRunUnits: 2400,
} as const;

/**
 * BITE offer policy for the HR scenario's role. Known to the student (it is in
 * the Data Room), not to the candidates.
 *
 * TODO: the implementation pack does not specify an HR scenario, so these
 * figures were authored for it. They are internally consistent with the
 * candidates in `content/hr`, and the single place to change them once real
 * numbers exist.
 */
export const BITE_HR_OFFER_POLICY = {
  roleTitle: 'Manager, China Business Development',
  bandMinYen: 8_500_000,
  /** Offers above this go to the HR director with a written justification. */
  bandMidYen: 9_500_000,
  bandMaxYen: 10_500_000,
  signOnCapYen: 1_000_000,
} as const;
