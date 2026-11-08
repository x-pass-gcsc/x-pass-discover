import 'server-only';
import type { PersonaText } from '@/content/personas.server';
import type { Translations } from '@/content/localize';

/**
 * SERVER-ONLY: the client-facing parts of the Sales personas in other
 * languages. Server-only because it carries the labels of facts the student
 * has not uncovered yet — a label is sent only once its fact is earned.
 *
 * Names are left as written: the office signs them in English too, and a
 * person keeps one name across the app. System prompts are not translated;
 * the personas already answer in the language the student writes in.
 */
export const SALES_PERSONA_TRANSLATIONS: Translations<Record<string, PersonaText>> = {
  ja: {
    'quickmart-buyer': {
      role: '飲料カテゴリーバイヤー',
      visibleContext:
        'Yuki Tanaka さんが責任を負うのは、特定のサプライヤーではなく、QuickMart の飲料棚全体の収益性です。棚スペースには限りがあるため、BITE を加えるには、おそらく何か別の商品を外すことになります。',
      openingMessage:
        'お越しいただきありがとうございます。率直に申し上げます。当社ではすでにプロテインドリンクを何種類も扱っていて、冷蔵棚はいっぱいです。BITE を入れるとなると、おそらく別の商品を外すことになります。ですから、なぜ BITE にその棚を任せるべきなのか、説明していただけますか。',
      factLabels: {
        morning_velocity: '朝の販売ペース',
        price_conversion: '価格と購入率',
        shelf_space: '棚スペース / フェイス数',
        new_product_waste: '新商品の廃棄リスク',
        pilot_preference: '希望するパイロット構成',
        expansion_threshold: '拡大の基準',
      },
    },
    'bite-sales-manager': {
      role: '流通営業マネージャー',
      visibleContext:
        'BITE 流通営業チームでのあなたのマネージャーです。ミッションを割り当て、BITE の制約について説明してくれますが、取引先の攻略は自分でやることを期待しています。',
      openingMessage:
        'ちょうどいいところに来たね。あなたに担当してほしいのは QuickMart。約 1,200 店舗あって、健康飲料を積極的に伸ばそうとしている。ミッションは、BITE Protein Drink を、うちが本当に受け入れられる条件で採用してもらうこと。BITE のことは何でも聞いて。でも QuickMart のことは、あなたが自分で突き止めること。',
      factLabels: {
        bite_production_capacity: '初期の生産能力',
      },
    },
  },
  ko: {
    'quickmart-buyer': {
      role: '음료 카테고리 바이어',
      visibleContext:
        'Yuki Tanaka 씨가 책임지는 것은 특정 공급사가 아니라 QuickMart 음료 진열대 전체의 수익성입니다. 진열 공간은 한정되어 있어서, BITE를 들이려면 아마 다른 상품을 빼야 합니다.',
      openingMessage:
        '와 주셔서 감사합니다. 솔직하게 말씀드리겠습니다. 저희는 이미 프로틴 음료를 여러 종류 취급하고 있고 냉장 진열대는 꽉 차 있습니다. BITE를 들인다면 아마 다른 상품을 빼야 할 겁니다. 그러니 왜 그 자리를 BITE에 맡겨야 하는지 설명해 주시겠어요?',
      factLabels: {
        morning_velocity: '아침 판매 속도',
        price_conversion: '가격과 구매 전환',
        shelf_space: '진열 공간 / 페이스 수',
        new_product_waste: '신제품 폐기 리스크',
        pilot_preference: '선호하는 파일럿 구성',
        expansion_threshold: '확대 기준',
      },
    },
    'bite-sales-manager': {
      role: '유통 영업 매니저',
      visibleContext:
        'BITE 유통 영업팀에서 나의 매니저입니다. 미션을 맡기고 BITE의 제약에 대해 설명해 주지만, 거래처 공략은 스스로 해내기를 기대합니다.',
      openingMessage:
        '마침 잘 왔어요. 맡기고 싶은 건 QuickMart예요. 매장이 약 1,200개이고, 건강 음료를 적극적으로 키우려 하고 있어요. 미션은 BITE Protein Drink를 우리가 정말 받아들일 수 있는 조건으로 입점시키는 거예요. BITE에 대해서는 뭐든 물어봐요. 하지만 QuickMart에 대해서는 직접 알아내야 해요.',
      factLabels: {
        bite_production_capacity: '초기 생산 능력',
      },
    },
  },
};
