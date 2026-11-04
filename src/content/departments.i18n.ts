import type { DepartmentText, Translations } from './localize';

/** The five departments in other languages, by slug. See `localize.ts`. */
export const DEPARTMENT_TRANSLATIONS: Translations<Record<string, DepartmentText>> = {
  ja: {
    marketing: {
      name: 'マーケティング',
      tagline: 'どう売り出すか？',
      description:
        'Spicy Crispy Chicken Bites の発売を計画します。誰に向けた商品か、どう届けるか、成功をどう測るかを決めます。',
      projectTitle: 'Spicy Crispy Chicken Bites 発売',
      coreQuestion: 'どう売り出すか？',
      finalOutput: 'マーケティング引き継ぎメモ',
    },
    sales: {
      name: '営業',
      tagline: 'どう取引を勝ち取るか？',
      description:
        'BITE Protein Drink を、採算の取れる条件で QuickMart に採用してもらいます。取引先を調べ、バイヤーに会い、取引条件を設計し、交渉します。',
      projectTitle: 'BITE Protein Drink × QuickMart',
      coreQuestion: 'どう取引を勝ち取るか？',
      finalOutput: 'QuickMart 営業提案書',
    },
    'product-management': {
      name: 'プロダクトマネジメント',
      tagline: '何をつくるべきか？',
      description:
        '製品ではなく顧客の課題から出発し、BITE が春の季節メニューに何を載せるべきかを決めます。',
      projectTitle: '春の季節メニュー企画',
      coreQuestion: '何をつくるべきか？',
      finalOutput: '商品企画 意思決定ブリーフ',
    },
    strategy: {
      name: '経営戦略',
      tagline: 'BITE はどこで成長すべきか？',
      description:
        '担当製品のない全社レベルの成長プロジェクトです。2027年までに成長するため、BITE がどこに投資すべきかを決めます。',
      projectTitle: 'BITE 2027 成長戦略',
      coreQuestion: 'BITE はどこで成長すべきか？',
      finalOutput: '戦略意思決定レポート',
    },
    'human-resources': {
      name: '人事',
      tagline: '誰を採用すべきか？',
      description:
        'BITE Protein Drink の中国展開に向けて不足している能力を見極め、職務に即した基準を定め、候補者を面接し、採用すべき人を推薦します。',
      projectTitle: 'BITE Protein Drink × 中国展開の人材採用',
      coreQuestion: '誰を採用すべきか？',
      finalOutput: '最終採用推薦',
    },
  },
  ko: {
    marketing: {
      name: '마케팅',
      tagline: '어떻게 알릴 것인가?',
      description:
        'Spicy Crispy Chicken Bites의 출시를 기획합니다. 누구를 위한 상품인지, 어떻게 고객에게 닿게 할지, 성공을 어떻게 측정할지 정합니다.',
      projectTitle: 'Spicy Crispy Chicken Bites 출시',
      coreQuestion: '어떻게 알릴 것인가?',
      finalOutput: '마케팅 인수인계 메모',
    },
    sales: {
      name: '영업',
      tagline: '어떻게 거래를 따낼 것인가?',
      description:
        'BITE Protein Drink를 수익성 있는 조건으로 QuickMart에 입점시킵니다. 거래처를 조사하고, 바이어를 만나고, 거래 조건을 설계하고, 협상합니다.',
      projectTitle: 'BITE Protein Drink × QuickMart',
      coreQuestion: '어떻게 거래를 따낼 것인가?',
      finalOutput: 'QuickMart 영업 제안서',
    },
    'product-management': {
      name: '프로덕트 매니지먼트',
      tagline: '무엇을 만들어야 하는가?',
      description:
        '제품이 아니라 고객의 문제에서 출발해, BITE가 봄 시즌 메뉴에 무엇을 올려야 할지 결정합니다.',
      projectTitle: '봄 시즌 메뉴 기획',
      coreQuestion: '무엇을 만들어야 하는가?',
      finalOutput: '상품 기획 의사결정 브리프',
    },
    strategy: {
      name: '경영 전략',
      tagline: 'BITE는 어디에서 성장해야 하는가?',
      description:
        '담당 제품이 없는 전사 차원의 성장 프로젝트입니다. 2027년까지 성장하기 위해 BITE가 어디에 투자해야 할지 결정합니다.',
      projectTitle: 'BITE 2027 성장 전략',
      coreQuestion: 'BITE는 어디에서 성장해야 하는가?',
      finalOutput: '전략 의사결정 보고서',
    },
    'human-resources': {
      name: '인사',
      tagline: '누구를 채용해야 하는가?',
      description:
        'BITE Protein Drink의 중국 진출에 부족한 역량을 파악하고, 직무에 맞는 기준을 정하고, 후보자를 면접해 채용할 사람을 추천합니다.',
      projectTitle: 'BITE Protein Drink × 중국 진출 인재 채용',
      coreQuestion: '누구를 채용해야 하는가?',
      finalOutput: '최종 채용 추천',
    },
  },
};
