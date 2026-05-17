import type { Expert, LifecyclePhase, Methodology } from '@/types/methodology';
import { DEFAULT_METHODOLOGY } from './default';
import { KONMARI_METHODOLOGY } from './konmari';
import { DANSHARI_METHODOLOGY } from './danshari';
import { HOME_EDIT_METHODOLOGY } from './homeEdit';
import { LIAOHSINYUN_METHODOLOGY } from './liaohsinyun';
import { GENTLE_METHODOLOGY } from './gentle';
import { WARDROBE_DOCTOR_METHODOLOGY } from './wardrobeDoctor';
import { ELDER_METHODOLOGY } from './elder';
import { MICRO_RENTAL_METHODOLOGY } from './microRental';
import { KASHIWA_SATO_METHODOLOGY } from './kashiwaSato';

export const ALL_METHODOLOGIES: Methodology[] = [
  DEFAULT_METHODOLOGY,
  DANSHARI_METHODOLOGY,
  KASHIWA_SATO_METHODOLOGY,
  KONMARI_METHODOLOGY,
  WARDROBE_DOCTOR_METHODOLOGY,
  LIAOHSINYUN_METHODOLOGY,
  MICRO_RENTAL_METHODOLOGY,
  HOME_EDIT_METHODOLOGY,
  GENTLE_METHODOLOGY,
  ELDER_METHODOLOGY,
];

export const ALL_EXPERTS: Expert[] = [
  {
    id: 'amberstash-system',
    displayName: 'Amber Stash 系統',
    bio: '系統內建方法論作者。提供通用收納規則，作為所有使用者的預設選擇。',
    methodologyIds: [DEFAULT_METHODOLOGY.id],
  },
  {
    id: 'placeholder-konmari',
    displayName: '近藤麻理惠（示範移植）',
    bio: '《怦然心動的人生整理魔法》作者。本方法論為示範性質移植 — 正式合作需取得 KonMari Inc. 授權。',
    methodologyIds: [KONMARI_METHODOLOGY.id],
  },
  {
    id: 'placeholder-yamashita',
    displayName: '山下英子（示範移植）',
    bio: '《斷捨離》作者，瑜伽行者出身。本方法論為示範性質移植，重點是建立心法層 — 不是技巧。',
    methodologyIds: [DANSHARI_METHODOLOGY.id],
  },
  {
    id: 'placeholder-home-edit',
    displayName: 'Clea & Joanna（示範移植）',
    bio: 'The Home Edit 創辦人，Netflix《Get Organized with The Home Edit》主持。彩虹分類、透明盒美學的代表。本方法論為示範性質移植。',
    methodologyIds: [HOME_EDIT_METHODOLOGY.id],
  },
  {
    id: 'placeholder-liaohsinyun',
    displayName: '廖心筠（示範移植）',
    bio: '台灣第一位到府整理師，「聯想性收納法」創始者。重視家庭關係與華人文化包袱。本方法論為示範移植 — 正式合作須取得本人授權。',
    methodologyIds: [LIAOHSINYUN_METHODOLOGY.id],
  },
  {
    id: 'placeholder-kc-davis',
    displayName: 'KC Davis（示範移植）',
    bio: '美國治療師，《How to Keep House While Drowning》作者。專注 ADHD 與心理負擔重者的「寬容派」整理。本方法論為示範性質移植。',
    methodologyIds: [GENTLE_METHODOLOGY.id],
  },
  {
    id: 'placeholder-laitinghe',
    displayName: '賴庭荷 衣櫥醫生（示範移植）',
    bio: '自 2016 治療逾 400 個衣櫥的衣物專科整理師。對 LGBTQ+ 中性穿搭友善。本方法論為示範移植。',
    methodologyIds: [WARDROBE_DOCTOR_METHODOLOGY.id],
  },
  {
    id: 'placeholder-elder-care',
    displayName: 'Amber Stash 銀髮照護版',
    bio: '整合廖心筠遺物整理智慧 + 何安蒔多代關係視角 + 銀髮人因工學的綜合方法論。為 2026 台灣超高齡社會設計。',
    methodologyIds: [ELDER_METHODOLOGY.id],
  },
  {
    id: 'placeholder-micro-rental',
    displayName: 'Amber Stash 小坪數版',
    bio: '為台灣都會 25 坪以下、租屋族設計。3M 無痕 / 伸縮桿 / 多功能家具 / 搬家友善 — 整合多位收納師的小宅實戰建議。',
    methodologyIds: [MICRO_RENTAL_METHODOLOGY.id],
  },
  {
    id: 'placeholder-kashiwa-sato',
    displayName: '佐藤可士和（示範移植）',
    bio: '日本品牌設計大師，UNIQLO / 樂天 / 國立新美術館 CI 操刀者。《超整理術》作者。本方法論為示範移植。',
    methodologyIds: [KASHIWA_SATO_METHODOLOGY.id],
  },
];

export function getMethodology(id: string): Methodology | undefined {
  return ALL_METHODOLOGIES.find((m) => m.id === id);
}

export function getExpertFor(methodologyId: string): Expert | undefined {
  return ALL_EXPERTS.find((e) => e.methodologyIds.includes(methodologyId));
}

/**
 * 取得某 lifecycle phase 推薦的方法論（取第一個 match）。
 */
export function methodologyForPhase(phase: LifecyclePhase): Methodology {
  const found = ALL_METHODOLOGIES.find((m) => m.lifecyclePhase === phase);
  return found ?? DEFAULT_METHODOLOGY;
}

/** 取得某 phase 的所有方法論 */
export function methodologiesForPhase(phase: LifecyclePhase): Methodology[] {
  return ALL_METHODOLOGIES.filter((m) => m.lifecyclePhase === phase);
}

/**
 * CIR 雜物影像評估量表簡化版（Frost CIR 量表的 app 落地）
 *  - light:   輕度 — 桌面有點亂、抽屜需要花時間找東西
 *  - moderate: 中度 — 視線範圍內有明顯堆積、不時要繞道
 *  - severe:  重度 — 房間功能受影響、無法正常使用
 *
 * 重度應建議尋求專業協助（CBT + 整理師三方協作）。
 */
export type CIRLevel = 'light' | 'moderate' | 'severe';

export const CIR_LABEL: Record<CIRLevel, string> = {
  light: '輕度雜亂',
  moderate: '中度困擾',
  severe: '重度（需專業協助）',
};

export const CIR_DESCRIPTION: Record<CIRLevel, string> = {
  light: '桌面 / 局部抽屜亂，但每個房間仍能正常使用功能。',
  moderate: '視線內有持續堆積，常需「繞」過某些區域，找東西要花時間。',
  severe: '房間功能受嚴重影響 — 床上不能睡、桌上不能寫、地板看不見。',
};

/** CIR 等級對應建議的 phase */
export const CIR_TO_PHASE: Record<CIRLevel, LifecyclePhase> = {
  light: 'maintenance',
  moderate: 'mindset',
  severe: 'gentle-reset',
};

/**
 * 重度時的安全建議（顯示在 onboarding，提醒尋求專業協助）。
 * 依據：Tolin et al. 2012 — 強制清除會反向強化囤積；Steketee & Frost CBT 是金標準。
 */
export const CIR_SEVERE_ADVISORY =
  '⚠️ 重度雜亂可能符合囤積症診斷標準（DSM-5 / ICD-11 6B24）。' +
  '研究（Tolin et al. 2012）顯示強制清除會反向強化症狀。' +
  '建議：① 尋求認知行為治療（CBT）— 這是金標準療法、② 聯繫專業整理師（如台灣居家整聊室、廖心筠）三方協作、' +
  '③ Amber Stash 將以「寬容派」(KC Davis 方法論) 給予你最低壓力的支援。不是你的錯。';
