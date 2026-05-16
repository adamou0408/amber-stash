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
import type { Methodology, MethodologyPricing } from '@/types/methodology';

export function SuggestionsScreen() {
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [active, setActive] = useState<Methodology>(DEFAULT_METHODOLOGY);

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
            <View style={styles.header}>
              <Text style={styles.headerTitle}>收納建議</Text>
              <Text style={styles.headerBody}>
                可切換不同方法論。每條建議都掛來源，方便你知道是誰的方法。
              </Text>
            </View>
            <View style={styles.methodPicker}>
              {ALL_METHODOLOGIES.map((m) => {
                const on = m.id === active.id;
                return (
                  <Pressable
                    key={m.id}
                    style={[styles.methodChip, on && styles.methodChipOn]}
                    onPress={() => onSwitch(m.id)}
                  >
                    <Text style={[styles.methodChipText, on && styles.methodChipTextOn]}>
                      {m.name}
                    </Text>
                    <Text style={[styles.methodChipPrice, on && styles.methodChipPriceOn]}>
                      {formatPricing(m.pricing)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.attribution}>
              <Text style={styles.attributionTitle}>{active.name}</Text>
              <Text style={styles.attributionAuthor}>by {expert?.displayName ?? '未知'}</Text>
              <Text style={styles.attributionDesc}>{active.description}</Text>
            </View>
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

function formatPricing(p: MethodologyPricing): string {
  switch (p.kind) {
    case 'free':
      return '免費';
    case 'subscription':
      return `NT$ ${p.monthlyTwd}/月`;
    case 'oneTime':
      return `NT$ ${p.priceTwd}`;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 4 },
  headerBody: { fontSize: 13, color: colors.textMuted },
  methodPicker: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  methodChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  methodChipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  methodChipText: { fontSize: 13, fontWeight: '700', color: colors.text },
  methodChipTextOn: { color: '#fff' },
  methodChipPrice: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  methodChipPriceOn: { color: 'rgba(255,255,255,0.85)' },
  attribution: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  attributionTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  attributionAuthor: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  attributionDesc: { fontSize: 12, color: colors.text, marginTop: 6, lineHeight: 18 },
  body: { fontSize: 14, color: colors.text, lineHeight: 20 },
});
