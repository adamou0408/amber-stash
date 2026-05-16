import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { colors } from '@/theme/colors';
import type { Detection } from '@/types/snapshot';
import { CATEGORY_LABEL } from '@/types';

/**
 * 容器歧義對話 — 當辨識到名稱含「盒/箱/籃」字樣的疑似容器時跳出。
 *
 * 兩個出口：
 *   - 「展開內容物」：把這 detection 刪掉，提示使用者重新拍裡面的東西
 *   - 「只算容器」：保留 detection 但 note 加上「(容器)」標記
 *
 * UX 細節：
 *   - 滿屏遮罩（pointerEvents='box-only'）避免誤點背景
 *   - dismiss 動作需要明確選擇，不能 tap-outside-to-close（容易誤關失去 context）
 */
type Props = {
  visible: boolean;
  detection: Detection | null;
  onExpand: (detection: Detection) => void;
  onKeepAsContainer: (detection: Detection) => void;
  onDismiss: () => void;
};

export function ContainerAmbiguityDialog({
  visible,
  detection,
  onExpand,
  onKeepAsContainer,
  onDismiss,
}: Props) {
  if (!detection) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onDismiss}
      testID="container-ambiguity-modal"
    >
      <Pressable
        testID="container-ambiguity-backdrop"
        accessibilityRole="none"
        style={styles.backdrop}
      >
        <Pressable
          // Stop propagation by intercepting press on the card itself.
          accessibilityRole="none"
          style={styles.card}
        >
          <Text style={styles.title}>偵測到一個收納容器</Text>
          <Text style={styles.subtitle}>
            「<Text style={styles.detectionName}>{detection.name}</Text>」看起來像一個收納箱／盒／籃。
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaPill}>{CATEGORY_LABEL[detection.category]}</Text>
            <Text style={styles.metaPill}>信心 {(detection.confidence * 100).toFixed(0)}%</Text>
          </View>
          <Text style={styles.body}>
            要把這個容器當成「一件」收進去，還是要展開、實際盤點裡面的東西？
          </Text>
          <View style={styles.actions}>
            <Button
              testID="container-ambiguity-expand"
              title="展開內容物"
              variant="secondary"
              onPress={() => onExpand(detection)}
              style={styles.action}
            />
            <Button
              testID="container-ambiguity-keep"
              title="只算這個容器"
              onPress={() => onKeepAsContainer(detection)}
              style={styles.action}
            />
          </View>
          <Pressable
            testID="container-ambiguity-dismiss"
            onPress={onDismiss}
            style={styles.dismiss}
            accessibilityRole="button"
          >
            <Text style={styles.dismissText}>稍後再決定</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(40, 30, 18, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.bg,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 10,
    lineHeight: 20,
  },
  detectionName: {
    fontWeight: '700',
    color: colors.primaryDark,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  metaPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: colors.card,
    color: colors.text,
    fontSize: 11,
    overflow: 'hidden',
  },
  body: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 16,
    lineHeight: 19,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  action: {
    flex: 1,
  },
  dismiss: {
    alignSelf: 'center',
    paddingVertical: 10,
    marginTop: 6,
  },
  dismissText: {
    fontSize: 12,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
});
