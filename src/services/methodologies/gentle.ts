import type { Methodology } from '@/types/methodology';

/**
 * 寬容派（near-port of KC Davis《How to Keep House While Drowning》)
 * 內建示範方法論 — 正式版本須取得本人授權。
 *
 * 生命週期定位：gentle-reset — ADHD、心理健康狀態不佳、整理過很多次都維持不住的人。
 *
 * 核心：
 *  - Care tasks are morally neutral
 *  - You don't serve your home; your home serves you
 *  - No one ever shamed themselves into better mental health
 *
 * 招牌技巧：
 *  - 5 樣物品法（垃圾 / 髒餐具 / 髒衣物 / 屬於他處 / 無家可歸）
 *  - 15 分鐘原則（FlyLady 也用）— 設 timer 整理 15 分鐘就停
 *  - Body doubling（找人陪伴整理）
 */
export const GENTLE_METHODOLOGY: Methodology = {
  id: 'gentle-zh',
  authorId: 'placeholder-kc-davis',
  name: '寬容派整理',
  description:
    'ADHD / 心理負擔重 / 整理過很多次都維持不住的人專用。整理是讓家為你服務，不是你為家服務。完美不是目標，「比昨天好一點」就夠了。',
  language: 'zh-TW',
  systemPrompt:
    '你是 KC Davis 風格的寬容派整理顧問。語氣極度溫和、零責備、絕對不用「應該」「必須」。常用「沒關係」「先這樣就好」「你已經夠努力了」。核心信念：care tasks 沒有道德含義 — 沒有「好家庭主婦」這種事。每條建議都拆得很小（5 分鐘以內可動手）。重視使用者的心理狀態超過家裡的整潔狀態。',
  lifecyclePhase: 'gentle-reset',
  rules: [
    {
      id: 'morally-neutral',
      appliesWhen: { type: 'categoryCount', category: '*', op: '>', value: 0 },
      priority: 100,
      suggestion: {
        titleTemplate: '💚 整理不是道德問題',
        bodyTemplate:
          '家裡亂不代表你是壞人。Care tasks（家務）是道德中性的 — 沒有所謂「正確的整潔度」。你的房間反映你的心理狀態，不反映你的價值。今天能做一點就做一點，做不到也沒關係。',
        tags: ['gentle', 'kc-davis', 'manifesto'],
      },
    },
    {
      id: 'five-things',
      appliesWhen: { type: 'categoryCount', category: '*', op: '>=', value: 5 },
      priority: 95,
      suggestion: {
        titleTemplate: '5 樣物品法 · 快速重置',
        bodyTemplate:
          '一個房間最亂時，所有東西其實只有 5 類：① 垃圾、② 髒餐具、③ 髒衣物、④ 屬於別處、⑤ 沒地方放（無家可歸）。一次處理一類，做完那類就 done。每完成一類給自己一個「贏」 — 多巴胺很重要。',
        tags: ['gentle', 'kc-davis', '5-things'],
      },
    },
    {
      id: 'fifteen-minutes',
      appliesWhen: { type: 'overcapacity', ratio: 0.7 },
      priority: 85,
      suggestion: {
        titleTemplate: '⏱️ 15 分鐘原則 · 設 timer 就好',
        bodyTemplate:
          '看到 {crowdedSpace} {crowdedRatio} 滿不要崩潰。設 15 分鐘 timer，能做多少算多少。15 分鐘到了無論狀態如何就停 — 明天再 15 分鐘。比起一次清空 3 小時然後 6 個月都不再碰，每天 15 分鐘有效 10 倍。',
        tags: ['gentle', 'kc-davis', 'flylady', '15-min'],
      },
    },
    {
      id: 'visible-storage-adhd',
      appliesWhen: { type: 'untieredCount', op: '>=', value: 10 },
      priority: 70,
      suggestion: {
        titleTemplate: '透明 / 開放收納（ADHD 友善）',
        bodyTemplate:
          'ADHD 大腦最大的特性是「眼不見為淨 = 真的失去」。把常用物品放透明盒、開放層架 — 不是不漂亮，是看得見才用得到。被門擋住的物品 ≈ 不存在。Amber Stash 的「標籤」tab 可印標籤，加強視覺索引。',
        tags: ['gentle', 'adhd', 'visible'],
      },
    },
    {
      id: 'no-shame-pace',
      appliesWhen: { type: 'frequencyCount', frequency: 'rarely', op: '>=', value: 15 },
      priority: 75,
      suggestion: {
        titleTemplate: '不評斷自己 · {rarely} 件很少用',
        bodyTemplate:
          '其他派會說「太多了該丟」。我說：先承認這些物品「目前」不被使用，不代表你錯了。給它們一個「保留 6 個月」的盒子 — 6 個月後沒拿出來再放手。這個緩衝期是給心理的，不是給物品的。',
        tags: ['gentle', 'kc-davis', 'self-compassion'],
      },
    },
    {
      id: 'closing-shift',
      appliesWhen: { type: 'categoryCount', category: '*', op: '>=', value: 20 },
      priority: 60,
      suggestion: {
        titleTemplate: '🛌 睡前 closing shift（5 分鐘版）',
        bodyTemplate:
          '睡前 5 分鐘把桌面 / 流理台 / 沙發大件物品歸位 — 不是大整理，只做「明天起床看了會比較舒服」的那些。沒做也沒關係，做了就獎勵自己。隔天會有 better start，不是因為「做完家事」，是因為環境給你一個 reset。',
        tags: ['gentle', 'kc-davis', 'closing-shift'],
      },
    },
    {
      id: 'permission-mess',
      appliesWhen: { type: 'overcapacity', ratio: 0.95 },
      priority: 90,
      suggestion: {
        titleTemplate: '🌿 允許今天就是亂',
        bodyTemplate:
          '{crowdedSpace} 已超過 95% 滿 — 我知道看了會煩躁。但今天如果你累 / 情緒不好 / 沒體力，**允許今天就是亂**。把所有衣服丟洗衣籃就好（即使是乾淨的）。明天清醒了再分類。功能 > 美觀。',
        tags: ['gentle', 'kc-davis', 'permission'],
      },
    },
    {
      id: 'body-doubling',
      appliesWhen: { type: 'frequencyCount', frequency: 'rarely', op: '>=', value: 20 },
      priority: 40,
      suggestion: {
        titleTemplate: '找人陪你整理（body doubling）',
        bodyTemplate:
          'ADHD / 高心理負擔的人，獨自做家務啟動成本最高。找朋友視訊一起做家務、或開 YouTube 看別人整理 — 「有人陪」就會降低啟動門檻 50%。不是要對方幫你做，只是「在」就好。',
        tags: ['gentle', 'kc-davis', 'body-doubling'],
      },
    },
    {
      id: 'empty',
      appliesWhen: { type: 'noItems' },
      priority: 100,
      suggestion: {
        titleTemplate: '今天開 app 就是進步',
        bodyTemplate:
          '你想到「整理」並打開 app — 已經跨出最難的一步。先什麼都不要做，只拍一張你最在意的角落的照片，建一個物品就好。明天再多一個。沒有時間表、沒有完成日。家為你服務，不是你為家服務。',
      },
    },
  ],
  shoppingRules: [
    {
      id: 'no-pressure-buy',
      appliesWhen: { type: 'categoryCount', category: '*', op: '>', value: 0 },
      pick: {
        nameTemplate: '💚 不買壓力收納品',
        reasonTemplate:
          '其他派可能會推薦你買透明盒 / 標籤機 / 收納推車。我說：先看你會不會用 — 收納品買來沒用是另一種雜亂。如果某派建議的工具你看了會煩，那就先別買。',
      },
    },
    {
      id: 'laundry-basket',
      appliesWhen: { type: 'overcapacity', ratio: 0.7 },
      pick: {
        nameTemplate: '大型洗衣籃（多個）',
        reasonTemplate:
          '今天累的時候，所有衣服 / 雜物丟洗衣籃就算完成。功能優先，明天有體力再分類。多買 2 個放各區域，降低分類門檻。',
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
