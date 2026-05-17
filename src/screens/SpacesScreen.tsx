import { useCallback, useMemo, useState } from 'react';
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
import { SPACE_LABEL, type Item, type Space, type SpaceKind } from '@/types';
import { addSpace, deleteSpace, loadSpaces } from '@/storage/spacesStorage';
import { loadItems } from '@/storage/itemsStorage';

const KINDS = Object.keys(SPACE_LABEL) as SpaceKind[];

export function SpacesScreen() {
  const [spaces, setSpaces] = useState<Space[] | null>(null);
  const [items, setItems] = useState<Item[]>([]);
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
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>新增空間</Text>
            <Text style={styles.label}>名稱</Text>
            <TextInput
              style={styles.input}
              placeholder="主臥衣櫃 / 廚房上櫃 / 玄關抽屜…"
              value={name}
              onChangeText={setName}
            />
            <Text style={styles.label}>類型</Text>
            <View style={styles.chips}>
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
            <Text style={styles.label}>尺寸（cm，可選）</Text>
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
            <Text style={styles.label}>容量估算（件數，啟用「80% 留白原則」警示）</Text>
            <TextInput
              style={styles.input}
              placeholder="此空間舒適能容納幾件物品？"
              keyboardType="number-pad"
              value={capacity}
              onChangeText={setCapacity}
            />
            <View style={[styles.chips, { marginTop: 8 }]}>
              {[5, 12, 20, 30, 50].map((n) => (
                <Pressable key={n} onPress={() => setCapacityPreset(n)} style={styles.chip}>
                  <Text style={styles.chipText}>{n} 件</Text>
                </Pressable>
              ))}
            </View>
            <Button title="新增" onPress={onAdd} style={{ marginTop: 12 }} />
          </View>
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
          const ratioColor =
            ratio === undefined
              ? colors.textMuted
              : ratio > 1
                ? '#c0392b'
                : ratio > 0.8
                  ? '#e67e22'
                  : '#27ae60';
          return (
            <Pressable
              style={styles.row}
              onLongPress={async () => {
                await deleteSpace(item.id);
                setSpaces((prev) => prev?.filter((s) => s.id !== item.id) ?? null);
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.name}</Text>
                <Text style={styles.rowMeta}>
                  {SPACE_LABEL[item.kind]}
                  {item.widthCm && item.heightCm && item.depthCm
                    ? ` · ${item.widthCm}×${item.heightCm}×${item.depthCm} cm`
                    : ''}
                </Text>
                {capacity ? (
                  <Text style={[styles.rowFill, { color: ratioColor }]}>
                    {count} / {capacity} 件 ·{' '}
                    {ratio !== undefined ? `${Math.round(ratio * 100)}%` : '-'}
                    {ratio !== undefined && ratio > 0.8 ? ' ⚠️ 超過 80%' : ''}
                  </Text>
                ) : (
                  <Text style={styles.rowFillEmpty}>未設容量 · 設定後可看 80% 留白警示</Text>
                )}
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
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  formTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: 10, marginBottom: 6 },
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
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  rowFill: { fontSize: 12, marginTop: 4, fontWeight: '600' },
  rowFillEmpty: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  empty: { alignItems: 'center', paddingVertical: 30 },
  emptyText: { color: colors.textMuted },
});
