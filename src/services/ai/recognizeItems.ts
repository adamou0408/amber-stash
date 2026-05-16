import uuid from 'react-native-uuid';
import type { Detection } from '@/types/snapshot';
import type { ItemCategory } from '@/types';
import { CATEGORY_LABEL } from '@/types';
import { callClaude, ClaudeApiError, type ToolDefinition } from './claudeClient';
import { getActiveBackend, getAiConfig } from './config';
import { mockRecognize } from './mockDetections';
import { consumeQuota } from './quota';

const REPORT_TOOL: ToolDefinition = {
  name: 'report_items',
  description: '回報你在照片中看到的所有可被收納的物品。同一物品請整合在一個項目（quantity 累加），不要重複計算。',
  input_schema: {
    type: 'object',
    properties: {
      detections: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: '物品中文名稱（精簡，例如「長袖襯衫」）' },
            category: {
              type: 'string',
              enum: Object.keys(CATEGORY_LABEL),
              description: '物品類別',
            },
            quantity: { type: 'integer', minimum: 1, description: '估計數量' },
            confidence: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: '辨識信心，不確定請給 < 0.6',
            },
            bbox: {
              type: 'object',
              description: 'bounding box，畫面內 0~1 歸一化座標',
              properties: {
                x: { type: 'number', minimum: 0, maximum: 1 },
                y: { type: 'number', minimum: 0, maximum: 1 },
                w: { type: 'number', minimum: 0, maximum: 1 },
                h: { type: 'number', minimum: 0, maximum: 1 },
              },
              required: ['x', 'y', 'w', 'h'],
            },
          },
          required: ['name', 'category', 'quantity', 'confidence'],
        },
      },
    },
    required: ['detections'],
  },
};

const SYSTEM_PROMPT = `你是「Amber Stash」這款收納推薦 app 的視覺辨識助手。
任務：分析使用者上傳的家庭照片，找出畫面中所有可被收納的物品。
規則：
- 同一個物品請整合在同一個 detection（用 quantity 累加），不要為了「每件都列」造成重複計算
- 不確定的物品 confidence < 0.6
- 回傳 bounding box 用畫面歸一化座標（0~1）
- 類別只能從給定 enum 選一個；找不到對應就用 'other'
- 一張照片回傳 detections 數量不要超過 12 個（合併同類別）
你必須使用 report_items 工具回報結果。`;

type RawDetection = {
  name: string;
  category: ItemCategory;
  quantity: number;
  confidence: number;
  bbox?: { x: number; y: number; w: number; h: number };
};

export function parseToolResult(raw: unknown, photoUri: string): Detection[] {
  if (typeof raw !== 'object' || raw === null) return [];
  const obj = raw as { detections?: unknown };
  if (!Array.isArray(obj.detections)) return [];

  const validCategories = new Set(Object.keys(CATEGORY_LABEL));
  return (obj.detections as RawDetection[])
    .filter((d) => d && typeof d.name === 'string' && validCategories.has(d.category))
    .map((d): Detection => ({
      id: String(uuid.v4()),
      name: d.name.trim().slice(0, 40),
      category: d.category,
      quantity: Math.max(1, Math.floor(Number(d.quantity) || 1)),
      confidence: clamp01(Number(d.confidence) || 0.5),
      sourceType: 'ai',
      bbox: d.bbox && allBoundedBbox(d.bbox) ? d.bbox : undefined,
      photoUri,
    }));
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function allBoundedBbox(b: { x: number; y: number; w: number; h: number }): boolean {
  return [b.x, b.y, b.w, b.h].every((n) => Number.isFinite(n) && n >= 0 && n <= 1);
}

export type RecognizeResult = {
  detections: Detection[];
  backend: 'proxy' | 'direct' | 'mock';
  quotaUsed?: number;
  quotaLimit?: number;
};

export type RecognizeOptions = {
  photoUri: string;
  base64: string;
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
};

export async function recognizeItems(opts: RecognizeOptions): Promise<RecognizeResult> {
  const backend = getActiveBackend();

  if (backend === 'mock') {
    return { detections: mockRecognize(opts.photoUri), backend: 'mock' };
  }

  const cfg = getAiConfig();
  const quota = await consumeQuota(cfg.freeMonthlyQuota);

  const response = await callClaude({
    system: SYSTEM_PROMPT,
    tools: [REPORT_TOOL],
    tool_choice: { type: 'tool', name: 'report_items' },
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: opts.mimeType ?? 'image/jpeg', data: opts.base64 },
          },
          { type: 'text', text: '請辨識照片中所有可被收納的物品。' },
        ],
      },
    ],
  });

  const toolUse = response.content.find((c) => c.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new ClaudeApiError(0, 'Model did not call report_items tool');
  }

  return {
    detections: parseToolResult(toolUse.input, opts.photoUri),
    backend,
    quotaUsed: quota.used,
    quotaLimit: quota.limit,
  };
}
