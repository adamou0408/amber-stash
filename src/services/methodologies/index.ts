import type { Expert, LifecyclePhase, Methodology } from '@/types/methodology';
import { DEFAULT_METHODOLOGY } from './default';
import { KONMARI_METHODOLOGY } from './konmari';
import { DANSHARI_METHODOLOGY } from './danshari';
import { HOME_EDIT_METHODOLOGY } from './homeEdit';

export const ALL_METHODOLOGIES: Methodology[] = [
  DEFAULT_METHODOLOGY,
  DANSHARI_METHODOLOGY,
  KONMARI_METHODOLOGY,
  HOME_EDIT_METHODOLOGY,
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
];

export function getMethodology(id: string): Methodology | undefined {
  return ALL_METHODOLOGIES.find((m) => m.id === id);
}

export function getExpertFor(methodologyId: string): Expert | undefined {
  return ALL_EXPERTS.find((e) => e.methodologyIds.includes(methodologyId));
}

/** 取得某 lifecycle phase 推薦的方法論（取第一個 match） */
export function methodologyForPhase(phase: LifecyclePhase): Methodology {
  const found = ALL_METHODOLOGIES.find((m) => m.lifecyclePhase === phase);
  return found ?? DEFAULT_METHODOLOGY;
}
