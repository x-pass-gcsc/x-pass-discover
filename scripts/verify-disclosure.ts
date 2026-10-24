/**
 * Verifies the deterministic hidden-fact disclosure matcher.
 *
 *   npm run verify:disclosure
 *
 * The discovery mechanic is the product: a student who asks a good question
 * should earn the specific number, and a student who asks nothing in particular
 * should earn nothing. In mock mode this matcher IS the mechanism, so it is
 * checked against ordinary phrasings rather than the exact trigger strings, and
 * against questions that must NOT disclose anything.
 */
import { matchFacts, selectDisclosures } from '@/services/ai/fact-matcher';
import { getPersona } from '@/content/personas.server';

let failures = 0;
const check = (label: string, cond: unknown, detail = '') => {
  if (!cond) failures++;
  console.log(`${cond ? '✓' : '✗ FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);
};

const buyer = getPersona('sales-quickmart', 'quickmart-buyer');
if (!buyer) throw new Error('quickmart-buyer persona is not registered');

const reveal = (message: string, already: string[] = []) =>
  selectDisclosures(matchFacts(message, buyer.facts, already)).map((f) => f.id);

/** Natural phrasings a student might actually type. */
const SHOULD_REVEAL: Array<[string, string]> = [
  ['morning_velocity', 'How do comparable protein drinks sell in the morning, and how does that differ in office-area stores?'],
  ['morning_velocity', 'What is the current sales velocity for this category?'],
  ['morning_velocity', 'How many units per store per day do the existing protein drinks do?'],
  ['morning_velocity', 'Do office locations perform differently?'],
  ['price_conversion', 'What price point converts best for your shoppers?'],
  ['price_conversion', 'Is there a price ceiling where customers stop buying?'],
  ['price_conversion', 'How much can customers pay for a drink like this?'],
  ['shelf_space', 'How many facings would a new protein drink get?'],
  ['shelf_space', 'What does the shelf space situation look like in the chiller?'],
  ['new_product_waste', 'What waste levels do you see on new products?'],
  ['new_product_waste', 'How do you think about inventory risk here?'],
  ['pilot_preference', 'Would you prefer to start small with a pilot?'],
  ['pilot_preference', 'What test region would you be comfortable with?'],
  ['pilot_preference', 'How many stores would you want in a trial?'],
  ['expansion_threshold', 'What does success look like for you after four weeks?'],
  ['expansion_threshold', 'What would it take to expand this nationwide?'],
  ['expansion_threshold', 'What are the criteria for expansion?'],
  ['morning_velocity', '朝の売上はどれくらいですか？'],
  ['shelf_space', '棚のスペースはどれくらい確保できますか？'],
];

console.log('=== good questions earn the specific fact ===');
for (const [expected, message] of SHOULD_REVEAL) {
  const ids = reveal(message);
  check(`"${message.slice(0, 62)}${message.length > 62 ? '…' : ''}" → ${expected}`, ids.includes(expected), ids.join(', ') || 'nothing');
}

/** Vague or off-topic messages must not leak anything. */
const SHOULD_REVEAL_NOTHING = [
  'Can you tell me more about QuickMart?',
  'Thank you for making time today.',
  'BITE Protein Drink has 20 g of protein and tastes great.',
  'We are excited about this partnership.',
  'Hello, I am the sales representative from BITE.',
  'I think our product would be a great fit for your customers.',
];

console.log('\n=== vague questions earn nothing ===');
for (const message of SHOULD_REVEAL_NOTHING) {
  const ids = reveal(message);
  check(`"${message}" reveals nothing`, ids.length === 0, ids.join(', '));
}

console.log('\n=== disclosure discipline ===');
const greedy = 'Tell me about morning sales velocity, price points, shelf facings, waste, the pilot region and expansion criteria.';
check('at most 2 facts disclosed per turn', reveal(greedy).length <= 2, `${reveal(greedy).length}`);

const already = ['morning_velocity'];
check(
  'an already-revealed fact is never re-disclosed',
  !reveal('What is the morning sales velocity?', already).includes('morning_velocity'),
);

check(
  'specificity wins: a precise question outranks a brushing one',
  reveal('How many facings would a new protein drink get on the shelf?')[0] === 'shelf_space',
  reveal('How many facings would a new protein drink get on the shelf?').join(', '),
);

const allHidden = buyer.facts.filter((f) => f.visibility === 'hidden').map((f) => f.id);
const coverage = new Set(SHOULD_REVEAL.map(([id]) => id));
check('every hidden fact is covered by this test', allHidden.every((id) => coverage.has(id)),
  allHidden.filter((id) => !coverage.has(id)).join(', '));

// ------------------------------------------------------------------ HR
//
// Six personas instead of one. The candidates are the hard case: a résumé
// claim ("managed distributor relationships") is only turned into evidence by
// asking what the candidate personally did, so that is what earns the fact.

const HR_SHOULD_REVEAL: Record<string, Array<[string, string]>> = {
  'hiring-manager': [
    ['hm_year_one_goal', 'What does success look like for this person after the first year?'],
    ['hm_year_one_goal', 'What should they achieve in their first 12 months?'],
    ['hm_team_of_one', 'Who will they work with in China — is there a local team?'],
    ['hm_team_of_one', 'Will they manage people, or be on their own?'],
    ['hm_previous_attempt', 'What went wrong with the 2024 attempt?'],
    ['hm_previous_attempt', 'Has BITE tried this before? What did you learn?'],
    ['hm_language', 'Does the person really need native-level Japanese?'],
    ['hm_language', 'Which languages will they actually use day to day?'],
    ['hm_channel_priority', 'If you had to choose, is the distributor or e-commerce the priority?'],
    ['hm_channel_priority', 'What is a must-have and what is a nice-to-have?'],
    ['hm_year_one_goal', '1年目の目標は何ですか？'],
  ],
  'candidate-lin': [
    ['lin_distributor_record', 'What did you personally do to build that distributor network?'],
    ['lin_distributor_record', 'How many distributors have you signed yourself?'],
    ['lin_lost_distributor', 'Tell me about a time something went wrong. What did you learn?'],
    ['lin_job_changes', 'Why have you changed jobs four times?'],
    ['lin_notice_period', 'When could you start, and what is your notice period?'],
    ['lin_hq_reporting', 'Have you ever reported to a headquarters outside China?'],
    ['lin_salary_expectation', 'What are your salary expectations?'],
  ],
  'candidate-sato': [
    ['sato_role_scope', 'What did you personally do in those distributor deals — who signed them?'],
    ['sato_role_scope', 'Give me a specific example of a deal you closed.'],
    ['sato_hq_bridge', 'How have you worked with your Tokyo head office?'],
    ['sato_mandarin_depth', 'Do you negotiate contracts in Mandarin yourself, or with an interpreter?'],
    ['sato_availability', 'When could you start?'],
    ['sato_salary_expectation', 'What salary are you looking for?'],
  ],
  'candidate-zhang': [
    ['zhang_crossborder_record', 'What were the results of the e-commerce launch you led?'],
    ['zhang_offline_gap', 'Have you managed an offline distributor?'],
    ['zhang_career_break', 'What did you do during your career break?'],
    ['zhang_hq_reporting', 'How did you report to the Japanese head office?'],
    ['zhang_availability', 'What is your notice period?'],
    ['zhang_salary_expectation', 'What are your compensation expectations?'],
  ],
  'bite-coo': [
    ['coo_board_pressure', 'Why is the timing so important — what is the board expecting?'],
    ['coo_referral_context', 'How well do you know Sato? Have you seen his work?'],
    ['coo_what_convinces', 'What would convince you to sign off on a different candidate?'],
    ['coo_notice_buyout', 'Could we buy out a notice period to make the start date?'],
  ],
};

const HR_SHOULD_REVEAL_NOTHING: Record<string, string[]> = {
  'hiring-manager': ['Thanks for making time today.', 'What are you looking for?'],
  'candidate-lin': ['Tell me about yourself.', 'Thank you for coming in.'],
  'candidate-sato': ['Tell me about yourself.', 'Why do you want to join BITE?'],
  'candidate-zhang': ['Tell me about yourself.', 'Thank you for coming in.'],
  'bite-coo': ['Thank you for your time.', 'I have prepared my recommendation.'],
};

console.log('\n=== HR: good questions earn the specific fact ===');
for (const [personaKey, cases] of Object.entries(HR_SHOULD_REVEAL)) {
  const persona = getPersona('hr-cn-expansion', personaKey);
  if (!persona) {
    check(`${personaKey} is registered`, false);
    continue;
  }
  const revealFor = (message: string) =>
    selectDisclosures(matchFacts(message, persona.facts, [])).map((f) => f.id);

  for (const [expected, message] of cases) {
    const ids = revealFor(message);
    check(`${personaKey}: "${message.slice(0, 56)}${message.length > 56 ? '…' : ''}" → ${expected}`, ids.includes(expected), ids.join(', ') || 'nothing');
  }
  for (const message of HR_SHOULD_REVEAL_NOTHING[personaKey] ?? []) {
    const ids = revealFor(message);
    check(`${personaKey}: "${message}" reveals nothing`, ids.length === 0, ids.join(', '));
  }

  const hidden = persona.facts.filter((f) => f.visibility === 'hidden').map((f) => f.id);
  const covered = new Set(cases.map(([id]) => id));
  check(`${personaKey}: every hidden fact is covered by this test`, hidden.every((id) => covered.has(id)),
    hidden.filter((id) => !covered.has(id)).join(', '));
}

console.log(`\n${failures === 0 ? '✅ DISCLOSURE MATCHER VERIFIED' : `❌ ${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
