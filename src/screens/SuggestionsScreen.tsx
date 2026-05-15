import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Section } from '@/components/Section';
import { colors } from '@/theme/colors';
import { loadItems } from '@/storage/itemsStorage';
import { loadSpaces } from '@/storage/spacesStorage';
import { generateSuggestions } from '@/services/suggestions';
import type { Suggestion } from '@/types';

export function SuggestionsScreen() {
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      Promise.all([loadItems(), loadSpaces()]).then(([items, spaces]) => {
        if (alive) setSuggestions(generateSuggestions(items, spaces));
      });
      return () => {
        alive = false;
      };
    }, []),
  );

  if (suggestions === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <FlatList
        contentContainerStyle={styles.content}
        data={suggestions}
        keyExtractor={(s) => s.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>AI 收納建議</Text>
            <Text style={styles.headerBody}>
              依目前物品分類與空間自動產生建議。先用規則式版本，之後會接 LLM 做更精準推薦。
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Section title="還沒有建議">
            <Text style={{ color: colors.textMuted }}>新增物品或空間後再回來看看。</Text>
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
  header: { marginBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 4 },
  headerBody: { fontSize: 13, color: colors.textMuted },
  body: { fontSize: 14, color: colors.text, lineHeight: 20 },
});
