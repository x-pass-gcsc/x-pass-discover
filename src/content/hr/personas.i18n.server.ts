import 'server-only';
import type { PersonaText } from '@/content/personas.server';
import type { Translations } from '@/content/localize';

/**
 * SERVER-ONLY: the client-facing parts of the HR personas in other languages.
 * Server-only because it carries the labels of facts the student has not
 * uncovered yet — a label is sent only once its fact is earned.
 *
 * Names are left as written, as for Sales. System prompts are not translated;
 * the personas already answer in the language the student writes in.
 */
export const HR_PERSONA_TRANSLATIONS: Translations<Record<string, PersonaText>> = {
  ja: {
    'bite-ta-manager': {
      role: '採用マネージャー（タレントアクイジション）',
      visibleContext:
        'BITE 人事チームでのあなたのマネージャーです。採用プロセスの基準を担っていて、BITE の方針を説明してくれますが、推薦をまとめるのはあなたです。',
      openingMessage:
        'ようこそ。Takuya Mori さんが、BITE Protein Drink を中国に展開するために上海で動ける人を探していて、その採用をあなたが担当します。BITE の方針やプロセスのことは私に聞いてください。仕事の中身そのものは、Takuya さんから聞き出す必要があります。',
      factLabels: {
        offer_approval_process: 'オファー承認のプロセス',
      },
    },
    'hiring-manager': {
      role: '国際事業部長',
      visibleContext:
        'Takuya Mori さんは東京で国際事業を率いていて、中国ポジションの責任者です。仕事に何が必要かは分かっていますが、書き出してはいません。職務記述書の草案は、彼のチームの最初の試みです。',
      openingMessage:
        '引き受けてくれてありがとう。正直に言うと、中国の計画はずっと頭の中だけで抱えていて、チームが作った職務記述書はまだ粗いんです。上海の現地で動ける人が必要です。うまく進めるために必要なことは何でも聞いてください。',
      factLabels: {
        hm_year_one_goal: '1年目の目標',
        hm_team_of_one: '一人きりのチーム',
        hm_previous_attempt: '2024年の挑戦が止まった理由',
        hm_language: '実際に必要な言語',
        hm_channel_priority: 'チャネルの優先順位',
      },
    },
    'candidate-lin': {
      role: '候補者 — Sunrise Nutrition 代理店営業責任者',
      visibleContext:
        'Lin Hao さんは、栄養食品ブランドで華東地域の代理店営業を率いています。8年間で4社に勤務。日本語は基礎レベルです。',
      openingMessage:
        'お招きいただきありがとうございます。キャリアのすべてを華東の冷蔵チャネルで過ごしてきたので、そこに参入しようとするブランドの課題はよく分かっています。何でも聞いてください。',
      factLabels: {
        lin_distributor_record: '自分で契約した代理店',
        lin_lost_distributor: '失敗と、そこから変えたこと',
        lin_job_changes: '4社に勤めた理由',
        lin_notice_period: '退職予告期間',
        lin_hq_reporting: '遠く離れた本社との仕事',
        lin_salary_expectation: '希望年収',
      },
    },
    'candidate-sato': {
      role: '候補者 — Kaiyo Trading（上海）アシスタントマネージャー',
      visibleContext:
        'Daiki Sato さんは日系商社の上海オフィスで働いています。BITE の COO の元同僚からの紹介で、COO と同じ大学の出身です。',
      openingMessage:
        'お会いできて光栄です。上海に来て7年、日本の食品ブランドと中国市場の橋渡しをしてきましたので、BITE の計画には本当にわくわくしています。',
      factLabels: {
        sato_role_scope: '代理店との取引を担っていたのは誰か',
        sato_hq_bridge: '日本の本社との仕事',
        sato_mandarin_depth: '交渉での中国語',
        sato_availability: '退職予告期間',
        sato_salary_expectation: '希望年収',
      },
    },
    'candidate-zhang': {
      role: '候補者 — 独立系 EC コンサルタント',
      visibleContext:
        'Zhang Wei さんは、日本のサプリメントブランドの中国向け越境 EC を率いたあと、キャリアの空白期間を経て、今はコンサルタントをしています。',
      openingMessage:
        'ありがとうございます。以前、日本のヘルスブランドを中国でオンライン展開したことがあるので、BITE がこれから何を経験するのかはよく分かっています。いくらでも詳しくお話しします。',
      factLabels: {
        zhang_crossborder_record: 'EC 展開の成果',
        zhang_offline_gap: 'オフライン流通の経験',
        zhang_career_break: 'キャリアの空白期間の中身',
        zhang_hq_reporting: '日本の本社との仕事',
        zhang_availability: '退職予告期間',
        zhang_salary_expectation: '希望年収',
      },
    },
    'bite-coo': {
      role: '最高執行責任者（COO）',
      visibleContext:
        'Hiroshi Kudo さんは上級職の採用を承認します。候補者の一人とは私的に会ったことがあり、中国での進展を示すよう迫られています。',
      openingMessage:
        '推薦書は読みました。順を追って説明してください。それから、Daiki Sato くんに公平なチャンスがあったのか、正直に教えてほしい。彼のことは知っていて、まさにうちに合う人物だと感じたんです。',
      factLabels: {
        coo_board_pressure: '彼がスピードを急ぐ理由',
        coo_referral_context: 'Sato さんをどの程度知っているか',
        coo_what_convinces: '何があれば納得するか',
        coo_notice_buyout: '退職予告期間の買い取り',
      },
    },
  },
  ko: {
    'bite-ta-manager': {
      role: '채용 매니저(탤런트 애퀴지션)',
      visibleContext:
        'BITE 인사팀에서 나의 매니저입니다. 채용 프로세스 기준을 맡고 있으며 BITE의 방침을 설명해 주지만, 추천안을 만드는 것은 나입니다.',
      openingMessage:
        '환영해요. Takuya Mori 씨가 BITE Protein Drink를 중국에 들여갈 사람을 상하이에서 찾고 있고, 그 채용을 당신이 맡게 됐어요. BITE의 방침과 프로세스는 저에게 물어보세요. 일 자체에 대해서는 Takuya 씨에게서 알아내야 해요.',
      factLabels: {
        offer_approval_process: '오퍼 승인 절차',
      },
    },
    'hiring-manager': {
      role: '국제사업부장',
      visibleContext:
        'Takuya Mori 씨는 도쿄에서 국제사업을 이끌며 중국 포지션을 책임지고 있습니다. 이 일에 무엇이 필요한지 알고 있지만 글로 정리하지는 않았습니다. 직무 기술서 초안은 그의 팀이 처음 만들어 본 것입니다.',
      openingMessage:
        '맡아 줘서 고마워요. 솔직히 말하면 중국 계획을 계속 머릿속에만 담아 두고 있었고, 팀이 만든 직무 기술서는 아직 거칠어요. 상하이 현지에서 움직일 사람이 필요해요. 제대로 하는 데 필요한 건 뭐든 물어봐요.',
      factLabels: {
        hm_year_one_goal: '1년 차 목표',
        hm_team_of_one: '혼자뿐인 팀',
        hm_previous_attempt: '2024년 시도가 멈춘 이유',
        hm_language: '실제로 필요한 언어',
        hm_channel_priority: '채널 우선순위',
      },
    },
    'candidate-lin': {
      role: '후보자 — Sunrise Nutrition 대리점 영업 책임자',
      visibleContext:
        'Lin Hao 씨는 영양식품 브랜드에서 화동 지역 대리점 영업을 이끌고 있습니다. 8년 동안 4개 회사에서 일했습니다. 일본어는 기초 수준입니다.',
      openingMessage:
        '불러 주셔서 감사합니다. 커리어 전부를 화동 냉장 채널에서 보냈기 때문에, 그 시장에 들어가려는 브랜드가 겪는 문제는 잘 알고 있습니다. 무엇이든 물어보세요.',
      factLabels: {
        lin_distributor_record: '직접 계약한 대리점',
        lin_lost_distributor: '실패와 그 뒤에 바꾼 것',
        lin_job_changes: '4개 회사를 거친 이유',
        lin_notice_period: '퇴사 통보 기간',
        lin_hq_reporting: '멀리 떨어진 본사와 일하기',
        lin_salary_expectation: '희망 연봉',
      },
    },
    'candidate-sato': {
      role: '후보자 — Kaiyo Trading(상하이) 어시스턴트 매니저',
      visibleContext:
        'Daiki Sato 씨는 일본계 종합상사의 상하이 사무소에서 일합니다. BITE COO의 전 동료가 추천했고, COO와 같은 대학 출신입니다.',
      openingMessage:
        '만나 뵙게 되어 영광입니다. 상하이에 온 지 7년째로, 일본 식품 브랜드와 중국 시장을 잇는 일을 해 왔기 때문에 BITE의 계획이 정말 기대됩니다.',
      factLabels: {
        sato_role_scope: '대리점 거래를 실제로 맡은 사람',
        sato_hq_bridge: '일본 본사와 일하기',
        sato_mandarin_depth: '협상에서의 중국어',
        sato_availability: '퇴사 통보 기간',
        sato_salary_expectation: '희망 연봉',
      },
    },
    'candidate-zhang': {
      role: '후보자 — 독립 이커머스 컨설턴트',
      visibleContext:
        'Zhang Wei 씨는 일본 건강보조식품 브랜드의 중국 대상 역직구 이커머스를 이끌었고, 커리어 공백기를 거쳐 지금은 컨설팅을 하고 있습니다.',
      openingMessage:
        '감사합니다. 예전에 일본 건강 브랜드를 중국에 온라인으로 출시한 적이 있어서, BITE가 앞으로 무엇을 겪게 될지 잘 알고 있습니다. 원하시는 만큼 자세히 말씀드릴게요.',
      factLabels: {
        zhang_crossborder_record: '이커머스 출시 성과',
        zhang_offline_gap: '오프라인 유통 경험',
        zhang_career_break: '커리어 공백기의 내용',
        zhang_hq_reporting: '일본 본사와 일하기',
        zhang_availability: '퇴사 통보 기간',
        zhang_salary_expectation: '희망 연봉',
      },
    },
    'bite-coo': {
      role: '최고운영책임자(COO)',
      visibleContext:
        'Hiroshi Kudo 씨는 고위직 채용을 최종 승인합니다. 후보자 중 한 명을 사적으로 만난 적이 있고, 중국에서 성과를 보여 줘야 한다는 압박을 받고 있습니다.',
      openingMessage:
        '추천서는 읽었어요. 차근차근 설명해 주세요. 그리고 Daiki Sato 군이 공정한 기회를 받았는지 솔직하게 말해 줬으면 해요. 그를 알고 있는데, 딱 우리 회사에 맞는 사람이라는 인상을 받았거든요.',
      factLabels: {
        coo_board_pressure: '그가 속도를 서두르는 이유',
        coo_referral_context: 'Sato 씨를 얼마나 아는가',
        coo_what_convinces: '무엇이 있으면 납득하는가',
        coo_notice_buyout: '퇴사 통보 기간 보상',
      },
    },
  },
};
