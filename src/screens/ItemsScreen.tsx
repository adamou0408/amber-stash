import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
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
import { CATEGORY_LABEL, type Item } from '@/types';
import { deleteItem, loadItems } from '@/storage/itemsStorage';
import type { ItemsStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<ItemsStackParamList, 'ItemsList'>;

export function ItemsScreen({ navigation }: Props) {
  const [items, setItems] = useState<Item[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      loadItems().then((data) => {
        if (alive) setItems(data);
      });
      return () => {
        alive = false;
      };
    }, []),
  );

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
            <Text style={styles.emptyBody}>從一個抽屜開始，拍張照、選個分類就好。</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
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
            </View>
          </Pressable>
        )}
      />
      <View style={styles.footer}>
        <Button title="＋ 新增物品" onPress={() => navigation.navigate('AddItem')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16, paddingBottom: 80 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
  emptyBody: { fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 32 },
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
  footer: { padding: 16, paddingBottom: 24 },
});
