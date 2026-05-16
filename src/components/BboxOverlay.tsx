import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Image,
  LayoutAnimation,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { colors } from '@/theme/colors';
import type { BBox, Detection } from '@/types/snapshot';
import {
  bboxStrokeForConfidence,
  normalizedToPx,
  resizeBboxFromCorner,
  translateBbox,
  type Corner,
} from '@/services/bboxMath';
import { LOW_CONFIDENCE_THRESHOLD } from '@/services/reviewState';

/**
 * 在原圖上覆蓋所有 detection 的 bbox 框；支援 corner 拖拉編輯。
 *
 * 設計考量：
 *   - 所有 bbox 都是歸一化座標（0~1），轉 px 在這層做
 *   - 拖拉 corner 由 `react-native-gesture-handler` 提供原生流暢度
 *   - focusedId 是 controlled prop — 點框 → 父層更新 → 我們高亮對應框
 *   - 純函式 (resizeBboxFromCorner / translateBbox) 抽到 `services/bboxMath.ts` 方便單元測試
 */

const CORNER_SIZE = 22;
const CORNER_HIT_PADDING = 8;

type GestureEvent = {
  nativeEvent: {
    translationX: number;
    translationY: number;
    state: number;
  };
};

type Props = {
  photoUri: string | undefined;
  detections: Detection[];
  /** 哪個 detection 是 focus — 邊框換色，pin 在最上層 */
  focusedId?: string | undefined;
  onFocus?: ((id: string) => void) | undefined;
  /** 拖完 corner 後 commit 新的 bbox 給父層 */
  onUpdateBbox?: ((id: string, next: BBox) => void) | undefined;
  /** 原圖長寬比，用來決定 overlay 高度。沒給時假設 4:3。 */
  aspectRatio?: number;
};

export function BboxOverlay({
  photoUri,
  detections,
  focusedId,
  onFocus,
  onUpdateBbox,
  aspectRatio = 4 / 3,
}: Props) {
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, []);

  const visible = useMemo(
    () => detections.filter((d) => d.bbox !== undefined),
    [detections],
  );

  return (
    <View
      testID="bbox-overlay"
      style={[styles.wrap, { aspectRatio }]}
      onLayout={onLayout}
    >
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Text style={styles.placeholderText}>沒有照片</Text>
        </View>
      )}
      {size.w > 0
        ? visible.map((d) => (
            <BboxFrame
              key={d.id}
              detection={d}
              bbox={d.bbox as BBox}
              containerW={size.w}
              containerH={size.h}
              focused={d.id === focusedId}
              onFocus={onFocus}
              onUpdateBbox={onUpdateBbox}
            />
          ))
        : null}
    </View>
  );
}

type FrameProps = {
  detection: Detection;
  bbox: BBox;
  containerW: number;
  containerH: number;
  focused: boolean;
  onFocus?: ((id: string) => void) | undefined;
  onUpdateBbox?: ((id: string, next: BBox) => void) | undefined;
};

function BboxFrame({
  detection,
  bbox,
  containerW,
  containerH,
  focused,
  onFocus,
  onUpdateBbox,
}: FrameProps) {
  const px = normalizedToPx(bbox, containerW, containerH);
  const stroke = bboxStrokeForConfidence(
    detection.confidence,
    colors.primary,
    colors.danger,
  );
  const lowConf = detection.confidence < LOW_CONFIDENCE_THRESHOLD;

  // Stash starting bbox at gesture start so each delta builds off the same baseline.
  const startRef = useRef<BBox>(bbox);

  const onPanBoxStart = () => {
    startRef.current = bbox;
  };

  const onPanBox = useCallback(
    (e: GestureEvent) => {
      const { translationX, translationY } = e.nativeEvent;
      const next = translateBbox(
        startRef.current,
        translationX,
        translationY,
        containerW,
        containerH,
      );
      onUpdateBbox?.(detection.id, next);
    },
    [containerW, containerH, detection.id, onUpdateBbox],
  );

  const makeCornerHandler = (corner: Corner) => {
    return (e: GestureEvent) => {
      const { translationX, translationY } = e.nativeEvent;
      const baseline = startRef.current;
      const basePx = normalizedToPx(baseline, containerW, containerH);
      let cornerX = basePx.x;
      let cornerY = basePx.y;
      switch (corner) {
        case 'tl':
          cornerX = basePx.x + translationX;
          cornerY = basePx.y + translationY;
          break;
        case 'tr':
          cornerX = basePx.x + basePx.w + translationX;
          cornerY = basePx.y + translationY;
          break;
        case 'bl':
          cornerX = basePx.x + translationX;
          cornerY = basePx.y + basePx.h + translationY;
          break;
        case 'br':
          cornerX = basePx.x + basePx.w + translationX;
          cornerY = basePx.y + basePx.h + translationY;
          break;
      }
      const next = resizeBboxFromCorner(
        baseline,
        corner,
        cornerX,
        cornerY,
        containerW,
        containerH,
      );
      onUpdateBbox?.(detection.id, next);
    };
  };

  return (
    <PanGestureHandler
      onBegan={onPanBoxStart}
      onGestureEvent={onPanBox}
      testID={`bbox-frame-pan-${detection.id}`}
    >
      <Pressable
        testID={`bbox-frame-${detection.id}`}
        onPress={() => onFocus?.(detection.id)}
        style={[
          styles.frame,
          {
            left: px.x,
            top: px.y,
            width: px.w,
            height: px.h,
            borderColor: stroke,
            borderWidth: focused ? 3 : 2,
            // Focused frames pop with a tinted fill; others stay see-through.
            backgroundColor: focused ? `${stroke}22` : 'transparent',
          },
        ]}
      >
        <View
          style={[
            styles.tag,
            { backgroundColor: stroke },
          ]}
          testID={`bbox-tag-${detection.id}`}
        >
          <Text style={styles.tagText} numberOfLines={1}>
            {detection.name} · {(detection.confidence * 100).toFixed(0)}%
            {lowConf ? ' ⚠️' : ''}
          </Text>
        </View>

        {/* Corner handles — only render when focused (less visual noise) */}
        {focused ? (
          <>
            <CornerHandle
              corner="tl"
              onStart={onPanBoxStart}
              onMove={makeCornerHandler('tl')}
            />
            <CornerHandle
              corner="tr"
              onStart={onPanBoxStart}
              onMove={makeCornerHandler('tr')}
            />
            <CornerHandle
              corner="bl"
              onStart={onPanBoxStart}
              onMove={makeCornerHandler('bl')}
            />
            <CornerHandle
              corner="br"
              onStart={onPanBoxStart}
              onMove={makeCornerHandler('br')}
            />
          </>
        ) : null}
      </Pressable>
    </PanGestureHandler>
  );
}

type CornerHandleProps = {
  corner: Corner;
  onStart: () => void;
  onMove: (e: GestureEvent) => void;
};

function CornerHandle({ corner, onStart, onMove }: CornerHandleProps) {
  const positional = cornerStyle(corner);
  return (
    <PanGestureHandler
      onBegan={onStart}
      onGestureEvent={onMove}
      testID={`bbox-corner-${corner}`}
    >
      <View
        style={[styles.cornerHit, positional]}
        // Helpful for E2E targeting later
        accessibilityLabel={`resize-${corner}`}
      >
        <View style={styles.cornerDot} />
      </View>
    </PanGestureHandler>
  );
}

function cornerStyle(corner: Corner) {
  const off = -(CORNER_SIZE / 2 + CORNER_HIT_PADDING);
  switch (corner) {
    case 'tl':
      return { left: off, top: off };
    case 'tr':
      return { right: off, top: off };
    case 'bl':
      return { left: off, bottom: off };
    case 'br':
      return { right: off, bottom: off };
  }
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { color: colors.textMuted },
  frame: {
    position: 'absolute',
    borderRadius: 6,
  },
  tag: {
    position: 'absolute',
    top: -22,
    left: 0,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    maxWidth: 200,
  },
  tagText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  cornerHit: {
    width: CORNER_SIZE + CORNER_HIT_PADDING * 2,
    height: CORNER_SIZE + CORNER_HIT_PADDING * 2,
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cornerDot: {
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderRadius: CORNER_SIZE / 2,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: colors.text,
  },
});
