import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { colors } from '@/theme/colors';
import {
  addShoppingItem,
  deleteShoppingItem,
  loadShopping,
  toggleShoppingDone,
} from '@/storage/shoppingStorage';
import { loadItems } from '@/storage/itemsStorage';
import { loadSpaces } from '@/storage/spacesStorage';
import { generateShoppingPicks } from '@/services/suggestions';
import type { ShoppingItem } from '@/types';

export function ShoppingScreen() {
  const [items, setItems] = useState<ShoppingItem[] | null>(null);
  const [picks, setPicks] = useState<{ name: string; reason: string }[]>([]);
  const [name, setName] = useState('');

  const refresh = useCallback(async () => {
    const [list, allItems, spaces] = await Promise.all([loadShopping(), loadItems(), loadSpaces()]);
    setItems(list);
    setPicks(generateShoppingPicks(allItems, spaces));
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

  async function onAdd(presetName?: string, reason?: string) {
    const target = (presetName ?? name).trim();
    if (!target) {
      Alert.alert('名稱必填');
      return;
    }
    const next = await addShoppingItem(target, reason);
    setItems((prev) => (prev ? [next, ...prev] : [next]));
    if (!presetName) setName('');
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
        contentContainerStyle={styles.content}
        data={items}
        keyExtractor={(it) => it.id}
        ListHeaderComponent={
          <View>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>新增購物項目</Text>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="例如：A4 收納抽屜"
                  value={name}
                  onChangeText={setName}
                />
                <Button title="加入" onPress={() => onAdd()} />
              </View>
            </View>
            {picks.length > 0 && (
              <View style={styles.picksCard}>
                <Text style={styles.formTitle}>根據你的物品推薦</Text>
                {picks.map((p) => (
                  <Pressable
                    key={p.name}
                    style={styles.pickRow}
                    onPress={() => onAdd(p.name, p.reason)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pickName}>{p.name}</Text>
                      <Text style={styles.pickReason}>{p.reason}</Text>
                    </View>
                    <Text style={styles.pickAdd}>＋ 加入</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ color: colors.textMuted }}>購物清單還是空的。</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.itemRow}
            onPress={async () => {
              await toggleShoppingDone(item.id);
              setItems((prev) =>
                prev?.map((it) => (it.id === item.id ? { ...it, done: !it.done } : it)) ?? null,
              );
            }}
            onLongPress={async () => {
              await deleteShoppingItem(item.id);
              setItems((prev) => prev?.filter((it) => it.id !== item.id) ?? null);
            }}
          >
            <View style={[styles.checkbox, item.done && styles.checkboxDone]}>
              {item.done ? <Text style={styles.check}>✓</Text> : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemName, item.done && styles.itemNameDone]}>{item.name}</Text>
              {item.reason ? <Text style={styles.itemReason}>{item.reason}</Text> : null}
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  picksCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  formTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  pickName: { fontSize: 14, fontWeight: '600', color: colors.text },
  pickReason: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  pickAdd: { color: colors.primary, fontWeight: '600' },
  itemRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: colors.accent, borderColor: colors.accent },
  check: { color: '#fff', fontSize: 14, fontWeight: '700' },
  itemName: { fontSize: 15, color: colors.text },
  itemNameDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  itemReason: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 30 },
});
