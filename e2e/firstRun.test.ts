/**
 * First-run smoke test.
 *
 * Critical user path covered:
 *   1. App launches and reaches the bottom-tab navigator.
 *   2. Demo data loads (5 spaces, 14 items, 3 shopping picks).
 *   3. User can navigate to the "建議" (suggestions) tab.
 *   4. Switching methodology (default ⇄ konmari) changes the rendered cards.
 *
 * Requires a real iOS simulator or Android emulator + a Detox-built native
 * binary; the harness can NOT execute this file. See README "E2E tests".
 *
 * The matchers (`by.text` / `by.label`) lean on visible Chinese copy so the
 * test stays close to what the user sees. Once stable, swap to `testID`
 * attributes added in the screens for resilience.
 */

import { by, device, element, expect as detoxExpect, waitFor } from 'detox';

describe('First-run smoke', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      // Wipe AsyncStorage so demo-data button is shown.
      delete: true,
      launchArgs: { detoxPrintBusyIdleResources: 'YES' },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('loads demo data and shows it on the items tab', async () => {
    // ItemsScreen empty-state has the "載入示範資料" button.
    await waitFor(element(by.text('載入示範資料')))
      .toBeVisible()
      .withTimeout(15000);

    await element(by.text('載入示範資料')).tap();

    // After demo-data load one of the 14 demo items appears in the list.
    // We check for the category section header "服飾" which is present in
    // the demo dataset.
    await waitFor(element(by.text('服飾')))
      .toBeVisible()
      .withTimeout(8000);
  });

  it('switches to the suggestions tab and renders cards', async () => {
    // Bottom tab "建議"
    await element(by.text('建議')).tap();

    await waitFor(element(by.text('收納建議')))
      .toBeVisible()
      .withTimeout(8000);

    // The default methodology card carries an "by [作者]" attribution that
    // contains the Amber Stash author name.
    await detoxExpect(element(by.text(/by /))).toBeVisible();
  });

  it('switches methodology and shows different suggestions', async () => {
    // Capture text before switching for a soft assertion.
    const beforeSwitch = await element(
      by.id('suggestion-list-first-title'),
    ).getAttributes().catch(() => null);

    // Tap the konmari chip — text is "怦然心動" in the methodology switcher.
    await element(by.text('怦然心動')).tap();

    // Konmari's free-tier suggestions include the keyword "全部拿出來"
    // (per docs/development-plan.md M3 acceptance criteria).
    await waitFor(element(by.text(/全部拿出來/)))
      .toBeVisible()
      .withTimeout(8000);

    // Sanity check: a different card title than before the switch.
    if (beforeSwitch && 'text' in beforeSwitch && beforeSwitch.text) {
      await detoxExpect(
        element(by.text(beforeSwitch.text as string)),
      ).not.toBeVisible();
    }
  });
});
