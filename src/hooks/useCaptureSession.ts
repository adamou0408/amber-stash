import { useCallback, useMemo, useState } from 'react';
import uuid from 'react-native-uuid';
import type { BBox, Detection } from '@/types/snapshot';

export type CaptureStep = 'capture' | 'review';

/**
 * useCaptureSession — 把 AddItem flow 的 session 暫存狀態抽出來。
 *
 * 邏輯：
 *   - in-memory 維護一個 detection list（pendings），不寫進 storage
 *   - commit / cancel 由父層自己決定（這 hook 只負責 client-side state）
 *   - 容器歧義對話、低信心確認、bbox 編輯都會 patch 同一份 list
 *
 * 為什麼不直接呼叫 sessionStorage？
 *   - 寫一個 session 物件到 AsyncStorage 是 commit 階段的事
 *   - capture 過程使用者可能取消 / 反覆編輯，全寫進去會留垃圾
 *   - 拿到 commit 才一次性 createSession + addDetectionToSession + commitSnapshot
 */
export type CaptureSessionApi = {
  pendings: Detection[];
  step: CaptureStep;
  setStep: (s: CaptureStep) => void;
  addManual: (input: ManualInput) => void;
  addBatch: (detections: Detection[]) => void;
  patch: (id: string, partial: Partial<Detection>) => void;
  remove: (id: string) => void;
  updateBbox: (id: string, next: BBox) => void;
  reset: () => void;
};

export type ManualInput = {
  name: string;
  category: Detection['category'];
  quantity: number;
  note?: string | undefined;
  photoUri?: string | undefined;
};

export function useCaptureSession(_spaceId: string | undefined): CaptureSessionApi {
  const [pendings, setPendings] = useState<Detection[]>([]);
  const [step, setStep] = useState<CaptureStep>('capture');

  const addManual = useCallback((input: ManualInput) => {
    const det: Detection = {
      id: String(uuid.v4()),
      name: input.name,
      category: input.category,
      quantity: input.quantity,
      confidence: 1,
      sourceType: 'manual',
      note: input.note,
      photoUri: input.photoUri,
    };
    setPendings((cur) => [det, ...cur]);
  }, []);

  const addBatch = useCallback((detections: Detection[]) => {
    setPendings((cur) => [...detections, ...cur]);
  }, []);

  const patch = useCallback((id: string, partial: Partial<Detection>) => {
    setPendings((cur) =>
      cur.map((d) => (d.id === id ? { ...d, ...partial } : d)),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setPendings((cur) => cur.filter((d) => d.id !== id));
  }, []);

  const updateBbox = useCallback((id: string, next: BBox) => {
    setPendings((cur) =>
      cur.map((d) => (d.id === id ? { ...d, bbox: { ...next } } : d)),
    );
  }, []);

  const reset = useCallback(() => {
    setPendings([]);
    setStep('capture');
  }, []);

  return useMemo<CaptureSessionApi>(
    () => ({ pendings, step, setStep, addManual, addBatch, patch, remove, updateBbox, reset }),
    [pendings, step, addManual, addBatch, patch, remove, updateBbox, reset],
  );
}
