import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { colors } from '@/theme/colors';
import {
  CATEGORY_LABEL,
  FREQUENCY_EMOJI,
  FREQUENCY_LABEL,
  SPACE_EMOJI,
  type Item,
  type Space,
  type UseFrequency,
} from '@/types';
import { deleteItem, loadItems, updateItem } from '@/storage/itemsStorage';
import { loadSpaces } from '@/storage/spacesStorage';
import { loadDemoData } from '@/services/demoData';
import type { ItemsStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<ItemsStackParamList, 'ItemsList'>;

export function ItemsScreen({ navigation }: Props) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);

  const refresh = useCallback(async () => {
    const [its, sps] = await Promise.all([loadItems(), loadSpaces()]);
    setItems(its);
    setSpaces(sps);
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

  const spaceById = useMemo(() => {
    const map = new Map<string, Space>();
    for (const s of spaces) map.set(s.id, s);
    return map;
  }, [spaces]);

  async function onLoadDemo() {
    await loadDemoData();
    await refresh();
  }

  function onTapItem(item: Item) {
    // 收納師原則 1/5/8 — 點一下快速設定使用頻率與黃金區
    const cur = item.useFrequency;
    const options: { label: string; freq?: UseFrequency }[] = [
      { label: '🔥 每天用', freq: 'daily' },
      { label: '⭐ 每週用', freq: 'weekly' },
      { label: '🌙 每月用', freq: 'monthly' },
      { label: '❄️ 很少用', freq: 'rarely' },
      { label: '清除頻率', freq: undefined },
    ];
    Alert.alert(
      `${item.name}`,
      cur ? `目前頻率：${FREQUENCY_EMOJI[cur]} ${FREQUENCY_LABEL[cur]}` : '尚未設定使用頻率',
      [
        ...options.map((o) => ({
          text: o.label,
          onPress: async () => {
            await updateItem(item.id, { useFrequency: o.freq });
            await refresh();
            if (o.freq === 'daily' || o.freq === 'weekly') {
              Alert.alert(
                '黃金區',
                '這件物品要放在「腰至眼睛」高度的黃金區嗎？',
                [
                  { text: '不要', onPress: async () => {
                    await updateItem(item.id, { inGoldenZone: false });
                    await refresh();
                  } },
                  { text: '是的', onPress: async () => {
                    await updateItem(item.id, { inGoldenZone: true });
                    await refresh();
                  } },
                ],
              );
            }
          },
        })),
        { text: '取消', style: 'cancel' },
      ],
    );
  }

  if (items === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={items}
        keyExtractor={(it) => it.id}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>還沒登錄任何物品</Text>
            <Text style={styles.emptyBody}>
              從一個抽屜開始，拍張照、選個分類就好。或者先載入示範資料看看 app 長怎樣。
            </Text>
            <View style={styles.emptyActions}>
              <Button title="＋ 新增物品" onPress={() => navigation.navigate('AddItem')} />
              <Button title="載入示範資料" variant="secondary" onPress={onLoadDemo} />
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const space = item.spaceId ? spaceById.get(item.spaceId) : undefined;
          const freq = item.useFrequency;
          return (
            <Pressable
              style={styles.row}
              onPress={() => onTapItem(item)}
              onLongPress={async () => {
                await deleteItem(item.id);
                setItems((prev) => prev?.filter((it) => it.id !== item.id) ?? null);
              }}
            >
              {item.photoUri ? (
                <Image source={{ uri: item.photoUri }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]}>
                  <Text style={styles.thumbPlaceholderText}>無圖</Text>
                </View>
              )}
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>{item.name}</Text>
                <Text style={styles.rowMeta}>
                  {CATEGORY_LABEL[item.category]} · 數量 {item.quantity}
                </Text>
                <View style={styles.pillRow}>
                  {space ? (
                    <View style={styles.spacePill}>
                      <Text style={styles.spacePillText}>
                        {SPACE_EMOJI[space.kind]} {space.name}
                      </Text>
                    </View>
                  ) : null}
                  {freq ? (
                    <View style={styles.spacePill}>
                      <Text style={styles.spacePillText}>
                        {FREQUENCY_EMOJI[freq]} {FREQUENCY_LABEL[freq]}
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.spacePill, styles.pillWarn]}>
                      <Text style={styles.pillWarnText}>未設頻率</Text>
                    </View>
                  )}
                  {item.inGoldenZone ? (
                    <View style={[styles.spacePill, styles.pillGold]}>
                      <Text style={styles.pillGoldText}>✨ 黃金區</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </Pressable>
          );
        }}
      />
      {items.length > 0 && (
        <View style={styles.footer}>
          <Button title="＋ 新增物品" onPress={() => navigation.navigate('AddItem')} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16, paddingBottom: 80 },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
  emptyBody: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 8,
    lineHeight: 20,
  },
  emptyActions: { gap: 10, alignSelf: 'stretch', marginTop: 20 },
  row: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  thumb: { width: 56, height: 56, borderRadius: 10, marginRight: 12, backgroundColor: colors.card },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  thumbPlaceholderText: { fontSize: 11, color: colors.textMuted },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  spacePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  spacePillText: { fontSize: 11, color: colors.text },
  pillWarn: { backgroundColor: '#fff4e1', borderColor: '#e6a850' },
  pillWarnText: { fontSize: 11, color: '#a76912' },
  pillGold: { backgroundColor: '#fff9d9', borderColor: '#d4a317' },
  pillGoldText: { fontSize: 11, color: '#7a5d05', fontWeight: '600' },
  footer: { padding: 16, paddingBottom: 24 },
});
