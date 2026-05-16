import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

/**
 * Three-stage progress UI for the vision-call flow.
 *
 * 我們無法拿到 Anthropic 真正的 streaming 進度（messages API 不 stream tool_use
 * 中段），但 UI 要傳達「事情有在動」。
 *
 * 階段：
 *   0 = 上傳照片
 *   1 = AI 分析中
 *   2 = 解析結果
 *
 * stage 由外部 prop 控制。每個 stage 內部都有一條 shimmer 動畫的進度條，
 * 並把已完成階段填滿、未到階段留空。
 */
export type ProgressStage = 0 | 1 | 2 | 'done';

const STAGE_LABELS: Record<Exclude<ProgressStage, 'done'>, string> = {
  0: '上傳照片',
  1: 'AI 分析中',
  2: '解析結果',
};

const TOTAL_STAGES = 3;

type Props = {
  stage: ProgressStage;
  /** 補一段「為什麼這需要時間」的副文，可不傳。 */
  hint?: string;
};

export function ProgressIndicator({ stage, hint }: Props) {
  const shimmer = useRef(new Animated.Value(0)).current;

  // shimmer loop for the active bar — pure visual sugar.
  useEffect(() => {
    if (stage === 'done') return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: false,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1100,
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [stage, shimmer]);

  const completedFraction = useMemo(() => {
    if (stage === 'done') return 1;
    return stage / TOTAL_STAGES;
  }, [stage]);

  // Animated width for the green progress bar
  const widthAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: completedFraction,
      duration: 360,
      useNativeDriver: false,
    }).start();
  }, [completedFraction, widthAnim]);

  const widthPct = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const shimmerOpacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.9],
  });

  return (
    <View testID="progress-indicator" style={styles.wrap}>
      <View style={styles.track}>
        <Animated.View
          style={[styles.fill, { width: widthPct }]}
        />
        {stage !== 'done' ? (
          <Animated.View
            testID="progress-indicator-shimmer"
            style={[styles.shimmer, { opacity: shimmerOpacity }]}
          />
        ) : null}
      </View>
      <View style={styles.labels}>
        {([0, 1, 2] as const).map((idx) => {
          const isDone = stage === 'done' || idx < (stage as number);
          const isActive = stage !== 'done' && idx === stage;
          return (
            <Text
              key={idx}
              testID={`progress-stage-${idx}`}
              style={[
                styles.label,
                isDone && styles.labelDone,
                isActive && styles.labelActive,
              ]}
            >
              {isDone ? '✓ ' : isActive ? '… ' : ''}
              {STAGE_LABELS[idx]}
            </Text>
          );
        })}
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 10,
  },
  track: {
    height: 8,
    backgroundColor: colors.card,
    borderRadius: 999,
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 999,
  },
  shimmer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    opacity: 0.5,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  label: {
    fontSize: 11,
    color: colors.textMuted,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  labelDone: {
    color: colors.accent,
    fontWeight: '600',
  },
  hint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6,
    lineHeight: 16,
  },
});
