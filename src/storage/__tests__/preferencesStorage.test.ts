import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loadPreferences,
  markOnboarded,
  recordOneInOneOut,
  rememberLastUsed,
  setActiveMethodology,
} from '@/storage/preferencesStorage';

beforeEach(async () => {
  // @ts-expect-error — test helper from mock
  AsyncStorage.__reset?.();
});

describe('preferencesStorage', () => {
  test('loadPreferences returns defaults when nothing stored', async () => {
    const prefs = await loadPreferences();
    expect(prefs.onboarded).toBe(false);
    expect(prefs.activeMethodologyId).toBe('amberstash-default');
    expect(prefs.lastCategory).toBeUndefined();
    expect(prefs.lastSpaceId).toBeUndefined();
    expect(prefs.lastUseFrequency).toBeUndefined();
  });

  test('setActiveMethodology persists id and marks onboarded', async () => {
    await setActiveMethodology('konmari-zh');
    const prefs = await loadPreferences();
    expect(prefs.activeMethodologyId).toBe('konmari-zh');
    expect(prefs.onboarded).toBe(true);
  });

  test('markOnboarded does not change methodology id', async () => {
    await markOnboarded();
    const prefs = await loadPreferences();
    expect(prefs.onboarded).toBe(true);
    expect(prefs.activeMethodologyId).toBe('amberstash-default');
  });

  test('rememberLastUsed persists each field', async () => {
    await rememberLastUsed({
      category: 'clothing',
      spaceId: 'sp-1',
      useFrequency: 'daily',
    });
    const prefs = await loadPreferences();
    expect(prefs.lastCategory).toBe('clothing');
    expect(prefs.lastSpaceId).toBe('sp-1');
    expect(prefs.lastUseFrequency).toBe('daily');
  });

  test('rememberLastUsed partial patch keeps unspecified fields', async () => {
    await rememberLastUsed({ category: 'tools', spaceId: 'sp-a' });
    await rememberLastUsed({ useFrequency: 'weekly' });
    const prefs = await loadPreferences();
    expect(prefs.lastCategory).toBe('tools');
    expect(prefs.lastSpaceId).toBe('sp-a');
    expect(prefs.lastUseFrequency).toBe('weekly');
  });

  test('rememberLastUsed does not affect onboarded / activeMethodologyId', async () => {
    await setActiveMethodology('konmari-zh');
    await rememberLastUsed({ category: 'clothing' });
    const prefs = await loadPreferences();
    expect(prefs.activeMethodologyId).toBe('konmari-zh');
    expect(prefs.onboarded).toBe(true);
  });

  test('default oneInOneOut state is zeroed', async () => {
    const prefs = await loadPreferences();
    expect(prefs.oneInOneOut.totalShows).toBe(0);
    expect(prefs.oneInOneOut.commitsSinceLastShow).toBe(0);
  });

  test('recordOneInOneOut(true) increments totalShows', async () => {
    await recordOneInOneOut(true);
    await recordOneInOneOut(true);
    const prefs = await loadPreferences();
    expect(prefs.oneInOneOut.totalShows).toBe(2);
    expect(prefs.oneInOneOut.commitsSinceLastShow).toBe(0);
  });

  test('recordOneInOneOut(false) increments commitsSinceLastShow', async () => {
    await recordOneInOneOut(false);
    await recordOneInOneOut(false);
    await recordOneInOneOut(false);
    const prefs = await loadPreferences();
    expect(prefs.oneInOneOut.totalShows).toBe(0);
    expect(prefs.oneInOneOut.commitsSinceLastShow).toBe(3);
  });

  test('recordOneInOneOut(true) resets commitsSinceLastShow after silent commits', async () => {
    await recordOneInOneOut(false);
    await recordOneInOneOut(false);
    await recordOneInOneOut(true);
    const prefs = await loadPreferences();
    expect(prefs.oneInOneOut.totalShows).toBe(1);
    expect(prefs.oneInOneOut.commitsSinceLastShow).toBe(0);
  });

  test('recordOneInOneOut does not affect other prefs', async () => {
    await setActiveMethodology('danshari-zh');
    await rememberLastUsed({ category: 'books' });
    await recordOneInOneOut(true);
    const prefs = await loadPreferences();
    expect(prefs.activeMethodologyId).toBe('danshari-zh');
    expect(prefs.lastCategory).toBe('books');
    expect(prefs.oneInOneOut.totalShows).toBe(1);
  });

  test('loadPreferences backfills missing oneInOneOut for legacy data', async () => {
    // Simulate old prefs without oneInOneOut field
    await AsyncStorage.setItem(
      'amberstash.preferences.v1',
      JSON.stringify({ activeMethodologyId: 'konmari-zh', onboarded: true }),
    );
    const prefs = await loadPreferences();
    expect(prefs.oneInOneOut.totalShows).toBe(0);
    expect(prefs.oneInOneOut.commitsSinceLastShow).toBe(0);
  });
});
