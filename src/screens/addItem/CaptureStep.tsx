import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/Button';
import { ProgressIndicator, type ProgressStage } from '@/components/ProgressIndicator';
import { colors } from '@/theme/colors';
import { CATEGORY_LABEL, SPACE_EMOJI, type ItemCategory, type Space } from '@/types';
import type { Detection } from '@/types/snapshot';
import { getActiveBackend } from '@/services/ai/config';

const CATEGORIES = Object.keys(CATEGORY_LABEL) as ItemCategory[];

/**
 * AddItem flow 的「capture」步驟。
 *
 * 純展示元件 — 所有狀態由父層管。可拍照／選照片／手動加入 detection。
 * 若選了空間就走 session 流；沒選就 fallback quick-save。
 */
type Props = {
  name: string;
  category: ItemCategory;
  quantity: string;
  note: string;
  photoUri?: string | undefined;
  spaces: Space[];
  spaceId?: string | undefined;
  pendings: Detection[];
  aiBusy: boolean;
  aiHint?: string | undefined;
  aiStage: ProgressStage;
  cameraPermissionDenied?: boolean;
  onChangeName: (n: string) => void;
  onChangeCategory: (c: ItemCategory) => void;
  onChangeQuantity: (q: string) => void;
  onChangeNote: (n: string) => void;
  onSelectSpace: (id: string | undefined) => void;
  onOpenCamera: () => void;
  onPickFromLibrary: () => void;
  onRecognize: () => void;
  onAddToSession: () => void;
  onGoReview: () => void;
  onQuickSaveLegacy: () => void;
  onRemovePending: (id: string) => void;
};

export function CaptureStep({
  name,
  category,
  quantity,
  note,
  photoUri,
  spaces,
  spaceId,
  pendings,
  aiBusy,
  aiHint,
  aiStage,
  onChangeName,
  onChangeCategory,
  onChangeQuantity,
  onChangeNote,
  onSelectSpace,
  onOpenCamera,
  onPickFromLibrary,
  onRecognize,
  onAddToSession,
  onGoReview,
  onQuickSaveLegacy,
  onRemovePending,
}: Props) {
  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <PhotoZone photoUri={photoUri} onCamera={onOpenCamera} onLibrary={onPickFromLibrary} />

      {photoUri ? (
        <AiPanel
          busy={aiBusy}
          stage={aiStage}
          hint={aiHint}
          onRecognize={onRecognize}
        />
      ) : null}

      <ManualEntry
        name={name}
        category={category}
        quantity={quantity}
        note={note}
        onChangeName={onChangeName}
        onChangeCategory={onChangeCategory}
        onChangeQuantity={onChangeQuantity}
        onChangeNote={onChangeNote}
      />

      {spaces.length > 0 ? (
        <SpacePicker
          spaces={spaces}
          spaceId={spaceId}
          onSelect={onSelectSpace}
        />
      ) : null}

      {pendings.length > 0 ? (
        <PendingList pendings={pendings} onRemove={onRemovePending} />
      ) : null}

      {spaceId ? (
        <>
          <Button title="加入這次 session" onPress={onAddToSession} style={{ marginTop: 16 }} />
          <Button
            title={`下一步：審核並 commit (${pendings.length})`}
            variant="secondary"
            onPress={onGoReview}
            disabled={pendings.length === 0}
            style={{ marginTop: 8 }}
          />
        </>
      ) : (
        <Button title="儲存" onPress={onQuickSaveLegacy} style={{ marginTop: 16 }} />
      )}
    </ScrollView>
  );
}

function PhotoZone({
  photoUri,
  onCamera,
  onLibrary,
}: {
  photoUri?: string | undefined;
  onCamera: () => void;
  onLibrary: () => void;
}) {
  return (
    <>
      <View style={styles.photoBox}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} />
        ) : (
          <Text style={styles.photoHint}>還沒有照片</Text>
        )}
      </View>
      <View style={styles.row}>
        <Button title="拍照" onPress={onCamera} style={styles.rowBtn} />
        <Button title="從相簿選" variant="secondary" onPress={onLibrary} style={styles.rowBtn} />
      </View>
    </>
  );
}

function AiPanel({
  busy,
  stage,
  hint,
  onRecognize,
}: {
  busy: boolean;
  stage: ProgressStage;
  hint?: string | undefined;
  onRecognize: () => void;
}) {
  const backend = getActiveBackend();
  return (
    <View style={styles.aiBox}>
      <Pressable
        onPress={onRecognize}
        disabled={busy}
        style={[styles.aiBtn, busy && styles.aiBtnDisabled]}
      >
        <Text style={styles.aiBtnText}>
          {busy ? 'AI 分析中…' : `🤖 用 AI 辨識這張照片${backend === 'mock' ? '（mock）' : ''}`}
        </Text>
      </Pressable>
      {busy ? (
        <ProgressIndicator
          stage={stage}
          hint="Vision call 一般需要 5-10 秒；上傳越大張越久。"
        />
      ) : null}
      {hint ? <Text style={styles.aiHint}>{hint}</Text> : null}
    </View>
  );
}

function ManualEntry({
  name,
  category,
  quantity,
  note,
  onChangeName,
  onChangeCategory,
  onChangeQuantity,
  onChangeNote,
}: {
  name: string;
  category: ItemCategory;
  quantity: string;
  note: string;
  onChangeName: (s: string) => void;
  onChangeCategory: (c: ItemCategory) => void;
  onChangeQuantity: (s: string) => void;
  onChangeNote: (s: string) => void;
}) {
  return (
    <>
      <Text style={styles.label}>物品名稱</Text>
      <TextInput
        style={styles.input}
        placeholder="例如：冬季羽絨外套"
        value={name}
        onChangeText={onChangeName}
      />
      <Text style={styles.label}>分類</Text>
      <View style={styles.chips}>
        {CATEGORIES.map((c) => {
          const active = c === category;
          return (
            <Pressable
              key={c}
              onPress={() => onChangeCategory(c)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {CATEGORY_LABEL[c]}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.label}>數量</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={quantity}
        onChangeText={onChangeQuantity}
      />
      <Text style={styles.label}>備註</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        multiline
        placeholder="保存期限、買的地點、誰的…"
        value={note}
        onChangeText={onChangeNote}
      />
    </>
  );
}

function SpacePicker({
  spaces,
  spaceId,
  onSelect,
}: {
  spaces: Space[];
  spaceId?: string | undefined;
  onSelect: (id: string | undefined) => void;
}) {
  return (
    <>
      <Text style={styles.label}>放在哪個空間</Text>
      <View style={styles.chips}>
        <Pressable
          onPress={() => onSelect(undefined)}
          style={[styles.chip, !spaceId && styles.chipActive]}
        >
          <Text style={[styles.chipText, !spaceId && styles.chipTextActive]}>未指定</Text>
        </Pressable>
        {spaces.map((s) => {
          const active = spaceId === s.id;
          return (
            <Pressable
              key={s.id}
              onPress={() => onSelect(s.id)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {SPACE_EMOJI[s.kind]} {s.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

function PendingList({
  pendings,
  onRemove,
}: {
  pendings: Detection[];
  onRemove: (id: string) => void;
}) {
  return (
    <View style={styles.pendingList}>
      <Text style={styles.pendingHeader}>本次 session 已加入 {pendings.length} 筆</Text>
      {pendings.map((p) => (
        <Pressable
          key={p.id}
          onLongPress={() => onRemove(p.id)}
          style={styles.pendingItem}
        >
          <Text style={styles.pendingItemText}>
            {p.name} · {CATEGORY_LABEL[p.category]} × {p.quantity}
          </Text>
          <Text style={styles.pendingItemHint}>長按移除</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  photoBox: {
    height: 200,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 12,
  },
  photo: { width: '100%', height: '100%' },
  photoHint: { color: colors.textMuted },
  row: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  rowBtn: { flex: 1 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  textarea: { minHeight: 70, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  pendingList: {
    marginTop: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  pendingHeader: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 8 },
  pendingItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  pendingItemText: { fontSize: 13, color: colors.text },
  pendingItemHint: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  aiBox: { marginBottom: 12 },
  aiBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBtnDisabled: { opacity: 0.6 },
  aiBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  aiHint: { fontSize: 12, color: colors.textMuted, marginTop: 8, lineHeight: 18 },
});
