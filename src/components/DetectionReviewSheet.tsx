import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Button } from '@/components/Button';
import { colors } from '@/theme/colors';
import { CATEGORY_LABEL, type ItemCategory } from '@/types';
import type { Detection } from '@/types/snapshot';
import {
  LOW_CONFIDENCE_THRESHOLD,
  canCommitReview,
  isLowConfidence,
  pendingLowConfidence,
} from '@/services/reviewState';

/**
 * 產品等級 review sheet：
 *
 *   - 每筆 detection 一 row
 *   - 低信心整 row 紅底 + 「需確認」徽章；點過後變綠勾
 *   - 點 row → 展開可編輯 name / category / quantity
 *   - 右滑刪除（react-native-gesture-handler Swipeable）
 *   - 全部低信心都「確認」過 && list 非空才能 commit
 *
 * Commit gating 邏輯抽到 `services/reviewState.ts`，方便獨立測試。
 */

const CATEGORIES = Object.keys(CATEGORY_LABEL) as ItemCategory[];

type Props = {
  detections: Detection[];
  /** 「確認過」的 low-conf id 集合；review sheet 自己內部管，外部不用知道。 */
  initialConfirmedIds?: ReadonlySet<string>;
  onUpdate: (id: string, patch: Partial<Detection>) => void;
  onRemove: (id: string) => void;
  onCommit: () => void;
  onCancel: () => void;
  /** 寫在 sheet 頂端的提示文字，例如要 commit 到哪個空間 */
  headerSubtitle?: string;
};

export function DetectionReviewSheet({
  detections,
  initialConfirmedIds,
  onUpdate,
  onRemove,
  onCommit,
  onCancel,
  headerSubtitle,
}: Props) {
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(
    () => new Set(initialConfirmedIds ?? []),
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleConfirm = useCallback((id: string) => {
    setConfirmedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedId((cur) => (cur === id ? null : id));
  }, []);

  const handleRemove = useCallback(
    (id: string) => {
      onRemove(id);
      setConfirmedIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      if (expandedId === id) setExpandedId(null);
    },
    [expandedId, onRemove],
  );

  const pendingIds = useMemo(
    () => pendingLowConfidence(detections, confirmedIds),
    [detections, confirmedIds],
  );

  const canCommit = useMemo(
    () => canCommitReview(detections, confirmedIds),
    [detections, confirmedIds],
  );

  return (
    <View style={styles.wrap} testID="detection-review-sheet">
      <View style={styles.header}>
        <Text style={styles.title}>確認 Snapshot ({detections.length})</Text>
        {headerSubtitle ? (
          <Text style={styles.subtitle}>{headerSubtitle}</Text>
        ) : null}
        {pendingIds.length > 0 ? (
          <View style={styles.pendingBanner} testID="pending-low-confidence-banner">
            <Text style={styles.pendingBannerText}>
              還有 {pendingIds.length} 筆低信心需要確認才能 commit
            </Text>
          </View>
        ) : null}
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        testID="detection-list"
      >
        {detections.length === 0 ? (
          <Text style={styles.emptyText}>還沒有 detection — 回上一步加幾筆。</Text>
        ) : null}
        {detections.map((d) => (
          <DetectionRow
            key={d.id}
            detection={d}
            expanded={expandedId === d.id}
            confirmed={confirmedIds.has(d.id)}
            onToggleExpand={() => handleToggleExpand(d.id)}
            onConfirm={() => handleConfirm(d.id)}
            onRemove={() => handleRemove(d.id)}
            onPatch={(patch) => onUpdate(d.id, patch)}
          />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="返回編輯"
          variant="secondary"
          onPress={onCancel}
          style={styles.footerBtn}
          testID="review-cancel"
        />
        <Button
          title="commit snapshot"
          onPress={onCommit}
          disabled={!canCommit}
          style={[styles.footerBtn, !canCommit ? styles.btnDisabled : null]}
          testID="review-commit"
        />
      </View>
    </View>
  );
}

type RowProps = {
  detection: Detection;
  expanded: boolean;
  confirmed: boolean;
  onToggleExpand: () => void;
  onConfirm: () => void;
  onRemove: () => void;
  onPatch: (patch: Partial<Detection>) => void;
};

function DetectionRow({
  detection,
  expanded,
  confirmed,
  onToggleExpand,
  onConfirm,
  onRemove,
  onPatch,
}: RowProps) {
  const low = isLowConfidence(detection);
  const needsConfirm = low && !confirmed;

  return (
    <Swipeable
      renderRightActions={() => (
        <Pressable
          testID={`row-swipe-delete-${detection.id}`}
          onPress={onRemove}
          style={styles.swipeAction}
        >
          <Text style={styles.swipeActionText}>刪除</Text>
        </Pressable>
      )}
    >
      <Pressable
        testID={`detection-row-${detection.id}`}
        onPress={onToggleExpand}
        style={[
          styles.row,
          needsConfirm && styles.rowLowConfNeedsConfirm,
          confirmed && low && styles.rowLowConfConfirmed,
        ]}
      >
        <View style={styles.rowHead}>
          <View style={styles.rowHeadLeft}>
            <Text style={styles.rowName}>{detection.name || '（未命名）'}</Text>
            <Text style={styles.rowMeta}>
              {CATEGORY_LABEL[detection.category]} · 數量 {detection.quantity} ·
              {' '}信心 {(detection.confidence * 100).toFixed(0)}%
            </Text>
          </View>
          {needsConfirm ? (
            <View
              testID={`row-needs-confirm-${detection.id}`}
              style={styles.needsConfirmBadge}
            >
              <Text style={styles.needsConfirmText}>需確認</Text>
            </View>
          ) : confirmed && low ? (
            <View testID={`row-confirmed-${detection.id}`} style={styles.confirmedBadge}>
              <Text style={styles.confirmedText}>已確認</Text>
            </View>
          ) : null}
        </View>

        {expanded ? (
          <View style={styles.expanded}>
            <Text style={styles.label}>物品名稱</Text>
            <TextInput
              testID={`row-edit-name-${detection.id}`}
              style={styles.input}
              value={detection.name}
              onChangeText={(name) => onPatch({ name })}
            />

            <Text style={styles.label}>類別</Text>
            <View style={styles.chips}>
              {CATEGORIES.map((c) => {
                const active = c === detection.category;
                return (
                  <Pressable
                    testID={`row-edit-cat-${detection.id}-${c}`}
                    key={c}
                    onPress={() => onPatch({ category: c })}
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
              testID={`row-edit-qty-${detection.id}`}
              style={styles.input}
              keyboardType="number-pad"
              value={String(detection.quantity)}
              onChangeText={(v) => {
                const n = Number.parseInt(v, 10);
                onPatch({ quantity: Number.isFinite(n) && n > 0 ? n : 1 });
              }}
            />

            {low && !confirmed ? (
              <Button
                title="確認這筆"
                testID={`row-confirm-btn-${detection.id}`}
                onPress={onConfirm}
                style={styles.confirmInlineBtn}
              />
            ) : null}
          </View>
        ) : null}
      </Pressable>
    </Swipeable>
  );
}

export { LOW_CONFIDENCE_THRESHOLD };

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 4, lineHeight: 18 },
  pendingBanner: {
    marginTop: 10,
    backgroundColor: '#FFE3E0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  pendingBannerText: { fontSize: 12, color: colors.danger, fontWeight: '600' },
  list: { flex: 1 },
  listContent: { padding: 12, paddingBottom: 32 },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 24,
  },
  row: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowLowConfNeedsConfirm: {
    backgroundColor: '#FFE3E0',
    borderColor: colors.danger,
  },
  rowLowConfConfirmed: {
    backgroundColor: '#E6F3EC',
    borderColor: colors.accent,
  },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowHeadLeft: { flex: 1 },
  rowName: { fontSize: 14, fontWeight: '700', color: colors.text },
  rowMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  needsConfirmBadge: {
    backgroundColor: colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  needsConfirmText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  confirmedBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  confirmedText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  expanded: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  label: { fontSize: 12, fontWeight: '600', color: colors.text, marginTop: 8, marginBottom: 4 },
  input: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.text,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 11 },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  confirmInlineBtn: { marginTop: 12 },
  swipeAction: {
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginBottom: 8,
    borderRadius: 12,
    marginLeft: 6,
  },
  swipeActionText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerBtn: { flex: 1 },
  btnDisabled: { opacity: 0.4 },
});
