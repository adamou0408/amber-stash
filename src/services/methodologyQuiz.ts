/**
 * 方法論問答推薦系統 — 使用者 onboarding 用 5 題引導找出最適合的派。
 *
 * 設計依據（第一性原理）：10 派沿著 7 個差異軸分布，5 題剛好能定位。
 * 每題每選項給數派加分；最後 score 加總，取 top 1 推薦、展示 top 3。
 *
 * 與 CIR 自評的關係：
 *  - CIR 是「需不需要尋求專業協助」的安全網（醫療層）
 *  - Quiz 是「適合哪種 mindset」的偏好引導（風格層）
 *  - 兩者互補：severe → 直接給 gentle 不問 quiz；light/moderate → 走 quiz
 */

import type { Methodology } from '@/types/methodology';

/** 一題 quiz 的選項，給某些方法論加 weight 分 */
export type QuizAnswerScore = {
  methodologyId: string;
  weight: number;
};

export type QuizOption = {
  id: string;
  label: string;
  scores: QuizAnswerScore[];
};

export type QuizQuestion = {
  id: string;
  /** 涵蓋的差異軸 — 給 debug / doc 用 */
  axis: string;
  text: string;
  options: QuizOption[];
};

/**
 * 核心 5 題，順序刻意安排：
 *  Q1 (痛點) → Q2 (情感) → Q3 (節奏) → Q4 (居住) → Q5 (目標)
 * 從「為什麼想整理」到「整理後要什麼」，使用者體驗連貫。
 */
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'pain',
    axis: '痛點切入',
    text: 'Q1 · 你目前的整理痛點，最接近哪一個？',
    options: [
      {
        id: 'too-much',
        label: '東西太多，每件都覺得「以後可能會用」',
        scores: [
          { methodologyId: 'danshari-zh', weight: 3 },
          { methodologyId: 'konmari-zh', weight: 2 },
        ],
      },
      {
        id: 'cant-find',
        label: '東西不知道該放哪，找東西很花時間',
        scores: [
          { methodologyId: 'liaohsinyun-zh', weight: 3 },
          { methodologyId: 'amberstash-default', weight: 2 },
        ],
      },
      {
        id: 'not-pretty',
        label: '想要家裡看起來像 IG 那種美',
        scores: [
          { methodologyId: 'home-edit-zh', weight: 3 },
        ],
      },
      {
        id: 'cant-maintain',
        label: '整理過很多次，但永遠維持不住',
        scores: [
          { methodologyId: 'gentle-zh', weight: 3 },
          { methodologyId: 'amberstash-default', weight: 1 },
        ],
      },
      {
        id: 'change-thinking',
        label: '想透過整理改變我的思考方式',
        scores: [
          { methodologyId: 'kashiwa-sato-zh', weight: 3 },
          { methodologyId: 'danshari-zh', weight: 1 },
        ],
      },
    ],
  },
  {
    id: 'emotion',
    axis: '情感切入',
    text: 'Q2 · 對「捨棄物品」這件事，你的感覺最接近？',
    options: [
      {
        id: 'soft-heart',
        label: '我容易心軟，看到回憶就捨不得',
        scores: [
          { methodologyId: 'konmari-zh', weight: 3 },
          { methodologyId: 'liaohsinyun-zh', weight: 2 },
        ],
      },
      {
        id: 'rational',
        label: '我能理性決定，看是否還有用',
        scores: [
          { methodologyId: 'danshari-zh', weight: 3 },
          { methodologyId: 'kashiwa-sato-zh', weight: 2 },
        ],
      },
      {
        id: 'keep-ok',
        label: '我捨不得也沒關係，留著也好',
        scores: [
          { methodologyId: 'gentle-zh', weight: 3 },
          { methodologyId: 'elder-zh', weight: 2 },
        ],
      },
      {
        id: 'family-burden',
        label: '紀念品 / 祖傳物特別難處理',
        scores: [
          { methodologyId: 'liaohsinyun-zh', weight: 3 },
          { methodologyId: 'elder-zh', weight: 2 },
        ],
      },
    ],
  },
  {
    id: 'tempo',
    axis: '節奏切入',
    text: 'Q3 · 你想花多少時間在整理上？',
    options: [
      {
        id: 'weekend-marathon',
        label: '給我一個週末全力以赴一次處理完',
        scores: [
          { methodologyId: 'konmari-zh', weight: 3 },
          { methodologyId: 'wardrobe-doctor-zh', weight: 2 },
        ],
      },
      {
        id: 'daily-15min',
        label: '每天 5-15 分鐘，慢慢累積',
        scores: [
          { methodologyId: 'gentle-zh', weight: 3 },
          { methodologyId: 'amberstash-default', weight: 2 },
          { methodologyId: 'liaohsinyun-zh', weight: 1 },
        ],
      },
      {
        id: 'mindset-first',
        label: '不要先動手，先想清楚為什麼整理',
        scores: [
          { methodologyId: 'danshari-zh', weight: 3 },
          { methodologyId: 'kashiwa-sato-zh', weight: 3 },
        ],
      },
      {
        id: 'low-energy',
        label: '我沒體力 / 沒心力做大整理',
        scores: [
          { methodologyId: 'gentle-zh', weight: 3 },
          { methodologyId: 'elder-zh', weight: 2 },
        ],
      },
    ],
  },
  {
    id: 'housing',
    axis: '居住切入',
    text: 'Q4 · 你的居住狀況最接近哪個？',
    options: [
      {
        id: 'normal',
        label: '自有 / 長期租 / 25 坪以上 / 可裝修',
        scores: [
          { methodologyId: 'amberstash-default', weight: 1 },
          { methodologyId: 'home-edit-zh', weight: 1 },
        ],
      },
      {
        id: 'micro',
        label: '小坪數 / 套房 / 20 坪以下',
        scores: [
          // 居住限制是客觀事實，給高權重
          { methodologyId: 'micro-rental-zh', weight: 5 },
        ],
      },
      {
        id: 'rental',
        label: '租屋 / 不能釘牆 / 隨時可能搬家',
        scores: [
          { methodologyId: 'micro-rental-zh', weight: 5 },
        ],
      },
      {
        id: 'multi-gen',
        label: '多代同堂 / 跟長輩同住',
        scores: [
          { methodologyId: 'liaohsinyun-zh', weight: 4 },
          { methodologyId: 'elder-zh', weight: 3 },
        ],
      },
      {
        id: 'elder-self',
        label: '我是長輩 / 主要為長輩整理',
        scores: [
          { methodologyId: 'elder-zh', weight: 5 },
        ],
      },
    ],
  },
  {
    id: 'goal',
    axis: '目標切入',
    text: 'Q5 · 整理完之後，你最想看到什麼？',
    options: [
      {
        id: 'visual-pretty',
        label: '像 IG 美照那樣的視覺整齊',
        scores: [
          { methodologyId: 'home-edit-zh', weight: 3 },
        ],
      },
      {
        id: 'find-fast',
        label: '找東西比以前快、不用翻',
        scores: [
          { methodologyId: 'liaohsinyun-zh', weight: 3 },
          { methodologyId: 'amberstash-default', weight: 2 },
        ],
      },
      {
        id: 'mental-calm',
        label: '心情變平靜，不被物品壓力',
        scores: [
          { methodologyId: 'danshari-zh', weight: 3 },
          { methodologyId: 'konmari-zh', weight: 2 },
        ],
      },
      {
        id: 'sustainable',
        label: '半年後家裡還能維持這樣',
        scores: [
          { methodologyId: 'gentle-zh', weight: 2 },
          { methodologyId: 'amberstash-default', weight: 2 },
        ],
      },
      {
        id: 'productivity',
        label: '工作 / 學習效率提升',
        scores: [
          { methodologyId: 'kashiwa-sato-zh', weight: 3 },
        ],
      },
      {
        id: 'wardrobe-focus',
        label: '我只關心衣櫥 / 穿搭',
        scores: [
          { methodologyId: 'wardrobe-doctor-zh', weight: 3 },
        ],
      },
    ],
  },
];

export type SelectedAnswers = Record<string, string>; // questionId -> optionId

/**
 * 計分：跑過所有選擇的答案，加總各方法論的 weight。
 */
export function scoreQuiz(answers: SelectedAnswers): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const q of QUIZ_QUESTIONS) {
    const chosenOptionId = answers[q.id];
    if (!chosenOptionId) continue;
    const option = q.options.find((o) => o.id === chosenOptionId);
    if (!option) continue;
    for (const s of option.scores) {
      scores[s.methodologyId] = (scores[s.methodologyId] ?? 0) + s.weight;
    }
  }
  return scores;
}

/**
 * 回傳 top N 推薦（依分數降序）。
 */
export function topRecommendations(
  scores: Record<string, number>,
  allMethodologies: Methodology[],
  n: number = 3,
): { methodology: Methodology; score: number }[] {
  return allMethodologies
    .map((m) => ({ methodology: m, score: scores[m.id] ?? 0 }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}
