import type { Locale } from '@/i18n/config';

/**
 * The pre-survey, one question per screen.
 *
 * This is the only place questions live: add, remove or reorder entries here
 * and the survey screen, its progress counter and the saved answers follow.
 * Each answer is stored under its `key`, so keys must be unique and should
 * not change once students have answered them.
 *
 * Every piece of text is written once per language. English is required; a
 * language left out falls back to English.
 *
 * The question set is the X-PASS pre-survey (X-PASS_Pre-survey_50.csv): ten
 * 1–5 statements for each of the five departments, one per competency of that
 * job. `measures` records which department and competency a statement belongs
 * to, so a rubric can be attached later without changing the questions or the
 * stored answers.
 */
export type Localized = { en: string } & Partial<Record<Exclude<Locale, 'en'>, string>>;

export const localize = (text: Localized, locale: Locale): string => text[locale] ?? text.en;

/** What a scale question measures: one competency of one department's job. */
export type Measures = {
  /** Department slug, as in `departments.ts`. */
  department: string;
  competency: string;
  /** The job description the competency was taken from, where there is one. */
  source?: string;
};

export type PreSurveyQuestion =
  | {
      key: string;
      kind: 'scale';
      prompt: Localized;
      /** Words under the two ends of the 1–5 scale; the defaults are "Not at all" / "Very much". */
      low?: Localized;
      high?: Localized;
      measures?: Measures;
    }
  | {
      key: string;
      kind: 'text';
      prompt: Localized;
      placeholder?: Localized;
      /** Optional text questions can be left blank. */
      optional?: boolean;
    };

/**
 * Keys of the 75-statement competency inventory this set replaced
 * (`MKT_01`…`PM_15`), by department. Their answers stay in saved surveys and
 * are never read as answers to the current statements, whose keys differ; they
 * only keep LIKE for a student who answered that version and not this one.
 */
const RETIRED_KEY_PREFIXES: Record<string, string> = {
  marketing: 'MKT_',
  strategy: 'STR_',
  sales: 'SAL_',
  'human-resources': 'HR_',
  'product-management': 'PM_',
};

const meanAsLike = (scores: number[]) =>
  Math.round((scores.reduce((sum, value) => sum + value, 0) / scores.length / 5) * 100);

/**
 * LIKE for one department, 0–100, from a student's saved answers.
 *
 * Until the rubric arrives this is the plain mean of the department's answered
 * statements, on the same 1–5 → 20–100 scale as before. Answers to an earlier
 * version of the survey (the competency inventory, or before it a single
 * `interest_<slug>` rating) are read only when the student answered nothing
 * for the department in this one. Null when there is nothing to read.
 */
export function likeForDepartment(
  answers: Record<string, unknown> | undefined,
  department: string,
): number | null {
  if (!answers) return null;
  const scores = PRE_SURVEY_QUESTIONS.filter(
    (question) => question.kind === 'scale' && question.measures?.department === department,
  )
    .map((question) => answers[question.key])
    .filter((value): value is number => typeof value === 'number');
  if (scores.length > 0) return meanAsLike(scores);

  const prefix = RETIRED_KEY_PREFIXES[department];
  const retired = prefix
    ? Object.entries(answers)
        .filter(([key]) => new RegExp(`^${prefix}\\d{2}$`).test(key))
        .map(([, value]) => value)
        .filter((value): value is number => typeof value === 'number')
    : [];
  if (retired.length > 0) return meanAsLike(retired);

  const legacy = answers[`interest_${department}`];
  return typeof legacy === 'number' ? Math.round((legacy / 5) * 100) : null;
}

/**
 * Whether a saved survey was taken on an earlier version of the questions: it
 * answers none of the current ones. Such a student is told that a new
 * pre-survey is waiting.
 */
export function isFromEarlierSurvey(answers: Record<string, unknown>): boolean {
  return !PRE_SURVEY_QUESTIONS.some((question) => {
    const value = answers[question.key];
    return typeof value === 'number' || (typeof value === 'string' && value.trim().length > 0);
  });
}

// Imported from X-PASS_Pre-survey_50.csv (No., Department, Skill / Competency,
// English question): the key is `PS50_` + No., in CSV order. That CSV is
// English only; the Japanese and Korean text is the translation of the same
// English sentence in X_PASS_pre_survey_questions.csv (the earlier inventory).
export const PRE_SURVEY_QUESTIONS: PreSurveyQuestion[] = [
  {
    key: 'PS50_01',
    kind: 'scale',
    prompt: {
      en: 'I am curious about why different people are attracted to different things.',
      ja: '人によって惹かれるものが違うのはなぜか、気になる。',
      ko: '사람마다 서로 다른 것에 끌리는 이유가 궁금하다.',
    },
    measures: { department: 'marketing', competency: 'Customer understanding' },
  },
  {
    key: 'PS50_02',
    kind: 'scale',
    prompt: {
      en: 'I enjoy finding fresh ways to make an ordinary idea more interesting to others.',
      ja: '普通のアイデアを、ほかの人にもっと面白いと感じてもらえるように工夫するのが好きだ。',
      ko: '평범한 아이디어를 다른 사람들에게 더 흥미롭게 전달할 새로운 방법을 찾는 것을 좋아한다.',
    },
    measures: { department: 'marketing', competency: 'Creative thinking' },
  },
  {
    key: 'PS50_03',
    kind: 'scale',
    prompt: {
      en: 'When sharing something, I think about what would make it interesting to the people receiving it.',
      ja: '何かを伝えるとき、受け取る人が何に興味を持つかを考えるほうだ。',
      ko: '무언가를 전달할 때, 듣거나 보는 사람이 무엇에 흥미를 느낄지 생각하는 편이다.',
    },
    measures: { department: 'marketing', competency: 'Audience awareness' },
  },
  {
    key: 'PS50_04',
    kind: 'scale',
    prompt: {
      en: 'When something becomes popular, I find myself wondering what might have contributed to its popularity.',
      ja: '何かが人気になると、その人気につながった要因は何なのか気になる。',
      ko: '어떤 것이 인기를 얻으면, 무엇이 인기에 영향을 미쳤는지 궁금해진다.',
    },
    measures: { department: 'marketing', competency: 'Analytical thinking' },
  },
  {
    key: 'PS50_05',
    kind: 'scale',
    prompt: {
      en: 'I enjoy explaining the value of something in a way that helps others understand its appeal.',
      ja: '何かの価値や魅力が相手に伝わるように説明するのが好きだ。',
      ko: '어떤 것의 가치를 다른 사람들이 매력적으로 느낄 수 있도록 설명하는 것을 좋아한다.',
    },
    measures: { department: 'marketing', competency: 'Persuasive communication' },
  },
  {
    key: 'PS50_06',
    kind: 'scale',
    prompt: {
      en: 'I like finding interesting ways to present information rather than simply listing facts.',
      ja: '情報をただ並べるのではなく、興味を引く形で伝える方法を考えるのが好きだ。',
      ko: '정보를 단순히 나열하기보다 흥미롭게 전달하는 방법을 찾는 것을 좋아한다.',
    },
    measures: { department: 'marketing', competency: 'Storytelling and content creation' },
  },
  {
    key: 'PS50_07',
    kind: 'scale',
    prompt: {
      en: 'I find it interesting that the same message can create different impressions depending on how it is presented.',
      ja: '同じメッセージでも、伝え方によって異なる印象を与えることが興味深い。',
      ko: '같은 메시지도 전달 방식에 따라 서로 다른 인상을 줄 수 있다는 점이 흥미롭다.',
    },
    measures: { department: 'marketing', competency: 'Understanding perceptions' },
  },
  {
    key: 'PS50_08',
    kind: 'scale',
    prompt: {
      en: 'After trying something new, I often reflect on what worked well and what could be improved.',
      ja: '新しいことを試した後、何がうまくいき、何を改善できるか振り返ることが多い。',
      ko: '새로운 것을 시도한 후, 무엇이 잘되었고 무엇을 개선할 수 있을지 돌아보는 편이다.',
    },
    measures: { department: 'marketing', competency: 'Results evaluation' },
  },
  {
    key: 'PS50_09',
    kind: 'scale',
    prompt: {
      en: 'I enjoy trying different approaches to see which one works better.',
      ja: 'どの方法がより効果的かを確かめるために、さまざまなやり方を試すのが好きだ。',
      ko: '어떤 방법이 더 효과적인지 알아보기 위해 여러 가지 접근 방식을 시도하는 것을 좋아한다.',
    },
    measures: { department: 'marketing', competency: 'Experimentation' },
  },
  {
    key: 'PS50_10',
    kind: 'scale',
    prompt: {
      en: 'I enjoy exchanging ideas with others and building on their suggestions.',
      ja: 'ほかの人とアイデアを出し合い、その提案をさらに発展させるのが好きだ。',
      ko: '다른 사람들과 아이디어를 나누고, 그들의 제안을 발전시키는 것을 좋아한다.',
    },
    measures: { department: 'marketing', competency: 'Collaboration and brainstorming' },
  },
  {
    key: 'PS50_11',
    kind: 'scale',
    prompt: {
      en: 'When making a decision, I like to consider how it might affect other things in the future.',
      ja: '何かを決めるとき、その決定が将来ほかのことにどのような影響を与えるか考えるのが好きだ。',
      ko: '결정을 내릴 때, 그 결정이 미래의 다른 일들에 어떤 영향을 미칠지 생각하는 것을 좋아한다.',
    },
    measures: { department: 'strategy', competency: 'Strategic thinking' },
  },
  {
    key: 'PS50_12',
    kind: 'scale',
    prompt: {
      en: 'When a problem feels complicated, I try to break it down into smaller parts to understand it better.',
      ja: '問題が複雑に感じられるときは、理解しやすくするために小さな部分に分けて考えるほうだ。',
      ko: '문제가 복잡하게 느껴지면, 더 잘 이해하기 위해 작은 부분으로 나누어 생각하는 편이다.',
    },
    measures: { department: 'strategy', competency: 'Problem structuring' },
  },
  {
    key: 'PS50_13',
    kind: 'scale',
    prompt: {
      en: 'When I hear an explanation, I naturally wonder what evidence supports it.',
      ja: '何かの説明を聞くと、それを裏付ける根拠は何なのか自然と気になる。',
      ko: '어떤 설명을 들으면, 그것을 뒷받침하는 근거가 무엇인지 자연스럽게 궁금해진다.',
    },
    measures: { department: 'strategy', competency: 'Critical thinking' },
  },
  {
    key: 'PS50_14',
    kind: 'scale',
    prompt: {
      en: 'When the same problem occurs repeatedly, I try to identify what is causing it.',
      ja: '同じ問題が繰り返し起こるとき、その原因が何なのかを突き止めようとする。',
      ko: '같은 문제가 반복되면, 그 원인이 무엇인지 파악하려고 한다.',
    },
    measures: { department: 'strategy', competency: 'Root-cause analysis' },
  },
  {
    key: 'PS50_15',
    kind: 'scale',
    prompt: {
      en: 'When faced with several options, I like comparing their advantages and disadvantages before choosing one.',
      ja: 'いくつかの選択肢があるとき、一つを選ぶ前にそれぞれのメリットとデメリットを比較するのが好きだ。',
      ko: '여러 선택지가 있을 때, 하나를 선택하기 전에 각각의 장단점을 비교하는 것을 좋아한다.',
    },
    measures: { department: 'strategy', competency: 'Evaluating alternatives' },
  },
  {
    key: 'PS50_16',
    kind: 'scale',
    prompt: {
      en: 'I feel more confident in a decision when I can support it with facts rather than assumptions.',
      ja: '推測よりも事実を根拠に判断できるとき、より自信を持って決断できる。',
      ko: '추측보다는 사실을 근거로 뒷받침할 수 있을 때 결정을 내리는 데 더 자신감이 생긴다.',
    },
    measures: { department: 'strategy', competency: 'Evidence-based judgment' },
  },
  {
    key: 'PS50_17',
    kind: 'scale',
    prompt: {
      en: 'When one part of a system changes, I tend to consider how the other parts might be affected.',
      ja: '仕組みの一部が変わると、ほかの部分にどのような影響が及ぶかも考えるほうだ。',
      ko: '시스템의 한 부분이 바뀌면, 다른 부분들이 어떤 영향을 받을지도 생각하는 편이다.',
    },
    measures: { department: 'strategy', competency: 'Systems thinking' },
  },
  {
    key: 'PS50_18',
    kind: 'scale',
    prompt: {
      en: 'When time or resources are limited, I try to determine where they would be most useful.',
      ja: '時間や資源が限られているとき、どこに使うのが最も効果的かを考えるようにしている。',
      ko: '시간이나 자원이 제한되어 있을 때, 어디에 활용하는 것이 가장 효과적일지 판단하려고 한다.',
    },
    measures: { department: 'strategy', competency: 'Resource allocation' },
  },
  {
    key: 'PS50_19',
    kind: 'scale',
    prompt: {
      en: 'When several tasks compete for attention, I try to identify which ones are most important to the overall goal.',
      ja: '複数の作業に同時に取り組む必要があるとき、全体の目標にとって何が最も重要かを見極めようとする。',
      ko: '여러 업무에 동시에 주의를 기울여야 할 때, 전체 목표에 가장 중요한 일이 무엇인지 파악하려고 한다.',
    },
    measures: { department: 'strategy', competency: 'Prioritization and project coordination' },
  },
  {
    key: 'PS50_20',
    kind: 'scale',
    prompt: {
      en: 'Before committing to a plan, I sometimes consider what could go wrong and how I might respond.',
      ja: '計画を実行に移す前に、どのような問題が起こり得るか、どう対応できるかを考えることがある。',
      ko: '계획을 실행하기로 결정하기 전에, 무엇이 잘못될 수 있고 어떻게 대응할 수 있을지 생각할 때가 있다.',
    },
    measures: { department: 'strategy', competency: 'Scenario thinking and risk awareness' },
  },
  {
    key: 'PS50_21',
    kind: 'scale',
    prompt: {
      en: 'I enjoy explaining my point of view in a way that helps others see why it might be worth considering.',
      ja: '自分の意見を検討する価値があると相手に感じてもらえるように説明するのが好きだ。',
      ko: '다른 사람들이 내 의견을 고려해 볼 가치가 있다고 느끼도록 설명하는 것을 좋아한다.',
    },
    measures: { department: 'sales', competency: 'Persuasion and influence' },
  },
  {
    key: 'PS50_22',
    kind: 'scale',
    prompt: {
      en: 'I enjoy getting to know people and finding common ground with them.',
      ja: '人と知り合い、共通点を見つけるのが好きだ。',
      ko: '사람들과 친해지고 공통점을 찾는 것을 좋아한다.',
    },
    measures: { department: 'sales', competency: 'Relationship building' },
  },
  {
    key: 'PS50_23',
    kind: 'scale',
    prompt: {
      en: 'When someone explains what they want, I try to understand what matters most to them.',
      ja: '誰かが希望を説明するとき、その人にとって何が最も重要なのかを理解しようとする。',
      ko: '누군가 원하는 것을 설명할 때, 그 사람에게 무엇이 가장 중요한지 이해하려고 한다.',
    },
    measures: { department: 'sales', competency: 'Active listening' },
  },
  {
    key: 'PS50_24',
    kind: 'scale',
    prompt: {
      en: 'When someone describes a difficulty, I naturally think about what kind of help would be most useful to them.',
      ja: '誰かが困っていることを話すと、その人にどのような助けが最も役立つか自然と考える。',
      ko: '누군가 어려움을 이야기하면, 그 사람에게 어떤 도움이 가장 유용할지 자연스럽게 생각하게 된다.',
    },
    measures: { department: 'sales', competency: 'Needs identification' },
  },
  {
    key: 'PS50_25',
    kind: 'scale',
    prompt: {
      en: 'When someone disagrees with my suggestion, I try to understand their concerns before responding.',
      ja: '誰かが自分の提案に賛成しないとき、反論する前に相手の懸念を理解しようとする。',
      ko: '누군가 내 제안에 동의하지 않으면, 반응하기 전에 그 사람이 무엇을 걱정하는지 이해하려고 한다.',
    },
    measures: { department: 'sales', competency: 'Objection handling' },
  },
  {
    key: 'PS50_26',
    kind: 'scale',
    prompt: {
      en: 'When two people want different things, I enjoy looking for an arrangement that works for both sides.',
      ja: '2人が異なるものを求めているとき、双方にとって納得できる折り合いを探すのが好きだ。',
      ko: '두 사람이 서로 다른 것을 원할 때, 양쪽 모두에게 도움이 되는 합의점을 찾는 것을 좋아한다.',
    },
    measures: { department: 'sales', competency: 'Negotiation and compromise' },
  },
  {
    key: 'PS50_27',
    kind: 'scale',
    prompt: {
      en: 'When an attempt does not work out, I am willing to try again using a different approach.',
      ja: '一度うまくいかなくても、別の方法で再び挑戦しようと思う。',
      ko: '시도한 일이 잘되지 않더라도 다른 방법으로 다시 도전할 의향이 있다.',
    },
    measures: { department: 'sales', competency: 'Resilience and persistence' },
  },
  {
    key: 'PS50_28',
    kind: 'scale',
    prompt: {
      en: 'I am comfortable starting conversations with people I have not interacted with before.',
      ja: 'これまで接点のなかった人に自分から話しかけることに抵抗がない。',
      ko: '이전에 교류한 적이 없는 사람에게 먼저 말을 거는 것이 편하다.',
    },
    measures: { department: 'sales', competency: 'Initiative and outreach' },
  },
  {
    key: 'PS50_29',
    kind: 'scale',
    prompt: {
      en: 'During conversations, I sometimes notice opportunities to connect someone\'s needs with something that could help them.',
      ja: '会話の中で、相手のニーズとその人の役に立つものを結びつける機会に気づくことがある。',
      ko: '대화 중에 누군가의 필요와 그 사람에게 도움이 될 만한 것을 연결할 기회를 발견할 때가 있다.',
    },
    measures: { department: 'sales', competency: 'Opportunity recognition' },
  },
  {
    key: 'PS50_30',
    kind: 'scale',
    prompt: {
      en: 'I naturally adjust how I explain something depending on who I am talking to.',
      ja: '話す相手に応じて、説明の仕方を自然に変えるほうだ。',
      ko: '대화하는 상대에 따라 설명하는 방식을 자연스럽게 바꾸는 편이다.',
    },
    measures: { department: 'sales', competency: 'Clear and adaptive communication' },
  },
  {
    key: 'PS50_31',
    kind: 'scale',
    prompt: {
      en: 'I often try to understand why people react differently to the same situation.',
      ja: '同じ状況でも、人によって反応が異なる理由を理解しようとすることが多い。',
      ko: '같은 상황에서도 사람들이 서로 다르게 반응하는 이유를 이해하려고 하는 편이다.',
    },
    measures: { department: 'human-resources', competency: 'Interpersonal understanding' },
  },
  {
    key: 'PS50_32',
    kind: 'scale',
    prompt: {
      en: 'When someone is upset, I try to understand what might be bothering them before responding.',
      ja: '誰かが落ち込んでいるとき、すぐに反応するよりも、まず何に悩んでいるのかを理解しようとする。',
      ko: '누군가 속상해할 때, 바로 반응하기보다 무엇이 그 사람을 힘들게 하는지 먼저 이해하려고 한다.',
    },
    measures: { department: 'human-resources', competency: 'Empathy and perspective-taking' },
  },
  {
    key: 'PS50_33',
    kind: 'scale',
    prompt: {
      en: 'When people disagree, I look for ways to help them understand each other\'s perspectives.',
      ja: '意見が対立したとき、互いの考えを理解できるようにする方法を探すほうだ。',
      ko: '사람들이 의견이 다를 때, 서로의 관점을 이해할 수 있도록 돕는 방법을 찾는 편이다.',
    },
    measures: { department: 'human-resources', competency: 'Conflict resolution' },
  },
  {
    key: 'PS50_34',
    kind: 'scale',
    prompt: {
      en: 'During conversations, I pay attention to what people mean, even when they do not express it directly.',
      ja: '会話では、相手がはっきりと言葉にしていないことにも注意を向けるほうだ。',
      ko: '대화할 때, 사람들이 직접적으로 표현하지 않더라도 그 말에 담긴 의미에 주의를 기울이는 편이다.',
    },
    measures: { department: 'human-resources', competency: 'Active listening' },
  },
  {
    key: 'PS50_35',
    kind: 'scale',
    prompt: {
      en: 'When deciding between different viewpoints, I try to consider everyone\'s circumstances rather than favoring one person.',
      ja: '異なる意見の中から判断するとき、特定の人を優先せず、それぞれの事情を考慮しようとする。',
      ko: '서로 다른 의견 중 하나를 선택할 때, 특정한 사람의 편을 들기보다 모든 사람의 상황을 고려하려고 한다.',
    },
    measures: { department: 'human-resources', competency: 'Fairness and impartiality' },
  },
  {
    key: 'PS50_36',
    kind: 'scale',
    prompt: {
      en: 'When someone shares something personal with me, I think carefully about what should remain private.',
      ja: '誰かが個人的な話をしてくれたとき、何を秘密にしておくべきか慎重に考える。',
      ko: '누군가 개인적인 이야기를 털어놓으면, 어떤 내용을 비밀로 지켜야 할지 신중하게 생각한다.',
    },
    measures: { department: 'human-resources', competency: 'Ethical judgment and discretion' },
  },
  {
    key: 'PS50_37',
    kind: 'scale',
    prompt: {
      en: 'When someone struggles with a task, I enjoy helping them find a way to improve.',
      ja: '誰かが作業に苦労しているとき、よりうまくできる方法を見つける手助けをするのが好きだ。',
      ko: '누군가 과제를 어려워할 때, 더 잘할 수 있는 방법을 찾도록 돕는 것을 좋아한다.',
    },
    measures: { department: 'human-resources', competency: 'Coaching and development' },
  },
  {
    key: 'PS50_38',
    kind: 'scale',
    prompt: {
      en: 'When organizing an activity involving several people, I try to make sure everyone knows their responsibilities.',
      ja: '複数の人が参加する活動を企画するとき、全員が自分の役割を理解しているか確認するようにしている。',
      ko: '여러 사람이 참여하는 활동을 준비할 때, 모두가 자신의 역할을 알고 있는지 확인하려고 한다.',
    },
    measures: { department: 'human-resources', competency: 'Coordination and planning' },
  },
  {
    key: 'PS50_39',
    kind: 'scale',
    prompt: {
      en: 'I notice when the atmosphere in a group changes, even if nobody openly mentions it.',
      ja: '誰もはっきりと言わなくても、グループの雰囲気の変化に気づくほうだ。',
      ko: '아무도 직접적으로 말하지 않더라도 그룹의 분위기가 달라지는 것을 알아차리는 편이다.',
    },
    measures: { department: 'human-resources', competency: 'Group dynamics and morale' },
  },
  {
    key: 'PS50_40',
    kind: 'scale',
    prompt: {
      en: 'I recognize that people may need different kinds of support to achieve the same goal.',
      ja: '同じ目標を達成するためでも、人によって必要なサポートは異なると考えている。',
      ko: '같은 목표를 달성하더라도 사람마다 필요한 지원이 다를 수 있다고 생각한다.',
    },
    measures: { department: 'human-resources', competency: 'Adaptability to individual needs' },
  },
  {
    key: 'PS50_41',
    kind: 'scale',
    prompt: {
      en: 'I tend to notice small inconveniences that people around me have learned to live with.',
      ja: '周りの人が当たり前のこととして受け入れている、ちょっとした不便さに気づくことが多い。',
      ko: '주변 사람들이 익숙해져서 그냥 감수하고 있는 작은 불편함을 알아차리는 편이다.',
    },
    measures: { department: 'product-management', competency: 'Opportunity recognition' },
  },
  {
    key: 'PS50_42',
    kind: 'scale',
    prompt: {
      en: 'When someone has difficulty with something, I often wonder what would make the experience easier for them.',
      ja: '誰かが何かに困っているとき、どうすればもっと簡単にできるようになるかを考えることが多い。',
      ko: '누군가 어떤 일을 어려워할 때, 어떻게 하면 그 사람이 더 쉽게 할 수 있을지 생각하는 편이다.',
    },
    measures: { department: 'product-management', competency: 'Customer understanding' },
  },
  {
    key: 'PS50_43',
    kind: 'scale',
    prompt: {
      en: 'When faced with several possible explanations, I prefer to look for clues before settling on one.',
      ja: 'いくつかの可能性が考えられるときは、一つに決める前に、まず手がかりを探すほうだ。',
      ko: '여러 가지 설명이 가능할 때, 하나를 선택하기 전에 먼저 단서를 찾아보는 편이다.',
    },
    measures: { department: 'product-management', competency: 'Analytical thinking' },
  },
  {
    key: 'PS50_44',
    kind: 'scale',
    prompt: {
      en: 'Before committing to a decision, I often consider how it might affect things later.',
      ja: '何かを決める前に、その決定が後々どのような影響を与えるか考えることが多い。',
      ko: '어떤 결정을 내리기 전에, 그 결정이 나중에 어떤 영향을 미칠지 생각하는 편이다.',
    },
    measures: { department: 'product-management', competency: 'Strategic thinking' },
  },
  {
    key: 'PS50_45',
    kind: 'scale',
    prompt: {
      en: 'When I have several things to do, I find it useful to identify which one would make the biggest difference.',
      ja: 'やるべきことがいくつかあるとき、どれが最も大きな効果をもたらすかを見極めることが大切だと思う。',
      ko: '해야 할 일이 여러 가지 있을 때, 어떤 일이 가장 큰 변화를 가져올지 파악하는 것이 도움이 된다고 생각한다.',
    },
    measures: { department: 'product-management', competency: 'Prioritization' },
  },
  {
    key: 'PS50_46',
    kind: 'scale',
    prompt: {
      en: 'When considering an opportunity, I tend to think about whether the expected benefits justify the effort involved.',
      ja: '何かに取り組む機会を考えるとき、期待できるメリットが必要な労力に見合うかを考えるほうだ。',
      ko: '어떤 기회를 고려할 때, 기대되는 이점이 필요한 노력만큼의 가치가 있는지 생각하는 편이다.',
    },
    measures: { department: 'product-management', competency: 'Business judgment' },
  },
  {
    key: 'PS50_47',
    kind: 'scale',
    prompt: {
      en: 'I feel more comfortable with a large task when I can break it into smaller steps.',
      ja: '大きな課題は、小さな段階に分けると取り組みやすく感じる。',
      ko: '큰 과제를 작은 단계로 나누면 더 수월하게 느껴진다.',
    },
    measures: { department: 'product-management', competency: 'Planning and organization' },
  },
  {
    key: 'PS50_48',
    kind: 'scale',
    prompt: {
      en: 'When a plan stops working as expected, I am willing to reconsider my original approach.',
      ja: '計画が思いどおりに進まなくなったときは、最初のやり方を見直すことに抵抗がない。',
      ko: '계획이 예상대로 진행되지 않으면, 원래의 접근 방식을 다시 검토할 의향이 있다.',
    },
    measures: { department: 'product-management', competency: 'Adaptability' },
  },
  {
    key: 'PS50_49',
    kind: 'scale',
    prompt: {
      en: 'I enjoy hearing how people with different experiences would approach the same situation.',
      ja: '異なる経験を持つ人たちが同じ状況にどう取り組むのか、話を聞くのが好きだ。',
      ko: '서로 다른 경험을 가진 사람들이 같은 상황에 어떻게 접근하는지 듣는 것을 좋아한다.',
    },
    measures: { department: 'product-management', competency: 'Cross-functional collaboration' },
  },
  {
    key: 'PS50_50',
    kind: 'scale',
    prompt: {
      en: 'When I have an idea, I often think about what would need to happen to turn it into something usable.',
      ja: 'アイデアが浮かぶと、それを実際に使える形にするには何が必要かを考えることが多い。',
      ko: '아이디어가 떠오르면, 실제로 활용할 수 있는 형태로 만들기 위해 무엇이 필요한지 생각하는 편이다.',
    },
    measures: { department: 'product-management', competency: 'Execution and lifecycle thinking' },
  },
];
