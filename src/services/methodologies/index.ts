import type { Expert, LifecyclePhase, Methodology } from '@/types/methodology';
import { DEFAULT_METHODOLOGY } from './default';
import { KONMARI_METHODOLOGY } from './konmari';
import { DANSHARI_METHODOLOGY } from './danshari';
import { HOME_EDIT_METHODOLOGY } from './homeEdit';
import { LIAOHSINYUN_METHODOLOGY } from './liaohsinyun';
import { GENTLE_METHODOLOGY } from './gentle';

export const ALL_METHODOLOGIES: Methodology[] = [
  DEFAULT_METHODOLOGY,
  DANSHARI_METHODOLOGY,
  KONMARI_METHODOLOGY,
  LIAOHSINYUN_METHODOLOGY,
  HOME_EDIT_METHODOLOGY,
  GENTLE_METHODOLOGY,
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
];

export function getMethodology(id: string): Methodology | undefined {
  return ALL_METHODOLOGIES.find((m) => m.id === id);
}

export function getExpertFor(methodologyId: string): Expert | undefined {
  return ALL_EXPERTS.find((e) => e.methodologyIds.includes(methodologyId));
}

/**
 * 取得某 lifecycle phase 推薦的方法論（取第一個 match）。
 * 同一個 phase 可能有多個方法論共存（如 maintenance 有 default 和廖心筠）；
 * 此函數回傳第一個註冊的 — 給 onboarding 用，使用者之後可手動換。
 */
export function methodologyForPhase(phase: LifecyclePhase): Methodology {
  const found = ALL_METHODOLOGIES.find((m) => m.lifecyclePhase === phase);
  return found ?? DEFAULT_METHODOLOGY;
}

/** 取得某 phase 的所有方法論（同 phase 多派時用） */
export function methodologiesForPhase(phase: LifecyclePhase): Methodology[] {
  return ALL_METHODOLOGIES.filter((m) => m.lifecyclePhase === phase);
}
