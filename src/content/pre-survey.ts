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
 * The question set is the X-PASS competency inventory: fifteen 1–5 statements
 * for each of the five departments, one per competency of that job. `measures`
 * records which department and competency a statement belongs to, so a rubric
 * can be attached later without changing the questions or the stored answers.
 */
export type Localized = { en: string } & Partial<Record<Exclude<Locale, 'en'>, string>>;

export const localize = (text: Localized, locale: Locale): string => text[locale] ?? text.en;

/** What a scale question measures: one competency of one department's job. */
export type Measures = {
  /** Department slug, as in `departments.ts`. */
  department: string;
  competencyNumber: number;
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
 * LIKE for one department, 0–100, from a student's saved answers.
 *
 * Until the rubric arrives this is the plain mean of the department's answered
 * statements, on the same 1–5 → 20–100 scale as before. Answers saved before the competency inventory
 * (a single `interest_<slug>` rating) are still read. Null when the student
 * answered nothing for the department.
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
  if (scores.length > 0) {
    const mean = scores.reduce((sum, value) => sum + value, 0) / scores.length;
    return Math.round((mean / 5) * 100);
  }
  const legacy = answers[`interest_${department}`];
  return typeof legacy === 'number' ? Math.round((legacy / 5) * 100) : null;
}

// Imported from X_PASS_pre_survey_questions.csv (order, question_id,
// job_role, competency_number, competency, question_en/ko/ja, source_url).
export const PRE_SURVEY_QUESTIONS: PreSurveyQuestion[] = [
  {
    key: 'MKT_01',
    kind: 'scale',
    prompt: {
      en: 'I am curious about why different people are attracted to different things.',
      ja: '人によって惹かれるものが違うのはなぜか、気になる。',
      ko: '사람마다 서로 다른 것에 끌리는 이유가 궁금하다.',
    },
    measures: {
      department: 'marketing',
      competencyNumber: 1,
      competency: 'Customer understanding',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/marketing-job-description',
    },
  },
  {
    key: 'MKT_02',
    kind: 'scale',
    prompt: {
      en: 'I enjoy finding fresh ways to make an ordinary idea more interesting to others.',
      ja: '普通のアイデアを、ほかの人にもっと面白いと感じてもらえるように工夫するのが好きだ。',
      ko: '평범한 아이디어를 다른 사람들에게 더 흥미롭게 전달할 새로운 방법을 찾는 것을 좋아한다.',
    },
    measures: {
      department: 'marketing',
      competencyNumber: 2,
      competency: 'Creative thinking',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/marketing-job-description',
    },
  },
  {
    key: 'MKT_03',
    kind: 'scale',
    prompt: {
      en: 'When sharing something, I think about what would make it interesting to the people receiving it.',
      ja: '何かを伝えるとき、受け取る人が何に興味を持つかを考えるほうだ。',
      ko: '무언가를 전달할 때, 듣거나 보는 사람이 무엇에 흥미를 느낄지 생각하는 편이다.',
    },
    measures: {
      department: 'marketing',
      competencyNumber: 3,
      competency: 'Audience awareness',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/marketing-job-description',
    },
  },
  {
    key: 'MKT_04',
    kind: 'scale',
    prompt: {
      en: 'I sometimes notice changes in what people around me talk about or become interested in.',
      ja: '周りの人が話題にしたり、興味を持ったりするものの変化に気づくことがある。',
      ko: '주변 사람들이 이야기하거나 관심을 갖는 주제가 어떻게 바뀌는지 알아차릴 때가 있다.',
    },
    measures: {
      department: 'marketing',
      competencyNumber: 4,
      competency: 'Trend awareness',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/marketing-job-description',
    },
  },
  {
    key: 'MKT_05',
    kind: 'scale',
    prompt: {
      en: 'When something becomes popular, I find myself wondering what might have contributed to its popularity.',
      ja: '何かが人気になると、その人気につながった要因は何なのか気になる。',
      ko: '어떤 것이 인기를 얻으면, 무엇이 인기에 영향을 미쳤는지 궁금해진다.',
    },
    measures: {
      department: 'marketing',
      competencyNumber: 5,
      competency: 'Analytical thinking',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/marketing-job-description',
    },
  },
  {
    key: 'MKT_06',
    kind: 'scale',
    prompt: {
      en: 'I enjoy explaining the value of something in a way that helps others understand its appeal.',
      ja: '何かの価値や魅力が相手に伝わるように説明するのが好きだ。',
      ko: '어떤 것의 가치를 다른 사람들이 매력적으로 느낄 수 있도록 설명하는 것을 좋아한다.',
    },
    measures: {
      department: 'marketing',
      competencyNumber: 6,
      competency: 'Persuasive communication',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/marketing-job-description',
    },
  },
  {
    key: 'MKT_07',
    kind: 'scale',
    prompt: {
      en: 'I like finding interesting ways to present information rather than simply listing facts.',
      ja: '情報をただ並べるのではなく、興味を引く形で伝える方法を考えるのが好きだ。',
      ko: '정보를 단순히 나열하기보다 흥미롭게 전달하는 방법을 찾는 것을 좋아한다.',
    },
    measures: {
      department: 'marketing',
      competencyNumber: 7,
      competency: 'Storytelling and content creation',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/marketing-job-description',
    },
  },
  {
    key: 'MKT_08',
    kind: 'scale',
    prompt: {
      en: 'I find it interesting that the same message can create different impressions depending on how it is presented.',
      ja: '同じメッセージでも、伝え方によって異なる印象を与えることが興味深い。',
      ko: '같은 메시지도 전달 방식에 따라 서로 다른 인상을 줄 수 있다는 점이 흥미롭다.',
    },
    measures: {
      department: 'marketing',
      competencyNumber: 8,
      competency: 'Understanding perceptions',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/marketing-job-description',
    },
  },
  {
    key: 'MKT_09',
    kind: 'scale',
    prompt: {
      en: 'When working on something, I like having a clear idea of what I want to achieve.',
      ja: '何かに取り組むとき、何を達成したいのかを明確にするのが好きだ。',
      ko: '무언가를 할 때, 무엇을 달성하고 싶은지 명확히 하는 것을 좋아한다.',
    },
    measures: {
      department: 'marketing',
      competencyNumber: 9,
      competency: 'Goal orientation',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/marketing-job-description',
    },
  },
  {
    key: 'MKT_10',
    kind: 'scale',
    prompt: {
      en: 'After trying something new, I often reflect on what worked well and what could be improved.',
      ja: '新しいことを試した後、何がうまくいき、何を改善できるか振り返ることが多い。',
      ko: '새로운 것을 시도한 후, 무엇이 잘되었고 무엇을 개선할 수 있을지 돌아보는 편이다.',
    },
    measures: {
      department: 'marketing',
      competencyNumber: 10,
      competency: 'Results evaluation',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/marketing-job-description',
    },
  },
  {
    key: 'MKT_11',
    kind: 'scale',
    prompt: {
      en: 'I enjoy trying different approaches to see which one works better.',
      ja: 'どの方法がより効果的かを確かめるために、さまざまなやり方を試すのが好きだ。',
      ko: '어떤 방법이 더 효과적인지 알아보기 위해 여러 가지 접근 방식을 시도하는 것을 좋아한다.',
    },
    measures: {
      department: 'marketing',
      competencyNumber: 11,
      competency: 'Experimentation',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/marketing-job-description',
    },
  },
  {
    key: 'MKT_12',
    kind: 'scale',
    prompt: {
      en: 'I enjoy exchanging ideas with others and building on their suggestions.',
      ja: 'ほかの人とアイデアを出し合い、その提案をさらに発展させるのが好きだ。',
      ko: '다른 사람들과 아이디어를 나누고, 그들의 제안을 발전시키는 것을 좋아한다.',
    },
    measures: {
      department: 'marketing',
      competencyNumber: 12,
      competency: 'Collaboration and brainstorming',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/marketing-job-description',
    },
  },
  {
    key: 'MKT_13',
    kind: 'scale',
    prompt: {
      en: 'I am comfortable adjusting how I approach something depending on the situation.',
      ja: '状況に応じて、物事への取り組み方を変えることに抵抗がない。',
      ko: '상황에 따라 접근 방식을 바꾸는 것에 거부감이 없다.',
    },
    measures: {
      department: 'marketing',
      competencyNumber: 13,
      competency: 'Adaptability',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/marketing-job-description',
    },
  },
  {
    key: 'MKT_14',
    kind: 'scale',
    prompt: {
      en: 'When handling several tasks, I try to keep track of what needs to be done and when.',
      ja: '複数の作業を同時に進めるとき、何をいつまでに行う必要があるか把握するようにしている。',
      ko: '여러 가지 일을 동시에 처리할 때, 해야 할 일과 마감 시점을 파악하려고 한다.',
    },
    measures: {
      department: 'marketing',
      competencyNumber: 14,
      competency: 'Organization and time management',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/marketing-job-description',
    },
  },
  {
    key: 'MKT_15',
    kind: 'scale',
    prompt: {
      en: 'I enjoy finding opportunities to connect with people who share an interest or goal.',
      ja: '共通の関心や目標を持つ人とつながる機会を見つけるのが好きだ。',
      ko: '관심사나 목표가 비슷한 사람들과 교류할 기회를 찾는 것을 좋아한다.',
    },
    measures: {
      department: 'marketing',
      competencyNumber: 15,
      competency: 'Relationship building and outreach',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/marketing-job-description',
    },
  },
  {
    key: 'STR_01',
    kind: 'scale',
    prompt: {
      en: 'When making a decision, I like to consider how it might affect other things in the future.',
      ja: '何かを決めるとき、その決定が将来ほかのことにどのような影響を与えるか考えるのが好きだ。',
      ko: '결정을 내릴 때, 그 결정이 미래의 다른 일들에 어떤 영향을 미칠지 생각하는 것을 좋아한다.',
    },
    measures: {
      department: 'strategy',
      competencyNumber: 1,
      competency: 'Strategic thinking',
    },
  },
  {
    key: 'STR_02',
    kind: 'scale',
    prompt: {
      en: 'When a problem feels complicated, I try to break it down into smaller parts to understand it better.',
      ja: '問題が複雑に感じられるときは、理解しやすくするために小さな部分に分けて考えるほうだ。',
      ko: '문제가 복잡하게 느껴지면, 더 잘 이해하기 위해 작은 부분으로 나누어 생각하는 편이다.',
    },
    measures: {
      department: 'strategy',
      competencyNumber: 2,
      competency: 'Problem structuring',
    },
  },
  {
    key: 'STR_03',
    kind: 'scale',
    prompt: {
      en: 'When I hear an explanation, I naturally wonder what evidence supports it.',
      ja: '何かの説明を聞くと、それを裏付ける根拠は何なのか自然と気になる。',
      ko: '어떤 설명을 들으면, 그것을 뒷받침하는 근거가 무엇인지 자연스럽게 궁금해진다.',
    },
    measures: {
      department: 'strategy',
      competencyNumber: 3,
      competency: 'Critical thinking',
    },
  },
  {
    key: 'STR_04',
    kind: 'scale',
    prompt: {
      en: 'When the same problem occurs repeatedly, I try to identify what is causing it.',
      ja: '同じ問題が繰り返し起こるとき、その原因が何なのかを突き止めようとする。',
      ko: '같은 문제가 반복되면, 그 원인이 무엇인지 파악하려고 한다.',
    },
    measures: {
      department: 'strategy',
      competencyNumber: 4,
      competency: 'Root-cause analysis',
    },
  },
  {
    key: 'STR_05',
    kind: 'scale',
    prompt: {
      en: 'When I notice a situation that could be improved, I often think about what could be done differently.',
      ja: '改善できそうな状況に気づくと、何を変えられるか考えることが多い。',
      ko: '개선할 수 있는 상황을 발견하면, 무엇을 다르게 할 수 있을지 생각하는 편이다.',
    },
    measures: {
      department: 'strategy',
      competencyNumber: 5,
      competency: 'Opportunity recognition',
    },
  },
  {
    key: 'STR_06',
    kind: 'scale',
    prompt: {
      en: 'I find it useful to think about what I want to achieve before deciding how to get there.',
      ja: '目標に向かう方法を決める前に、何を達成したいのかを考えることが大切だと思う。',
      ko: '목표에 도달하는 방법을 결정하기 전에, 무엇을 달성하고 싶은지 생각하는 것이 중요하다고 느낀다.',
    },
    measures: {
      department: 'strategy',
      competencyNumber: 6,
      competency: 'Long-term planning',
    },
  },
  {
    key: 'STR_07',
    kind: 'scale',
    prompt: {
      en: 'When faced with several options, I like comparing their advantages and disadvantages before choosing one.',
      ja: 'いくつかの選択肢があるとき、一つを選ぶ前にそれぞれのメリットとデメリットを比較するのが好きだ。',
      ko: '여러 선택지가 있을 때, 하나를 선택하기 전에 각각의 장단점을 비교하는 것을 좋아한다.',
    },
    measures: {
      department: 'strategy',
      competencyNumber: 7,
      competency: 'Evaluating alternatives',
    },
  },
  {
    key: 'STR_08',
    kind: 'scale',
    prompt: {
      en: 'I feel more confident in a decision when I can support it with facts rather than assumptions.',
      ja: '推測よりも事実を根拠に判断できるとき、より自信を持って決断できる。',
      ko: '추측보다는 사실을 근거로 뒷받침할 수 있을 때 결정을 내리는 데 더 자신감이 생긴다.',
    },
    measures: {
      department: 'strategy',
      competencyNumber: 8,
      competency: 'Evidence-based judgment',
    },
  },
  {
    key: 'STR_09',
    kind: 'scale',
    prompt: {
      en: 'When one part of a system changes, I tend to consider how the other parts might be affected.',
      ja: '仕組みの一部が変わると、ほかの部分にどのような影響が及ぶかも考えるほうだ。',
      ko: '시스템의 한 부분이 바뀌면, 다른 부분들이 어떤 영향을 받을지도 생각하는 편이다.',
    },
    measures: {
      department: 'strategy',
      competencyNumber: 9,
      competency: 'Systems thinking',
    },
  },
  {
    key: 'STR_10',
    kind: 'scale',
    prompt: {
      en: 'When time or resources are limited, I try to determine where they would be most useful.',
      ja: '時間や資源が限られているとき、どこに使うのが最も効果的かを考えるようにしている。',
      ko: '시간이나 자원이 제한되어 있을 때, 어디에 활용하는 것이 가장 효과적일지 판단하려고 한다.',
    },
    measures: {
      department: 'strategy',
      competencyNumber: 10,
      competency: 'Resource allocation',
    },
  },
  {
    key: 'STR_11',
    kind: 'scale',
    prompt: {
      en: 'When circumstances change, I am willing to reconsider a plan even if I have already invested considerable effort in it.',
      ja: '状況が変わったときは、すでに多くの労力を費やした計画でも見直すことに抵抗がない。',
      ko: '상황이 바뀌면, 이미 많은 노력을 들인 계획이라도 다시 검토할 의향이 있다.',
    },
    measures: {
      department: 'strategy',
      competencyNumber: 11,
      competency: 'Adaptability and change management',
    },
  },
  {
    key: 'STR_12',
    kind: 'scale',
    prompt: {
      en: 'When I encounter information from different sources, I enjoy connecting the pieces to form a clearer picture.',
      ja: 'さまざまな情報に触れたとき、それらを結びつけて全体像をより明確に理解するのが好きだ。',
      ko: '여러 출처에서 정보를 접하면, 각각의 정보를 연결해 전체적인 상황을 더 명확하게 이해하는 것을 좋아한다.',
    },
    measures: {
      department: 'strategy',
      competencyNumber: 12,
      competency: 'Synthesizing information',
    },
  },
  {
    key: 'STR_13',
    kind: 'scale',
    prompt: {
      en: 'When I recommend an approach, I try to explain why it makes sense compared with other options.',
      ja: 'ある方法を提案するとき、ほかの選択肢と比べてなぜその方法が適切なのかを説明するようにしている。',
      ko: '어떤 방법을 추천할 때, 다른 선택지와 비교해 왜 그 방법이 적절한지 설명하려고 한다.',
    },
    measures: {
      department: 'strategy',
      competencyNumber: 13,
      competency: 'Persuasive reasoning',
    },
  },
  {
    key: 'STR_14',
    kind: 'scale',
    prompt: {
      en: 'When several tasks compete for attention, I try to identify which ones are most important to the overall goal.',
      ja: '複数の作業に同時に取り組む必要があるとき、全体の目標にとって何が最も重要かを見極めようとする。',
      ko: '여러 업무에 동시에 주의를 기울여야 할 때, 전체 목표에 가장 중요한 일이 무엇인지 파악하려고 한다.',
    },
    measures: {
      department: 'strategy',
      competencyNumber: 14,
      competency: 'Prioritization and project coordination',
    },
  },
  {
    key: 'STR_15',
    kind: 'scale',
    prompt: {
      en: 'Before committing to a plan, I sometimes consider what could go wrong and how I might respond.',
      ja: '計画を実行に移す前に、どのような問題が起こり得るか、どう対応できるかを考えることがある。',
      ko: '계획을 실행하기로 결정하기 전에, 무엇이 잘못될 수 있고 어떻게 대응할 수 있을지 생각할 때가 있다.',
    },
    measures: {
      department: 'strategy',
      competencyNumber: 15,
      competency: 'Scenario thinking and risk awareness',
    },
  },
  {
    key: 'SAL_01',
    kind: 'scale',
    prompt: {
      en: 'I enjoy explaining my point of view in a way that helps others see why it might be worth considering.',
      ja: '自分の意見を検討する価値があると相手に感じてもらえるように説明するのが好きだ。',
      ko: '다른 사람들이 내 의견을 고려해 볼 가치가 있다고 느끼도록 설명하는 것을 좋아한다.',
    },
    measures: {
      department: 'sales',
      competencyNumber: 1,
      competency: 'Persuasion and influence',
      source: 'https://business.linkedin.com/en-in/talent-solutions/resources/talent-acquisition/job-descriptions/inside-sales-executive',
    },
  },
  {
    key: 'SAL_02',
    kind: 'scale',
    prompt: {
      en: 'I enjoy getting to know people and finding common ground with them.',
      ja: '人と知り合い、共通点を見つけるのが好きだ。',
      ko: '사람들과 친해지고 공통점을 찾는 것을 좋아한다.',
    },
    measures: {
      department: 'sales',
      competencyNumber: 2,
      competency: 'Relationship building',
      source: 'https://business.linkedin.com/en-in/talent-solutions/resources/talent-acquisition/job-descriptions/inside-sales-executive',
    },
  },
  {
    key: 'SAL_03',
    kind: 'scale',
    prompt: {
      en: 'When someone explains what they want, I try to understand what matters most to them.',
      ja: '誰かが希望を説明するとき、その人にとって何が最も重要なのかを理解しようとする。',
      ko: '누군가 원하는 것을 설명할 때, 그 사람에게 무엇이 가장 중요한지 이해하려고 한다.',
    },
    measures: {
      department: 'sales',
      competencyNumber: 3,
      competency: 'Active listening',
      source: 'https://business.linkedin.com/en-in/talent-solutions/resources/talent-acquisition/job-descriptions/inside-sales-executive',
    },
  },
  {
    key: 'SAL_04',
    kind: 'scale',
    prompt: {
      en: 'When someone describes a difficulty, I naturally think about what kind of help would be most useful to them.',
      ja: '誰かが困っていることを話すと、その人にどのような助けが最も役立つか自然と考える。',
      ko: '누군가 어려움을 이야기하면, 그 사람에게 어떤 도움이 가장 유용할지 자연스럽게 생각하게 된다.',
    },
    measures: {
      department: 'sales',
      competencyNumber: 4,
      competency: 'Needs identification',
      source: 'https://business.linkedin.com/en-in/talent-solutions/resources/talent-acquisition/job-descriptions/inside-sales-executive',
    },
  },
  {
    key: 'SAL_05',
    kind: 'scale',
    prompt: {
      en: 'When someone disagrees with my suggestion, I try to understand their concerns before responding.',
      ja: '誰かが自分の提案に賛成しないとき、反論する前に相手の懸念を理解しようとする。',
      ko: '누군가 내 제안에 동의하지 않으면, 반응하기 전에 그 사람이 무엇을 걱정하는지 이해하려고 한다.',
    },
    measures: {
      department: 'sales',
      competencyNumber: 5,
      competency: 'Objection handling',
      source: 'https://business.linkedin.com/en-in/talent-solutions/resources/talent-acquisition/job-descriptions/inside-sales-executive',
    },
  },
  {
    key: 'SAL_06',
    kind: 'scale',
    prompt: {
      en: 'When two people want different things, I enjoy looking for an arrangement that works for both sides.',
      ja: '2人が異なるものを求めているとき、双方にとって納得できる折り合いを探すのが好きだ。',
      ko: '두 사람이 서로 다른 것을 원할 때, 양쪽 모두에게 도움이 되는 합의점을 찾는 것을 좋아한다.',
    },
    measures: {
      department: 'sales',
      competencyNumber: 6,
      competency: 'Negotiation and compromise',
      source: 'https://business.linkedin.com/en-in/talent-solutions/resources/talent-acquisition/job-descriptions/inside-sales-executive',
    },
  },
  {
    key: 'SAL_07',
    kind: 'scale',
    prompt: {
      en: 'Having a clear target motivates me to keep working toward an outcome.',
      ja: '明確な目標があると、結果を出すまで努力を続ける意欲が湧く。',
      ko: '명확한 목표가 있으면 원하는 결과를 얻을 때까지 계속 노력할 동기가 생긴다.',
    },
    measures: {
      department: 'sales',
      competencyNumber: 7,
      competency: 'Goal orientation',
      source: 'https://business.linkedin.com/en-in/talent-solutions/resources/talent-acquisition/job-descriptions/inside-sales-executive',
    },
  },
  {
    key: 'SAL_08',
    kind: 'scale',
    prompt: {
      en: 'When an attempt does not work out, I am willing to try again using a different approach.',
      ja: '一度うまくいかなくても、別の方法で再び挑戦しようと思う。',
      ko: '시도한 일이 잘되지 않더라도 다른 방법으로 다시 도전할 의향이 있다.',
    },
    measures: {
      department: 'sales',
      competencyNumber: 8,
      competency: 'Resilience and persistence',
      source: 'https://business.linkedin.com/en-in/talent-solutions/resources/talent-acquisition/job-descriptions/inside-sales-executive',
    },
  },
  {
    key: 'SAL_09',
    kind: 'scale',
    prompt: {
      en: 'I am comfortable starting conversations with people I have not interacted with before.',
      ja: 'これまで接点のなかった人に自分から話しかけることに抵抗がない。',
      ko: '이전에 교류한 적이 없는 사람에게 먼저 말을 거는 것이 편하다.',
    },
    measures: {
      department: 'sales',
      competencyNumber: 9,
      competency: 'Initiative and outreach',
      source: 'https://business.linkedin.com/en-in/talent-solutions/resources/talent-acquisition/job-descriptions/inside-sales-executive',
    },
  },
  {
    key: 'SAL_10',
    kind: 'scale',
    prompt: {
      en: 'During conversations, I sometimes notice opportunities to connect someone\'s needs with something that could help them.',
      ja: '会話の中で、相手のニーズとその人の役に立つものを結びつける機会に気づくことがある。',
      ko: '대화 중에 누군가의 필요와 그 사람에게 도움이 될 만한 것을 연결할 기회를 발견할 때가 있다.',
    },
    measures: {
      department: 'sales',
      competencyNumber: 10,
      competency: 'Opportunity recognition',
      source: 'https://business.linkedin.com/en-in/talent-solutions/resources/talent-acquisition/job-descriptions/inside-sales-executive',
    },
  },
  {
    key: 'SAL_11',
    kind: 'scale',
    prompt: {
      en: 'I naturally adjust how I explain something depending on who I am talking to.',
      ja: '話す相手に応じて、説明の仕方を自然に変えるほうだ。',
      ko: '대화하는 상대에 따라 설명하는 방식을 자연스럽게 바꾸는 편이다.',
    },
    measures: {
      department: 'sales',
      competencyNumber: 11,
      competency: 'Clear and adaptive communication',
      source: 'https://business.linkedin.com/en-in/talent-solutions/resources/talent-acquisition/job-descriptions/inside-sales-executive',
    },
  },
  {
    key: 'SAL_12',
    kind: 'scale',
    prompt: {
      en: 'When someone is unsure about a choice, I like helping them compare their options and reach a decision.',
      ja: '誰かが選択に迷っているとき、選択肢を比較して決断できるよう手助けするのが好きだ。',
      ko: '누군가 선택을 어려워할 때, 여러 선택지를 비교하고 결정을 내릴 수 있도록 돕는 것을 좋아한다.',
    },
    measures: {
      department: 'sales',
      competencyNumber: 12,
      competency: 'Decision support',
      source: 'https://business.linkedin.com/en-in/talent-solutions/resources/talent-acquisition/job-descriptions/inside-sales-executive',
    },
  },
  {
    key: 'SAL_13',
    kind: 'scale',
    prompt: {
      en: 'When I promise someone that I will do something, I make an effort to follow through.',
      ja: '誰かに何かをすると約束したら、きちんと実行するよう努める。',
      ko: '누군가에게 무언가를 하겠다고 약속하면, 그 약속을 지키려고 노력한다.',
    },
    measures: {
      department: 'sales',
      competencyNumber: 13,
      competency: 'Follow-through and reliability',
      source: 'https://business.linkedin.com/en-in/talent-solutions/resources/talent-acquisition/job-descriptions/inside-sales-executive',
    },
  },
  {
    key: 'SAL_14',
    kind: 'scale',
    prompt: {
      en: 'I find it motivating to track my progress toward a goal and see how far I have come.',
      ja: '目標に向けた進捗を記録し、どこまで達成できたかを確認すると意欲が高まる。',
      ko: '목표를 향한 진행 상황을 기록하고 얼마나 달성했는지 확인하는 것이 동기 부여가 된다.',
    },
    measures: {
      department: 'sales',
      competencyNumber: 14,
      competency: 'Performance tracking',
      source: 'https://business.linkedin.com/en-in/talent-solutions/resources/talent-acquisition/job-descriptions/inside-sales-executive',
    },
  },
  {
    key: 'SAL_15',
    kind: 'scale',
    prompt: {
      en: 'I make an effort to maintain relationships with people even after our immediate interaction has ended.',
      ja: '目の前の用事が終わった後も、人との関係を維持するよう努める。',
      ko: '당장의 용건이 끝난 후에도 사람들과의 관계를 이어 가려고 노력한다.',
    },
    measures: {
      department: 'sales',
      competencyNumber: 15,
      competency: 'Customer relationship management',
      source: 'https://business.linkedin.com/en-in/talent-solutions/resources/talent-acquisition/job-descriptions/inside-sales-executive',
    },
  },
  {
    key: 'HR_01',
    kind: 'scale',
    prompt: {
      en: 'I often try to understand why people react differently to the same situation.',
      ja: '同じ状況でも、人によって反応が異なる理由を理解しようとすることが多い。',
      ko: '같은 상황에서도 사람들이 서로 다르게 반응하는 이유를 이해하려고 하는 편이다.',
    },
    measures: {
      department: 'human-resources',
      competencyNumber: 1,
      competency: 'Interpersonal understanding',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/human-resources-manager-job-description',
    },
  },
  {
    key: 'HR_02',
    kind: 'scale',
    prompt: {
      en: 'When someone is upset, I try to understand what might be bothering them before responding.',
      ja: '誰かが落ち込んでいるとき、すぐに反応するよりも、まず何に悩んでいるのかを理解しようとする。',
      ko: '누군가 속상해할 때, 바로 반응하기보다 무엇이 그 사람을 힘들게 하는지 먼저 이해하려고 한다.',
    },
    measures: {
      department: 'human-resources',
      competencyNumber: 2,
      competency: 'Empathy and perspective-taking',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/human-resources-manager-job-description',
    },
  },
  {
    key: 'HR_03',
    kind: 'scale',
    prompt: {
      en: 'When people disagree, I look for ways to help them understand each other\'s perspectives.',
      ja: '意見が対立したとき、互いの考えを理解できるようにする方法を探すほうだ。',
      ko: '사람들이 의견이 다를 때, 서로의 관점을 이해할 수 있도록 돕는 방법을 찾는 편이다.',
    },
    measures: {
      department: 'human-resources',
      competencyNumber: 3,
      competency: 'Conflict resolution',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/human-resources-manager-job-description',
    },
  },
  {
    key: 'HR_04',
    kind: 'scale',
    prompt: {
      en: 'During conversations, I pay attention to what people mean, even when they do not express it directly.',
      ja: '会話では、相手がはっきりと言葉にしていないことにも注意を向けるほうだ。',
      ko: '대화할 때, 사람들이 직접적으로 표현하지 않더라도 그 말에 담긴 의미에 주의를 기울이는 편이다.',
    },
    measures: {
      department: 'human-resources',
      competencyNumber: 4,
      competency: 'Active listening',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/human-resources-manager-job-description',
    },
  },
  {
    key: 'HR_05',
    kind: 'scale',
    prompt: {
      en: 'I enjoy creating an environment where people feel comfortable approaching me.',
      ja: '人が気軽に話しかけられる雰囲気をつくるのが好きだ。',
      ko: '사람들이 편하게 다가와 이야기할 수 있는 분위기를 만드는 것을 좋아한다.',
    },
    measures: {
      department: 'human-resources',
      competencyNumber: 5,
      competency: 'Relationship building',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/human-resources-manager-job-description',
    },
  },
  {
    key: 'HR_06',
    kind: 'scale',
    prompt: {
      en: 'When deciding between different viewpoints, I try to consider everyone\'s circumstances rather than favoring one person.',
      ja: '異なる意見の中から判断するとき、特定の人を優先せず、それぞれの事情を考慮しようとする。',
      ko: '서로 다른 의견 중 하나를 선택할 때, 특정한 사람의 편을 들기보다 모든 사람의 상황을 고려하려고 한다.',
    },
    measures: {
      department: 'human-resources',
      competencyNumber: 6,
      competency: 'Fairness and impartiality',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/human-resources-manager-job-description',
    },
  },
  {
    key: 'HR_07',
    kind: 'scale',
    prompt: {
      en: 'When someone shares something personal with me, I think carefully about what should remain private.',
      ja: '誰かが個人的な話をしてくれたとき、何を秘密にしておくべきか慎重に考える。',
      ko: '누군가 개인적인 이야기를 털어놓으면, 어떤 내용을 비밀로 지켜야 할지 신중하게 생각한다.',
    },
    measures: {
      department: 'human-resources',
      competencyNumber: 7,
      competency: 'Ethical judgment and discretion',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/human-resources-manager-job-description',
    },
  },
  {
    key: 'HR_08',
    kind: 'scale',
    prompt: {
      en: 'When a problem keeps recurring, I try to understand its underlying cause rather than deal with each incident separately.',
      ja: '同じ問題が繰り返し起こるとき、その都度対応するよりも、根本的な原因を理解しようとする。',
      ko: '같은 문제가 반복되면, 매번 개별적으로 대응하기보다 근본적인 원인을 이해하려고 한다.',
    },
    measures: {
      department: 'human-resources',
      competencyNumber: 8,
      competency: 'Problem-solving',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/human-resources-manager-job-description',
    },
  },
  {
    key: 'HR_09',
    kind: 'scale',
    prompt: {
      en: 'I prefer keeping important information organized so that I can find it when needed.',
      ja: '必要なときにすぐ見つけられるよう、重要な情報を整理しておくほうだ。',
      ko: '필요할 때 쉽게 찾을 수 있도록 중요한 정보를 정리해 두는 편이다.',
    },
    measures: {
      department: 'human-resources',
      competencyNumber: 9,
      competency: 'Organization and attention to detail',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/human-resources-manager-job-description',
    },
  },
  {
    key: 'HR_10',
    kind: 'scale',
    prompt: {
      en: 'When following a procedure, I like to understand why the rules exist and what they are meant to prevent.',
      ja: '手順に従うとき、そのルールがなぜ存在し、どのような問題を防ぐためのものなのか理解したいと思う。',
      ko: '절차를 따를 때, 규칙이 왜 존재하며 어떤 문제를 예방하기 위한 것인지 이해하는 것을 중요하게 생각한다.',
    },
    measures: {
      department: 'human-resources',
      competencyNumber: 10,
      competency: 'Policy and rule awareness',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/human-resources-manager-job-description',
    },
  },
  {
    key: 'HR_11',
    kind: 'scale',
    prompt: {
      en: 'When someone struggles with a task, I enjoy helping them find a way to improve.',
      ja: '誰かが作業に苦労しているとき、よりうまくできる方法を見つける手助けをするのが好きだ。',
      ko: '누군가 과제를 어려워할 때, 더 잘할 수 있는 방법을 찾도록 돕는 것을 좋아한다.',
    },
    measures: {
      department: 'human-resources',
      competencyNumber: 11,
      competency: 'Coaching and development',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/human-resources-manager-job-description',
    },
  },
  {
    key: 'HR_12',
    kind: 'scale',
    prompt: {
      en: 'When organizing an activity involving several people, I try to make sure everyone knows their responsibilities.',
      ja: '複数の人が参加する活動を企画するとき、全員が自分の役割を理解しているか確認するようにしている。',
      ko: '여러 사람이 참여하는 활동을 준비할 때, 모두가 자신의 역할을 알고 있는지 확인하려고 한다.',
    },
    measures: {
      department: 'human-resources',
      competencyNumber: 12,
      competency: 'Coordination and planning',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/human-resources-manager-job-description',
    },
  },
  {
    key: 'HR_13',
    kind: 'scale',
    prompt: {
      en: 'I notice when the atmosphere in a group changes, even if nobody openly mentions it.',
      ja: '誰もはっきりと言わなくても、グループの雰囲気の変化に気づくほうだ。',
      ko: '아무도 직접적으로 말하지 않더라도 그룹의 분위기가 달라지는 것을 알아차리는 편이다.',
    },
    measures: {
      department: 'human-resources',
      competencyNumber: 13,
      competency: 'Group dynamics and morale',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/human-resources-manager-job-description',
    },
  },
  {
    key: 'HR_14',
    kind: 'scale',
    prompt: {
      en: 'I recognize that people may need different kinds of support to achieve the same goal.',
      ja: '同じ目標を達成するためでも、人によって必要なサポートは異なると考えている。',
      ko: '같은 목표를 달성하더라도 사람마다 필요한 지원이 다를 수 있다고 생각한다.',
    },
    measures: {
      department: 'human-resources',
      competencyNumber: 14,
      competency: 'Adaptability to individual needs',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/human-resources-manager-job-description',
    },
  },
  {
    key: 'HR_15',
    kind: 'scale',
    prompt: {
      en: 'When a routine causes repeated difficulties, I look for ways to make it work better for everyone involved.',
      ja: 'いつものやり方で問題が繰り返し起こるとき、関係する全員にとってよりよい方法を探すほうだ。',
      ko: '어떤 일상적인 절차에서 문제가 반복되면, 관련된 모든 사람에게 더 효과적인 방식이 있는지 찾아보는 편이다.',
    },
    measures: {
      department: 'human-resources',
      competencyNumber: 15,
      competency: 'Process improvement',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/human-resources-manager-job-description',
    },
  },
  {
    key: 'PM_01',
    kind: 'scale',
    prompt: {
      en: 'I tend to notice small inconveniences that people around me have learned to live with.',
      ja: '周りの人が当たり前のこととして受け入れている、ちょっとした不便さに気づくことが多い。',
      ko: '주변 사람들이 익숙해져서 그냥 감수하고 있는 작은 불편함을 알아차리는 편이다.',
    },
    measures: {
      department: 'product-management',
      competencyNumber: 1,
      competency: 'Opportunity recognition',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/product-manager-job-description',
    },
  },
  {
    key: 'PM_02',
    kind: 'scale',
    prompt: {
      en: 'I enjoy thinking of new things that could address problems I notice around me.',
      ja: '身の回りで気づいた問題を解決できる、新しいアイデアを考えるのが好きだ。',
      ko: '주변에서 발견한 문제를 해결할 수 있는 새로운 아이디어를 생각하는 것을 좋아한다.',
    },
    measures: {
      department: 'product-management',
      competencyNumber: 2,
      competency: 'Idea generation',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/product-manager-job-description',
    },
  },
  {
    key: 'PM_03',
    kind: 'scale',
    prompt: {
      en: 'When someone has difficulty with something, I often wonder what would make the experience easier for them.',
      ja: '誰かが何かに困っているとき、どうすればもっと簡単にできるようになるかを考えることが多い。',
      ko: '누군가 어떤 일을 어려워할 때, 어떻게 하면 그 사람이 더 쉽게 할 수 있을지 생각하는 편이다.',
    },
    measures: {
      department: 'product-management',
      competencyNumber: 3,
      competency: 'Customer understanding',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/product-manager-job-description',
    },
  },
  {
    key: 'PM_04',
    kind: 'scale',
    prompt: {
      en: 'When faced with several possible explanations, I prefer to look for clues before settling on one.',
      ja: 'いくつかの可能性が考えられるときは、一つに決める前に、まず手がかりを探すほうだ。',
      ko: '여러 가지 설명이 가능할 때, 하나를 선택하기 전에 먼저 단서를 찾아보는 편이다.',
    },
    measures: {
      department: 'product-management',
      competencyNumber: 4,
      competency: 'Analytical thinking',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/product-manager-job-description',
    },
  },
  {
    key: 'PM_05',
    kind: 'scale',
    prompt: {
      en: 'Before committing to a decision, I often consider how it might affect things later.',
      ja: '何かを決める前に、その決定が後々どのような影響を与えるか考えることが多い。',
      ko: '어떤 결정을 내리기 전에, 그 결정이 나중에 어떤 영향을 미칠지 생각하는 편이다.',
    },
    measures: {
      department: 'product-management',
      competencyNumber: 5,
      competency: 'Strategic thinking',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/product-manager-job-description',
    },
  },
  {
    key: 'PM_06',
    kind: 'scale',
    prompt: {
      en: 'When I see different solutions to the same problem, I naturally wonder what makes each one appealing.',
      ja: '同じ問題に対するさまざまな解決策を見ると、それぞれの魅力は何なのか自然と気になる。',
      ko: '같은 문제에 대한 여러 해결책을 보면, 각각의 매력은 무엇인지 자연스럽게 궁금해진다.',
    },
    measures: {
      department: 'product-management',
      competencyNumber: 6,
      competency: 'Competitive awareness',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/product-manager-job-description',
    },
  },
  {
    key: 'PM_07',
    kind: 'scale',
    prompt: {
      en: 'When I have several things to do, I find it useful to identify which one would make the biggest difference.',
      ja: 'やるべきことがいくつかあるとき、どれが最も大きな効果をもたらすかを見極めることが大切だと思う。',
      ko: '해야 할 일이 여러 가지 있을 때, 어떤 일이 가장 큰 변화를 가져올지 파악하는 것이 도움이 된다고 생각한다.',
    },
    measures: {
      department: 'product-management',
      competencyNumber: 7,
      competency: 'Prioritization',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/product-manager-job-description',
    },
  },
  {
    key: 'PM_08',
    kind: 'scale',
    prompt: {
      en: 'When considering an opportunity, I tend to think about whether the expected benefits justify the effort involved.',
      ja: '何かに取り組む機会を考えるとき、期待できるメリットが必要な労力に見合うかを考えるほうだ。',
      ko: '어떤 기회를 고려할 때, 기대되는 이점이 필요한 노력만큼의 가치가 있는지 생각하는 편이다.',
    },
    measures: {
      department: 'product-management',
      competencyNumber: 8,
      competency: 'Business judgment',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/product-manager-job-description',
    },
  },
  {
    key: 'PM_09',
    kind: 'scale',
    prompt: {
      en: 'I feel more comfortable with a large task when I can break it into smaller steps.',
      ja: '大きな課題は、小さな段階に分けると取り組みやすく感じる。',
      ko: '큰 과제를 작은 단계로 나누면 더 수월하게 느껴진다.',
    },
    measures: {
      department: 'product-management',
      competencyNumber: 9,
      competency: 'Planning and organization',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/product-manager-job-description',
    },
  },
  {
    key: 'PM_10',
    kind: 'scale',
    prompt: {
      en: 'When a plan stops working as expected, I am willing to reconsider my original approach.',
      ja: '計画が思いどおりに進まなくなったときは、最初のやり方を見直すことに抵抗がない。',
      ko: '계획이 예상대로 진행되지 않으면, 원래의 접근 방식을 다시 검토할 의향이 있다.',
    },
    measures: {
      department: 'product-management',
      competencyNumber: 10,
      competency: 'Adaptability',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/product-manager-job-description',
    },
  },
  {
    key: 'PM_11',
    kind: 'scale',
    prompt: {
      en: 'I enjoy hearing how people with different experiences would approach the same situation.',
      ja: '異なる経験を持つ人たちが同じ状況にどう取り組むのか、話を聞くのが好きだ。',
      ko: '서로 다른 경험을 가진 사람들이 같은 상황에 어떻게 접근하는지 듣는 것을 좋아한다.',
    },
    measures: {
      department: 'product-management',
      competencyNumber: 11,
      competency: 'Cross-functional collaboration',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/product-manager-job-description',
    },
  },
  {
    key: 'PM_12',
    kind: 'scale',
    prompt: {
      en: 'I like finding ways to explain complicated ideas so that others can understand them more easily.',
      ja: '複雑なアイデアを、相手がより理解しやすいように説明する方法を考えるのが好きだ。',
      ko: '복잡한 아이디어를 다른 사람들이 더 쉽게 이해할 수 있도록 설명하는 방법을 찾는 것을 좋아한다.',
    },
    measures: {
      department: 'product-management',
      competencyNumber: 12,
      competency: 'Communication and articulation',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/product-manager-job-description',
    },
  },
  {
    key: 'PM_13',
    kind: 'scale',
    prompt: {
      en: 'In group activities, I sometimes help people connect their individual contributions to a shared goal.',
      ja: 'グループ活動では、それぞれの取り組みが共通の目標にどうつながるかを整理することがある。',
      ko: '그룹 활동에서 각자의 기여가 공동의 목표와 어떻게 연결되는지 정리하는 역할을 할 때가 있다.',
    },
    measures: {
      department: 'product-management',
      competencyNumber: 13,
      competency: 'Leadership and coordination',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/product-manager-job-description',
    },
  },
  {
    key: 'PM_14',
    kind: 'scale',
    prompt: {
      en: 'I find it interesting that the same thing can appeal to different people for different reasons.',
      ja: '同じものでも、人によって異なる理由で魅力を感じることが興味深い。',
      ko: '같은 것이라도 사람마다 서로 다른 이유로 매력을 느낄 수 있다는 점이 흥미롭다.',
    },
    measures: {
      department: 'product-management',
      competencyNumber: 14,
      competency: 'Product positioning',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/product-manager-job-description',
    },
  },
  {
    key: 'PM_15',
    kind: 'scale',
    prompt: {
      en: 'When I have an idea, I often think about what would need to happen to turn it into something usable.',
      ja: 'アイデアが浮かぶと、それを実際に使える形にするには何が必要かを考えることが多い。',
      ko: '아이디어가 떠오르면, 실제로 활용할 수 있는 형태로 만들기 위해 무엇이 필요한지 생각하는 편이다.',
    },
    measures: {
      department: 'product-management',
      competencyNumber: 15,
      competency: 'Execution and lifecycle thinking',
      source: 'https://business.linkedin.com/hire/resources/how-to-hire-guides/product-manager-job-description',
    },
  },
];
