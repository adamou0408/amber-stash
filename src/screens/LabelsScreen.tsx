import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { colors } from '@/theme/colors';
import { SPACE_EMOJI, SPACE_LABEL, type Space } from '@/types';
import { loadSpaces } from '@/storage/spacesStorage';
import {
  LABEL_SIZES,
  buildLabelHtml,
  type LabelOptions,
  type LabelSize,
} from '@/services/labelHtml';

export function LabelsScreen() {
  const [spaces, setSpaces] = useState<Space[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [size, setSize] = useState<LabelSize>('medium');
  const [showEmoji, setShowEmoji] = useState(true);
  const [showQr, setShowQr] = useState(true);
  const [showSubtitle, setShowSubtitle] = useState(true);
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      loadSpaces().then((s) => {
        if (alive) setSpaces(s);
      });
      return () => {
        alive = false;
      };
    }, []),
  );

  const selectedList = useMemo(
    () => (spaces ?? []).filter((s) => selected.has(s.id)),
    [spaces, selected],
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (!spaces) return;
    if (selected.size === spaces.length) setSelected(new Set());
    else setSelected(new Set(spaces.map((s) => s.id)));
  }

  async function makeOptions(): Promise<LabelOptions> {
    return { size, showEmoji, showQr, showSubtitle };
  }

  async function onPrint() {
    if (selectedList.length === 0) {
      Alert.alert('請先選擇至少一個空間');
      return;
    }
    setBusy(true);
    try {
      const html = await buildLabelHtml(selectedList, await makeOptions());
      await Print.printAsync({ html });
    } catch (err) {
      Alert.alert('列印失敗', err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function onSharePdf() {
    if (selectedList.length === 0) {
      Alert.alert('請先選擇至少一個空間');
      return;
    }
    setBusy(true);
    try {
      const html = await buildLabelHtml(selectedList, await makeOptions());
      const { uri } = await Print.printToFileAsync({ html });
      const can = await Sharing.isAvailableAsync();
      if (can) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: '分享標籤 PDF' });
      } else {
        Alert.alert('PDF 已產生', uri);
      }
    } catch (err) {
      Alert.alert('產生 PDF 失敗', err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
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
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>標籤尺寸</Text>
          <Text style={styles.cardSub}>之後可拿來印貼紙、或當客製收納箱的雷雕設計稿</Text>
          <View style={styles.sizeRow}>
            {LABEL_SIZES.map((s) => {
              const active = s.id === size;
              return (
                <Pressable
                  key={s.id}
                  style={[styles.sizeChip, active && styles.sizeChipActive]}
                  onPress={() => setSize(s.id)}
                >
                  <Text style={[styles.sizeChipText, active && styles.sizeChipTextActive]}>
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>標籤內容</Text>
          <Row label="分類圖示 / Emoji" value={showEmoji} onChange={setShowEmoji} />
          <Row label="QR Code（掃出空間詳情）" value={showQr} onChange={setShowQr} />
          <Row label="尺寸副標題" value={showSubtitle} onChange={setShowSubtitle} />
        </View>

        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.cardTitle}>選擇空間（{selected.size}/{spaces.length}）</Text>
            <Pressable onPress={selectAll}>
              <Text style={styles.linkText}>
                {selected.size === spaces.length && spaces.length > 0 ? '全部取消' : '全部選取'}
              </Text>
            </Pressable>
          </View>
          {spaces.length === 0 ? (
            <Text style={styles.emptyHint}>還沒有任何空間。先到「空間」分頁新增。</Text>
          ) : (
            spaces.map((s) => {
              const checked = selected.has(s.id);
              return (
                <Pressable key={s.id} style={styles.spaceRow} onPress={() => toggle(s.id)}>
                  <View style={[styles.checkbox, checked && styles.checkboxOn]}>
                    {checked ? <Text style={styles.check}>✓</Text> : null}
                  </View>
                  <Text style={styles.spaceEmoji}>{SPACE_EMOJI[s.kind]}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.spaceName}>{s.name}</Text>
                    <Text style={styles.spaceMeta}>{SPACE_LABEL[s.kind]}</Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={busy ? '處理中…' : '預覽 / 列印'}
          onPress={onPrint}
          disabled={busy}
          style={{ flex: 1 }}
        />
        <Button
          title="存成 PDF"
          variant="secondary"
          onPress={onSharePdf}
          disabled={busy}
          style={{ flex: 1 }}
        />
      </View>
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 },
  cardSub: { fontSize: 12, color: colors.textMuted, marginBottom: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  linkText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  sizeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  sizeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sizeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  sizeChipText: { color: colors.text, fontSize: 13 },
  sizeChipTextActive: { color: '#fff', fontWeight: '600' },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  toggleLabel: { fontSize: 14, color: colors.text },
  spaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderColor: colors.border,
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
  checkboxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  check: { color: '#fff', fontSize: 14, fontWeight: '700' },
  spaceEmoji: { fontSize: 22 },
  spaceName: { fontSize: 15, fontWeight: '600', color: colors.text },
  spaceMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  emptyHint: { color: colors.textMuted, paddingVertical: 12 },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    paddingTop: 8,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
});
