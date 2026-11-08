import { BITE_HR_OFFER_POLICY } from '@/content/company';
import type { ScenarioText, StepText, Translations } from '@/content/localize';

/**
 * The HR scenario in other languages, addressed by the keys in `scenario.ts`.
 * Figures are read from the same offer policy the English uses, so a
 * translation can never quote a different band. Names stay as written. See
 * `localize.ts`.
 */

const o = BITE_HR_OFFER_POLICY;
const yen = (n: number) => `¥${n.toLocaleString()}`;
const band = `${yen(o.bandMinYen)} – ${yen(o.bandMaxYen)}`;

// ---------------------------------------------------------------- Japanese

const ROLE_REFERENCE_JA: StepText['media'] = {
  alt: '仕事中の BITE 人事チーム',
  title: '中国事業開発マネージャー',
  caption: '上海 · 東京の国際事業部長の直属',
  facts: [
    { label: '製品', value: 'BITE Protein Drink' },
    { label: '市場', value: '上海を起点とする華東地域' },
    { label: '給与レンジ', value: band },
  ],
};

const CANDIDATES_JA = { lin: 'Lin Hao', sato: 'Daiki Sato', zhang: 'Zhang Wei' };

const SCENARIO_JA: ScenarioText = {
  title: 'BITE Protein Drink × 中国展開の人材採用',
  studentRole: 'ジュニア採用担当（タレントアクイジション）',
  mission: 'BITE Protein Drink を中国に展開するために、誰を採用すべきかを、職務に関連する根拠に基づき、オファー方針の範囲内で推薦する。',
  finalOutputTitle: '最終採用推薦',
  steps: {
    'hr-training': {
      title: '人事トレーニング',
      summary: '仕事を始める前に、採用担当の考え方を学びます。',
      instructions:
        '「人事スターターガイド」を読んでから、トレーニングを完了にしてください。任意のセルフチェックはあなた自身のためのもので、スキルの根拠として使われることはありません。',
      tasks: {
        'hr-training-review': {
          title: '人事スターターガイドを読む',
          instructions:
            '下のパネルで「人事スターターガイド」を開いてください。読み終えたら、トレーニングを完了にします。',
        },
        'hr-training-self-check': {
          title: '任意のセルフチェック',
          instructions:
            '採点はされず、SKILL FIT の根拠にも使われません。自分の理解を確かめるためだけのものです。',
          fields: {
            q_criterion: {
              label: '良い選考基準とは…',
              options: {
                a: '採用マネージャーが人に求める好み',
                b: '仕事そのものまでたどれるもの',
                c: '一番優秀な候補者が持っているもの',
              },
            },
            q_resume: {
              label: '履歴書に「代理店との関係を管理」とあります。次にすべきことは…',
              options: {
                a: '代理店経験を「強い」と評価する',
                b: 'その関係の中で本人が実際に何をしたかを聞く',
                c: '無視する — 履歴書は誇張するものだから',
              },
            },
            q_ne: {
              label: '面接である基準を一度も確かめませんでした。評価は…',
              options: {
                a: '無難に真ん中の点数にする',
                b: 'NE — 根拠不足',
                c: '低い点数にする',
              },
            },
          },
        },
      },
    },

    onboarding: {
      title: 'オンボーディング — 中国展開を理解する',
      summary: '中国での発売に必要で、BITE がまだできないことを見つけます。',
      instructions:
        '展開ブリーフと能力の棚卸しを読んでください。そのうえで、能力ギャップを3つ以上診断します。発売に何が必要か、今の BITE に何があるか、そのギャップがなぜ重要かを書きます。ギャップはビジネスの課題であり、採用はそれを埋める方法のひとつにすぎません。',
      media: ROLE_REFERENCE_JA,
      tasks: {
        'capability-gaps': {
          title: '能力ギャップの診断',
          instructions:
            '資料に書いてあることと、あなたが推測していることを分けてください。インテーク面談は、その推測を確かめるためにあります。',
          fields: {
            gaps: {
              label: '能力ギャップ',
              fields: {
                capability: { label: '発売に必要な能力' },
                current_state: {
                  label: '今の BITE にあるもの',
                  helpText: 'どの資料で読んだかを書いてください。',
                },
                why_it_matters: { label: 'そのギャップが重要な理由' },
              },
            },
            gap_to_fill_by_hiring: { label: 'この採用でまず埋めるべきギャップは？（任意）' },
          },
        },
      },
    },

    'intake-prep': {
      title: 'インテーク面談の準備',
      summary: '選考基準を実際に変えうる質問を書きます。',
      instructions:
        '採用マネージャーの Takuya Mori さんへの質問を5つ用意してください。それぞれについて、目的と、答えによってどの採用判断が変わるかを書きます。何も変えられない答えしか返ってこない質問は、ただの雑談です。',
      tasks: {
        'intake-questions': {
          title: 'インテーク面談の5つの質問',
          fields: {
            questions: {
              label: '質問',
              fields: {
                question: { label: '質問' },
                purpose: { label: '目的' },
                decision_affected: {
                  label: '影響する判断',
                  options: {
                    must_have: '必須の基準',
                    nice_to_have: 'あると望ましい基準',
                    language: '語学の要件',
                    seniority: '職位 / 給与レンジ',
                    start_date: '入社日',
                    interview_questions: '面接の質問',
                    other: 'その他',
                  },
                },
              },
            },
          },
        },
      },
    },

    'hiring-intake': {
      title: '採用マネージャーとのインテーク面談',
      summary: 'この仕事に本当に必要なことを Takuya Mori さんから聞き出します。',
      instructions:
        'Takuya さんは必要なことを分かっていますが、書き出してはいません。また、彼が望むことのすべてが職務に関連しているわけではありません。具体的なことは、それが表すことについて質問したときに出てきます。用意した質問は会話の横に表示されますが、相手が実際に言ったことに沿って進めてください。',
      media: ROLE_REFERENCE_JA,
      tasks: {
        'intake-conversation': { title: 'Takuya Mori さんとのインテーク面談' },
      },
    },

    'job-criteria': {
      title: '職務に関連する選考基準',
      summary: 'インテーク面談の内容を、面接で確かめられる基準にします。',
      instructions:
        'どの基準も仕事までたどれなければなりません。何が必須で何があると望ましいか、それぞれをどう確かめるかを決めてください。そのうえで職務記述書の草案を直します。何を削るか、その理由も書いてください。',
      tasks: {
        'selection-criteria': {
          title: '選考基準',
          fields: {
            criteria: {
              label: '基準',
              fields: {
                criterion: { label: '基準' },
                priority: {
                  label: '優先度',
                  options: { must_have: '必須', nice_to_have: 'あると望ましい' },
                },
                why_job_related: {
                  label: '職務に関連する理由',
                  helpText: 'インテーク面談や資料の何が、これを仕事の一部にしていますか？',
                },
                how_to_test: { label: '面接でどう確かめるか' },
              },
            },
            jd_requirements_removed: { label: '職務記述書の草案から削る・書き直す要件と、その理由' },
            evidence_refs: {
              label: '根拠をひもづける',
              helpText: 'これらの基準のもとになったデータルームの資料とインテーク面談での発言を選んでください。',
            },
          },
        },
      },
    },

    'candidate-interviews': {
      title: '候補者面接',
      summary: 'Lin Hao さん、Daiki Sato さん、Zhang Wei さんを面接します。',
      instructions:
        '3回の別々の面接です。答えを比べられるよう、基準から作った同じ中心的な質問を全員にしてください。履歴書の一行は主張にすぎません。各候補者が本人として何をしたかを聞いてください。面接はそれぞれ独立しており、ある候補者の発言を他の候補者は知りません。',
      tasks: {
        'interview-lin': { title: '面接 — Lin Hao さん' },
        'interview-sato': { title: '面接 — Daiki Sato さん' },
        'interview-zhang': { title: '面接 — Zhang Wei さん' },
      },
    },

    scorecards: {
      title: '面接スコアカード',
      summary: '全候補者を同じ基準で、根拠とともに評価します。',
      instructions:
        '候補者 × 基準ごとに1行です。どの評価にも、実際に聞いた根拠が必要です。面接で確かめなかった項目は、NE が正直な評価です。3人全員の面接が終わってから開くので、ほかの候補者の話を聞く前に誰かを採点することはありません。',
      tasks: {
        'candidate-scorecards': {
          title: 'スコアカード',
          fields: {
            ratings: {
              label: '評価',
              helpText: '3人それぞれについて、少なくとも2つの基準を評価してください。',
              fields: {
                candidate: { label: '候補者', options: CANDIDATES_JA },
                criterion: { label: '基準' },
                rating: {
                  label: '評価',
                  options: {
                    '1': '1 — 否定的な根拠',
                    '2': '2 — 根拠が混在',
                    '3': '3 — ある程度の肯定的な根拠',
                    '4': '4 — 強い肯定的な根拠',
                    NE: 'NE — 根拠不足',
                  },
                },
                evidence: {
                  label: '根拠',
                  helpText: '候補者は実際に何と言いましたか？ NE の場合は、確かめられなかったことを書いてください。',
                },
              },
            },
            impressions_set_aside: {
              label: '気づいて脇に置いた印象（任意）',
              helpText: '誰かを好き・嫌いと感じるのは、あなた自身についての情報です。評価に混ざらないよう、ここに書き出してください。',
            },
            evidence_refs: { label: '根拠をひもづける' },
          },
        },
      },
    },

    'recommendation-v1': {
      title: '採用推薦',
      summary: '候補者とオファーを推薦します。',
      instructions:
        '推薦はスコアカードから導くもので、その逆ではありません。オファー方針の警告はあくまで警告です。推薦を決めるのはあなたです。',
      media: ROLE_REFERENCE_JA,
      tasks: {
        'recommendation-v1': {
          title: '推薦 v1',
          fields: {
            recommended_candidate: { label: '推薦する候補者', options: CANDIDATES_JA },
            runner_up: {
              label: '次点',
              options: { ...CANDIDATES_JA, none: 'なし — 採用活動をやり直す' },
            },
            rationale: { label: '基準に結びつけた理由' },
            gaps_in_recommended: {
              label: '推薦する候補者に足りないところ',
              helpText: '完璧に合う人はいません。BITE は何を支える必要がありますか？',
            },
            proposed_base_salary_yen: {
              label: '提示する年間基本給（円）',
              helpText: `レンジは ${band} です。${yen(o.bandMidYen)} を超える場合は書面での理由が必要です。`,
            },
            sign_on_bonus_yen: {
              label: '入社一時金（円）',
              helpText: `任意で、最大 ${yen(o.signOnCapYen)} です。タダではありません。何のためかを書いてください。`,
            },
            offer_justification: {
              label: 'オファーの理由（職務関連）',
              helpText: '中間値を超える場合は方針上必須です。この候補者は、仕事に必要な何をもたらしますか？',
            },
            target_start: { label: '入社予定日', placeholder: '例：オファーから6週間以内' },
            key_risk: { label: '主なリスク' },
            onboarding_plan: { label: '最初の90日 / リスクへの対策' },
          },
        },
        'recommendation-coaching': {
          title: 'Aya さんと話してみる（任意）',
          instructions: 'マネージャーは方針を説明してくれますが、代わりに選んではくれません。',
        },
      },
    },

    'executive-pressure': {
      title: '想定外の出来事',
      summary: 'COO からメッセージが届きました。何を変え、何を維持するかを決めます。',
      instructions:
        'このメッセージには2つの異なることが含まれています。ひとつは、仕事に必要なことの本当の変更です。もうひとつはそうではありません。何を変えて何を維持するかを意図して決め、どちらについても理由を説明できるようにしてください。',
      eventPayload: {
        headline: 'COO：入社日と、候補者の希望について',
        from: 'Hiroshi Kudo — BITE 最高執行責任者（COO）',
        body: '先に進む前に2点あります。\n\nまず、上海の展示会の日程が確定しました。中国の責任者には、オファーから2か月以内に着任してもらう必要があります。ここは譲れません。\n\n次に、先週 Daiki Sato くんと食事をしました。いい人物で、私と同じ大学の出身、日本語も完璧、まさにうちに合うタイプです。正直、なぜスコアカードでこんなに時間をかけているのか分かりません。彼にオファーを出しましょう。',
        facts: [
          { label: '新しい要件', value: 'オファーから2か月以内に入社' },
          { label: '経営層の希望', value: 'Daiki Sato — 個人的な知り合い' },
          { label: '依頼', value: '評価を省いて Sato さんにオファーを出す' },
        ],
      },
      tasks: {
        'pressure-acknowledge': { title: 'メッセージを読む' },
        'recommendation-v2-revision': {
          title: '見直しの判断',
          instructions:
            '推薦 v1 はそのまま保存され、このフォームの横に表示されます。ここでの入力で上書きされることはありません。',
          fields: {
            legitimate_change: { label: 'メッセージのうち、職務に関連する本当の変更' },
            not_job_related: { label: 'メッセージのうち、職務に関連しないこと' },
            conditions_to_change: { label: '推薦で変えること' },
            conditions_to_keep: { label: '維持すること' },
            why_change: { label: '変える理由' },
            why_keep: { label: '維持する理由' },
            start_date_plan: {
              label: '2か月以内の入社をどう実現するか',
              helpText: '候補者が間に合わない場合、どんな選択肢がありますか？',
            },
            reply_to_coo: {
              label: 'COO への返信',
              helpText: '敬意を持って、短く、根拠に基づいて。根拠が一致するなら、彼に同意しても構いません。',
            },
            recommendation_v2_summary: { label: '推薦 v2 のまとめ' },
          },
        },
        'pressure-coaching': { title: 'Aya さんと話してみる（任意）' },
      },
    },

    'executive-review': {
      title: '経営層の承認',
      summary: 'Hiroshi Kudo さんに推薦を説明し、守り抜きます。',
      instructions:
        '彼は押してきます。彼を動かすのは根拠であって、粘り強さではありません。実際にたどり着いた判断を記録してください。BITE がオファーを方針と照らし合わせて確認します。',
      media: ROLE_REFERENCE_JA,
      tasks: {
        'coo-conversation': { title: 'Hiroshi Kudo さんとの承認面談' },
        'final-decision-record': {
          title: '判断の記録',
          instructions:
            'あなたと COO が実際にたどり着いた結論を記録してください。文章ではなく構造化されたデータで、人事チームが保管するのはここです。',
          fields: {
            final_candidate: {
              label: 'オファーを出す候補者',
              options: { ...CANDIDATES_JA, none: 'オファーなし — 採用活動をやり直す' },
            },
            proposed_base_salary_yen: { label: '年間基本給（円）' },
            sign_on_bonus_yen: { label: '入社一時金（円）' },
            offer_justification: { label: 'オファーの理由（職務関連）' },
            target_start: { label: '入社予定日' },
            conditions: {
              label: '判断に付けた条件',
              helpText: '退職予告期間の買い取り、オンボーディングの支援、見直しの時期など、合意したこと。',
            },
            decision_status: {
              label: '承認の着地点',
              options: {
                signed_off: '推薦どおり承認',
                signed_off_with_changes: '変更つきで承認',
                not_signed_off: '承認されず — 推薦を見直す',
              },
            },
          },
        },
      },
    },

    'final-submission': {
      title: '最終提出',
      summary: '最終採用推薦を提出します。',
      instructions:
        '各セクションには、これまでのあなたの作業があらかじめ入っています。表現は自由に直してください。提出すると、変更できないスナップショットとして保存されます。',
      tasks: {
        'final-hiring-recommendation': {
          title: '最終採用推薦',
          fields: {
            capability_gap: {
              label: '1. 能力ギャップ',
              prefillTemplate:
                '{{capability-gaps.gaps[].capability}}\n\nまず埋めるもの：{{capability-gaps.gap_to_fill_by_hiring}}',
            },
            selection_criteria: {
              label: '2. 職務に関連する選考基準',
              prefillTemplate: '{{selection-criteria.criteria[].criterion}}',
            },
            candidate_evaluation: {
              label: '3. 候補者の評価',
              prefillTemplate: '{{candidate-scorecards.ratings[].evidence}}',
            },
            recommendation: {
              label: '4. 推薦と理由',
              prefillTemplate:
                '候補者：{{final-decision-record.final_candidate}}\n\n{{recommendation-v1.rationale}}',
            },
            fallback: {
              label: '5. 次点 / 代替案',
              prefillTemplate: '次点：{{recommendation-v1.runner_up}}',
            },
            offer: {
              label: '6. オファー',
              prefillTemplate:
                '基本給：¥{{final-decision-record.proposed_base_salary_yen}}\n入社一時金：¥{{final-decision-record.sign_on_bonus_yen}}\n入社：{{final-decision-record.target_start}}\n条件：{{final-decision-record.conditions}}',
            },
            risks_and_onboarding: {
              label: '7. リスクと最初の90日',
              prefillTemplate:
                '足りないところ：{{recommendation-v1.gaps_in_recommended}}\n主なリスク：{{recommendation-v1.key_risk}}\n計画：{{recommendation-v1.onboarding_plan}}\n入社日：{{recommendation-v2-revision.start_date_plan}}',
            },
            pressure_handling: {
              label: '8. 経営層の依頼への対応',
              prefillTemplate:
                '変えたこと：{{recommendation-v2-revision.conditions_to_change}}\n維持したこと：{{recommendation-v2-revision.conditions_to_keep}}\n返信：{{recommendation-v2-revision.reply_to_coo}}',
            },
            next_action: { label: '9. 次のアクション' },
          },
        },
      },
    },
  },
};

// ------------------------------------------------------------------ Korean

const ROLE_REFERENCE_KO: StepText['media'] = {
  alt: '일하고 있는 BITE 인사팀',
  title: '중국 사업개발 매니저',
  caption: '상하이 · 도쿄 국제사업부장 직속',
  facts: [
    { label: '제품', value: 'BITE Protein Drink' },
    { label: '시장', value: '상하이를 시작으로 한 화동 지역' },
    { label: '연봉 범위', value: band },
  ],
};

const CANDIDATES_KO = { lin: 'Lin Hao', sato: 'Daiki Sato', zhang: 'Zhang Wei' };

const SCENARIO_KO: ScenarioText = {
  title: 'BITE Protein Drink × 중국 진출 인재 채용',
  studentRole: '주니어 채용 담당(탤런트 애퀴지션)',
  mission: 'BITE Protein Drink를 중국에 진출시키기 위해 누구를 채용해야 할지, 직무 관련 근거에 기반해 오퍼 방침 안에서 추천한다.',
  finalOutputTitle: '최종 채용 추천',
  steps: {
    'hr-training': {
      title: '인사 트레이닝',
      summary: '일을 시작하기 전에 채용 담당자의 사고방식을 배웁니다.',
      instructions:
        '「인사 스타터 가이드」를 읽은 뒤 트레이닝을 완료로 표시하세요. 선택형 셀프 체크는 나 자신을 위한 것이며, 역량의 근거로 쓰이지 않습니다.',
      tasks: {
        'hr-training-review': {
          title: '인사 스타터 가이드 읽기',
          instructions:
            '아래 패널에서 「인사 스타터 가이드」를 여세요. 다 읽었으면 트레이닝을 완료로 표시합니다.',
        },
        'hr-training-self-check': {
          title: '선택형 셀프 체크',
          instructions:
            '채점되지 않으며 SKILL FIT의 근거로도 쓰이지 않습니다. 내 이해를 확인하기 위한 것입니다.',
          fields: {
            q_criterion: {
              label: '좋은 선발 기준이란…',
              options: {
                a: '채용 매니저가 사람에게서 좋아하는 점',
                b: '일 자체로 거슬러 올라가 확인할 수 있는 것',
                c: '가장 뛰어난 후보자가 가진 것',
              },
            },
            q_resume: {
              label: '이력서에 "대리점 관계 관리"라고 적혀 있습니다. 다음에 할 일은…',
              options: {
                a: '대리점 경험을 "강함"으로 평가한다',
                b: '그 관계에서 본인이 실제로 무엇을 했는지 묻는다',
                c: '무시한다 — 이력서는 과장하기 마련이니까',
              },
            },
            q_ne: {
              label: '면접에서 어떤 기준을 한 번도 확인하지 못했습니다. 평가는…',
              options: {
                a: '무난하게 중간 점수로 한다',
                b: 'NE — 근거 부족',
                c: '낮은 점수로 한다',
              },
            },
          },
        },
      },
    },

    onboarding: {
      title: '온보딩 — 중국 진출 이해하기',
      summary: '중국 출시에 필요하지만 BITE가 아직 할 수 없는 것을 찾습니다.',
      instructions:
        '진출 브리프와 역량 현황을 읽으세요. 그런 다음 역량 격차를 3개 이상 진단합니다. 출시에 무엇이 필요한지, 지금 BITE에 무엇이 있는지, 그 격차가 왜 중요한지를 적습니다. 격차는 비즈니스 문제이고, 채용은 그것을 메우는 방법 중 하나일 뿐입니다.',
      media: ROLE_REFERENCE_KO,
      tasks: {
        'capability-gaps': {
          title: '역량 격차 진단',
          instructions:
            '자료에 적힌 것과 내가 추측하는 것을 구분하세요. 인테이크 미팅은 그 추측을 확인하기 위한 자리입니다.',
          fields: {
            gaps: {
              label: '역량 격차',
              fields: {
                capability: { label: '출시에 필요한 역량' },
                current_state: {
                  label: '지금 BITE에 있는 것',
                  helpText: '어떤 자료에서 읽었는지 적어 주세요.',
                },
                why_it_matters: { label: '그 격차가 중요한 이유' },
              },
            },
            gap_to_fill_by_hiring: { label: '이번 채용으로 먼저 메워야 할 격차는?(선택)' },
          },
        },
      },
    },

    'intake-prep': {
      title: '인테이크 미팅 준비',
      summary: '선발 기준을 실제로 바꿀 수 있는 질문을 씁니다.',
      instructions:
        '채용 매니저 Takuya Mori 씨에게 할 질문 5개를 준비하세요. 질문마다 목적과, 답에 따라 어떤 채용 판단이 바뀌는지를 적습니다. 아무것도 바꾸지 못하는 답만 돌아오는 질문은 그냥 잡담입니다.',
      tasks: {
        'intake-questions': {
          title: '인테이크 미팅 질문 5개',
          fields: {
            questions: {
              label: '질문',
              fields: {
                question: { label: '질문' },
                purpose: { label: '목적' },
                decision_affected: {
                  label: '영향을 받는 판단',
                  options: {
                    must_have: '필수 기준',
                    nice_to_have: '있으면 좋은 기준',
                    language: '언어 요건',
                    seniority: '직급 / 연봉 범위',
                    start_date: '입사일',
                    interview_questions: '면접 질문',
                    other: '기타',
                  },
                },
              },
            },
          },
        },
      },
    },

    'hiring-intake': {
      title: '채용 매니저 인테이크 미팅',
      summary: '이 일에 실제로 필요한 것을 Takuya Mori 씨에게서 알아냅니다.',
      instructions:
        'Takuya 씨는 무엇이 필요한지 알고 있지만 글로 정리하지는 않았고, 그가 원하는 것이 모두 직무와 관련된 것도 아닙니다. 구체적인 내용은 그것이 나타내는 바를 물어볼 때 나옵니다. 준비한 질문은 대화 옆에 표시되지만, 상대가 실제로 한 말을 따라 진행하세요.',
      media: ROLE_REFERENCE_KO,
      tasks: {
        'intake-conversation': { title: 'Takuya Mori 씨와의 인테이크 미팅' },
      },
    },

    'job-criteria': {
      title: '직무 관련 선발 기준',
      summary: '인테이크 미팅 내용을 면접에서 확인할 수 있는 기준으로 바꿉니다.',
      instructions:
        '모든 기준은 일로 거슬러 올라가 확인할 수 있어야 합니다. 무엇이 필수이고 무엇이 있으면 좋은지, 각각을 어떻게 확인할지 정하세요. 그런 다음 직무 기술서 초안을 고칩니다. 무엇을 뺄지와 그 이유를 적어 주세요.',
      tasks: {
        'selection-criteria': {
          title: '선발 기준',
          fields: {
            criteria: {
              label: '기준',
              fields: {
                criterion: { label: '기준' },
                priority: {
                  label: '우선순위',
                  options: { must_have: '필수', nice_to_have: '있으면 좋음' },
                },
                why_job_related: {
                  label: '직무와 관련된 이유',
                  helpText: '인테이크 미팅이나 자료의 어떤 내용이 이것을 일의 일부로 만드나요?',
                },
                how_to_test: { label: '면접에서 어떻게 확인할지' },
              },
            },
            jd_requirements_removed: { label: '직무 기술서 초안에서 빼거나 고칠 요건과 그 이유' },
            evidence_refs: {
              label: '근거 연결하기',
              helpText: '이 기준들의 바탕이 된 데이터 룸 자료와 인테이크 미팅 발언을 고르세요.',
            },
          },
        },
      },
    },

    'candidate-interviews': {
      title: '후보자 면접',
      summary: 'Lin Hao 씨, Daiki Sato 씨, Zhang Wei 씨를 면접합니다.',
      instructions:
        '세 번의 별도 면접입니다. 답을 비교할 수 있도록, 기준에서 만든 같은 핵심 질문을 모두에게 하세요. 이력서의 한 줄은 주장일 뿐입니다. 각 후보자가 본인이 직접 무엇을 했는지 물어보세요. 면접은 각각 독립적이라, 한 후보자의 말을 다른 후보자는 알지 못합니다.',
      tasks: {
        'interview-lin': { title: '면접 — Lin Hao 씨' },
        'interview-sato': { title: '면접 — Daiki Sato 씨' },
        'interview-zhang': { title: '면접 — Zhang Wei 씨' },
      },
    },

    scorecards: {
      title: '면접 스코어카드',
      summary: '모든 후보자를 같은 기준으로, 근거와 함께 평가합니다.',
      instructions:
        '후보자 × 기준마다 한 줄입니다. 모든 평가에는 실제로 들은 근거가 필요합니다. 면접에서 확인하지 못한 항목은 NE가 정직한 평가입니다. 세 명의 면접이 모두 끝난 뒤에 열리므로, 다른 후보자의 이야기를 듣기 전에 누군가를 채점하는 일은 없습니다.',
      tasks: {
        'candidate-scorecards': {
          title: '스코어카드',
          fields: {
            ratings: {
              label: '평가',
              helpText: '세 명 각각에 대해 최소 2개 기준을 평가하세요.',
              fields: {
                candidate: { label: '후보자', options: CANDIDATES_KO },
                criterion: { label: '기준' },
                rating: {
                  label: '평가',
                  options: {
                    '1': '1 — 부정적인 근거',
                    '2': '2 — 근거가 엇갈림',
                    '3': '3 — 어느 정도 긍정적인 근거',
                    '4': '4 — 강한 긍정적인 근거',
                    NE: 'NE — 근거 부족',
                  },
                },
                evidence: {
                  label: '근거',
                  helpText: '후보자가 실제로 뭐라고 했나요? NE라면 확인하지 못한 것을 적어 주세요.',
                },
              },
            },
            impressions_set_aside: {
              label: '알아차리고 제쳐 둔 인상(선택)',
              helpText: '누군가가 좋거나 싫은 것은 나에 대한 정보입니다. 평가에 섞이지 않도록 여기에 적어 두세요.',
            },
            evidence_refs: { label: '근거 연결하기' },
          },
        },
      },
    },

    'recommendation-v1': {
      title: '채용 추천',
      summary: '후보자와 오퍼를 추천합니다.',
      instructions:
        '추천은 스코어카드에서 나오는 것이지, 그 반대가 아닙니다. 오퍼 방침 경고는 어디까지나 경고입니다. 추천을 결정하는 것은 나입니다.',
      media: ROLE_REFERENCE_KO,
      tasks: {
        'recommendation-v1': {
          title: '추천 v1',
          fields: {
            recommended_candidate: { label: '추천 후보자', options: CANDIDATES_KO },
            runner_up: {
              label: '차순위',
              options: { ...CANDIDATES_KO, none: '없음 — 채용을 다시 시작' },
            },
            rationale: { label: '기준과 연결한 이유' },
            gaps_in_recommended: {
              label: '추천 후보자에게 부족한 점',
              helpText: '완벽하게 맞는 사람은 없습니다. BITE는 무엇을 지원해야 하나요?',
            },
            proposed_base_salary_yen: {
              label: '제안 연간 기본급(엔)',
              helpText: `범위는 ${band}입니다. ${yen(o.bandMidYen)}를 넘으면 서면 사유가 필요합니다.`,
            },
            sign_on_bonus_yen: {
              label: '입사 보너스(엔)',
              helpText: `선택 사항이며 최대 ${yen(o.signOnCapYen)}입니다. 공짜가 아니니 무엇을 위한 것인지 적어 주세요.`,
            },
            offer_justification: {
              label: '오퍼 사유(직무 관련)',
              helpText: '중간값을 넘으면 방침상 필수입니다. 이 후보자는 일에 필요한 무엇을 가져오나요?',
            },
            target_start: { label: '목표 입사일', placeholder: '예: 오퍼 후 6주 이내' },
            key_risk: { label: '주요 리스크' },
            onboarding_plan: { label: '첫 90일 / 리스크 대응' },
          },
        },
        'recommendation-coaching': {
          title: 'Aya 씨와 이야기해 보기(선택)',
          instructions: '매니저는 방침을 설명해 주지만, 대신 골라 주지는 않습니다.',
        },
      },
    },

    'executive-pressure': {
      title: '예상치 못한 상황',
      summary: 'COO에게서 메시지가 왔습니다. 무엇을 바꾸고 무엇을 유지할지 정합니다.',
      instructions:
        '이 메시지에는 서로 다른 두 가지가 담겨 있습니다. 하나는 일에 필요한 것의 실제 변화입니다. 다른 하나는 그렇지 않습니다. 무엇을 바꾸고 무엇을 유지할지 의도를 갖고 정하고, 양쪽 모두에 대해 이유를 설명할 수 있어야 합니다.',
      eventPayload: {
        headline: 'COO: 입사일과 후보자 선호에 대하여',
        from: 'Hiroshi Kudo — BITE 최고운영책임자(COO)',
        body: '더 진행하기 전에 두 가지가 있습니다.\n\n먼저, 상하이 박람회 일정이 확정됐습니다. 중국 책임자는 오퍼 후 2개월 안에 자리에 앉아 있어야 합니다. 이건 양보할 수 없습니다.\n\n다음으로, 지난주에 Daiki Sato 군과 저녁을 먹었습니다. 좋은 사람이고, 나와 같은 대학 출신에, 일본어도 완벽하고, 딱 우리 회사에 맞는 사람입니다. 솔직히 왜 스코어카드로 이렇게 시간을 끄는지 모르겠습니다. 그에게 오퍼를 냅시다.',
        facts: [
          { label: '새 요건', value: '오퍼 후 2개월 안에 입사' },
          { label: '경영진의 선호', value: 'Daiki Sato — 개인적인 지인' },
          { label: '요청', value: '평가를 건너뛰고 Sato 씨에게 오퍼' },
        ],
      },
      tasks: {
        'pressure-acknowledge': { title: '메시지 읽기' },
        'recommendation-v2-revision': {
          title: '수정 판단',
          instructions:
            '추천 v1은 그대로 보존되어 이 양식 옆에 표시됩니다. 여기서 입력해도 덮어쓰이지 않습니다.',
          fields: {
            legitimate_change: { label: '메시지 중 직무와 관련된 실제 변화' },
            not_job_related: { label: '메시지 중 직무와 관련 없는 것' },
            conditions_to_change: { label: '추천에서 바꿀 것' },
            conditions_to_keep: { label: '유지할 것' },
            why_change: { label: '바꾸는 이유' },
            why_keep: { label: '유지하는 이유' },
            start_date_plan: {
              label: '2개월 안 입사를 어떻게 맞출지',
              helpText: '후보자가 제때 입사할 수 없다면 어떤 선택지가 있나요?',
            },
            reply_to_coo: {
              label: 'COO에게 보낼 답장',
              helpText: '정중하고, 짧고, 근거에 기반해서. 근거가 맞는다면 그의 의견에 동의해도 됩니다.',
            },
            recommendation_v2_summary: { label: '추천 v2 요약' },
          },
        },
        'pressure-coaching': { title: 'Aya 씨와 이야기해 보기(선택)' },
      },
    },

    'executive-review': {
      title: '경영진 승인',
      summary: 'Hiroshi Kudo 씨에게 추천을 설명하고 지켜 냅니다.',
      instructions:
        '그는 밀어붙일 것입니다. 그를 움직이는 것은 끈기가 아니라 근거입니다. 실제로 도달한 결정을 기록하세요. BITE가 오퍼를 방침에 비추어 확인합니다.',
      media: ROLE_REFERENCE_KO,
      tasks: {
        'coo-conversation': { title: 'Hiroshi Kudo 씨와의 승인 미팅' },
        'final-decision-record': {
          title: '결정 기록',
          instructions:
            '나와 COO가 실제로 도달한 결론을 기록하세요. 글이 아니라 구조화된 데이터이며, 인사팀이 보관하는 것은 여기입니다.',
          fields: {
            final_candidate: {
              label: '오퍼할 후보자',
              options: { ...CANDIDATES_KO, none: '오퍼 없음 — 채용을 다시 시작' },
            },
            proposed_base_salary_yen: { label: '연간 기본급(엔)' },
            sign_on_bonus_yen: { label: '입사 보너스(엔)' },
            offer_justification: { label: '오퍼 사유(직무 관련)' },
            target_start: { label: '목표 입사일' },
            conditions: {
              label: '결정에 붙은 조건',
              helpText: '퇴사 통보 기간 보상, 온보딩 지원, 재검토 시점 등 합의한 것.',
            },
            decision_status: {
              label: '승인 결과',
              options: {
                signed_off: '추천대로 승인',
                signed_off_with_changes: '변경 후 승인',
                not_signed_off: '승인되지 않음 — 추천을 다시 검토',
              },
            },
          },
        },
      },
    },

    'final-submission': {
      title: '최종 제출',
      summary: '최종 채용 추천을 제출합니다.',
      instructions:
        '각 섹션에는 지금까지의 작업이 미리 채워져 있습니다. 표현은 자유롭게 고치세요. 제출하면 바꿀 수 없는 스냅숏으로 저장됩니다.',
      tasks: {
        'final-hiring-recommendation': {
          title: '최종 채용 추천',
          fields: {
            capability_gap: {
              label: '1. 역량 격차',
              prefillTemplate:
                '{{capability-gaps.gaps[].capability}}\n\n먼저 메울 것: {{capability-gaps.gap_to_fill_by_hiring}}',
            },
            selection_criteria: {
              label: '2. 직무 관련 선발 기준',
              prefillTemplate: '{{selection-criteria.criteria[].criterion}}',
            },
            candidate_evaluation: {
              label: '3. 후보자 평가',
              prefillTemplate: '{{candidate-scorecards.ratings[].evidence}}',
            },
            recommendation: {
              label: '4. 추천과 이유',
              prefillTemplate:
                '후보자: {{final-decision-record.final_candidate}}\n\n{{recommendation-v1.rationale}}',
            },
            fallback: {
              label: '5. 차순위 / 대안',
              prefillTemplate: '차순위: {{recommendation-v1.runner_up}}',
            },
            offer: {
              label: '6. 오퍼',
              prefillTemplate:
                '기본급: ¥{{final-decision-record.proposed_base_salary_yen}}\n입사 보너스: ¥{{final-decision-record.sign_on_bonus_yen}}\n입사: {{final-decision-record.target_start}}\n조건: {{final-decision-record.conditions}}',
            },
            risks_and_onboarding: {
              label: '7. 리스크와 첫 90일',
              prefillTemplate:
                '부족한 점: {{recommendation-v1.gaps_in_recommended}}\n주요 리스크: {{recommendation-v1.key_risk}}\n계획: {{recommendation-v1.onboarding_plan}}\n입사일: {{recommendation-v2-revision.start_date_plan}}',
            },
            pressure_handling: {
              label: '8. 경영진 요청에 대한 대응',
              prefillTemplate:
                '바꾼 것: {{recommendation-v2-revision.conditions_to_change}}\n유지한 것: {{recommendation-v2-revision.conditions_to_keep}}\n답장: {{recommendation-v2-revision.reply_to_coo}}',
            },
            next_action: { label: '9. 다음 액션' },
          },
        },
      },
    },
  },
};

export const HR_SCENARIO_TRANSLATIONS: Translations<ScenarioText> = {
  ja: SCENARIO_JA,
  ko: SCENARIO_KO,
};
