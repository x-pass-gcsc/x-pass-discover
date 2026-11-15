import 'server-only';
import type { Locale } from '@/i18n/config';
import type { SenpaiInput, SenpaiService } from './types';

/**
 * Offline senpai, used when no API key is configured.
 *
 * It recognises a handful of common questions and otherwise gives general
 * advice. The window says plainly that it is in offline mode, so nobody
 * mistakes these canned lines for a real conversation.
 */

type Topic = { match: RegExp; answer: Record<Locale, string> };

const TOPICS: Topic[] = [
  {
    match: /部門|選|department|choose|pick|부서|선택/i,
    answer: {
      ja: '部門選びで迷ったら、「どんな問いにワクワクするか」で考えてみて。\n\n- **営業**：どうすれば取引をまとめられる？\n- **マーケティング**：どう売り出す？\n- **プロダクトマネジメント**：何をつくる？\n- **経営戦略**：会社はどこへ向かう？\n- **人事**：誰と一緒に働く？\n\n2つは自分で選んで、残り1つはAIのおすすめが入るよ。意外な部門が向いていることもあるから、気楽に試してみて。',
      en: 'If you are torn between departments, ask yourself which question excites you most.\n\n- **Sales**: How do we win the deal?\n- **Marketing**: How should we market it?\n- **Product Management**: What should we create?\n- **Strategy**: Where should the company go?\n- **HR**: Who should we work with?\n\nYou pick two and the AI recommends a third. The unexpected one sometimes fits best, so give it a go.',
      ko: '부서 선택이 고민된다면 "어떤 질문에 가장 두근거리는지"로 생각해 봐.\n\n- **영업**: 어떻게 거래를 성사시킬까?\n- **마케팅**: 어떻게 알릴까?\n- **프로덕트 매니지먼트**: 무엇을 만들까?\n- **경영전략**: 회사는 어디로 가야 할까?\n- **인사**: 누구와 함께 일할까?\n\n두 개는 직접 고르고, 하나는 AI가 추천해 줘. 의외의 부서가 잘 맞을 때도 있어.',
    },
  },
  {
    match: /質問|聞き|ヒアリング|会議|商談|question|ask|meeting|buyer|질문|미팅|회의/i,
    answer: {
      ja: '相手に話を聞くときのコツを3つ。\n\n1. **事前に仮説を持つ**：資料を読んで「たぶんこうだろう」を作ってから聞くと、質問が鋭くなるよ。\n2. **数字と理由をセットで聞く**：「いくら？」だけでなく「なぜその条件なの？」まで。\n3. **相手の困りごとを聞く**：こちらの売りたいものより、相手が何に困っているかが大事。\n\n具体的な質問を一緒に考えたいなら、いま取り組んでいる内容を教えて。',
      en: 'Three tips for interviewing someone.\n\n1. **Go in with a hypothesis.** Read the materials and form a guess first; your questions get sharper.\n2. **Ask for the number and the reason.** Not just "how much?" but "why that condition?"\n3. **Ask about their problems.** What worries them matters more than what you want to sell.\n\nTell me what you are working on and we can draft questions together.',
      ko: '상대에게 이야기를 들을 때의 요령 세 가지.\n\n1. **가설을 먼저 세우기**: 자료를 읽고 "아마 이렇겠지"를 만든 뒤 물어보면 질문이 날카로워져.\n2. **숫자와 이유를 함께 묻기**: "얼마?"뿐 아니라 "왜 그 조건이야?"까지.\n3. **상대의 고민을 묻기**: 우리가 팔고 싶은 것보다 상대가 무엇에 곤란한지가 중요해.',
    },
  },
  {
    match: /レポート|向いて|適性|好き|report|fit|like|skill|리포트|적성|좋아/i,
    answer: {
      ja: '最後のレポートでは「好き（LIKE）」と「向いている（SKILL FIT）」を分けて見るよ。\n\n好きだけど今はまだ得意じゃない仕事も、得意だけどあまり心が動かない仕事もあっていい。どちらが正解ということはないから、体験しながら「楽しかった瞬間」と「うまくできた瞬間」を両方メモしておくと、振り返りがぐっと深まるよ。',
      en: 'The final report looks at LIKE and SKILL FIT separately.\n\nIt is fine to love work you are not good at yet, or to be good at work that does not move you. Neither is the "right" answer. Jot down both the moments you enjoyed and the moments you did well; it makes the reflection much richer.',
      ko: '마지막 리포트에서는 "좋아함(LIKE)"과 "잘 맞음(SKILL FIT)"을 나눠서 봐.\n\n좋아하지만 아직 서툰 일도, 잘하지만 마음이 크게 움직이지 않는 일도 있을 수 있어. 즐거웠던 순간과 잘 해낸 순간을 둘 다 메모해 두면 돌아볼 때 훨씬 깊어져.',
    },
  },
  {
    match: /操作|動か|歩|使い方|どうやって|move|walk|how do i|control|조작|이동|사용법/i,
    answer: {
      ja: 'オフィスでは **WASD** か **矢印キー** で歩けるよ。光っている人や机に近づいて **E** キーで話しかけたり、仕事を始めたりできる。画面のクエスト表示が次に行く場所を教えてくれるから、迷ったらそれを目印にしてね。',
      en: 'In the office, walk with **WASD** or the **arrow keys**. Go up to a highlighted person or desk and press **E** to talk or start work. The quest tracker on screen shows where to go next.',
      ko: '오피스에서는 **WASD**나 **방향키**로 걸을 수 있어. 빛나는 사람이나 책상에 다가가서 **E** 키로 말을 걸거나 일을 시작할 수 있어. 화면의 퀘스트 표시가 다음 목적지를 알려 줘.',
    },
  },
];

const DEFAULT_ANSWER: Record<Locale, string> = {
  ja: 'いい質問だね。いまはオフライン版の先輩だから、くわしい相談にはまだ答えられないんだ。\n\n迷ったときは、\n\n1. 手元の資料をもう一度読んで、**分かっていること**と**分からないこと**を分ける\n2. 分からないことのうち、**判断に一番効くもの**から調べる・聞く\n3. 完璧じゃなくても、まず**自分の仮説**を書いてみる\n\nこの順番で進めると、だいたい前に進めるよ。',
  en: 'Good question. I am the offline senpai right now, so I cannot go into detail yet.\n\nWhen you are stuck:\n\n1. Reread the materials and separate **what you know** from **what you do not**.\n2. Of the unknowns, look into **the one that matters most** for the decision first.\n3. Write down **your own hypothesis**, even if it is not perfect.\n\nThat order usually gets you moving.',
  ko: '좋은 질문이야. 지금은 오프라인 선배라서 자세한 상담은 아직 어려워.\n\n막힐 때는\n\n1. 자료를 다시 읽고 **아는 것**과 **모르는 것**을 나누기\n2. 모르는 것 중 **판단에 가장 중요한 것**부터 알아보기\n3. 완벽하지 않아도 **내 가설**을 먼저 써 보기\n\n이 순서로 하면 대체로 앞으로 나아갈 수 있어.',
};

export class MockSenpaiService implements SenpaiService {
  readonly provider = 'mock' as const;

  async *stream(input: SenpaiInput): AsyncIterable<string> {
    const question = input.turns.at(-1)?.content ?? '';
    const topic = TOPICS.find((t) => t.match.test(question));
    const answer = (topic?.answer ?? DEFAULT_ANSWER)[input.locale];
    // Feed it out in small pieces so the window behaves as it does live.
    for (const piece of answer.match(/[\s\S]{1,12}/g) ?? []) {
      yield piece;
      await new Promise((resolve) => setTimeout(resolve, 15));
    }
  }
}
