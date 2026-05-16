import type { Methodology, Expert } from '@/types/methodology';
import { DEFAULT_METHODOLOGY } from './default';
import { KONMARI_METHODOLOGY } from './konmari';

export const ALL_METHODOLOGIES: Methodology[] = [DEFAULT_METHODOLOGY, KONMARI_METHODOLOGY];

export const ALL_EXPERTS: Expert[] = [
  {
    id: 'amberstash-system',
    displayName: 'Amber Stash 系統',
    bio: '系統內建方法論作者。提供通用收納規則，作為所有使用者的預設選擇。',
    methodologyIds: [DEFAULT_METHODOLOGY.id],
  },
  {
    id: 'placeholder-expert',
    displayName: '示範收納師（待邀請）',
    bio: '此為示範用佔位帳號。正式版本將替換為 3-5 位邀請制收納師。',
    methodologyIds: [KONMARI_METHODOLOGY.id],
  },
];

export function getMethodology(id: string): Methodology | undefined {
  return ALL_METHODOLOGIES.find((m) => m.id === id);
}

export function getExpertFor(methodologyId: string): Expert | undefined {
  return ALL_EXPERTS.find((e) => e.methodologyIds.includes(methodologyId));
}
