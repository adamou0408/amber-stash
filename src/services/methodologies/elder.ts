import type { Methodology } from '@/types/methodology';

/**
 * 銀髮 / 遺物前期整理（為 2026 台灣超高齡社會設計）
 * 內建示範方法論 — 整合廖心筠 / 何安蒔的遺物整理智慧 + 銀髮人因工學。
 *
 * 生命週期定位：gentle-reset — 給長輩、給家屬陪長輩整理、給自己預先做傳承標記。
 *
 * 核心：
 * - 銀髮取物高度 = 肚臍至肩膀（不是腰至眼睛），重物要下放
 * - 地板防滑、藥盒、衣櫃頂端禁放重物（地震多）
 * - 遺物整理「不要急著丟，給家屬 3 個月情緒平復」
 * - 生前整理（end-of-life prep）— 預先標記哪些要傳給誰
 */
export const ELDER_METHODOLOGY: Methodology = {
  id: 'elder-zh',
  authorId: 'placeholder-elder-care',
  name: '銀髮 / 傳承整理',
  description:
    '為 65+ 長輩、陪伴整理的家屬、或預先做生前整理的人設計。重點是身體安全 + 物品傳承 — 不是減量。融合廖心筠遺物整理智慧。',
  language: 'zh-TW',
  systemPrompt:
    '你是專門服務銀髮族與遺物整理的顧問。語氣極度尊重、不催促、不暗示「東西太多」。長輩的物品承載一輩子的記憶 — 整理是「為了下一階段的生活更方便」，不是「為了清空」。陪伴家屬整理遺物時：給時間、不替亡者做決定、保留家屬還沒準備好放手的物品。',
  lifecyclePhase: 'gentle-reset',
  rules: [
    {
      id: 'elder-golden-zone-redefined',
      appliesWhen: { type: 'frequencyCount', frequency: 'daily', op: '>=', value: 3 },
      priority: 100,
      suggestion: {
        titleTemplate: '🧓 銀髮黃金區 = 肚臍至肩（不是腰至眼）',
        bodyTemplate:
          '長輩取物的省力區段比年輕人窄 — 高處抬手會閃肩、低處彎腰會傷腰。把每天用的 {daily} 件物品移到「肚臍至肩」高度。原本黃金區（腰至眼睛）中靠上的範圍對銀髮反而吃力。',
        tags: ['elder', 'ergonomics'],
      },
    },
    {
      id: 'top-shelf-no-heavy',
      appliesWhen: { type: 'hasSpaceKind', kind: 'wardrobe' },
      priority: 95,
      suggestion: {
        titleTemplate: '⚠️ 衣櫃頂端禁放重物（地震多）',
        bodyTemplate:
          '台灣地震頻繁。衣櫃 / 高櫃頂端只放「掉下來不會傷人」的物品 — 棉被、絨毛玩具、空盒。**禁放**：書、瓶罐、相框、玻璃飾品。長輩反應比較慢，掉下來閃避不及。',
        tags: ['elder', 'safety', 'earthquake'],
      },
    },
    {
      id: 'medicine-pillbox',
      appliesWhen: { type: 'categoryCount', category: 'cosmetics', op: '>=', value: 1 },
      priority: 80,
      suggestion: {
        titleTemplate: '💊 28 格藥盒輔助服藥',
        bodyTemplate:
          '長輩多重用藥 + 記憶力下降 → 用「一週 4 時段 = 28 格藥盒」每週分裝一次。漏吃 / 重吃都看得見。藥盒固定放餐桌旁（不是浴室藥櫃 — 太遠 / 太濕）。家人可一眼確認服藥狀況。',
        tags: ['elder', 'medication'],
      },
    },
    {
      id: 'floor-anti-slip',
      appliesWhen: { type: 'overcapacity', ratio: 0.7 },
      priority: 70,
      suggestion: {
        titleTemplate: '🦶 地板淨空 = 防跌倒最大杠桿',
        bodyTemplate:
          '長輩跌倒 80% 發生在家裡，地板雜物是首因。{crowdedSpace} 滿 {crowdedRatio} — 但更該優先處理的是「動線地板上有沒有絆腳物」。地毯壓不平、延長線在地、雜物堆在走道，這些比櫃內亂更危險。可申請衛福部「居家無障礙環境改善補助」（1966 專線）。',
        tags: ['elder', 'safety', 'fall-prevention'],
      },
    },
    {
      id: 'heritage-mark-while-alive',
      appliesWhen: { type: 'categoryCount', category: 'sentimental', op: '>=', value: 1 },
      priority: 85,
      suggestion: {
        titleTemplate: '📝 生前整理 · 趁現在標記傳承',
        bodyTemplate:
          '不是悲觀，是務實 — 為紀念性物品標註「想留給誰」，避免後代「不敢丟也不知道誰要」。Amber Stash 的備註欄可寫「未來給女兒」「家族祖傳，給長孫」。標完之後物品還是你的、繼續用，但日後處理時家人有方向。',
        tags: ['elder', 'inheritance', 'end-of-life-prep'],
      },
    },
    {
      id: 'inheritance-3-month-buffer',
      appliesWhen: { type: 'heirloomCount', op: '>=', value: 1 },
      priority: 90,
      suggestion: {
        titleTemplate: '🏛️ 遺物 {heirloom} 件 — 給 3 個月情緒沉澱',
        bodyTemplate:
          '廖心筠（華人第一位遺物整理師）的核心建議：**親人剛過世後 3 個月內不做減量決定**。情緒沒平復前丟掉的物品，事後會後悔。先建立一個「傳承櫃」集中放，慢慢來。每週進去看一次，自然會有些物品「準備好放手」、有些還想留 — 都尊重。',
        tags: ['elder', 'bereavement', 'inheritance'],
      },
    },
    {
      id: 'multi-gen-shared-storage',
      appliesWhen: { type: 'categoryCount', category: '*', op: '>=', value: 100 },
      priority: 60,
      suggestion: {
        titleTemplate: '🏠 多代同堂的物品邊界',
        bodyTemplate:
          '台灣常見「爸媽家變子女倉庫」— 何安蒔直言「爸媽家不是孩子的倉庫」。如果你的空間有子女搬出去後留下的物品，明定期限：「3 個月內請回來帶走，否則由我處置」。對方通常拖了又拖、但有期限就會行動。',
        tags: ['elder', 'multi-generational'],
      },
    },
    {
      id: 'reduce-not-empty',
      appliesWhen: { type: 'frequencyCount', frequency: 'rarely', op: '>=', value: 20 },
      priority: 50,
      suggestion: {
        titleTemplate: '不是清空，是減負擔',
        bodyTemplate:
          '對銀髮族不適合「全部拿出來」式的大整理 — 體力負擔太重、心理衝擊太大。每次只處理一個小範圍（一個抽屜、一個架子），花 30 分鐘就停。一週 1-2 次，半年累積就有大改變。**不要追求一次清空。**',
        tags: ['elder', 'gentle-pace'],
      },
    },
    {
      id: 'empty',
      appliesWhen: { type: 'noItems' },
      priority: 100,
      suggestion: {
        titleTemplate: '從一個藥盒 / 一個鑰匙位開始',
        bodyTemplate:
          '銀髮整理的第一步通常是「安全相關」— 藥盒固定位置、鑰匙固定位置、手機充電器固定位置。這三樣是每天的「儀式」基礎。先把這三個小空間拍照建檔，後面再慢慢擴張。',
      },
    },
  ],
  shoppingRules: [
    {
      id: 'pillbox-28',
      appliesWhen: { type: 'categoryCount', category: 'cosmetics', op: '>=', value: 1 },
      pick: {
        nameTemplate: '一週 4 時段藥盒（28 格）',
        reasonTemplate: '長輩多重用藥的記憶輔助。藥局 / 蝦皮通用品。',
        priceTwdMin: 150,
        priceTwdMax: 500,
      },
    },
    {
      id: 'anti-slip-mat',
      appliesWhen: { type: 'hasSpaceKind', kind: 'other' },
      pick: {
        nameTemplate: '浴室 / 走道防滑墊',
        reasonTemplate: '跌倒是長輩最大居家風險，比減量更該優先投資。',
        brand: '3M',
        priceTwdMin: 200,
        priceTwdMax: 800,
      },
    },
    {
      id: 'grab-bar',
      appliesWhen: { type: 'categoryCount', category: '*', op: '>', value: 0 },
      pick: {
        nameTemplate: '浴室 / 床邊扶手桿',
        reasonTemplate:
          '可申請衛福部「居家無障礙環境改善補助」(1966 專線)，部分縣市最高補助 NT$ 20,000。',
        priceTwdMin: 800,
        priceTwdMax: 5000,
      },
    },
  ],
  appliesTo: [
    'clothing',
    'kitchen',
    'documents',
    'cosmetics',
    'sentimental',
    'other',
  ],
  pricing: { kind: 'free' },
  version: 1,
};
