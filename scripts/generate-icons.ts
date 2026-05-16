#!/usr/bin/env ts-node
/**
 * Generate Amber Stash app icons from the SVG source.
 *
 *   npm run generate-icons
 *
 * Inputs:
 *   - assets/icon-source.svg (1024×1024 master)
 *
 * Outputs:
 *   - assets/icon.png             1024×1024  iOS app icon
 *   - assets/adaptive-icon.png    1024×1024  Android adaptive icon foreground
 *   - assets/splash-icon.png      1024×1024  Splash screen center image
 *   - assets/favicon.png             48×48   Web favicon
 *
 * Re-run after editing icon-source.svg and commit the PNGs.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'assets', 'icon-source.svg');
const OUT_DIR = path.join(ROOT, 'assets');

type Target = {
  name: string;
  size: number;
  /**
   * Optional flat background. iOS does not allow alpha in app icons but
   * Adaptive / splash / favicon are happiest with transparent or matching
   * cream. We keep cream as the safe default for everything.
   */
  background?: string;
};

const TARGETS: Target[] = [
  { name: 'icon.png', size: 1024, background: '#C8821A' },
  // Android adaptive foreground sits on top of the system-defined background
  // color (see app.json `android.adaptiveIcon.backgroundColor`). The PNG must
  // contain transparent padding so the launcher can mask / animate it.
  { name: 'adaptive-icon.png', size: 1024, background: 'transparent' },
  { name: 'splash-icon.png', size: 1024, background: 'transparent' },
  { name: 'favicon.png', size: 48, background: '#C8821A' },
];

async function main(): Promise<void> {
  const svg = await fs.readFile(SRC);
  await fs.mkdir(OUT_DIR, { recursive: true });

  for (const target of TARGETS) {
    const outPath = path.join(OUT_DIR, target.name);
    let pipeline = sharp(svg, { density: 384 }).resize(target.size, target.size, {
      fit: 'contain',
      background: target.background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    });

    if (target.background && target.background !== 'transparent') {
      pipeline = pipeline.flatten({ background: target.background });
    }

    await pipeline.png({ compressionLevel: 9 }).toFile(outPath);
    const { size } = await fs.stat(outPath);
    // eslint-disable-next-line no-console
    console.log(
      `  ${target.name.padEnd(20)} ${String(target.size).padStart(4)}px  (${Math.round(size / 1024)} KB)`,
    );
  }

  // eslint-disable-next-line no-console
  console.log(`\nWrote ${TARGETS.length} PNG(s) to ${OUT_DIR}`);
}

main().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
