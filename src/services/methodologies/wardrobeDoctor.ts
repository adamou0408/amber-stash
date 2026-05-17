import type { Methodology } from '@/types/methodology';

/**
 * 衣櫥醫生（near-port of 賴庭荷方法論）
 * 內建示範方法論 — 正式版本須取得本人授權。
 *
 * 生命週期定位：deep-clean — 衣物專科的一次性整理。
 *
 * 核心：衣櫥整理 + 穿搭建議 + 精準購買三位一體。
 * 不只是「分類好」，而是「穿得出去」。對 LGBTQ+ 中性穿搭友善。
 *
 * 招牌技巧：
 * - 5-4-3-2-1 膠囊衣櫥入門公式（5 上 / 4 下 / 3 外 / 2 鞋 / 1 特殊）
 * - 季節輪替（冬衣徹底洗曬乾再收）
 * - 直立摺 / 口袋摺 / 軍人摺三選一
 */
export const WARDROBE_DOCTOR_METHODOLOGY: Methodology = {
  id: 'wardrobe-doctor-zh',
  authorId: 'placeholder-laitinghe',
  name: '衣櫥醫生',
  description:
    '衣物專科。整理 + 穿搭 + 精準購買三位一體 — 衣櫥不是「整齊就好」，是「穿得出去」。對中性 / 多元穿搭友善。',
  language: 'zh-TW',
  systemPrompt:
    '你是賴庭荷風格的衣物整理顧問。語氣專業中性，不假設使用者的性別表達。每件衣服問「能穿出門嗎？跟現有的能搭嗎？」核心目標是「穿得出去的衣櫥」，不是「視覺整齊的衣櫥」。鼓勵精準購買（買前先 mock 搭配），而非囤積。',
  lifecyclePhase: 'deep-clean',
  rules: [
    {
      id: 'capsule-541-target',
      appliesWhen: { type: 'categoryCount', category: 'clothing', op: '>=', value: 15 },
      priority: 100,
      suggestion: {
        titleTemplate: '👚 5-4-3-2-1 膠囊衣櫥目標',
        bodyTemplate:
          '入門公式：5 件上衣 + 4 件下著 + 3 件外搭 + 2 雙鞋 + 1 件特殊單品。能搭出 30+ 種組合。目前你有 {clothing} 件 — 試試挑出最常穿的 15 件當「核心衣櫥」，其他先收進「儲備區」。一週後如果完全沒翻儲備區 = 那些衣服不必留。',
        tags: ['wardrobe-doctor', 'capsule'],
      },
    },
    {
      id: 'wear-out-test',
      appliesWhen: { type: 'frequencyCount', frequency: 'rarely', op: '>=', value: 5 },
      priority: 90,
      suggestion: {
        titleTemplate: '🚪 衣物「穿得出去」測試 · {rarely} 件待檢視',
        bodyTemplate:
          '一件件問三題：① 上次穿是何時 / 哪個場合？② 配什麼鞋與下著能出門？③ 跟現在的我（年齡 / 體型 / 風格）還相符嗎？三題答得出來 = 留；卡關 = 不是「以後可能會穿」，是「現在不穿了」。',
        tags: ['wardrobe-doctor', 'wearability'],
      },
    },
    {
      id: 'fold-method-choice',
      appliesWhen: { type: 'categoryCount', category: 'clothing', op: '>=', value: 10 },
      priority: 70,
      suggestion: {
        titleTemplate: '🪡 三種摺法選一種',
        bodyTemplate:
          '① **直立摺**（KonMari）— 摺成可站立的長方體，抽屜內一眼看完。② **口袋摺**（Blair 推廣）— 把開口塞進自身，立著不散開，適合運動服 / T 恤。③ **軍人摺**（日本警視廳災害對策）— 摺成最小體積，適合旅行 / 災備。挑一種堅持用，不要混。',
        tags: ['wardrobe-doctor', 'fold-method'],
      },
    },
    {
      id: 'humid-storage',
      appliesWhen: { type: 'categoryCount', category: 'clothing', op: '>=', value: 15 },
      priority: 60,
      suggestion: {
        titleTemplate: '🌧️ 換季四要 · 台灣濕度防霉',
        bodyTemplate:
          '台灣亞熱帶換季要點：① 收前徹底洗淨 + 晴天日曬乾、② 衣櫃內放除濕劑（小蘇打 / 咖啡渣 / 竹炭）、③ 吊掛間距留 5cm 通風、④ 雨季常開除濕機。**羊毛大衣不要真空壓縮**（會變形）。冬被 / 羽絨衣才適合壓縮袋。',
        tags: ['wardrobe-doctor', 'taiwan-humidity'],
      },
    },
    {
      id: 'hanger-unify',
      appliesWhen: { type: 'categoryCount', category: 'clothing', op: '>=', value: 20 },
      priority: 55,
      suggestion: {
        titleTemplate: '🪝 衣架統一 · 視覺立刻整齊',
        bodyTemplate:
          '掛衣服的衣架不統一是衣櫃亂的最大主因。建議三選一：MUJI 鋁衣架（不留肩痕）/ IKEA BUMERANG 山毛櫸實木 / 絨布防滑衣架。一次買齊，舊衣架全收掉。視覺檔次立刻上一個 level。',
        tags: ['wardrobe-doctor', 'unify'],
      },
    },
    {
      id: 'color-styling-overlap',
      appliesWhen: {
        type: 'and',
        conditions: [
          { type: 'categoryCount', category: 'clothing', op: '>=', value: 20 },
          { type: 'colorDiversity', category: 'clothing', op: '>=', value: 5 },
        ],
      },
      priority: 45,
      suggestion: {
        titleTemplate: '🎨 衣物 {colorVarieties} 色 · 找出主色 70/30',
        bodyTemplate:
          '挑出 2-3 個「主色」（你 70% 的衣服顏色）+ 1-2 個「點綴色」（30%）。其他顏色考慮淘汰 — 因為很難搭、會變成「孤兒衣」。{dominantColor} 是你目前的主色之一，可以圍繞它擴張。',
        tags: ['wardrobe-doctor', 'palette'],
      },
    },
    {
      id: 'gender-neutral-respect',
      appliesWhen: { type: 'categoryCount', category: 'clothing', op: '>=', value: 1 },
      priority: 20,
      suggestion: {
        titleTemplate: '🌈 中性 / 多元穿搭友善',
        bodyTemplate:
          '不要被「男裝 / 女裝」分區限制 — 你的衣櫃以「穿著場合」和「搭配性」分區即可。建議分區：上班 / 居家 / 運動 / 正式 / 季節限定。性別表達是你的自由。',
        tags: ['wardrobe-doctor', 'lgbtq+'],
      },
    },
    {
      id: 'pre-buy-mock',
      appliesWhen: { type: 'categoryCount', category: 'clothing', op: '>=', value: 30 },
      priority: 80,
      suggestion: {
        titleTemplate: '🛍️ 買新衣前先「mock」三套',
        bodyTemplate:
          '想買新衣前，先用現有衣服 mock 出三套搭配，每套都包含這件新衣 — 想得出來才買、想不出來就放棄。這是「精準購買」的核心。也順便避免「衝動消費後變成 rarely 衣物」。',
        tags: ['wardrobe-doctor', 'consumption-control'],
      },
    },
    {
      id: 'empty',
      appliesWhen: { type: 'noItems' },
      priority: 100,
      suggestion: {
        titleTemplate: '從一個你最常打開的抽屜開始',
        bodyTemplate:
          '衣物整理建議從**內衣 / 襪子抽屜**開始 — 因為每天打開、容易看到成果。把所有襪子內衣拿出來、檢視狀況（破了 / 鬆了 / 變色就放手），然後依摺法統一收回去。完成一個小區域的成就感會推動下一步。',
      },
    },
  ],
  shoppingRules: [
    {
      id: 'aluminum-hangers',
      appliesWhen: { type: 'categoryCount', category: 'clothing', op: '>=', value: 20 },
      pick: {
        nameTemplate: 'MUJI 鋁衣架 ×20',
        reasonTemplate: '不留肩痕 / 視覺統一。衣櫃整齊度立刻 +1 個 level。',
        brand: 'MUJI',
        priceTwdMin: 590,
        priceTwdMax: 890,
      },
    },
    {
      id: 'fits-clothing-box',
      appliesWhen: { type: 'categoryCount', category: 'clothing', op: '>=', value: 30 },
      pick: {
        nameTemplate: '天馬 Fits 衣裝盒（堆疊式）',
        reasonTemplate: '日系收納標竿，可堆疊、抽屜式滑軌、透明面板看得見內容物。',
        brand: '天馬 Tenma',
        sku: 'Fits 衣裝盒',
        priceTwdMin: 590,
        priceTwdMax: 1290,
      },
    },
    {
      id: 'skubb-divider',
      appliesWhen: { type: 'categoryCount', category: 'clothing', op: '>=', value: 25 },
      pick: {
        nameTemplate: 'IKEA SKUBB 抽屜分隔 6 格',
        reasonTemplate: '直立摺好的衣物 / 襪子 / 內衣分區，便宜耐用。',
        brand: 'IKEA',
        sku: 'SKUBB',
        priceTwdMin: 599,
        priceTwdMax: 599,
      },
    },
  ],
  appliesTo: ['clothing'],
  pricing: { kind: 'free' },
  version: 1,
};
