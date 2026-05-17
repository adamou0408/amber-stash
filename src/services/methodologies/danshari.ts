import type { Methodology } from '@/types/methodology';

/**
 * 斷捨離（near-port of 山下英子方法論）
 * 內建示範方法論 — v4 階段不對外授權。
 * 生命週期定位：mindset — 改變消費與物的關係的心法層。
 *
 * 核心：斷（斷絕不需要的物品進來）/ 捨（捨棄家裡不需要的物品）/ 離（脫離對物品的執著）
 * 招牌技巧：七五一法則
 *   - 看得見的收納（show）：滿格 70%（30% 留白）
 *   - 看不見的收納（stored）：滿格 50%（一半留白）
 *   - 展示性收納（shrine）：1%（極少數紀念品）
 */
export const DANSHARI_METHODOLOGY: Methodology = {
  id: 'danshari-zh',
  authorId: 'placeholder-yamashita',
  name: '斷捨離',
  description:
    '從「我」與「物」的關係出發，斷絕不需要的進來、捨棄不需要的、脫離對物的執著。重點是日常修練，不是一次性大整理。',
  language: 'zh-TW',
  systemPrompt:
    '你是「斷捨離」風格的收納顧問，依山下英子哲學。語氣冷靜直接，不溫情。每條建議都從「現在的我，需要這個嗎？」出發，不是「以前的我」「未來的我」。引導使用者問三題：① 還在用嗎 ② 現在的我需要嗎 ③ 不留會不舒服嗎 — 三題都不是就放手。重視日常持續，不依賴一次性大整理。',
  lifecyclePhase: 'mindset',
  rules: [
    {
      id: 'core-question',
      appliesWhen: { type: 'categoryCount', category: '*', op: '>', value: 0 },
      priority: 100,
      suggestion: {
        titleTemplate: '今日修練：問三題',
        bodyTemplate:
          '隨意挑一件物品，問三題：① 現在還在用嗎？② 現在的我需要嗎（不是以前 / 未來的我）？③ 不留我會不舒服嗎？— 三題都答「不」，就是該放手的訊號。每天一件，比一次整理 5 小時更持久。',
        tags: ['danshari', 'daily-practice'],
      },
    },
    {
      id: 'tier-show-overcrowd',
      appliesWhen: { type: 'tierExceeds', tier: 'show', value: 0, op: '>' },
      priority: 95,
      suggestion: {
        titleTemplate: '七五一法則 · 看得見區已 {showRatio}',
        bodyTemplate:
          '山下英子的七五一法則：看得見的物品比例該維持在「七成滿」— 30% 的留白才有呼吸感，超過視覺立刻變雜亂。建議從目前 {show} 件減到 70%。',
        tags: ['danshari', '751-rule'],
      },
    },
    {
      id: 'tier-stored-overcrowd',
      appliesWhen: { type: 'tierExceeds', tier: 'stored', value: 0, op: '>' },
      priority: 92,
      suggestion: {
        titleTemplate: '七五一法則 · 收納區已 {storedRatio}',
        bodyTemplate:
          '抽屜 / 櫃內物品該維持「五成滿」 — 滿一半才有調整空間，下次新增不需要重新整理。目前 {stored} 件，建議減量到一半。',
        tags: ['danshari', '751-rule'],
      },
    },
    {
      id: 'tier-shrine-overcrowd',
      appliesWhen: { type: 'tierExceeds', tier: 'shrine', value: 0.04, op: '>' },
      priority: 88,
      suggestion: {
        titleTemplate: '紀念區已超過 1% — 共 {shrine} 件',
        bodyTemplate:
          '七五一中的「一」 — 紀念品該維持在全部物品的 1% 以下。超過代表你還沒練完「離」（脫離對物的執著）。再過一遍：哪些是「現在的我」真的還需要的？',
        tags: ['danshari', '751-rule'],
      },
    },
    {
      id: 'untiered-many',
      appliesWhen: { type: 'untieredCount', op: '>=', value: 5 },
      priority: 75,
      suggestion: {
        titleTemplate: '⚠️ 還有 {untiered} 件未分「看 / 收 / 念」',
        bodyTemplate:
          '七五一法則需要每件物品標一個層級 — 看得見、收起來、或紀念。點開物品列表 → 點一件物品 → 選擇層級。標完才能看七五一比例是否平衡。',
        tags: ['danshari', 'onboarding'],
      },
    },
    {
      id: 'consume-pause',
      appliesWhen: { type: 'overcapacity', ratio: 0.7 },
      priority: 80,
      suggestion: {
        titleTemplate: '購物前暫停 · {crowdedSpace} 已 {crowdedRatio}',
        bodyTemplate:
          '「斷」的修練 — 物品進來前先暫停。下次在店裡準備買新東西時問自己：「這個物品進到 {crowdedSpace}，要拿走家裡哪一件？」答不出來就先別買。',
        tags: ['danshari', 'consumption-control'],
      },
    },
    {
      id: 'rarely-attachment',
      appliesWhen: { type: 'frequencyCount', frequency: 'rarely', op: '>=', value: 10 },
      priority: 70,
      suggestion: {
        titleTemplate: '❄️ {rarely} 件很少用 — 是執著還是需要？',
        bodyTemplate:
          '「離」的修練 — 脫離對物品的執著。每件 rarely 物品問自己：「不留會不舒服嗎？」若你心裡卡卡的，那是「執著」不是「需要」。練習感謝它陪伴過，然後放手。',
        tags: ['danshari', 'attachment'],
      },
    },
    {
      id: 'no-frequency-no-judgment',
      appliesWhen: { type: 'unfrequented', op: '>=', value: 5 },
      priority: 50,
      suggestion: {
        titleTemplate: '先標頻率，才能判斷',
        bodyTemplate:
          '斷捨離靠「現在的我」是否需要 — 而頻率（每天 / 週 / 月 / 很少）就是最直接的訊號。{unfrequented} 件還沒標頻率的物品，先補上才有對話基礎。',
        tags: ['danshari', 'onboarding'],
      },
    },
    {
      id: 'empty',
      appliesWhen: { type: 'noItems' },
      priority: 100,
      suggestion: {
        titleTemplate: '從「我」開始，不是從「物」開始',
        bodyTemplate:
          '斷捨離的起點不是物品，是你 — 想想「現在的你」想過什麼樣的生活？需要什麼樣的空間支持？答案清楚了，物品的去留就自然有判斷依據。然後拍一個你最在意的空間開始。',
      },
    },
  ],
  shoppingRules: [
    {
      id: 'pause-before-buy',
      appliesWhen: { type: 'categoryCount', category: '*', op: '>', value: 0 },
      pick: {
        nameTemplate: '⏸️ 暫停：不買收納用品',
        reasonTemplate:
          '買收納盒 = 增加「物」。斷捨離的順序是先「捨」再「收」 — 你會發現減量後家裡的盒子已足夠。',
      },
    },
    {
      id: 'one-in-rule-card',
      appliesWhen: { type: 'overcapacity', ratio: 0.7 },
      pick: {
        nameTemplate: '🛑 一進一出 · {crowdedSpace} 滿警示',
        reasonTemplate:
          '此空間已超過 70% 滿。下次想買新東西前，先決定「拿走家裡哪一件對應品」— 沒答案就不買。',
      },
    },
  ],
  appliesTo: [
    'clothing',
    'kitchen',
    'books',
    'electronics',
    'documents',
    'cosmetics',
    'toys',
    'tools',
    'sentimental',
    'other',
  ],
  pricing: { kind: 'free' },
  version: 1,
};
