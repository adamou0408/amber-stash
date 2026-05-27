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
};

type RawFixtures = { scenarios: RawScenario[] };

const VALID_CATEGORIES = new Set<string>(Object.keys(CATEGORY_LABEL));

/**
 * Scenario id → asset module。
 * 用靜態 require 因為 Metro 不支援動態字串路徑。
 * 沒列在這裡的 scenario（例如 low-confidence-mix）就走 undefined，picker 內不顯示縮圖。
 * 照片來源見 assets/fixtures/ATTRIBUTION.md。
 */
const FIXTURE_PHOTOS: Record<string, number> = {
  'wardrobe-clothing': require('../../../assets/fixtures/wardrobe-clothing.jpg'),
  'desk-stationery': require('../../../assets/fixtures/desk-stationery.jpg'),
  'drawer-electronics': require('../../../assets/fixtures/drawer-electronics.jpg'),
  'kitchen-storage': require('../../../assets/fixtures/kitchen-storage.jpg'),
};

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
    photo: FIXTURE_PHOTOS[raw.id],
  };
}

/** 回傳所有可用的 fixture（每次 call 都會生新 UUID — 每次選擇都是獨立 batch）。 */
export function listFixtures(): FixtureScenario[] {
  return (fixturesRaw as RawFixtures).scenarios.map(materialize);
}

/** 依 id 取單一 fixture；找不到回 null。 */
export function loadFixture(id: string): DetectionSourceResult | null {
  const scenario = listFixtures().find((s) => s.id === id);
  if (!scenario) return null;
  return {
    detections: scenario.detections,
    meta: { backend: 'fixture' },
  };
}
