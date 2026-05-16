import type { Methodology } from '@/types/methodology';

export const KONMARI_METHODOLOGY: Methodology = {
  id: 'konmari-zh',
  authorId: 'placeholder-expert',
  name: '怦然心動式（範例）',
  description: '依「物品種類順序」整理、留下會讓你怦然心動的物品。此為示範方法論，正式版會由認證收納師授權。',
  language: 'zh-TW',
  systemPrompt:
    '你是一位「怦然心動」風格的收納顧問。依物品種類順序處理（衣物 → 書籍 → 文件 → 小物 → 紀念品）。每個建議要引導使用者問「拿在手上會怦然心動嗎？」如果不會，建議感謝後放手。語氣溫柔但堅定。',
  rules: [
    {
      id: 'clothing-first',
      appliesWhen: { type: 'categoryCount', category: 'clothing', op: '>=', value: 1 },
      priority: 100,
      suggestion: {
        titleTemplate: '從衣物開始（{clothing} 件）',
        bodyTemplate:
          '把所有衣物先全部拿出來堆在一起 — 看到「總量」是第一步。一件一件拿起來問「會讓你怦然心動嗎？」會的留下、不會的感謝後放手。順序：衣物 → 書 → 文件 → 小物 → 紀念品。',
        tags: ['konmari', 'step-1'],
      },
    },
    {
      id: 'books-second',
      appliesWhen: { type: 'categoryCount', category: 'books', op: '>=', value: 1 },
      priority: 90,
      suggestion: {
        titleTemplate: '接著處理書籍（{books} 件）',
        bodyTemplate:
          '把所有書放到地上，不要在書櫃上挑。每本拿起來感受，留下「現在」會讓你心動的。「之後可能會看」通常代表現在不需要。',
        tags: ['konmari', 'step-2'],
      },
    },
    {
      id: 'documents-third',
      appliesWhen: { type: 'categoryCount', category: 'documents', op: '>=', value: 1 },
      priority: 80,
      suggestion: {
        titleTemplate: '文件原則：原則上全部丟（{documents} 件）',
        bodyTemplate:
          '文件不會讓人怦然心動。只留「現在還在用 / 不確定一段時間 / 必須留」三類，其他丟掉。重要的掃描存雲端。',
        tags: ['konmari', 'step-3'],
      },
    },
    {
      id: 'sentimental-last',
      appliesWhen: { type: 'categoryCount', category: 'sentimental', op: '>=', value: 1 },
      priority: 70,
      suggestion: {
        titleTemplate: '紀念品留到最後（{sentimental} 件）',
        bodyTemplate:
          '紀念品最難處理，因為承載感情。前面練習過了再來處理。一件一件拿起來，問「現在的我，需要這個物品嗎？」',
        tags: ['konmari', 'step-5'],
      },
    },
    {
      id: 'empty',
      appliesWhen: { type: 'noItems' },
      priority: 100,
      suggestion: {
        titleTemplate: '先列出你想處理的類別',
        bodyTemplate:
          '怦然心動式的核心是「依類別整理而非依房間」。先把你最想處理的類別所有物品拍進來，再開始決定哪些留下。',
      },
    },
  ],
  shoppingRules: [
    {
      id: 'no-buy-first',
      appliesWhen: { type: 'categoryCount', category: '*', op: '>', value: 0 },
      pick: {
        nameTemplate: '⚠️ 先別買收納用品',
        reasonTemplate: '怦然心動法的原則是「先精簡、再收納」。先完成減量，再決定要買什麼盒子。',
      },
    },
  ],
  appliesTo: ['clothing', 'books', 'documents', 'sentimental', 'other'],
  pricing: { kind: 'subscription', monthlyTwd: 79 },
  version: 1,
};
