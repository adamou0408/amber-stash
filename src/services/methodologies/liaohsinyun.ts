import type { Methodology } from '@/types/methodology';

/**
 * 廖心筠「一條粉粿聯想性收納法」（near-port of 廖心筠方法論）
 * 內建示範方法論 — 正式版本須取得本人授權。
 *
 * 生命週期定位：maintenance — 日常維持階段，與 amberstash-default 共存。
 *
 * 核心：依「聯想動線」決定物品位置 — 鑰匙旁邊放口罩、保養品依使用順序排列。
 * 物歸原位變直覺，不需要意志力。
 *
 * 本派特別處理華人收納文化包袱：
 * - 祖傳遺物 / 家族物的孝道壓力
 * - 集點品 / 贈品的稟賦效應
 * - 風水的雙面影響
 * - 多代同堂物品所有權衝突
 */
export const LIAOHSINYUN_METHODOLOGY: Methodology = {
  id: 'liaohsinyun-zh',
  authorId: 'placeholder-liaohsinyun',
  name: '廖心筠聯想收納',
  description:
    '台灣本土最大整理流派。依「使用情境聯想」收納 — 鑰匙旁邊放口罩、保養品依使用順序、出門用品集中在玄關。針對華人家庭情感包袱設計。',
  language: 'zh-TW',
  systemPrompt:
    '你是廖心筠風格的整理顧問。語氣溫暖直接，常用「親愛的」「我跟你說」這類口語。核心問句：「你在用這個的時候，下一個會用什麼？」依使用順序聯想 → 收在一起。特別溫和處理祖傳物品與遺物 — 「不急著丟，給時間」。重視家庭關係超過收納本身。',
  lifecyclePhase: 'maintenance',
  rules: [
    {
      id: 'association-design',
      appliesWhen: { type: 'unassociatedCount', op: '>=', value: 5 },
      priority: 95,
      suggestion: {
        titleTemplate: '聯想設計 · {unassociated} 件物品待設定動線',
        bodyTemplate:
          '親愛的，每件物品問自己：「我用它的當下，下一個會用什麼？」例：鑰匙 → 口罩、悠遊卡（出門連動）；卸妝水 → 化妝棉、保養品（睡前順序）。把連動的東西收一起 = 動線最短 = 不用意志力也會物歸原位。',
        tags: ['liaohsinyun', 'association', 'principle-1-deep'],
      },
    },
    {
      id: 'entrance-bundle',
      appliesWhen: {
        type: 'and',
        conditions: [
          { type: 'categoryCount', category: 'tools', op: '>=', value: 1 },
          {
            type: 'or',
            conditions: [
              { type: 'hasSpaceKind', kind: 'drawer' },
              { type: 'hasSpaceKind', kind: 'shelf' },
            ],
          },
        ],
      },
      priority: 80,
      suggestion: {
        titleTemplate: '玄關出門組合 · 鑰匙 + 口罩 + 悠遊卡',
        bodyTemplate:
          '台灣家庭的「出門連動組」固定就那幾樣：鑰匙、口罩、悠遊卡 / 信用卡、傘。全部集中在玄關抽屜或托盤裡 — 出門前一個動作全帶上、回家一個動作全卸下。鑰匙圈掛口罩夾，雨天傘桶就在腳邊。',
        tags: ['liaohsinyun', 'taiwan-entrance'],
      },
    },
    {
      id: 'skincare-sequence',
      appliesWhen: { type: 'categoryCount', category: 'cosmetics', op: '>=', value: 5 },
      priority: 75,
      suggestion: {
        titleTemplate: '保養品依使用順序排列 · {cosmetics} 件',
        bodyTemplate:
          '依「使用順序」由左到右擺放：卸妝 → 洗臉 → 化妝水 → 精華 → 乳液 → 防曬。早上往左走、晚上反向。不會忘記步驟、不會跳過某一瓶（這也是減量壓力 — 不順手用的自然會被淘汰）。',
        tags: ['liaohsinyun', 'sequence'],
      },
    },
    {
      id: 'heirloom-gentle',
      appliesWhen: { type: 'heirloomCount', op: '>=', value: 1 },
      priority: 90,
      suggestion: {
        titleTemplate: '🏛️ 家族傳承物 {heirloom} 件 — 不急',
        bodyTemplate:
          '親愛的，祖傳的東西不要急著處理。給自己 3 個月以上的時間情緒沉澱，特別是親人剛過世的物品。先建一個「傳承櫃」集中放，慢慢來。如果決定要傳給下一代，現在做標記；如果留作紀念，拍照數位化也是一種「擁有」。',
        tags: ['liaohsinyun', 'heritage', 'chinese-culture'],
      },
    },
    {
      id: 'point-collect-trap',
      appliesWhen: {
        type: 'and',
        conditions: [
          { type: 'frequencyCount', frequency: 'rarely', op: '>=', value: 5 },
          { type: 'categoryCount', category: 'other', op: '>=', value: 5 },
        ],
      },
      priority: 70,
      suggestion: {
        titleTemplate: '集點 / 贈品 / 夾娃娃 — 是免費的嗎？',
        bodyTemplate:
          '台灣特有的「免費品」陷阱：超商集點、加油站贈品、夾娃娃機娃娃因為「免費獲得」會被稟賦效應放大價值。問自己：如果現在去店裡賣 100 元，你會買嗎？不會的話，當初也只是「拿了」不是「需要」。把這些挑出來捐贈 / 轉送。',
        tags: ['liaohsinyun', 'taiwan-freebie', 'endowment-effect'],
      },
    },
    {
      id: 'multi-gen-territory',
      appliesWhen: { type: 'categoryCount', category: '*', op: '>=', value: 50 },
      priority: 50,
      suggestion: {
        titleTemplate: '多代同堂的物品邊界',
        bodyTemplate:
          '台灣家庭常有「爸媽家變子女倉庫」的問題。如果你家也是 — 跟同住的家人約定每人「劃地盤」：誰的物品放誰的區。不要替別人決定該不該丟。如果是父母來訪暫放的，明定「3 個月內要帶回去」期限。',
        tags: ['liaohsinyun', 'family-boundary'],
      },
    },
    {
      id: 'fengshui-balance',
      appliesWhen: { type: 'overcapacity', ratio: 0.85 },
      priority: 60,
      suggestion: {
        titleTemplate: '🪙 風水也支持留白 · {crowdedSpace} 已 {crowdedRatio}',
        bodyTemplate:
          '風水講究「明財位不可堆雜物」 — 客廳進門斜對角是明財位，要清爽。{crowdedSpace} 太滿不只壓迫感重，傳統上認為也擋住「氣的流動」。當這條建議比減量哲學更有說服力時就用它 — 重點是先空出來。',
        tags: ['liaohsinyun', 'fengshui'],
      },
    },
    {
      id: 'taiwan-humidity',
      appliesWhen: { type: 'categoryCount', category: 'clothing', op: '>=', value: 15 },
      priority: 55,
      suggestion: {
        titleTemplate: '台灣亞熱帶氣候 · 衣物防潮四要',
        bodyTemplate:
          '台灣全年濕度高，衣物收納要做到：① 收前徹底洗淨曬乾、② 衣櫃放除濕劑（小蘇打 / 咖啡渣 / 竹炭都可）、③ 吊掛間距留 5cm 通風、④ 雨季常開除濕機。羊毛大衣不要長期真空壓縮（會變形）。',
        tags: ['liaohsinyun', 'taiwan-climate'],
      },
    },
    {
      id: 'kitchen-rice-bug',
      appliesWhen: { type: 'categoryCount', category: 'kitchen', op: '>=', value: 5 },
      priority: 45,
      suggestion: {
        titleTemplate: '🌾 米蟲問題的根本解',
        bodyTemplate:
          '台灣家庭年年面對米蟲問題。最徹底的方法：米買回家先冷凍 3 小時殺卵，再冷藏保存。米桶內可放月桂葉、未剝皮大蒜或去籽辣椒輔助。打開包裝後 1 個月內吃完不要囤積。',
        tags: ['liaohsinyun', 'taiwan-kitchen'],
      },
    },
    {
      id: 'empty',
      appliesWhen: { type: 'noItems' },
      priority: 100,
      suggestion: {
        titleTemplate: '從玄關抽屜開始',
        bodyTemplate:
          '親愛的，台灣家庭最值得開始的地方是玄關抽屜 — 鑰匙、口罩、悠遊卡天天用，把這些收順了，每天的「出門儀式」就會立刻變順。拍張照片把這個小空間的物品建檔，開始你的整理旅程。',
      },
    },
  ],
  shoppingRules: [
    {
      id: 'entrance-tray',
      appliesWhen: { type: 'hasSpaceKind', kind: 'drawer' },
      pick: {
        nameTemplate: '玄關托盤（出門組）',
        reasonTemplate:
          '鑰匙、口罩、悠遊卡集中放一個托盤。建議 IKEA RIMFORSA 或木質托盤約 NT$ 300-800。',
      },
    },
    {
      id: 'umbrella-stand',
      appliesWhen: { type: 'hasSpaceKind', kind: 'drawer' },
      pick: {
        nameTemplate: '伸縮傘桶（防滴水）',
        reasonTemplate:
          '台灣雨多。HOLA 編織款 NT$ 500-900，底部有排水盤的最理想。放玄關腳邊。',
      },
    },
    {
      id: 'dehumidifier-bag',
      appliesWhen: { type: 'categoryCount', category: 'clothing', op: '>=', value: 15 },
      pick: {
        nameTemplate: '除濕包 × 4 個',
        reasonTemplate:
          '衣櫃 / 鞋櫃各放一個。台灣濕度全年 70%+，是衣物霉斑與發臭的最大主因。NT$ 50-150 一個，每月或變色就換。',
      },
    },
  ],
  appliesTo: [
    'clothing',
    'kitchen',
    'cosmetics',
    'tools',
    'sentimental',
    'other',
  ],
  pricing: { kind: 'free' },
  version: 1,
};
