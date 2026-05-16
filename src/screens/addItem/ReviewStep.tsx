import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BboxOverlay } from '@/components/BboxOverlay';
import { ContainerAmbiguityDialog } from '@/components/ContainerAmbiguityDialog';
import { DetectionReviewSheet } from '@/components/DetectionReviewSheet';
import { colors } from '@/theme/colors';
import type { BBox, Detection } from '@/types/snapshot';
import { markAsContainerOnly, pickContainerCandidate } from '@/services/containerHeuristic';

/**
 * Review step：
 *   - 上半：BboxOverlay（如果有照片 + 有 bbox 才顯示）
 *   - 下半：DetectionReviewSheet
 *   - 容器歧義對話：自動跳出處理首個 candidate；處理完後若仍有下一個再跳
 */
type Props = {
  pendings: Detection[];
  spaceName?: string | undefined;
  primaryPhotoUri?: string | undefined;
  onPatch: (id: string, patch: Partial<Detection>) => void;
  onUpdateBbox: (id: string, next: BBox) => void;
  onRemove: (id: string) => void;
  onCancel: () => void;
  onCommit: () => void;
};

export function ReviewStep({
  pendings,
  spaceName,
  primaryPhotoUri,
  onPatch,
  onUpdateBbox,
  onRemove,
  onCancel,
  onCommit,
}: Props) {
  const [focusedId, setFocusedId] = useState<string | undefined>(undefined);
  // Track which containers the user has already triaged so we don't pester them
  // when they re-enter review after editing.
  const [resolvedContainerIds, setResolvedContainerIds] = useState<Set<string>>(
    new Set(),
  );
  const [bboxVisible, setBboxVisible] = useState(true);

  const detectionsWithBbox = useMemo(
    () => pendings.filter((d) => d.bbox !== undefined && d.photoUri),
    [pendings],
  );

  const pendingContainer = useMemo(() => {
    const candidates = pendings.filter((d) => !resolvedContainerIds.has(d.id));
    return pickContainerCandidate(candidates);
  }, [pendings, resolvedContainerIds]);

  const handleExpand = useCallback(
    (det: Detection) => {
      onRemove(det.id);
      setResolvedContainerIds((cur) => {
        const next = new Set(cur);
        next.add(det.id);
        return next;
      });
    },
    [onRemove],
  );

  const handleKeepAsContainer = useCallback(
    (det: Detection) => {
      const tagged = markAsContainerOnly(det);
      onPatch(det.id, { note: tagged.note });
      setResolvedContainerIds((cur) => {
        const next = new Set(cur);
        next.add(det.id);
        return next;
      });
    },
    [onPatch],
  );

  const handleDismissContainer = useCallback(() => {
    if (pendingContainer) {
      setResolvedContainerIds((cur) => {
        const next = new Set(cur);
        next.add(pendingContainer.id);
        return next;
      });
    }
  }, [pendingContainer]);

  return (
    <View style={styles.wrap}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {detectionsWithBbox.length > 0 && primaryPhotoUri ? (
          <View style={styles.overlayBox}>
            <View style={styles.overlayHeader}>
              <Text style={styles.overlayTitle}>原圖標註</Text>
              <Pressable
                onPress={() => setBboxVisible((v) => !v)}
                style={styles.toggleBtn}
                testID="bbox-overlay-toggle"
              >
                <Text style={styles.toggleText}>{bboxVisible ? '隱藏框' : '顯示框'}</Text>
              </Pressable>
            </View>
            {bboxVisible ? (
              <BboxOverlay
                photoUri={primaryPhotoUri}
                detections={detectionsWithBbox}
                focusedId={focusedId}
                onFocus={setFocusedId}
                onUpdateBbox={onUpdateBbox}
              />
            ) : null}
            <Text style={styles.overlayHint}>
              點框 focus → 拖角調整。低信心紅、高信心金。
            </Text>
          </View>
        ) : null}

        <DetectionReviewSheet
          detections={pendings}
          onUpdate={onPatch}
          onRemove={onRemove}
          onCommit={onCommit}
          onCancel={onCancel}
          headerSubtitle={
            spaceName
              ? `commit 後這份 snapshot 會取代「${spaceName}」當前狀態（不累加）。`
              : undefined
          }
        />
      </ScrollView>

      <ContainerAmbiguityDialog
        visible={pendingContainer !== null}
        detection={pendingContainer}
        onExpand={handleExpand}
        onKeepAsContainer={handleKeepAsContainer}
        onDismiss={handleDismissContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 12 },
  overlayBox: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  overlayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  overlayTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleText: { fontSize: 11, color: colors.text },
  overlayHint: { fontSize: 11, color: colors.textMuted, marginTop: 6, lineHeight: 16 },
});
