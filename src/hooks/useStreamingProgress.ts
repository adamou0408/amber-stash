import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProgressStage } from '@/components/ProgressIndicator';

/**
 * useStreamingProgress — 模擬「上傳 → AI 分析 → 解析結果」三階段進度。
 *
 * 因為 Anthropic messages API 在 tool_use 模式下不會 stream 中段，所以
 * 我們用時間段切換 stage 來給使用者「事情有在動」的感覺。
 *
 *   - start() 進入 stage 0（上傳）
 *   - 經過 `uploadMs` 後切到 stage 1（分析中）
 *   - finish() 切到 stage 2（解析結果）然後再切 'done'（隱藏）
 *
 * 為什麼分兩個 timer 而不是 step('done') 後馬上消失？
 *   - 留個 0.3s 給 stage 2 的 ✓ 動畫，UX 才不會「啪」一下抽掉
 */
type Options = {
  uploadMs?: number;
  parseDelayMs?: number;
};

export function useStreamingProgress({
  uploadMs = 1200,
  parseDelayMs = 400,
}: Options = {}) {
  const [stage, setStage] = useState<ProgressStage>('done');
  const uploadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (uploadTimer.current) {
      clearTimeout(uploadTimer.current);
      uploadTimer.current = null;
    }
    if (finishTimer.current) {
      clearTimeout(finishTimer.current);
      finishTimer.current = null;
    }
  }, []);

  useEffect(() => clear, [clear]);

  const start = useCallback(() => {
    clear();
    setStage(0);
    uploadTimer.current = setTimeout(() => setStage(1), uploadMs);
  }, [clear, uploadMs]);

  const finish = useCallback(() => {
    clear();
    setStage(2);
    finishTimer.current = setTimeout(() => setStage('done'), parseDelayMs);
  }, [clear, parseDelayMs]);

  const cancel = useCallback(() => {
    clear();
    setStage('done');
  }, [clear]);

  return { stage, start, finish, cancel };
}
