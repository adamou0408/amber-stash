import type { Item, ItemCategory, Space, Suggestion } from '@/types';

const RULES: Partial<Record<ItemCategory, (count: number) => string>> = {
  clothing: (n) =>
    n >= 10
      ? `衣物有 ${n} 件，建議以「直立摺疊 + 分類顏色」收進抽屜，方便一眼看清。可加抽屜分隔板，避免疊放後翻找凌亂。`
      : `衣物不多，可按用途（外出 / 居家 / 季節）掛在衣櫃同一區，下方留出鞋盒空間。`,
  kitchen: (n) =>
    `廚房用品 ${n} 件：常用 8 成放「黃金高度」櫃內（腰至胸），備用品收上層或抽屜後段。乾貨建議統一密封罐，標籤朝外。`,
  books: (n) =>
    n >= 20
      ? `${n} 本書建議分「在讀 / 待讀 / 已讀」三區，垂直立放避免疊放。可考慮捐出已讀的非工具書釋出空間。`
      : `書量不多，可橫向交錯立放於書桌層架，搭配書檔即可。`,
  electronics: () =>
    `電子產品的線材最容易亂：建議用魔鬼氈束線帶 + 標籤捲收，集中收一個盒子。充電器只留常用 1-2 個。`,
  documents: () =>
    `文件分「必留（身分 / 保單 / 房契）/ 短期保存（一年內報稅）/ 廢棄」三層，必留掃描備份後縮減紙本。`,
  cosmetics: () =>
    `美妝保養請以「使用頻率」排序，常用放轉盤或前排，季節性收抽屜。檢查保存期限，過期清掉是最大效益。`,
  toys: () =>
    `玩具用「透明收納箱 + 圖卡標籤」讓孩子自己收。建議輪替收納：一半收起來，一個月換一次保持新鮮感。`,
  tools: () =>
    `工具掛上洞洞板或磁吸條，能「站著看見」就不會重複買。耗材（螺絲、釘子）用透明小盒分類。`,
  sentimental: () =>
    `紀念品請設「一個盒子原則」：滿了就要做取捨。重要的可拍照數位化保存。`,
};

export function generateSuggestions(items: Item[], spaces: Space[]): Suggestion[] {
  const result: Suggestion[] = [];

  const byCategory = items.reduce<Record<string, number>>((acc, it) => {
    acc[it.category] = (acc[it.category] ?? 0) + it.quantity;
    return acc;
  }, {});

  Object.entries(byCategory).forEach(([cat, count]) => {
    const fn = RULES[cat as ItemCategory];
    if (!fn) return;
    result.push({
      id: `cat-${cat}`,
      title: `${cat} · ${count} 件`,
      body: fn(count),
    });
  });

  if (spaces.length === 0 && items.length > 0) {
    result.unshift({
      id: 'no-space',
      title: '先描述一下你的空間',
      body: '你已經建了物品清單，但還沒設定空間。建立衣櫃 / 抽屜 / 書桌等空間後，可以拿到更精準的分區建議。',
    });
  }

  if (items.length === 0) {
    result.push({
      id: 'empty',
      title: '從一個抽屜開始',
      body: '建議從最常用、最亂的一個抽屜或櫃子開始拍照建檔。完成第一個小區域，再擴張到整個房間。',
    });
  }

  return result;
}

export function generateShoppingPicks(items: Item[], spaces: Space[]): { name: string; reason: string }[] {
  const picks: { name: string; reason: string }[] = [];
  const counts = items.reduce<Record<string, number>>((acc, it) => {
    acc[it.category] = (acc[it.category] ?? 0) + it.quantity;
    return acc;
  }, {});

  if ((counts.clothing ?? 0) >= 10) {
    picks.push({ name: '抽屜分隔收納盒（衣物用）', reason: `衣物 ${counts.clothing} 件，分隔後直立摺好取拿更直覺` });
  }
  if ((counts.kitchen ?? 0) >= 5) {
    picks.push({ name: '密封儲物罐 4 件組', reason: '乾貨統一收納並貼標籤' });
  }
  if ((counts.books ?? 0) >= 10) {
    picks.push({ name: '金屬書檔 2 入', reason: '避免書本傾倒、便於分區' });
  }
  if ((counts.electronics ?? 0) >= 3) {
    picks.push({ name: '魔鬼氈束線帶 + 標籤', reason: '整理線材、避免打結' });
  }
  if ((counts.toys ?? 0) >= 8) {
    picks.push({ name: '透明翻蓋收納箱', reason: '玩具輪替制收納' });
  }
  if (spaces.some((s) => s.kind === 'wardrobe')) {
    picks.push({ name: '伸縮收納層板', reason: '衣櫃上方常見死角可加層板' });
  }
  return picks;
}
