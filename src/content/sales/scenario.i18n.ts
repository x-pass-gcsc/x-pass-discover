import { BITE_UNIT_ECONOMICS } from '@/content/company';
import type { FieldText, ScenarioText, Translations } from '@/content/localize';

/**
 * The Sales scenario in other languages, addressed by the keys in
 * `scenario.ts`. Numbers are read from the same constants the English uses, so
 * a translation can never quote a different price. See `localize.ts`.
 */

const e = BITE_UNIT_ECONOMICS;

const DECISION_AFFECTED_OPTIONS_JA: Record<string, string> = {
  price: '価格',
  store_count: '店舗数',
  test_region: 'テスト地域',
  quantity: '数量',
  promotion: '販促',
  shelf_placement: '棚の配置',
  reorder_rule: '追加発注のルール',
  risk_sharing: 'リスク分担',
  other: 'その他',
};

const PRODUCT_REFERENCE_JA = {
  alt: 'BITE Protein Drink のチョコレート、バニラビーン、ストロベリー、抹茶',
  title: 'BITE Protein Drink',
  caption: '330 ml・たんぱく質 20 g・要冷蔵・賞味期限 30 日',
  facts: [
    { label: '希望小売価格', value: `¥${e.recommendedRetailPriceYen}` },
    { label: '標準卸価格', value: `¥${e.standardWholesalePriceYen}` },
    { label: '基本貢献利益', value: `¥${e.baseContributionYen}/本` },
  ],
};

const ACCOUNT_REFERENCE_JA = {
  alt: '夕暮れの QuickMart の店舗',
  title: 'QuickMart',
  caption: '日本のコンビニエンスストアチェーン・約 1,200 店舗',
  facts: [
    { label: '18〜29歳の構成比', value: '31%' },
    { label: '朝の売上構成比', value: '18%' },
    { label: '冷蔵品の廃棄率', value: '4.2%' },
  ],
};

const PROPOSAL_FIELDS_JA: Record<string, FieldText> = {
  test_region: {
    label: 'テスト地域',
    placeholder: '例：関西、全国、東京のオフィス街',
    helpText:
      'データルームのパイロット案は判断材料です。自分で独自の構成を設計しても構いません。',
  },
  store_count: {
    label: '店舗数',
    helpText: 'QuickMart の店舗数は全体で約 1,200 店です。',
  },
  initial_quantity: {
    label: '初回数量（本）',
    helpText: 'BITE の最小生産ロットは 2,400 本です。',
  },
  wholesale_price_yen: {
    label: '卸価格（円 / 本）',
    helpText: 'QuickMart 向けの標準卸価格は ¥178 です。',
  },
  retail_price_yen: {
    label: '小売価格（円 / 本）',
    helpText: '希望小売価格は ¥298 です。',
  },
  extra_promotion_yen: {
    label: '追加の販促支援（円 / 本）',
    helpText:
      'コスト構造にすでに含まれる基本販促費 ¥12 への上乗せです。タダではありません。BITE の貢献利益が減ります。',
  },
  target_customer: { label: 'ターゲット顧客' },
  shelf_or_placement_strategy: { label: '棚・配置の戦略' },
  promotion_plan: { label: '販促計画' },
  bite_support: {
    label: 'BITE の支援',
    helpText: '商品を納める以外に、うまくいくよう BITE が何をするか。',
  },
  sales_target_units_per_store_per_day: { label: '販売目標（本 / 店 / 日）' },
  reorder_or_expansion_rule: {
    label: '追加発注・拡大のルール',
    helpText: 'どの数値がどうなったら、このパイロットを継続・拡大しますか？',
  },
  expected_volume: {
    label: '想定販売数量',
    helpText: '算出方法も示してください：店舗数 × 本 / 店 / 日 × 日数。',
  },
  quickmart_economics_summary: {
    label: 'QuickMart にとっての採算',
    helpText: 'この取引が QuickMart にとってどれだけの価値になるか（利益率と利益額）。',
  },
  bite_contribution_summary: { label: 'BITE の貢献利益' },
  customer_value_summary: {
    label: '顧客価値のまとめ',
    helpText: '特徴 → 顧客にとっての便益 → ビジネスへの影響 → 根拠。',
  },
  key_risk: { label: '主なリスク' },
  risk_mitigation: { label: 'リスクへの対策' },
};

const DECISION_AFFECTED_OPTIONS_KO: Record<string, string> = {
  price: '가격',
  store_count: '매장 수',
  test_region: '테스트 지역',
  quantity: '수량',
  promotion: '판촉',
  shelf_placement: '진열 위치',
  reorder_rule: '추가 발주 규칙',
  risk_sharing: '리스크 분담',
  other: '기타',
};

const PRODUCT_REFERENCE_KO = {
  alt: '초콜릿, 바닐라빈, 딸기, 말차 맛의 BITE Protein Drink',
  title: 'BITE Protein Drink',
  caption: '330 ml · 단백질 20 g · 냉장 보관 · 유통기한 30일',
  facts: [
    { label: '권장 소비자가', value: `¥${e.recommendedRetailPriceYen}` },
    { label: '표준 도매가', value: `¥${e.standardWholesalePriceYen}` },
    { label: '기본 공헌이익', value: `¥${e.baseContributionYen}/병` },
  ],
};

const ACCOUNT_REFERENCE_KO = {
  alt: '해 질 녘의 QuickMart 매장',
  title: 'QuickMart',
  caption: '일본의 편의점 체인 · 약 1,200개 매장',
  facts: [
    { label: '18~29세 고객 비중', value: '31%' },
    { label: '아침 매출 비중', value: '18%' },
    { label: '냉장 상품 폐기율', value: '4.2%' },
  ],
};

const PROPOSAL_FIELDS_KO: Record<string, FieldText> = {
  test_region: {
    label: '테스트 지역',
    placeholder: '예: 간사이, 전국, 도쿄 오피스 상권',
    helpText:
      '데이터 룸의 파일럿 옵션은 참고 자료입니다. 자신만의 구성을 직접 설계해도 됩니다.',
  },
  store_count: {
    label: '매장 수',
    helpText: 'QuickMart의 전체 매장 수는 약 1,200개입니다.',
  },
  initial_quantity: {
    label: '초기 수량(병)',
    helpText: 'BITE의 최소 생산 단위는 2,400병입니다.',
  },
  wholesale_price_yen: {
    label: '도매가(엔/병)',
    helpText: 'QuickMart 대상 표준 도매가는 ¥178입니다.',
  },
  retail_price_yen: {
    label: '소비자가(엔/병)',
    helpText: '권장 소비자가는 ¥298입니다.',
  },
  extra_promotion_yen: {
    label: '추가 판촉 지원(엔/병)',
    helpText:
      '원가 구조에 이미 들어 있는 기본 판촉비 ¥12에 더해지는 금액입니다. 공짜가 아니며, BITE의 공헌이익이 줄어듭니다.',
  },
  target_customer: { label: '타깃 고객' },
  shelf_or_placement_strategy: { label: '진열·배치 전략' },
  promotion_plan: { label: '판촉 계획' },
  bite_support: {
    label: 'BITE의 지원',
    helpText: '상품을 납품하는 것 외에, 이 거래가 잘되도록 BITE가 무엇을 하는가.',
  },
  sales_target_units_per_store_per_day: { label: '판매 목표(병/매장/일)' },
  reorder_or_expansion_rule: {
    label: '추가 발주·확대 규칙',
    helpText: '어떤 수치가 어떻게 되면 이 파일럿을 계속하거나 확대하나요?',
  },
  expected_volume: {
    label: '예상 판매량',
    helpText: '계산 방법도 보여 주세요: 매장 수 × 병/매장/일 × 일수.',
  },
  quickmart_economics_summary: {
    label: 'QuickMart의 수익성',
    helpText: '이 거래가 QuickMart에 어느 정도의 가치가 있는지(이익률과 이익 금액).',
  },
  bite_contribution_summary: { label: 'BITE의 공헌이익' },
  customer_value_summary: {
    label: '고객 가치 요약',
    helpText: '특징 → 고객에게 주는 이점 → 비즈니스 영향 → 근거.',
  },
  key_risk: { label: '주요 리스크' },
  risk_mitigation: { label: '리스크 대응' },
};

export const SALES_SCENARIO_TRANSLATIONS: Translations<ScenarioText> = {
  ja: {
    title: 'BITE Protein Drink × QuickMart',
    studentRole: '流通営業 ジュニア担当',
    mission: 'BITE Protein Drink を、採算の取れる条件で QuickMart に採用してもらう。',
    finalOutputTitle: 'QuickMart 最終営業提案書',
    steps: {
      'sales-training': {
        title: '営業トレーニング',
        summary: '仕事を始める前に、営業のプロの考え方を学びます。',
        instructions:
          '「営業スターターガイド」を読んでから、トレーニングを完了にしてください。任意のセルフチェックはあなた自身のためのもので、スキルの根拠として使われることはありません。',
        tasks: {
          'training-review': {
            title: '営業スターターガイドを読む',
            instructions:
              '下のパネルで「営業スターターガイド」を開いてください。読み終えたら、トレーニングを完了にします。',
          },
          'training-self-check': {
            title: '任意のセルフチェック',
            instructions:
              '採点はされず、SKILL FIT の根拠にも使われません。自分の理解を確かめるためだけのものです。',
            fields: {
              q_hypothesis: {
                label: '仮説とは…',
                options: {
                  a: 'バイヤーに示せる事実',
                  b: 'まだ検証が必要な暫定的な見立て',
                  c: 'ビジネス目標と同じもの',
                },
              },
              q_request: {
                label: 'バイヤーに「価格が高すぎる」と言われました。最初にすべきことは…',
                options: {
                  a: '価格を下げる',
                  b: 'その反論の裏に実際に何があるのかを探る',
                  c: '商談を打ち切る',
                },
              },
              q_deal: {
                label: '成約した取引は…',
                options: {
                  a: 'いつでも良い結果である',
                  b: '双方にとって採算が合う場合にだけ良い結果である',
                },
              },
            },
          },
        },
      },

      onboarding: {
        title: 'オンボーディング — BITE と製品を理解する',
        summary: 'マネージャーに会い、自分が何を売るのかを知ります。',
        instructions:
          'BITE、製品シート、QuickMart の概要を確認してください。そのうえで、BITE Protein Drink の営業上の強みを3つ挙げます。それぞれの根拠と、なぜこの取引先にとって重要かもしれないかを添えてください。',
        media: PRODUCT_REFERENCE_JA,
        tasks: {
          'product-strengths': {
            title: '3つの営業上の強み',
            instructions:
              '強みは、このバイヤーにとって何かをもたらして初めて強みになります。「たんぱく質 20 g」は特徴です。それが QuickMart にとって何の価値になるかが強みです。',
            fields: {
              strengths: {
                label: '営業上の強み',
                fields: {
                  strength: { label: '強み' },
                  evidence: {
                    label: '根拠',
                    helpText: 'これはどこから来た情報ですか？資料名か数値を挙げてください。',
                  },
                  why_it_may_matter_to_quickmart: {
                    label: 'QuickMart にとって重要かもしれない理由',
                  },
                },
              },
            },
          },
        },
      },

      'account-research': {
        title: '取引先リサーチ',
        summary: 'QuickMart について、商談前の取引先仮説を立てます。',
        instructions:
          'データルームで作業します。根拠を示せることと推測していることを分けてください。商談はその推測を確かめるためにあります。',
        media: ACCOUNT_REFERENCE_JA,
        tasks: {
          'account-analysis-memo': {
            title: '取引先分析メモ',
            instructions:
              '仮説は事実ではありません。「仮説」と表示された項目はあなたの解釈で、商談で確かめることになります。',
            fields: {
              business_goals: {
                label: 'ビジネス目標（3つ）',
                helpText: 'QuickMart が最終的に実現したいことは何ですか？',
                fields: {
                  goal: { label: '目標' },
                  evidence: { label: '根拠' },
                },
              },
              likely_problems: {
                label: '想定される課題（3つ）',
                helpText: 'その目標を妨げているものは何ですか？',
                fields: {
                  problem_hypothesis: { label: '課題の仮説' },
                  evidence: { label: '根拠' },
                  why_it_matters: { label: 'なぜ重要か' },
                },
              },
              top_account_hypothesis: { label: '最も重要な取引先仮説（任意）' },
              what_must_be_validated_in_meeting: { label: '商談で確かめるべきこと（任意）' },
            },
          },
        },
      },

      'meeting-prep': {
        title: 'バイヤー商談の準備',
        summary: '提案を実際に変えうる質問を書きます。',
        instructions:
          'Yuki Tanaka さんへの質問を5つ用意してください。それぞれについて、目的と、答えによってどの判断が変わるかを書きます。どの判断も変えない答えしか返ってこない質問は、ただの雑談です。',
        tasks: {
          'buyer-questions': {
            title: 'バイヤーへの5つの質問',
            fields: {
              questions: {
                label: '質問',
                fields: {
                  question: { label: '質問' },
                  purpose: { label: '目的' },
                  decision_affected: {
                    label: '影響する判断',
                    options: DECISION_AFFECTED_OPTIONS_JA,
                  },
                },
              },
            },
          },
        },
      },

      'buyer-meeting': {
        title: 'AI バイヤー商談',
        summary: 'QuickMart の飲料カテゴリーバイヤー、Yuki Tanaka さんに会います。',
        instructions:
          'Yuki さんは知っていることを自分から全部は話しません。具体的な数字は、その数字が表すことについて質問したときに出てきます。用意した質問は会話の横に表示されますが、相手が実際に言ったことに沿って進めてください。',
        media: ACCOUNT_REFERENCE_JA,
        tasks: {
          'buyer-meeting-conversation': { title: 'Yuki Tanaka さんとの商談' },
        },
      },

      'needs-analysis': {
        title: 'ニーズ分析',
        summary: '会話の内容を、構造化された顧客診断にまとめます。',
        instructions:
          'QuickMart が望むこと → それを妨げるもの → 必要なもの → 判断を制約するもの → 恐れているリスク。口にされた要望が、そのまま本当のニーズとは限りません。',
        tasks: {
          'needs-analysis': {
            title: '顧客診断',
            fields: {
              goal: { label: '目標 — QuickMart が望むこと' },
              problem: { label: '課題 — それを妨げるもの' },
              need: { label: 'ニーズ — それを解決するために必要なもの' },
              constraint: { label: '制約 — 変えにくいこと' },
              risk: { label: 'リスク — うまくいかないと恐れていること' },
              top_need_1: { label: '最重要ニーズ #1' },
              top_need_2: { label: '最重要ニーズ #2（任意）' },
              evidence_summary: {
                label: '根拠のまとめ',
                helpText: 'この診断を裏づける、実際に聞いたこと・読んだことは何ですか？',
              },
              evidence_refs: {
                label: '根拠をひもづける',
                helpText: 'この診断のもとになったデータルームの資料とバイヤーの発言を選んでください。',
              },
            },
          },
        },
      },

      'proposal-v1': {
        title: '初回営業提案',
        summary: '採算の取れるパイロット提案を設計します。',
        instructions:
          '計算ツールは採算を示すだけで、判断はしません。ガードレールの警告はあくまで警告です。提案を決めるのはあなたです。',
        media: PRODUCT_REFERENCE_JA,
        tasks: {
          'proposal-v1': {
            title: '提案 v1',
            fields: PROPOSAL_FIELDS_JA,
          },
        },
      },

      'unexpected-event': {
        title: '想定外の出来事',
        summary: '新しい情報が届きました。何を変え、何を維持するかを決めます。',
        instructions:
          '価格は多くの変数のひとつにすぎません。何を変えて何を維持するかを意図して決め、どちらについても理由を説明できるようにしてください。',
        eventPayload: {
          headline: 'QuickMart：競合の価格と展開リスクについて',
          from: 'Yuki Tanaka — QuickMart 飲料カテゴリーバイヤー',
          body: 'ご提案をいただいてから、状況が2点変わりました。\n\nまず、FitDrink から御社より ¥20 安い卸価格の再提示がありました。次に、社内では、認知度の低いブランドをいきなり全国展開することに不安の声が出ています。当社が負うリスクとしては大きすぎると感じています。\n\n先に進む前に、どう対応されるおつもりかを伺いたいと思います。',
          facts: [
            { label: '競合', value: 'FitDrink' },
            { label: '競合との卸価格差', value: 'BITE より ¥20 安い' },
            { label: '示された懸念', value: '認知度の低いブランドの全国展開はリスクが大きすぎる' },
          ],
        },
        tasks: {
          'event-acknowledge': { title: 'メッセージを読む' },
          'proposal-v2-revision': {
            title: '見直しの判断',
            instructions:
              '提案 v1 はそのまま保存され、このフォームの横に表示されます。ここでの入力で上書きされることはありません。',
            fields: {
              conditions_to_change: { label: '変える条件' },
              conditions_to_keep: { label: '維持する条件' },
              why_change: { label: '変える理由' },
              why_keep: { label: '維持する理由' },
              response_to_competitor: {
                label: '競合への対応',
                helpText: '価格を合わせるのは選択肢のひとつにすぎません。必須ではありません。',
              },
              how_to_reduce_quickmart_risk: { label: 'QuickMart のリスクをどう減らすか' },
              proposal_v2_summary: { label: '提案 v2 のまとめ' },
            },
          },
        },
      },

      negotiation: {
        title: '最終交渉',
        summary: 'Yuki Tanaka さんと最終的な条件パッケージを交渉します。',
        instructions:
          'すべてが交渉の対象です。価格、数量、店舗数、販促、サンプリング、データ共有、返品条件、追加発注の条件、支払条件。実際に合意したパッケージを記録してください。BITE がガードレールと照らし合わせて確認します。',
        media: PRODUCT_REFERENCE_JA,
        tasks: {
          'negotiation-conversation': { title: 'Yuki Tanaka さんとの交渉' },
          'final-agreed-package': {
            title: '最終合意パッケージ',
            instructions:
              'Yuki さんと実際にたどり着いた条件を記録してください。文章ではなく構造化されたデータで、BITE がレビューするのはここです。',
            fields: {
              wholesale_price_yen: { label: '卸価格（円 / 本）' },
              retail_price_yen: { label: '小売価格（円 / 本）' },
              extra_promotion_yen: { label: '追加の販促支援（円 / 本）' },
              test_region: { label: 'テスト地域' },
              store_count: { label: '店舗数' },
              initial_quantity: { label: '初回数量（本）' },
              promotion_terms: { label: '販促条件' },
              sampling: { label: 'サンプリング' },
              data_sharing: { label: 'データ共有' },
              return_terms: {
                label: '売れ残り・返品の条件',
                helpText: 'BITE は全量返品保証を提供できません。',
              },
              reorder_conditions: { label: '追加発注・拡大の条件' },
              payment_terms_days: {
                label: '支払条件（日）',
                helpText: 'BITE が受け入れられるのは最長 45 日です。',
              },
              agreement_status: {
                label: '交渉の着地点',
                options: {
                  agreed: '基本合意',
                  agreed_with_open_points: '未決事項ありで合意',
                  not_agreed: '合意に至らず — 提案を見直す',
                },
              },
            },
          },
        },
      },

      'final-submission': {
        title: '最終提出',
        summary: 'QuickMart 最終営業提案書を提出します。',
        instructions:
          '各セクションには、これまでのあなたの作業があらかじめ入っています。表現は自由に直してください。提出すると、変更できないスナップショットとして保存されます。',
        tasks: {
          'final-proposal': {
            title: 'QuickMart 最終営業提案書',
            fields: {
              quickmart_needs: {
                label: '1. QuickMart のニーズ',
                prefillTemplate:
                  '目標：{{needs-analysis.goal}}\n課題：{{needs-analysis.problem}}\nニーズ：{{needs-analysis.need}}\n最重要ニーズ：{{needs-analysis.top_need_1}}',
              },
              bite_value_proposition: { label: '2. BITE の価値提案' },
              pilot_structure: {
                label: '3. パイロット / テストの構成',
                prefillTemplate:
                  '地域：{{final-agreed-package.test_region}}\n店舗数：{{final-agreed-package.store_count}}\n追加発注・拡大：{{final-agreed-package.reorder_conditions}}',
              },
              price_and_quantity: {
                label: '4. 卸価格 / 小売価格 / 数量',
                prefillTemplate:
                  '卸価格：¥{{final-agreed-package.wholesale_price_yen}}\n小売価格：¥{{final-agreed-package.retail_price_yen}}\n初回数量：{{final-agreed-package.initial_quantity}} 本',
              },
              expected_sales_and_economics: {
                label: '5. 想定売上と採算',
                prefillTemplate:
                  '{{proposal-v1.expected_volume}}\n\nQuickMart：{{proposal-v1.quickmart_economics_summary}}\nBITE：{{proposal-v1.bite_contribution_summary}}',
              },
              promotion_and_support: {
                label: '6. 販促と BITE の支援',
                prefillTemplate:
                  '{{final-agreed-package.promotion_terms}}\n\nBITE の支援：{{proposal-v1.bite_support}}',
              },
              final_negotiated_conditions: {
                label: '7. 最終的な交渉条件',
                prefillTemplate:
                  '返品：{{final-agreed-package.return_terms}}\n支払条件：{{final-agreed-package.payment_terms_days}} 日\nデータ共有：{{final-agreed-package.data_sharing}}\nサンプリング：{{final-agreed-package.sampling}}',
              },
              competitive_differentiation: { label: '8. 競合との差別化' },
              key_risks_and_response: {
                label: '9. 主なリスクと対応',
                prefillTemplate:
                  '主なリスク：{{proposal-v1.key_risk}}\n対策：{{proposal-v1.risk_mitigation}}\nQuickMart のリスク低減：{{proposal-v2-revision.how_to_reduce_quickmart_risk}}',
              },
              next_action: { label: '10. 次のアクション' },
            },
          },
        },
      },
    },
  },
  ko: {
    title: 'BITE Protein Drink × QuickMart',
    studentRole: '유통 영업 주니어 담당',
    mission: 'BITE Protein Drink를 수익성 있는 조건으로 QuickMart에 입점시킨다.',
    finalOutputTitle: 'QuickMart 최종 영업 제안서',
    steps: {
      'sales-training': {
        title: '영업 트레이닝',
        summary: '일을 시작하기 전에 영업 전문가의 사고방식을 배웁니다.',
        instructions:
          '「영업 스타터 가이드」를 읽은 뒤 트레이닝을 완료로 표시하세요. 선택형 셀프 체크는 나 자신을 위한 것이며, 역량의 근거로 쓰이지 않습니다.',
        tasks: {
          'training-review': {
            title: '영업 스타터 가이드 읽기',
            instructions:
              '아래 패널에서 「영업 스타터 가이드」를 여세요. 다 읽었으면 트레이닝을 완료로 표시합니다.',
          },
          'training-self-check': {
            title: '선택형 셀프 체크',
            instructions:
              '채점되지 않으며 SKILL FIT의 근거로도 쓰이지 않습니다. 내 이해를 확인하기 위한 것입니다.',
            fields: {
              q_hypothesis: {
                label: '가설이란…',
                options: {
                  a: '바이어에게 제시할 수 있는 사실',
                  b: '아직 검증이 필요한 잠정적인 판단',
                  c: '비즈니스 목표와 같은 것',
                },
              },
              q_request: {
                label: '바이어가 "가격이 너무 비싸다"고 했습니다. 가장 먼저 할 일은…',
                options: {
                  a: '가격을 내린다',
                  b: '그 반론 뒤에 실제로 무엇이 있는지 알아본다',
                  c: '미팅을 끝낸다',
                },
              },
              q_deal: {
                label: '성사된 거래는…',
                options: {
                  a: '언제나 좋은 결과다',
                  b: '양쪽 모두에게 수익이 날 때만 좋은 결과다',
                },
              },
            },
          },
        },
      },

      onboarding: {
        title: '온보딩 — BITE와 제품 이해하기',
        summary: '매니저를 만나고, 내가 무엇을 팔게 되는지 알아봅니다.',
        instructions:
          'BITE, 제품 시트, QuickMart 개요를 확인하세요. 그런 다음 BITE Protein Drink의 영업상 강점 3가지를 적습니다. 각각의 근거와, 이 거래처에 왜 중요할 수 있는지를 함께 적어 주세요.',
        media: PRODUCT_REFERENCE_KO,
        tasks: {
          'product-strengths': {
            title: '영업상 강점 3가지',
            instructions:
              '강점은 이 바이어에게 무언가를 가져다줄 때 비로소 강점이 됩니다. "단백질 20 g"은 특징입니다. 그것이 QuickMart에 어떤 가치가 되는지가 강점입니다.',
            fields: {
              strengths: {
                label: '영업상 강점',
                fields: {
                  strength: { label: '강점' },
                  evidence: {
                    label: '근거',
                    helpText: '이 정보는 어디에서 왔나요? 자료 이름이나 수치를 적어 주세요.',
                  },
                  why_it_may_matter_to_quickmart: {
                    label: 'QuickMart에 중요할 수 있는 이유',
                  },
                },
              },
            },
          },
        },
      },

      'account-research': {
        title: '거래처 리서치',
        summary: 'QuickMart에 대해 미팅 전 거래처 가설을 세웁니다.',
        instructions:
          '데이터 룸에서 작업합니다. 근거를 댈 수 있는 것과 추측하는 것을 구분하세요. 미팅은 그 추측을 확인하기 위한 자리입니다.',
        media: ACCOUNT_REFERENCE_KO,
        tasks: {
          'account-analysis-memo': {
            title: '거래처 분석 메모',
            instructions:
              '가설은 사실이 아닙니다. "가설"이라고 표시된 항목은 나의 해석이며, 미팅에서 확인하게 됩니다.',
            fields: {
              business_goals: {
                label: '비즈니스 목표(3개)',
                helpText: 'QuickMart가 궁극적으로 이루려는 것은 무엇인가요?',
                fields: {
                  goal: { label: '목표' },
                  evidence: { label: '근거' },
                },
              },
              likely_problems: {
                label: '예상되는 문제(3개)',
                helpText: '그 목표를 가로막는 것은 무엇인가요?',
                fields: {
                  problem_hypothesis: { label: '문제 가설' },
                  evidence: { label: '근거' },
                  why_it_matters: { label: '왜 중요한가' },
                },
              },
              top_account_hypothesis: { label: '가장 중요한 거래처 가설(선택)' },
              what_must_be_validated_in_meeting: { label: '미팅에서 확인해야 할 것(선택)' },
            },
          },
        },
      },

      'meeting-prep': {
        title: '바이어 미팅 준비',
        summary: '제안을 실제로 바꿀 수 있는 질문을 씁니다.',
        instructions:
          'Yuki Tanaka 씨에게 할 질문 5개를 준비하세요. 질문마다 목적과, 답에 따라 어떤 결정이 바뀌는지를 적습니다. 어떤 결정도 바꾸지 않는 답만 돌아오는 질문은 그냥 잡담입니다.',
        tasks: {
          'buyer-questions': {
            title: '바이어에게 할 질문 5개',
            fields: {
              questions: {
                label: '질문',
                fields: {
                  question: { label: '질문' },
                  purpose: { label: '목적' },
                  decision_affected: {
                    label: '영향을 받는 결정',
                    options: DECISION_AFFECTED_OPTIONS_KO,
                  },
                },
              },
            },
          },
        },
      },

      'buyer-meeting': {
        title: 'AI 바이어 미팅',
        summary: 'QuickMart 음료 카테고리 바이어 Yuki Tanaka 씨를 만납니다.',
        instructions:
          'Yuki 씨는 아는 것을 먼저 다 말해 주지 않습니다. 구체적인 숫자는 그 숫자가 나타내는 내용을 물어볼 때 나옵니다. 준비한 질문은 대화 옆에 표시되지만, 상대가 실제로 한 말을 따라 진행하세요.',
        media: ACCOUNT_REFERENCE_KO,
        tasks: {
          'buyer-meeting-conversation': { title: 'Yuki Tanaka 씨와의 미팅' },
        },
      },

      'needs-analysis': {
        title: '니즈 분석',
        summary: '대화 내용을 구조화된 고객 진단으로 정리합니다.',
        instructions:
          'QuickMart가 원하는 것 → 그것을 가로막는 것 → 필요한 것 → 판단을 제약하는 것 → 두려워하는 리스크. 말로 나온 요청이 곧 진짜 니즈인 것은 아닙니다.',
        tasks: {
          'needs-analysis': {
            title: '고객 진단',
            fields: {
              goal: { label: '목표 — QuickMart가 원하는 것' },
              problem: { label: '문제 — 그것을 가로막는 것' },
              need: { label: '니즈 — 그것을 해결하는 데 필요한 것' },
              constraint: { label: '제약 — 바꾸기 어려운 것' },
              risk: { label: '리스크 — 잘 안 될까 봐 걱정하는 것' },
              top_need_1: { label: '가장 중요한 니즈 #1' },
              top_need_2: { label: '가장 중요한 니즈 #2(선택)' },
              evidence_summary: {
                label: '근거 요약',
                helpText: '이 진단을 뒷받침하는, 실제로 듣거나 읽은 것은 무엇인가요?',
              },
              evidence_refs: {
                label: '근거 연결하기',
                helpText: '이 진단의 바탕이 된 데이터 룸 자료와 바이어의 발언을 고르세요.',
              },
            },
          },
        },
      },

      'proposal-v1': {
        title: '첫 영업 제안',
        summary: '수익성 있는 파일럿 제안을 설계합니다.',
        instructions:
          '계산 도구는 수익성을 보여 줄 뿐 판단하지 않습니다. 가드레일 경고는 어디까지나 경고입니다. 제안을 결정하는 것은 나입니다.',
        media: PRODUCT_REFERENCE_KO,
        tasks: {
          'proposal-v1': {
            title: '제안 v1',
            fields: PROPOSAL_FIELDS_KO,
          },
        },
      },

      'unexpected-event': {
        title: '예상치 못한 상황',
        summary: '새로운 정보가 들어왔습니다. 무엇을 바꾸고 무엇을 유지할지 정합니다.',
        instructions:
          '가격은 여러 변수 중 하나일 뿐입니다. 무엇을 바꾸고 무엇을 유지할지 의도를 갖고 정하고, 양쪽 모두에 대해 이유를 설명할 수 있어야 합니다.',
        eventPayload: {
          headline: 'QuickMart: 경쟁사 가격과 전개 리스크에 대하여',
          from: 'Yuki Tanaka — QuickMart 음료 카테고리 바이어',
          body: '제안을 받은 뒤로 상황이 두 가지 바뀌었습니다.\n\n먼저, FitDrink가 귀사보다 ¥20 낮은 도매가를 다시 제시했습니다. 다음으로, 사내에서 인지도가 낮은 브랜드를 곧바로 전국에 전개하는 것에 대한 우려가 나오고 있습니다. 저희가 떠안기에는 리스크가 너무 크다고 느낍니다.\n\n진행하기 전에 어떻게 대응하실 생각인지 듣고 싶습니다.',
          facts: [
            { label: '경쟁사', value: 'FitDrink' },
            { label: '경쟁사와의 도매가 차이', value: 'BITE보다 ¥20 낮음' },
            { label: '제기된 우려', value: '인지도가 낮은 브랜드의 전국 전개는 리스크가 너무 크다' },
          ],
        },
        tasks: {
          'event-acknowledge': { title: '메시지 읽기' },
          'proposal-v2-revision': {
            title: '수정 판단',
            instructions:
              '제안 v1은 그대로 보존되어 이 양식 옆에 표시됩니다. 여기서 입력해도 덮어쓰이지 않습니다.',
            fields: {
              conditions_to_change: { label: '바꿀 조건' },
              conditions_to_keep: { label: '유지할 조건' },
              why_change: { label: '바꾸는 이유' },
              why_keep: { label: '유지하는 이유' },
              response_to_competitor: {
                label: '경쟁사 대응',
                helpText: '가격을 맞추는 것은 선택지 중 하나일 뿐, 필수가 아닙니다.',
              },
              how_to_reduce_quickmart_risk: { label: 'QuickMart의 리스크를 어떻게 줄일까' },
              proposal_v2_summary: { label: '제안 v2 요약' },
            },
          },
        },
      },

      negotiation: {
        title: '최종 협상',
        summary: 'Yuki Tanaka 씨와 최종 조건 패키지를 협상합니다.',
        instructions:
          '모든 것이 협상 대상입니다. 가격, 수량, 매장 수, 판촉, 샘플링, 데이터 공유, 반품 조건, 추가 발주 조건, 결제 조건. 실제로 합의한 패키지를 기록하세요. BITE가 가드레일에 비추어 검토합니다.',
        media: PRODUCT_REFERENCE_KO,
        tasks: {
          'negotiation-conversation': { title: 'Yuki Tanaka 씨와의 협상' },
          'final-agreed-package': {
            title: '최종 합의 패키지',
            instructions:
              'Yuki 씨와 실제로 도달한 조건을 기록하세요. 글이 아니라 구조화된 데이터이며, BITE가 검토하는 것은 여기입니다.',
            fields: {
              wholesale_price_yen: { label: '도매가(엔/병)' },
              retail_price_yen: { label: '소비자가(엔/병)' },
              extra_promotion_yen: { label: '추가 판촉 지원(엔/병)' },
              test_region: { label: '테스트 지역' },
              store_count: { label: '매장 수' },
              initial_quantity: { label: '초기 수량(병)' },
              promotion_terms: { label: '판촉 조건' },
              sampling: { label: '샘플링' },
              data_sharing: { label: '데이터 공유' },
              return_terms: {
                label: '미판매·반품 조건',
                helpText: 'BITE는 전량 반품 보장을 제공할 수 없습니다.',
              },
              reorder_conditions: { label: '추가 발주·확대 조건' },
              payment_terms_days: {
                label: '결제 조건(일)',
                helpText: 'BITE가 받아들일 수 있는 것은 최대 45일입니다.',
              },
              agreement_status: {
                label: '협상 결과',
                options: {
                  agreed: '기본 합의',
                  agreed_with_open_points: '미결 사항이 있는 합의',
                  not_agreed: '합의하지 못함 — 제안을 다시 검토',
                },
              },
            },
          },
        },
      },

      'final-submission': {
        title: '최종 제출',
        summary: 'QuickMart 최종 영업 제안서를 제출합니다.',
        instructions:
          '각 섹션에는 지금까지의 작업이 미리 채워져 있습니다. 표현은 자유롭게 고치세요. 제출하면 바꿀 수 없는 스냅숏으로 저장됩니다.',
        tasks: {
          'final-proposal': {
            title: 'QuickMart 최종 영업 제안서',
            fields: {
              quickmart_needs: {
                label: '1. QuickMart의 니즈',
                prefillTemplate:
                  '목표: {{needs-analysis.goal}}\n문제: {{needs-analysis.problem}}\n니즈: {{needs-analysis.need}}\n가장 중요한 니즈: {{needs-analysis.top_need_1}}',
              },
              bite_value_proposition: { label: '2. BITE의 가치 제안' },
              pilot_structure: {
                label: '3. 파일럿 / 테스트 구성',
                prefillTemplate:
                  '지역: {{final-agreed-package.test_region}}\n매장 수: {{final-agreed-package.store_count}}\n추가 발주·확대: {{final-agreed-package.reorder_conditions}}',
              },
              price_and_quantity: {
                label: '4. 도매가 / 소비자가 / 수량',
                prefillTemplate:
                  '도매가: ¥{{final-agreed-package.wholesale_price_yen}}\n소비자가: ¥{{final-agreed-package.retail_price_yen}}\n초기 수량: {{final-agreed-package.initial_quantity}}병',
              },
              expected_sales_and_economics: {
                label: '5. 예상 매출과 수익성',
                prefillTemplate:
                  '{{proposal-v1.expected_volume}}\n\nQuickMart: {{proposal-v1.quickmart_economics_summary}}\nBITE: {{proposal-v1.bite_contribution_summary}}',
              },
              promotion_and_support: {
                label: '6. 판촉과 BITE의 지원',
                prefillTemplate:
                  '{{final-agreed-package.promotion_terms}}\n\nBITE의 지원: {{proposal-v1.bite_support}}',
              },
              final_negotiated_conditions: {
                label: '7. 최종 협상 조건',
                prefillTemplate:
                  '반품: {{final-agreed-package.return_terms}}\n결제 조건: {{final-agreed-package.payment_terms_days}}일\n데이터 공유: {{final-agreed-package.data_sharing}}\n샘플링: {{final-agreed-package.sampling}}',
              },
              competitive_differentiation: { label: '8. 경쟁사와의 차별화' },
              key_risks_and_response: {
                label: '9. 주요 리스크와 대응',
                prefillTemplate:
                  '주요 리스크: {{proposal-v1.key_risk}}\n대응: {{proposal-v1.risk_mitigation}}\nQuickMart 리스크 감소: {{proposal-v2-revision.how_to_reduce_quickmart_risk}}',
              },
              next_action: { label: '10. 다음 액션' },
            },
          },
        },
      },
    },
  },
};
