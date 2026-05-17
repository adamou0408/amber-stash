import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Section } from '@/components/Section';
import { colors } from '@/theme/colors';
import { loadItems } from '@/storage/itemsStorage';
import { loadSpaces } from '@/storage/spacesStorage';
import { loadLatestSnapshotMap } from '@/storage/sessionStorage';
import { loadPreferences, setActiveMethodology } from '@/storage/preferencesStorage';
import { generateSuggestions } from '@/services/suggestions';
import { ALL_METHODOLOGIES, getExpertFor, getMethodology } from '@/services/methodologies';
import { DEFAULT_METHODOLOGY } from '@/services/methodologies/default';
import type { Suggestion } from '@/types';
import { LIFECYCLE_EMOJI, LIFECYCLE_LABEL, type Methodology } from '@/types/methodology';

export function SuggestionsScreen() {
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [active, setActive] = useState<Methodology>(DEFAULT_METHODOLOGY);
  const [pickerOpen, setPickerOpen] = useState(false);

  const refresh = useCallback(async () => {
    const prefs = await loadPreferences();
    const methodology = getMethodology(prefs.activeMethodologyId) ?? DEFAULT_METHODOLOGY;
    const [items, spaces] = await Promise.all([loadItems(), loadSpaces()]);
    const latestMap = await loadLatestSnapshotMap(spaces.map((s) => s.id));
    setActive(methodology);
    setSuggestions(generateSuggestions(items, spaces, methodology.id, latestMap));
  }, []);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      refresh().then(() => {
        if (!alive) return;
      });
      return () => {
        alive = false;
      };
    }, [refresh]),
  );

  async function onSwitch(id: string) {
    await setActiveMethodology(id);
    await refresh();
  }

  if (suggestions === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const expert = getExpertFor(active.id);

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <FlatList
        contentContainerStyle={styles.content}
        data={suggestions}
        keyExtractor={(s) => s.id}
        ListHeaderComponent={
          <View>
            <Pressable
              style={styles.activeBar}
              onPress={() => setPickerOpen((v) => !v)}
            >
              <Text style={styles.activeEmoji}>
                {LIFECYCLE_EMOJI[active.lifecyclePhase]}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.activeName} numberOfLines={1}>
                  {active.name}
                </Text>
                <Text style={styles.activeMeta} numberOfLines={1}>
                  {LIFECYCLE_LABEL[active.lifecyclePhase]} · by{' '}
                  {expert?.displayName ?? '未知'}
                </Text>
              </View>
              <Text style={styles.activeChevron}>{pickerOpen ? '▲' : '▼'}</Text>
            </Pressable>
            {pickerOpen && (
              <View style={styles.methodPicker}>
                {ALL_METHODOLOGIES.map((m) => {
                  const on = m.id === active.id;
                  return (
                    <Pressable
                      key={m.id}
                      style={[styles.methodChip, on && styles.methodChipOn]}
                      onPress={() => {
                        onSwitch(m.id);
                        setPickerOpen(false);
                      }}
                    >
                      <Text style={[styles.methodChipText, on && styles.methodChipTextOn]}>
                        {LIFECYCLE_EMOJI[m.lifecyclePhase]} {m.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <Section title="還沒有建議">
            <Text style={{ color: colors.textMuted }}>
              這套方法暫時對你目前的資料沒有建議。新增物品或空間後再試試。
            </Text>
          </Section>
        }
        renderItem={({ item }) => (
          <Section title={item.title}>
            <Text style={styles.body}>{item.body}</Text>
          </Section>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  activeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    gap: 12,
  },
  activeEmoji: { fontSize: 28 },
  activeName: { fontSize: 16, fontWeight: '700', color: colors.text },
  activeMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  activeChevron: { fontSize: 14, color: colors.textMuted, paddingHorizontal: 4 },
  methodPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  methodChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  methodChipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  methodChipText: { fontSize: 13, fontWeight: '600', color: colors.text },
  methodChipTextOn: { color: '#fff' },
  body: { fontSize: 14, color: colors.text, lineHeight: 20 },
});
