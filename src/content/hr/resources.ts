import type { ResourceDefinition } from '@/types/resource';
import { BITE_HR_OFFER_POLICY } from '@/content/company';
import { SALES_RESOURCES } from '@/content/sales/resources';

const o = BITE_HR_OFFER_POLICY;
const yen = (n: number) => `¥${n.toLocaleString()}`;

/**
 * Data Room contents for the HR scenario.
 *
 * These are PUBLIC: anything here is readable by the student at any time. What
 * the candidates actually did — as opposed to what their résumés claim — and
 * what the hiring manager actually needs are hidden persona facts that have to
 * be earned by asking. See `personas.server.ts`.
 *
 * TODO: the implementation pack does not specify the HR scenario. Everything
 * below was authored from the department brief ("diagnose capability gaps for
 * the BITE Protein Drink CN expansion, define job-related criteria, interview
 * candidates, and recommend who to hire") and should be reviewed by whoever
 * owns the HR content.
 */

/**
 * The product is the same one Sales is listing, so the sheet's content is
 * reused rather than retyped. It still needs its own key: resource keys are
 * unique across every scenario in the database, and sharing one would move
 * the Sales row into this scenario on the next seed.
 */
const productSheet = SALES_RESOURCES.find((r) => r.key === 'bite-protein-drink-sheet');
if (!productSheet) throw new Error('bite-protein-drink-sheet is missing from the Sales Data Room');

export const HR_RESOURCES: ResourceDefinition[] = [
  {
    key: 'hr-training-1pager',
    fileMeta: { format: 'WEB', detail: 'Guide · 5 min read' },
    title: 'HR Starter: how recruiters think',
    description:
      'Role mindset, key concepts and frameworks. Read this before the scenario begins.',
    resourceType: 'training',
    visibility: 'scenario',
    sortOrder: 0,
    body: {
      kind: 'markdown',
      markdown: `## Role mindset

> **Hiring is not choosing the most impressive person. It is predicting who will do this specific job well — and being able to show the evidence.**

Before asking:

> Who do we like?

Ask:

> **What will this person actually have to do in their first year?**

## Key concepts

| Concept | Meaning |
|---|---|
| Capability Gap | What the business needs to be able to do that nobody in the company can do today |
| Job-related Criterion | A selection criterion you can trace back to the work itself |
| Must-have / Nice-to-have | Whether a candidate without it can still succeed in the role |
| Structured Interview | The same core questions, asked of every candidate, rated on the same scale |
| Behavioural Question | "Tell me about a time you…" — asks for what someone did, not what they would do |
| Probe | The follow-up that turns a claim into evidence: "What did *you* do, specifically?" |
| Scorecard | Criterion × candidate × rating × evidence |
| NE — Not Enough Evidence | An honest rating when the interview did not test something. It is not a low score |
| Bias | A shortcut that feels like judgement — similarity, halo, first impression, confirmation |
| Offer Band | The salary range BITE has approved for the role |

## Important ways of thinking

1. **Define the job before you meet the people.**
2. **Every criterion must trace back to the work.** Age, school and "fits in with us" do not.
3. **Same questions, same scale, for every candidate.**
4. **A résumé line is a claim, not evidence.** Ask what they personally did.
5. **"Not enough evidence" is an honest answer.** Guessing a number is not.
6. **Liking someone is not evidence.** Notice when you do, and ask why.
7. **Pressure tells you about the organisation, not about the candidate.**

## Frameworks

**Selection**

\`\`\`
Job → Criteria → Questions → Evidence → Rating → Decision
\`\`\`

**Probing a claim (STAR)**

\`\`\`
Situation → Task → Action (what did YOU do?) → Result → What you learned
\`\`\`

## Core line

> **Ask "what did you personally do?"**

If a résumé says *managed distributor relationships*, find out whether the candidate negotiated and signed those distributors, or supported the person who did. Both are real work. They are not the same job.`,
    },
  },
  {
    key: 'bite-people-profile',
    fileMeta: { format: 'PDF', detail: 'PDF · 3 pages' },
    title: 'BITE company profile — People team',
    description: 'Who BITE is and how the People team works with the business.',
    resourceType: 'company_profile',
    visibility: 'scenario',
    sortOrder: 1,
    body: {
      kind: 'markdown',
      markdown: `**BITE** is a casual F&B brand operating stores, takeout, delivery and digital channels.

The **People team** partners with each business unit on hiring. A *hiring manager* owns the role and makes the final call; the *talent acquisition partner* — you — owns the process: defining what the job needs, running a fair and consistent selection, and bringing a recommendation the business can defend.

### What the People team is measured on

- Hires who are still performing a year later, not roles filled quickly
- A selection process every candidate would recognise as fair
- Decisions that rest on job-related evidence, written down
- Offers inside BITE's approved bands`,
    },
  },
  { ...productSheet, key: 'hr-product-sheet', sortOrder: 2 },
  {
    key: 'cn-expansion-brief',
    fileMeta: { format: 'DOC', detail: 'Memo · 2 pages' },
    title: 'China expansion brief — BITE Protein Drink',
    description: 'Why BITE is going to East China, and what the new role owns.',
    resourceType: 'memo',
    visibility: 'scenario',
    sortOrder: 3,
    body: {
      kind: 'markdown',
      markdown: `**From:** International Business, Tokyo
**Status:** Approved for exploration

### Why China

BITE's board has approved exploring a launch of BITE Protein Drink in **East China, starting from Shanghai**. Ready-to-drink protein is a growing category there, and BITE wants to learn whether its product travels before committing more capital.

### Routes to market under consideration

1. **A regional chilled-beverage distributor** in East China, supplying convenience and grocery retail.
2. **A cross-border e-commerce storefront**, selling direct to consumers.

Neither route is in place today.

### What has been tried

A 2024 attempt to export through a Japanese trading partner did not progress beyond initial shipments.

### The role

| Item | Detail |
|---|---|
| Title | ${o.roleTitle} |
| Location | Shanghai |
| Reports to | Takuya Mori, Head of International Business (Tokyo) |
| Owns | Getting BITE Protein Drink to Chinese consumers through one or both routes above |

The hiring manager will brief you on the year-one goals in the intake meeting.`,
    },
  },
  {
    key: 'capability-inventory',
    fileMeta: { format: 'XLSX', detail: 'Excel · 1 sheet' },
    title: 'International capability inventory',
    description: 'What a China launch needs, and what BITE can already do.',
    resourceType: 'data_table',
    visibility: 'scenario',
    sortOrder: 4,
    body: {
      kind: 'table',
      columns: ['Capability', 'Needed for a China launch', 'At BITE today'],
      rows: [
        ['Sourcing and managing a chilled distributor in China', 'Yes', 'None — nobody has done it'],
        ['Commercial negotiation in Mandarin', 'Yes', 'None — one Tokyo staff member speaks conversational Mandarin'],
        ['Cross-border e-commerce operations', 'Likely', 'None in-house; agencies are available on contract'],
        ['Export documentation and logistics from Japan', 'Yes', 'Yes — Tokyo export coordinator'],
        ['Product and brand knowledge', 'Yes', 'Yes — Tokyo marketing and product teams'],
        ['Reporting and alignment with Tokyo', 'Yes', 'Yes — Head of International Business'],
        ['East China consumer and market data', 'Yes', 'Partial — one purchased market report'],
      ],
      note: '"Needed" reflects the expansion brief as written. The hiring manager may weight these differently — that is what the intake meeting is for.',
    },
  },
  {
    key: 'jd-draft',
    fileMeta: { format: 'DOC', detail: 'Draft · 1 page' },
    title: 'Job description — draft',
    description:
      'Written by the International Business team last month. The People team has not reviewed it yet.',
    resourceType: 'file',
    visibility: 'scenario',
    sortOrder: 5,
    body: {
      kind: 'markdown',
      markdown: `## ${o.roleTitle} (Shanghai)

> DRAFT — not yet reviewed by the People team.

### About the role

Lead BITE's first move into the Chinese market with BITE Protein Drink.

### Requirements

- 5+ years of B2B sales in food and beverage in China
- Experience setting up or managing distributors
- Business-level Mandarin
- Native-level Japanese
- Age 28–35
- Graduate of a top-tier university
- Experience in cross-border e-commerce
- Fits in with our Tokyo team culture
- Willing to be based in Shanghai`,
    },
  },
  {
    key: 'candidate-lin-hao',
    fileMeta: { format: 'PDF', detail: 'Résumé · 2 pages' },
    title: 'Candidate file — Lin Hao',
    description: 'Résumé summary as submitted.',
    resourceType: 'file',
    visibility: 'scenario',
    sortOrder: 6,
    body: {
      kind: 'markdown',
      markdown: `**Lin Hao** · Shanghai · applied via job board

### Summary

Distributor-channel sales leader in East China food and beverage. Built and managed distributor networks across Jiangsu and Zhejiang.

### Experience

| Years | Company | Role |
|---|---|---|
| 2023 – now | Sunrise Nutrition | Head of Distributor Sales, East China |
| 2021 – 2023 | Coastal Beverage Group | Regional Channel Manager, East China |
| 2018 – 2021 | Huadong Foods | Key Account Manager, chilled beverages |
| 2016 – 2018 | Jiangnan Dairy | Sales Representative |

### Languages

Mandarin (native) · English (business) · Japanese (basic, JLPT N3)

### Education

BA Marketing, a university in Nanjing`,
    },
  },
  {
    key: 'candidate-daiki-sato',
    fileMeta: { format: 'PDF', detail: 'Résumé · 2 pages' },
    title: 'Candidate file — Daiki Sato',
    description: 'Résumé summary as submitted.',
    resourceType: 'file',
    visibility: 'scenario',
    sortOrder: 7,
    body: {
      kind: 'markdown',
      markdown: `**Daiki Sato** · Shanghai · **referral** — introduced by a former colleague of BITE's COO

### Summary

Seven years in the Shanghai office of a Japanese trading company's food import division. Managed relationships with Chinese distributors for Japanese food brands.

### Experience

| Years | Company | Role |
|---|---|---|
| 2017 – now | Kaiyo Trading, Shanghai office | Food Import Division — Assistant Manager (from 2021) |

### Languages

Japanese (native) · Mandarin (business, HSK 6) · English (business)

### Education

BA Economics, Meiwa University — the same university as BITE's COO`,
    },
  },
  {
    key: 'candidate-zhang-wei',
    fileMeta: { format: 'PDF', detail: 'Résumé · 2 pages' },
    title: 'Candidate file — Zhang Wei',
    description: 'Résumé summary as submitted.',
    resourceType: 'file',
    visibility: 'scenario',
    sortOrder: 8,
    body: {
      kind: 'markdown',
      markdown: `**Zhang Wei** · Hangzhou · applied via job board

### Summary

Cross-border e-commerce lead for Japanese health brands entering China.

### Experience

| Years | Company | Role |
|---|---|---|
| 2023 – now | Independent | E-commerce consultant |
| 2022 – 2023 | — | Career break |
| 2019 – 2022 | Hoshino Health (Japanese supplement brand), China | Cross-border E-commerce Lead |
| 2015 – 2019 | A cross-border e-commerce platform | Category Specialist, imported health foods |

### Languages

Mandarin (native) · English (business) · Japanese (conversational)

### Education

BA International Trade, a university in Hangzhou`,
    },
  },
  {
    key: 'bite-offer-policy',
    fileMeta: { format: 'PDF', detail: 'Policy · 1 page' },
    title: 'BITE offer policy — this role',
    description: 'Salary band, sign-on limit and the approval rules.',
    resourceType: 'policy',
    visibility: 'scenario',
    sortOrder: 9,
    body: {
      kind: 'markdown',
      markdown: `| Item | Limit |
|---|---|
| Role | ${o.roleTitle} |
| Annual base salary band | ${yen(o.bandMinYen)} – ${yen(o.bandMaxYen)} (JPY equivalent) |
| Band midpoint | ${yen(o.bandMidYen)} |
| Sign-on bonus | Up to ${yen(o.signOnCapYen)}, one-off |

### Approval rules

- An offer **above the midpoint** goes to the HR director with a written, **job-related** justification.
- Every interviewed candidate has a completed scorecard before an offer is recommended.
- Offers are made on job-related grounds. **Referral source, personal acquaintance, age and school are not selection criteria.**

These are BITE's own limits. Candidates do not know them, and must not be told the band.`,
    },
  },
];
