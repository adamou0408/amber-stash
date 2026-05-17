import type { Methodology } from '@/types/methodology';

/**
 * 佐藤可士和超整理術（near-port of Kashiwa Sato 方法論）
 * 內建示範方法論 — 正式版本須取得授權。
 *
 * 生命週期定位：mindset — 跳脫居家、從思考層面整理。
 * 適合工作者、設計師、創業者、學生 — 把整理當成「思考工具」。
 *
 * 核心：三層次整理
 *  - 空間整理（Space）— 桌面、書架、抽屜
 *  - 資訊整理（Info）— 數位檔案、雲端、訊息分類
 *  - 思考整理（Thinking）— 待辦、目標、優先順序
 *
 * 三層相互強化 — 桌面亂代表思緒亂。
 */
export const KASHIWA_SATO_METHODOLOGY: Methodology = {
  id: 'kashiwa-sato-zh',
  authorId: 'placeholder-kashiwa-sato',
  name: '佐藤可士和超整理術',
  description:
    '把整理當成「思考工具」— 桌面整潔不是為了好看，是為了讓大腦能專注於真正重要的事。三層次：空間 / 資訊 / 思考。適合工作者、設計師、創業者。',
  language: 'zh-TW',
  systemPrompt:
    '你是佐藤可士和風格的整理顧問。語氣冷靜、像設計師 — 強調「整理 = 找出本質」。每件物品問「這個物品幫助我達成什麼目標？」沒有目標的物品就是雜訊。常用「視覺整齊不夠，要邏輯整齊」這類比喻。對象不限居家，包含桌面、雲端、待辦清單。',
  lifecyclePhase: 'mindset',
  rules: [
    {
      id: 'desk-as-thinking-tool',
      appliesWhen: { type: 'hasSpaceKind', kind: 'desk' },
      priority: 100,
      suggestion: {
        titleTemplate: '🖥️ 桌面 = 思考工具',
        bodyTemplate:
          '佐藤可士和的辦公桌每天清空到「只剩電腦」。理由不是潔癖 — 是讓大腦進入空間時零干擾，只專注當前任務。試試一週：每天下班前清空桌面。一週後你會發現思緒清晰度的差別。',
        tags: ['kashiwa-sato', 'desk-blank'],
      },
    },
    {
      id: 'remove-noise',
      appliesWhen: { type: 'frequencyCount', frequency: 'rarely', op: '>=', value: 10 },
      priority: 90,
      suggestion: {
        titleTemplate: '🎯 {rarely} 件物品 = {rarely} 個雜訊',
        bodyTemplate:
          '每件 rarely 物品問：「它幫助我達成什麼目標？」如果答案是「以後可能會用到」 = 沒有目標 = 雜訊。不要被「實用 / 不實用」分類困住，而是「對齊目標 / 不對齊目標」。',
        tags: ['kashiwa-sato', 'goal-alignment'],
      },
    },
    {
      id: 'three-layer-organization',
      appliesWhen: { type: 'categoryCount', category: '*', op: '>=', value: 30 },
      priority: 80,
      suggestion: {
        titleTemplate: '📐 三層次整理 · 別只整理桌面',
        bodyTemplate:
          '桌面整理 + 數位檔案整理 + 待辦清單整理 = 三位一體。只做一層效果有限。建議今週：① 物理桌面清空（佐藤式）、② 雲端文件依專案歸檔、③ 待辦清單砍掉超過 30 天沒動的。三層一起做，思緒清晰度翻倍。',
        tags: ['kashiwa-sato', 'three-layer'],
      },
    },
    {
      id: 'essence-question',
      appliesWhen: { type: 'categoryCount', category: 'documents', op: '>=', value: 5 },
      priority: 75,
      suggestion: {
        titleTemplate: '📑 文件 · 問「本質問題是什麼？」',
        bodyTemplate:
          '文件 {documents} 件 — 別按類別分類，按「解決什麼問題」分類。例：合約類 → 「保護法律權益」、發票類 → 「報稅依據」、課程筆記 → 「未來工作可參考」。同類本質的文件放一起，找的時候用「我要解決什麼」找。',
        tags: ['kashiwa-sato', 'essence'],
      },
    },
    {
      id: 'eliminate-decision-points',
      appliesWhen: { type: 'frequencyCount', frequency: 'daily', op: '>=', value: 5 },
      priority: 70,
      suggestion: {
        titleTemplate: '⚡ 減少每日決策點',
        bodyTemplate:
          '你有 {daily} 件每天用的物品。為每件物品定「唯一的家」— 不准有第二位置。決策疲勞是消耗大腦的最大隱形成本（Roy F. Baumeister 1998）。鑰匙永遠在玄關托盤、手機永遠在床頭充電盤、保溫瓶永遠在書桌右上 — 少 1 個「我放哪去了」就多 1 分能量。',
        tags: ['kashiwa-sato', 'decision-fatigue'],
      },
    },
    {
      id: 'mock-uniqlo-method',
      appliesWhen: { type: 'categoryCount', category: 'clothing', op: '>=', value: 20 },
      priority: 50,
      suggestion: {
        titleTemplate: '👕 借用 UNIQLO 商業邏輯整理衣物',
        bodyTemplate:
          '佐藤幫 UNIQLO 整理品牌時的核心：「我們不是賣衣服，是賣 LifeWear」— 一句話定位後，所有商品都歸位。試試對你的衣櫃做同樣的事 — 用一句話定義你的穿衣身分（「上班 + 假日輕鬆」），然後檢視 {clothing} 件衣物哪些對齊。',
        tags: ['kashiwa-sato', 'branding-applied'],
      },
    },
    {
      id: 'visual-information-density',
      appliesWhen: { type: 'overcapacity', ratio: 0.7 },
      priority: 60,
      suggestion: {
        titleTemplate: '👁️ 視覺密度 = 認知負擔',
        bodyTemplate:
          '{crowdedSpace} 已 {crowdedRatio} 滿。即使每件物品都有用，眼睛看到的「視覺密度」會直接增加大腦的認知負擔。佐藤的設計原則：「留白不是空白，是讓重要的事被看見」。減 20% 不是為了空間，是為了腦袋。',
        tags: ['kashiwa-sato', 'cognitive-load'],
      },
    },
    {
      id: 'empty',
      appliesWhen: { type: 'noItems' },
      priority: 100,
      suggestion: {
        titleTemplate: '從一個問題開始：你想成為什麼樣的人？',
        bodyTemplate:
          '佐藤整理 UNIQLO 前先問「這個品牌想成為什麼？」整理家也是 — 你想要什麼樣的日常？把這個答案寫在一張紙上、貼在你最常看到的地方。之後所有物品的去留決策都回到這張紙。然後從你最常工作的桌面開始建檔。',
      },
    },
  ],
  shoppingRules: [
    {
      id: 'desk-organizer-minimal',
      appliesWhen: { type: 'categoryCount', category: 'documents', op: '>=', value: 5 },
      pick: {
        nameTemplate: 'MUJI 聚丙烯立式斜口檔案盒 A4',
        reasonTemplate:
          '佐藤推崇的「無印良品式」收納 — 規格統一、邏輯清楚、視覺極簡。一個 NT$ 199，買 3-5 個就能改變整個桌面的視覺密度。',
        brand: 'MUJI',
        sku: 'PP 立式斜口檔案盒 A4',
        priceTwdMin: 199,
        priceTwdMax: 199,
      },
    },
    {
      id: 'notion-or-similar',
      appliesWhen: { type: 'categoryCount', category: 'documents', op: '>=', value: 10 },
      pick: {
        nameTemplate: '數位筆記工具（Notion / Obsidian / Apple Notes）',
        reasonTemplate:
          '三層次整理的「資訊整理」基礎工具。紙本文件掃描存雲端、依「本質問題」開資料夾。免費版通常夠用。',
        priceTwdMin: 0,
        priceTwdMax: 300,
      },
    },
  ],
  appliesTo: ['documents', 'books', 'electronics', 'other'],
  pricing: { kind: 'free' },
  version: 1,
};
