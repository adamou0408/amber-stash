import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadOnboarding, saveOnboarding, resetOnboarding } from '@/storage/onboardingStorage';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('onboardingStorage', () => {
  it('starts as fresh state', async () => {
    const ob = await loadOnboarding();
    expect(ob).toEqual({ completedAt: null, pickedMethodologyId: null, loadedDemo: false });
  });

  it('saves a patch and merges with existing state', async () => {
    await saveOnboarding({ pickedMethodologyId: 'konmari-zh' });
    let ob = await loadOnboarding();
    expect(ob.pickedMethodologyId).toBe('konmari-zh');
    expect(ob.completedAt).toBeNull();
    expect(ob.loadedDemo).toBe(false);

    await saveOnboarding({ completedAt: 12345, loadedDemo: true });
    ob = await loadOnboarding();
    expect(ob.pickedMethodologyId).toBe('konmari-zh');
    expect(ob.completedAt).toBe(12345);
    expect(ob.loadedDemo).toBe(true);
  });

  it('reset clears the entry', async () => {
    await saveOnboarding({ completedAt: 999 });
    expect((await loadOnboarding()).completedAt).toBe(999);
    await resetOnboarding();
    expect(await loadOnboarding()).toEqual({
      completedAt: null,
      pickedMethodologyId: null,
      loadedDemo: false,
    });
  });

  it('survives corrupt JSON by falling back to fresh', async () => {
    await AsyncStorage.setItem('amberstash.onboarding.v1', 'not-json{');
    const ob = await loadOnboarding();
    expect(ob).toEqual({ completedAt: null, pickedMethodologyId: null, loadedDemo: false });
  });
});
