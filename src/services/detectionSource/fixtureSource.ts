import uuid from 'react-native-uuid';
import type { Detection, BBox } from '@/types/snapshot';
import type { ItemCategory, SpaceKind } from '@/types';
import { CATEGORY_LABEL } from '@/types';
import fixturesRaw from '../fixtures/detectionFixtures.json';
import type { DetectionSourceResult, FixtureScenario } from './types';

type RawDetection = {
  name: string;
  category: string;
  quantity: number;
  confidence: number;
  bbox?: BBox;
};

type RawScenario = {
  id: string;
  label: string;
  description?: string;
  spaceKind?: SpaceKind;
  detections: RawDetection[];
  photos?: string[];
};

type RawFixtures = { scenarios: RawScenario[] };

const VALID_CATEGORIES = new Set<string>(Object.keys(CATEGORY_LABEL));

/** 從 Unsplash CDN base URL 補上想要的尺寸 / 品質 query string。 */
export function buildPhotoUrl(baseUrl: string, width: number = 1080): string {
  return `${baseUrl}?fm=jpg&q=75&w=${width}&auto=format&fit=crop`;
}

/** 從 photos pool 隨機抽一張完整 URL。pool 為空回 undefined。 */
function pickRandom(photos: string[] | undefined, width: number = 1080): string | undefined {
  if (!photos || photos.length === 0) return undefined;
  const idx = Math.floor(Math.random() * photos.length);
  return buildPhotoUrl(photos[idx]!, width);
}

function materialize(raw: RawScenario): FixtureScenario {
  const detections = raw.detections
    .filter((d) => VALID_CATEGORIES.has(d.category))
    .map(
      (d): Detection => ({
        id: String(uuid.v4()),
        name: d.name,
        category: d.category as ItemCategory,
        quantity: Math.max(1, Math.floor(d.quantity || 1)),
        confidence: Math.max(0, Math.min(1, d.confidence)),
        sourceType: 'ai',
        bbox: d.bbox,
      }),
    );
  return {
    id: raw.id,
    label: raw.label,
    description: raw.description,
    spaceKind: raw.spaceKind,
    detections,
    photos: raw.photos ?? [],
    pickedPhotoUrl: pickRandom(raw.photos),
  };
}

/**
 * 回傳所有可用的 fixture。
 * 每次 call 都會：
 *   - 為 detections 生新 UUID（讓每次選擇都是獨立 batch）
 *   - 從 photos pool 隨機抽一張當 pickedPhotoUrl（讓 picker 每次打開看到不同的代表照片）
 */
export function listFixtures(): FixtureScenario[] {
  return (fixturesRaw as RawFixtures).scenarios.map(materialize);
}

/** 依 id 取單一 fixture；找不到回 null。 */
export function loadFixture(id: string): DetectionSourceResult | null {
  const scenario = listFixtures().find((s) => s.id === id);
  if (!scenario) return null;
  return {
    detections: scenario.detections,
    photoUri: scenario.pickedPhotoUrl,
    meta: { backend: 'fixture' },
  };
}
