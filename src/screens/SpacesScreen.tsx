import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { colors } from '@/theme/colors';
import { SPACE_LABEL, type Item, type Space, type SpaceKind } from '@/types';
import { addSpace, deleteSpace, loadSpaces } from '@/storage/spacesStorage';
import { loadItems } from '@/storage/itemsStorage';
import type { SpacesStackParamList } from '@/navigation/types';

const KINDS = Object.keys(SPACE_LABEL) as SpaceKind[];

export function SpacesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SpacesStackParamList>>();
  const [spaces, setSpaces] = useState<Space[] | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<SpaceKind>('wardrobe');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [depth, setDepth] = useState('');
  // 收納師原則 6：80% 留白原則，需要使用者粗估容量
  const [capacity, setCapacity] = useState('');

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      Promise.all([loadSpaces(), loadItems()]).then(([s, its]) => {
        if (!alive) return;
        setSpaces(s);
        setItems(its);
      });
      return () => {
        alive = false;
      };
    }, []),
  );

  const itemCountBySpace = useMemo(() => {
    const map: Record<string, number> = {};
    for (const it of items) {
      if (it.spaceId) {
        map[it.spaceId] = (map[it.spaceId] ?? 0) + it.quantity;
      }
    }
    return map;
  }, [items]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate('Labels')}
          style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.headerBtnText}>🏷️ 列印標籤</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  async function onAdd() {
    if (!name.trim()) {
      Alert.alert('空間名稱必填');
      return;
    }
    const space = await addSpace({
      name: name.trim(),
      kind,
      widthCm: parseNumber(width),
      heightCm: parseNumber(height),
      depthCm: parseNumber(depth),
      capacityEstimate: parseNumber(capacity),
    });
    setSpaces((prev) => (prev ? [space, ...prev] : [space]));
    setName('');
    setWidth('');
    setHeight('');
    setDepth('');
    setCapacity('');
    setFormOpen(false);
  }

  function setCapacityPreset(n: number) {
    setCapacity(String(n));
  }

  if (spaces === null) {
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
        data={spaces}
        keyExtractor={(s) => s.id}
        ListHeaderComponent={
          formOpen ? (
            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>新增空間</Text>
                <Pressable onPress={() => setFormOpen(false)}>
                  <Text style={styles.formClose}>✕</Text>
                </Pressable>
              </View>
              <TextInput
                style={[styles.input, { marginTop: 8 }]}
                placeholder="空間名稱（例：主臥衣櫃）"
                value={name}
                onChangeText={setName}
              />
              <View style={[styles.chips, { marginTop: 10 }]}>
                {KINDS.map((k) => {
                  const active = k === kind;
                  return (
                    <Pressable
                      key={k}
                      onPress={() => setKind(k)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {SPACE_LABEL[k]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.labelSecondary}>容量估算（件數）— 啟用 80% 留白警示</Text>
              <View style={[styles.chips, { marginBottom: 8 }]}>
                {[5, 12, 20, 30, 50].map((n) => (
                  <Pressable
                    key={n}
                    onPress={() => setCapacityPreset(n)}
                    style={[styles.chip, capacity === String(n) && styles.chipActive]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        capacity === String(n) && styles.chipTextActive,
                      ]}
                    >
                      {n}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.advRow}>
                <Text style={styles.advRowLabel}>尺寸 cm（可選）</Text>
                <View style={styles.sizeRow}>
                  <TextInput
                    style={[styles.input, styles.sizeInput]}
                    placeholder="寬"
                    keyboardType="number-pad"
                    value={width}
                    onChangeText={setWidth}
                  />
                  <TextInput
                    style={[styles.input, styles.sizeInput]}
                    placeholder="高"
                    keyboardType="number-pad"
                    value={height}
                    onChangeText={setHeight}
                  />
                  <TextInput
                    style={[styles.input, styles.sizeInput]}
                    placeholder="深"
                    keyboardType="number-pad"
                    value={depth}
                    onChangeText={setDepth}
                  />
                </View>
              </View>
              <Button title="新增空間" onPress={onAdd} style={{ marginTop: 12 }} />
            </View>
          ) : (
            <Pressable style={styles.addBtn} onPress={() => setFormOpen(true)}>
              <Text style={styles.addBtnText}>＋ 新增空間</Text>
            </Pressable>
          )
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>還沒有空間。先建一個衣櫃或抽屜試試。</Text>
          </View>
        }
        renderItem={({ item }) => {
          const count = itemCountBySpace[item.id] ?? 0;
          const capacity = item.capacityEstimate;
          const ratio = capacity ? count / capacity : undefined;
          const warn = ratio !== undefined && ratio > 0.8;
          const over = ratio !== undefined && ratio > 1;
          return (
            <Pressable
              style={[styles.row, warn && styles.rowWarn, over && styles.rowOver]}
              onLongPress={async () => {
                await deleteSpace(item.id);
                setSpaces((prev) => prev?.filter((s) => s.id !== item.id) ?? null);
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.name}</Text>
                <Text style={styles.rowMeta}>
                  {SPACE_LABEL[item.kind]}
                  {count > 0 ? ` · ${count} 件` : ''}
                  {warn && capacity
                    ? `　${over ? '🔴' : '🟠'} ${Math.round((ratio ?? 0) * 100)}%`
                    : ''}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

function parseNumber(v: string): number | undefined {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  headerBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  headerBtnText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  addBtn: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  addBtnText: { fontSize: 15, fontWeight: '700', color: colors.primary },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  formHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  formTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  formClose: { fontSize: 18, color: colors.textMuted, padding: 4 },
  labelSecondary: { fontSize: 11, color: colors.textMuted, marginTop: 10, marginBottom: 6 },
  advRow: { marginTop: 6 },
  advRowLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 4 },
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  sizeRow: { flexDirection: 'row', gap: 8 },
  sizeInput: { flex: 1 },
  row: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowWarn: { borderColor: '#e67e22' },
  rowOver: { borderColor: '#c0392b', borderWidth: 1.5 },
  rowTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  rowMeta: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  empty: { alignItems: 'center', paddingVertical: 30 },
  emptyText: { color: colors.textMuted },
});
