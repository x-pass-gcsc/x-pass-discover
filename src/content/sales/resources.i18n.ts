import {
  BITE_PROTEIN_DRINK,
  BITE_SALES_GUARDRAILS,
  BITE_UNIT_ECONOMICS,
} from '@/content/company';
import type { ResourceText, Translations } from '@/content/localize';

/**
 * The Sales Data Room in other languages, by resource key. Figures are read
 * from the same constants as `resources.ts`. See `localize.ts`.
 */

const g = BITE_SALES_GUARDRAILS;
const e = BITE_UNIT_ECONOMICS;
const p = BITE_PROTEIN_DRINK.attributes;

export const SALES_RESOURCE_TRANSLATIONS: Translations<Record<string, ResourceText>> = {
  ja: {
    'sales-training-1pager': {
      fileDetail: 'ガイド・5分で読めます',
      title: '営業スターターガイド：プロの考え方',
      description: '役割の心構え、重要な概念、フレームワーク。シナリオを始める前に読んでください。',
      markdown: `## 役割の心構え

> **営業とは、製品を押し売りすることではありません。顧客のビジネスを理解し、双方に価値を生む取引を設計することです。**

こう考える前に：

> どうすれば自社の製品を売れるか？

こう問いかけます：

> **顧客は何を実現しようとしているのか？**

## 重要な概念

| 概念 | 意味 |
|---|---|
| 取引先仮説（Account Hypothesis） | 商談前に立てる、顧客の目標・課題・リスクについての暫定的な見立て |
| ビジネス目標（Business Goal） | 顧客が最終的に実現したい成果 |
| ニーズ（Need） | 顧客が課題を解決するために必要なもの |
| 制約（Constraint） | 予算、棚スペース、生産能力など、変えにくい条件 |
| 判断基準（Decision Criteria） | バイヤーが判断に使う要素 |
| 価値提案（Value Proposition） | 製品の機能が、この顧客にとってどんな価値になるか |
| ユニットエコノミクス（Unit Economics） | 1個あたりの売上・コスト・利益の構造 |
| ガードレール（Guardrail） | 越えてはいけない最低・最高の条件 |
| トレードオフ（Trade-off） | ある分野で譲る代わりに、別の分野で価値を得ること |
| パイロット（Pilot） | 拡大前の限定的なテスト |
| 成功基準（Success Criteria） | 拡大や継続を判断するための根拠のしきい値 |

## 大切な考え方

1. **売り込む前に理解する。**
2. **仮説は事実ではない。**
3. **口にされた要望 ≠ 本当のニーズ。**
4. **特徴 ≠ 価値。**
5. **価格だけで交渉しない。**
6. **成約した取引が、いつも良い取引とは限らない。**

## フレームワーク

**ディスカバリー**

\`\`\`
質問する → 聴く → 掘り下げる → 確認する → 適応する
\`\`\`

**価値の創出**

\`\`\`
特徴 → 顧客にとっての便益 → ビジネスへの影響 → 根拠
\`\`\`

**交渉**

\`\`\`
優先順位 → ガードレール → トレードオフ → 合意
\`\`\`

## 核となる一言

> **要望の裏にある「なぜ」を聞く。**

バイヤーに「価格が高すぎる」と言われたら、本当の問題が利益率なのか、売れ残りのリスクなのか、廃棄なのか、競合の価格なのか、社内承認なのかを探ってください。`,
    },

    'bite-company-profile': {
      fileDetail: 'PDF・4ページ',
      title: 'BITE 会社概要',
      description: 'BITE とはどんな会社か、流通営業チームはどう動いているか。',
      markdown: `**BITE** は、店舗、テイクアウト、デリバリー、デジタルチャネルを展開するカジュアルな F&B ブランドです。

**流通営業**チームは、BITE のパッケージ商品をコンビニ、スーパー、ドラッグストアなどの小売チャネルに販売します。全国チェーンでの採用は*カテゴリーバイヤー*が決めます。バイヤーが責任を負うのは、特定のサプライヤーではなく、棚のカテゴリー全体の売上と収益性です。

バイヤーの棚には限りがあります。新しい商品を加えるには、たいてい別の商品を外すことになります。それが本当の競争です。

### 流通営業チームが評価されること

- どんな価格でもよいのではなく、採算の取れる条件で採用を勝ち取ること
- 発売後の売れ行き。棚から外された商品は、失注した提案よりも高くつくため
- BITE 社内のガードレールに対する、1本あたりの貢献利益
- 取引先との長期的な関係`,
    },

    'bite-protein-drink-sheet': {
      fileDetail: 'PDF・2ページ',
      imageAlt: 'BITE Protein Drink のチョコレート、バニラビーン、ストロベリー、抹茶',
      title: 'BITE Protein Drink — 製品シート',
      description: '仕様、価格、強みと弱み。',
      markdown: `| 項目 | 内容 |
|---|---|
| 製品 | ${BITE_PROTEIN_DRINK.name} |
| 容量 | ${p.size} |
| たんぱく質 | ${p.protein} |
| カロリー | ${p.calories} |
| 保存方法 | 要冷蔵 |
| 賞味期限 | ${p.shelfLifeDays} 日 |
| フレーバー | ミルクコーヒー / ココア |
| 希望小売価格 | ¥${p.recommendedRetailPriceYen} |
| QuickMart 向け標準卸価格 | ¥${p.standardWholesalePriceYen} |
| 入数 | ${p.packSize} |
| 主なターゲット | 朝食を抜きがちな、忙しい20〜30代 |

### 強み

- たんぱく質 20 g
- 手軽な食事・朝食の代わりになる
- なめらかで飲みやすい味

### 弱み

- 冷蔵の棚スペースが必要
- 常温品より賞味期限が短い
- 小売価格が ¥300 に近い
- 日本でのブランド認知度が低い
- 初期の生産能力が限られている`,
    },

    'bite-unit-economics': {
      fileDetail: 'Excel・1シート',
      title: 'BITE Protein Drink — ユニットエコノミクス',
      description: '1本あたりのコスト構造と基本貢献利益。',
      columns: ['項目', '1本あたり'],
      rows: [
        ['希望小売価格', `¥${e.recommendedRetailPriceYen}`],
        ['標準卸価格', `¥${e.standardWholesalePriceYen}`],
        ['製造原価', `¥${e.manufacturingCostYen}`],
        ['冷蔵物流費', `¥${e.coldLogisticsYen}`],
        ['基本販促費', `¥${e.basePromotionYen}`],
        ['BITE の基本貢献利益', `¥${e.baseContributionYen}`],
      ],
      note: `基本貢献利益：${e.standardWholesalePriceYen} − ${e.manufacturingCostYen} − ${e.coldLogisticsYen} − ${e.basePromotionYen} = ${e.baseContributionYen}。追加で販促を提供すると、その分さらに貢献利益が減ります。決してタダではありません。`,
    },

    'bite-sales-guardrails': {
      fileDetail: '社内規程・1ページ',
      title: 'BITE 社内営業ガードレール',
      description:
        'BITE の社内規程です。バイヤーはこの下限を知りません。QuickMart 側の制約であるかのように提示しないでください。',
      markdown: `これは **BITE 社内の限度**です。QuickMart には伝えていません。

- 最低卸価格：**¥${g.minWholesalePriceYen}**
- 価格構造から得る1本あたりの最低貢献利益：**¥${g.minUnitContributionYen}**（決められた基本構造を超える追加販促の前）
- 追加の販促支援：**最大 ¥${g.maxExtraPromotionYen}/本**
- **全量返品保証はしない**
- 支払条件：最長 **${g.maxPaymentTermDays} 日**
- 最小生産ロット：**${g.minProductionRunUnits.toLocaleString()} 本**
- 損益分岐点を下回る取引は受けない

販促支援を加える場合は、その影響を明示的に計算してください。その分は貢献利益から出ていきます。`,
    },

    'quickmart-account-profile': {
      fileDetail: 'PDF・12ページ',
      imageAlt: '夕暮れの QuickMart の店舗',
      title: 'QuickMart — 取引先プロフィール',
      description: 'チェーンの概要、現在の課題、カテゴリーの方向性。',
      markdown: `QuickMart は日本のコンビニエンスストアチェーンです。

| 項目 | 内容 |
|---|---|
| 店舗数 | 全国に約 1,200 店 |
| 顧客の傾向 | 18〜29歳の来店が増えている |
| 現在の課題 | 朝 7:00〜10:00 の売上が伸び悩んでいる |
| カテゴリーの方向性 | 健康飲料を拡充したい |
| 物理的な制約 | 冷蔵の棚スペースが限られている |

### 公表されているビジネス目標

- 朝の飲料売上を **15%** 伸ばす
- 健康飲料カテゴリーを拡充する
- 新商品の廃棄率を **5% 以下**に抑える
- 20代のオフィスワーカーを取り込む
- 差別化された商品を導入する

### 分かっている判断基準

- 目標の小売価格は **¥300 以下**
- 小売利益率の目標：**35% 以上**
- 全店展開の前に、限定店舗でのパイロットを好む
- 売れ行きが悪ければ 4 週間で取り扱いを終了することがある
- 成功すれば、最大 **1,200 店**まで展開を広げられる`,
    },

    'quickmart-category-data': {
      fileDetail: 'Excel・3.2 MB',
      title: 'QuickMart — 公開カテゴリーデータ',
      description:
        '商談前に入手できるカテゴリーレベルの指標です。バイヤーはこれよりも具体的な数字を知っています。',
      columns: ['指標', '値'],
      rows: [
        ['18〜29歳の顧客構成比', '31%'],
        ['朝の売上構成比', '18%'],
        ['健康飲料カテゴリーの成長率', '前年比 +15%'],
        ['リピート購入率', '28%'],
        ['朝のプロテインドリンク平均販売数', '2.4 本/店/日'],
        ['冷蔵飲料の廃棄率', '4.2%'],
        ['顧客の支払意思額', '¥250〜300'],
      ],
      note: 'これはカテゴリーの平均値です。QuickMart の中でどう内訳が分かれるかはバイヤーが教えてくれます。ただし、正しいことについて質問した場合に限ります。',
    },

    'competitor-comparison': {
      fileDetail: 'Excel・1.1 MB',
      title: '競合比較',
      description: '同じ棚を争っているプロテインドリンク。',
      columns: ['製品', '容量 / たんぱく質', '小売価格', '卸価格', 'ポジショニング', '弱み'],
      rows: [
        ['FitDrink', '300 ml / 15 g', '¥278', '¥158', '低価格 / 認知度', 'たんぱく質が少ない'],
        ['BodyGo', '350 ml / 20 g', '¥328', '¥198', 'プレミアム', '高い'],
        ['Morning Plus', '250 ml / 10 g', '¥248', '¥145', '朝向け / 安定', '差別化が弱い'],
        ['BITE Protein Drink', '330 ml / 20 g', '¥298', '¥178', '食事代わり / 味', '認知度が低い'],
      ],
    },

    'pilot-structure-options': {
      fileDetail: 'メモ・1ページ',
      title: 'パイロット構成の選択肢（判断材料）',
      description: '3つの出発点です。どれも正解ではありません。自分で設計しても構いません。',
      markdown: `これは**判断材料であって、正解ではありません**。BITE のガードレールを守る限り、別の構成を設計しても構いません。

### A. 関西 — 120 店舗
- 集中している
- 運営を管理しやすい
- サンプルが小さい

### B. 全国 — 300 店舗
- より広い市場データが得られる
- 認知が早く広がる
- 生産と廃棄のリスクが大きく、運営も複雑になる

### C. オフィス街 — 80 店舗
- ターゲットとの相性が良い
- 朝・朝食の仮説が明確
- 結果を一般化しにくい`,
    },
  },
  ko: {
    'sales-training-1pager': {
      fileDetail: '가이드 · 5분 분량',
      title: '영업 스타터 가이드: 전문가의 사고방식',
      description: '역할에 맞는 마음가짐, 핵심 개념, 프레임워크. 시나리오를 시작하기 전에 읽으세요.',
      markdown: `## 역할에 맞는 마음가짐

> **영업은 제품을 밀어붙이는 일이 아닙니다. 고객의 비즈니스를 이해하고, 양쪽 모두에게 가치를 만드는 거래를 설계하는 일입니다.**

이렇게 생각하기 전에:

> 어떻게 하면 우리 제품을 팔 수 있을까?

이렇게 물으세요:

> **고객은 무엇을 이루려 하고 있는가?**

## 핵심 개념

| 개념 | 의미 |
|---|---|
| 거래처 가설(Account Hypothesis) | 미팅 전에 세우는, 고객의 목표·문제·리스크에 대한 잠정적인 판단 |
| 비즈니스 목표(Business Goal) | 고객이 궁극적으로 이루고 싶은 성과 |
| 니즈(Need) | 고객이 문제를 해결하는 데 필요한 것 |
| 제약(Constraint) | 예산, 진열 공간, 생산 능력 등 바꾸기 어려운 조건 |
| 판단 기준(Decision Criteria) | 바이어가 결정할 때 쓰는 요소 |
| 가치 제안(Value Proposition) | 제품의 기능이 이 고객에게 어떤 가치가 되는가 |
| 단위 경제성(Unit Economics) | 1개당 매출·비용·이익 구조 |
| 가드레일(Guardrail) | 넘어서는 안 되는 최저·최고 조건 |
| 트레이드오프(Trade-off) | 한 영역에서 양보하는 대신 다른 영역에서 가치를 얻는 것 |
| 파일럿(Pilot) | 확대하기 전의 제한된 테스트 |
| 성공 기준(Success Criteria) | 확대나 지속을 판단하는 근거의 기준선 |

## 중요한 원칙

1. **팔기 전에 이해한다.**
2. **가설은 사실이 아니다.**
3. **말로 나온 요청 ≠ 진짜 니즈.**
4. **특징 ≠ 가치.**
5. **가격만으로 협상하지 않는다.**
6. **성사된 거래가 늘 좋은 거래는 아니다.**

## 프레임워크

**디스커버리**

\`\`\`
질문한다 → 듣는다 → 파고든다 → 확인한다 → 맞춘다
\`\`\`

**가치 만들기**

\`\`\`
특징 → 고객에게 주는 이점 → 비즈니스 영향 → 근거
\`\`\`

**협상**

\`\`\`
우선순위 → 가드레일 → 트레이드오프 → 합의
\`\`\`

## 핵심 한마디

> **요청 뒤에 있는 "왜"를 물어라.**

바이어가 "가격이 너무 비싸다"고 하면, 진짜 문제가 이익률인지, 팔리지 않을 리스크인지, 폐기인지, 경쟁사 가격인지, 사내 승인인지를 알아보세요.`,
    },

    'bite-company-profile': {
      fileDetail: 'PDF · 4페이지',
      title: 'BITE 회사 개요',
      description: 'BITE는 어떤 회사이고, 유통 영업팀은 어떻게 일하는가.',
      markdown: `**BITE**는 매장, 테이크아웃, 배달, 디지털 채널을 운영하는 캐주얼 F&B 브랜드입니다.

**유통 영업**팀은 BITE의 패키지 상품을 편의점, 슈퍼마켓, 드러그스토어 같은 소매 채널에 판매합니다. 전국 체인의 입점은 *카테고리 바이어*가 결정합니다. 바이어가 책임지는 것은 특정 공급사가 아니라 진열대 카테고리 전체의 매출과 수익성입니다.

바이어의 진열대는 한정되어 있습니다. 새 상품을 들이려면 대개 다른 상품을 빼야 합니다. 그것이 진짜 경쟁입니다.

### 유통 영업팀이 평가받는 것

- 아무 가격이 아니라, 수익이 나는 조건으로 입점을 따내는 것
- 출시 후 판매 실적. 진열대에서 빠진 상품은 놓친 제안보다 비용이 크기 때문
- BITE 사내 가드레일 대비 1병당 공헌이익
- 거래처와의 장기적인 관계`,
    },

    'bite-protein-drink-sheet': {
      fileDetail: 'PDF · 2페이지',
      imageAlt: '초콜릿, 바닐라빈, 딸기, 말차 맛의 BITE Protein Drink',
      title: 'BITE Protein Drink — 제품 시트',
      description: '사양, 가격, 강점과 약점.',
      markdown: `| 항목 | 내용 |
|---|---|
| 제품 | ${BITE_PROTEIN_DRINK.name} |
| 용량 | ${p.size} |
| 단백질 | ${p.protein} |
| 칼로리 | ${p.calories} |
| 보관 방법 | 냉장 |
| 유통기한 | ${p.shelfLifeDays}일 |
| 맛 | 밀크커피 / 코코아 |
| 권장 소비자가 | ¥${p.recommendedRetailPriceYen} |
| QuickMart 대상 표준 도매가 | ¥${p.standardWholesalePriceYen} |
| 입수 | ${p.packSize} |
| 주요 타깃 | 아침을 거르기 쉬운 바쁜 20~30대 |

### 강점

- 단백질 20 g
- 간편한 식사·아침 대용
- 부드럽고 마시기 쉬운 맛

### 약점

- 냉장 진열 공간이 필요
- 상온 제품보다 유통기한이 짧음
- 소비자가가 ¥300에 가까움
- 일본 내 브랜드 인지도가 낮음
- 초기 생산 능력이 제한적`,
    },

    'bite-unit-economics': {
      fileDetail: 'Excel · 시트 1개',
      title: 'BITE Protein Drink — 단위 경제성',
      description: '1병당 비용 구조와 기본 공헌이익.',
      columns: ['항목', '1병당'],
      rows: [
        ['권장 소비자가', `¥${e.recommendedRetailPriceYen}`],
        ['표준 도매가', `¥${e.standardWholesalePriceYen}`],
        ['제조 원가', `¥${e.manufacturingCostYen}`],
        ['냉장 물류비', `¥${e.coldLogisticsYen}`],
        ['기본 판촉비', `¥${e.basePromotionYen}`],
        ['BITE 기본 공헌이익', `¥${e.baseContributionYen}`],
      ],
      note: `기본 공헌이익: ${e.standardWholesalePriceYen} − ${e.manufacturingCostYen} − ${e.coldLogisticsYen} − ${e.basePromotionYen} = ${e.baseContributionYen}. 판촉을 추가로 제공하면 그만큼 공헌이익이 더 줄어듭니다. 절대 공짜가 아닙니다.`,
    },

    'bite-sales-guardrails': {
      fileDetail: '사내 규정 · 1페이지',
      title: 'BITE 사내 영업 가드레일',
      description:
        'BITE의 사내 규정입니다. 바이어는 이 하한선을 모릅니다. QuickMart 쪽 제약인 것처럼 제시하지 마세요.',
      markdown: `이것은 **BITE 사내의 한도**입니다. QuickMart에는 알리지 않았습니다.

- 최저 도매가: **¥${g.minWholesalePriceYen}**
- 가격 구조에서 얻는 1병당 최저 공헌이익: **¥${g.minUnitContributionYen}** (정해진 기본 구조를 넘는 추가 판촉 전 기준)
- 추가 판촉 지원: **최대 ¥${g.maxExtraPromotionYen}/병**
- **전량 반품 보장은 하지 않음**
- 결제 조건: 최대 **${g.maxPaymentTermDays}일**
- 최소 생산 단위: **${g.minProductionRunUnits.toLocaleString()}병**
- 손익분기점 아래의 거래는 받지 않음

판촉 지원을 더할 때는 그 영향을 명시적으로 계산하세요. 그만큼 공헌이익에서 빠져나갑니다.`,
    },

    'quickmart-account-profile': {
      fileDetail: 'PDF · 12페이지',
      imageAlt: '해 질 녘의 QuickMart 매장',
      title: 'QuickMart — 거래처 프로필',
      description: '체인 개요, 현재 과제, 카테고리 방향.',
      markdown: `QuickMart는 일본의 편의점 체인입니다.

| 항목 | 내용 |
|---|---|
| 매장 수 | 전국 약 1,200개 |
| 고객 경향 | 18~29세 방문이 늘고 있음 |
| 현재 과제 | 아침 7:00~10:00 매출이 정체 |
| 카테고리 방향 | 건강 음료를 늘리고 싶음 |
| 물리적 제약 | 냉장 진열 공간이 한정적 |

### 공개된 비즈니스 목표

- 아침 음료 매출을 **15%** 늘린다
- 건강 음료 카테고리를 확대한다
- 신제품 폐기율을 **5% 이하**로 유지한다
- 20대 직장인을 끌어들인다
- 차별화된 상품을 들인다

### 알려진 판단 기준

- 목표 소비자가는 **¥300 이하**
- 소매 이익률 목표: **35% 이상**
- 전 매장 전개 전에 제한된 매장에서의 파일럿을 선호
- 판매가 부진하면 4주 만에 취급을 중단할 수 있음
- 성공하면 최대 **1,200개 매장**까지 확대 가능`,
    },

    'quickmart-category-data': {
      fileDetail: 'Excel · 3.2 MB',
      title: 'QuickMart — 공개 카테고리 데이터',
      description:
        '미팅 전에 구할 수 있는 카테고리 수준의 지표입니다. 바이어는 이보다 구체적인 숫자를 알고 있습니다.',
      columns: ['지표', '값'],
      rows: [
        ['18~29세 고객 비중', '31%'],
        ['아침 매출 비중', '18%'],
        ['건강 음료 카테고리 성장률', '전년 대비 +15%'],
        ['재구매율', '28%'],
        ['아침 프로틴 음료 평균 판매량', '2.4병/매장/일'],
        ['냉장 음료 폐기율', '4.2%'],
        ['고객의 지불 의사 금액', '¥250~300'],
      ],
      note: '이것은 카테고리 평균입니다. QuickMart 안에서 어떻게 나뉘는지는 바이어가 알려 줍니다. 단, 맞는 질문을 했을 때만입니다.',
    },

    'competitor-comparison': {
      fileDetail: 'Excel · 1.1 MB',
      title: '경쟁사 비교',
      description: '같은 진열대를 두고 경쟁하는 프로틴 음료.',
      columns: ['제품', '용량 / 단백질', '소비자가', '도매가', '포지셔닝', '약점'],
      rows: [
        ['FitDrink', '300 ml / 15 g', '¥278', '¥158', '저가 / 인지도', '단백질이 적음'],
        ['BodyGo', '350 ml / 20 g', '¥328', '¥198', '프리미엄', '비쌈'],
        ['Morning Plus', '250 ml / 10 g', '¥248', '¥145', '아침용 / 안정적', '차별화가 약함'],
        ['BITE Protein Drink', '330 ml / 20 g', '¥298', '¥178', '식사 대용 / 맛', '인지도가 낮음'],
      ],
    },

    'pilot-structure-options': {
      fileDetail: '메모 · 1페이지',
      title: '파일럿 구성 선택지(판단 자료)',
      description: '세 가지 출발점입니다. 어느 것도 정답이 아닙니다. 직접 설계해도 됩니다.',
      markdown: `이것은 **판단 자료이지 정답이 아닙니다**. BITE의 가드레일을 지키는 한, 다른 구성을 설계해도 됩니다.

### A. 간사이 — 120개 매장
- 집중되어 있음
- 운영 관리가 쉬움
- 표본이 작음

### B. 전국 — 300개 매장
- 더 넓은 시장 데이터를 얻을 수 있음
- 인지도가 빨리 퍼짐
- 생산·폐기 리스크가 크고 운영이 복잡해짐

### C. 오피스 상권 — 80개 매장
- 타깃과 잘 맞음
- 아침·조식 가설이 분명함
- 결과를 일반화하기 어려움`,
    },
  },
};
