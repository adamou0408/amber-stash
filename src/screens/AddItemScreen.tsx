import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '@/theme/colors';
import { CATEGORY_LABEL, type ItemCategory, type Space } from '@/types';
import { addItem } from '@/storage/itemsStorage';
import { loadSpaces } from '@/storage/spacesStorage';
import {
  addDetectionToSession,
  commitSnapshot,
  createSession,
  loadLatestSnapshotForSpace,
} from '@/storage/sessionStorage';
import { detectAnomalies } from '@/services/anomaly';
import { recognizeItems } from '@/services/ai/recognizeItems';
import { QuotaExceededError } from '@/services/ai/quota';
import { useCaptureSession } from '@/hooks/useCaptureSession';
import { useStreamingProgress } from '@/hooks/useStreamingProgress';
import type { ItemsStackParamList } from '@/navigation/types';
import { CameraStep } from './addItem/CameraStep';
import { CaptureStep } from './addItem/CaptureStep';
import { ReviewStep } from './addItem/ReviewStep';

type Props = NativeStackScreenProps<ItemsStackParamList, 'AddItem'>;

/**
 * AddItemScreen — 物品新增入口。
 *
 * 把原本一個 480-行 god component 拆成三個 step component（capture / camera /
 * review）+ 兩個 hook（useCaptureSession / useStreamingProgress）。
 *
 *   - 未選空間 → 走 legacy quick-save（單筆 Item 直接寫進 itemsStorage）
 *   - 選了空間 → 走 session 流：capture → review → commit snapshot + items 同步
 *
 * UX deferred 整批還清（M5.5）：
 *   - DetectionReviewSheet 處理低信心強制確認 + 右滑刪除 + 行內編輯
 *   - BboxOverlay 在 review 顯示原圖框 + 拖拉編輯
 *   - ContainerAmbiguityDialog 自動處理疑似收納盒
 *   - ProgressIndicator + useStreamingProgress 給 vision call 加假進度
 */
export function AddItemScreen({ navigation }: Props) {
  // ---------- form inputs ----------
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ItemCategory>('other');
  const [quantity, setQuantity] = useState('1');
  const [note, setNote] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [photoBase64, setPhotoBase64] = useState<string | undefined>();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [spaceId, setSpaceId] = useState<string | undefined>();

  // ---------- session ----------
  const session = useCaptureSession(spaceId);

  // ---------- camera + permissions ----------
  const [cameraOpen, setCameraOpen] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  // ---------- AI ----------
  const [aiBusy, setAiBusy] = useState(false);
  const [aiHint, setAiHint] = useState<string | undefined>();
  const progress = useStreamingProgress();

  useEffect(() => {
    loadSpaces().then(setSpaces);
  }, []);

  // ---------- camera flow ----------
  const openCamera = useCallback(async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert('需要相機權限', '請到設定開啟相機權限後再試一次。');
        return;
      }
    }
    setCameraOpen(true);
  }, [permission, requestPermission]);

  const onCapturePhoto = useCallback(({ uri, base64 }: { uri: string; base64?: string }) => {
    setPhotoUri(uri);
    setPhotoBase64(base64);
    setCameraOpen(false);
    setAiHint(undefined);
  }, []);

  const onPickFromLibrary = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setPhotoBase64(result.assets[0].base64 ?? undefined);
      setAiHint(undefined);
    }
  }, []);

  // ---------- AI flow ----------
  const onRecognize = useCallback(async () => {
    if (!photoUri || !photoBase64) {
      Alert.alert('沒有照片', '請先拍照或選照片。');
      return;
    }
    if (!spaceId) {
      Alert.alert('請先選空間', 'AI 辨識結果會進到 session，要先指定空間。');
      return;
    }
    setAiBusy(true);
    setAiHint(undefined);
    progress.start();
    try {
      const result = await recognizeItems({ photoUri, base64: photoBase64 });
      progress.finish();
      if (result.detections.length === 0) {
        setAiHint('AI 沒辨識到任何物品。試試另一張照片，或手動加入。');
        return;
      }
      session.addBatch(result.detections);
      const lowConf = result.detections.filter((d) => d.confidence < 0.6).length;
      const backendLabel =
        result.backend === 'mock' ? '（mock 模式 — 未設 API key）' : `（${result.backend}）`;
      const quotaLabel =
        result.backend === 'mock'
          ? ''
          : ` · 配額 ${result.quotaUsed}/${result.quotaLimit}`;
      const lowConfLabel = lowConf > 0 ? ` · ${lowConf} 筆低信心請審核` : '';
      setAiHint(`✓ 加入 ${result.detections.length} 筆 ${backendLabel}${quotaLabel}${lowConfLabel}`);
    } catch (err) {
      progress.cancel();
      if (err instanceof QuotaExceededError) {
        Alert.alert('本月配額已用完', err.message);
      } else {
        Alert.alert('AI 識別失敗', err instanceof Error ? err.message : String(err));
      }
    } finally {
      setAiBusy(false);
    }
  }, [photoUri, photoBase64, spaceId, session, progress]);

  // ---------- manual entry ----------
  const onAddToSession = useCallback(() => {
    if (!name.trim()) {
      Alert.alert('物品名稱必填');
      return;
    }
    if (!spaceId) {
      Alert.alert('請先選擇空間', '在 session 模式下，先選定一個空間再開始整理。');
      return;
    }
    const qty = Number.parseInt(quantity, 10);
    session.addManual({
      name: name.trim(),
      category,
      quantity: Number.isFinite(qty) && qty > 0 ? qty : 1,
      photoUri,
      note: note.trim() || undefined,
    });
    // Reset just the inputs — keep photo / category around for fast follow-up adds.
    setName('');
    setQuantity('1');
    setNote('');
  }, [name, spaceId, quantity, category, photoUri, note, session]);

  // ---------- quick-save legacy (no space selected) ----------
  const onQuickSaveLegacy = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('物品名稱必填');
      return;
    }
    const qty = Number.parseInt(quantity, 10);
    await addItem({
      name: name.trim(),
      category,
      quantity: Number.isFinite(qty) && qty > 0 ? qty : 1,
      photoUri,
      note: note.trim() || undefined,
      spaceId,
    });
    navigation.goBack();
  }, [name, quantity, category, photoUri, note, spaceId, navigation]);

  // ---------- review + commit ----------
  const onGoReview = useCallback(() => {
    if (session.pendings.length === 0 || !spaceId) {
      Alert.alert('還不能 commit', '請至少加入一筆 detection 並選定空間。');
      return;
    }
    session.setStep('review');
  }, [session, spaceId]);

  const onBackToCapture = useCallback(() => session.setStep('capture'), [session]);

  const onCommit = useCallback(async () => {
    if (!spaceId || session.pendings.length === 0) return;

    // anomaly check before persisting
    const latest = await loadLatestSnapshotForSpace(spaceId);
    const anomalies = detectAnomalies(session.pendings, latest);
    if (anomalies.length > 0) {
      const detail = anomalies
        .map(
          (a) =>
            `${CATEGORY_LABEL[a.category]}：上次 ${a.previousQuantity} → 本次 ${a.currentQuantity} (${a.ratio.toFixed(1)}x)`,
        )
        .join('\n');
      const goAhead = await new Promise<boolean>((resolve) => {
        Alert.alert(
          '數量異常確認',
          `偵測到某些類別數量大幅增加：\n\n${detail}\n\n確定要 commit 嗎？`,
          [
            { text: '取消', style: 'cancel', onPress: () => resolve(false) },
            { text: '確定 commit', onPress: () => resolve(true) },
          ],
        );
      });
      if (!goAhead) return;
    }

    const created = await createSession(spaceId);
    for (const p of session.pendings) {
      await addDetectionToSession(created.id, p);
    }
    await commitSnapshot(created.id);

    // 同時寫進 items storage 維持向後相容（M2/M3 流程）
    for (const p of session.pendings) {
      await addItem({
        name: p.name,
        category: p.category,
        quantity: p.quantity,
        photoUri: p.photoUri,
        note: p.note,
        spaceId,
      });
    }

    session.reset();
    navigation.goBack();
  }, [spaceId, session, navigation]);

  const selectedSpace = useMemo(
    () => spaces.find((s) => s.id === spaceId),
    [spaces, spaceId],
  );

  // ---------- render ----------
  if (cameraOpen) {
    return <CameraStep onCancel={() => setCameraOpen(false)} onCapture={onCapturePhoto} />;
  }

  if (session.step === 'review') {
    return (
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <ReviewStep
          pendings={session.pendings}
          spaceName={selectedSpace?.name}
          primaryPhotoUri={photoUri}
          onPatch={session.patch}
          onUpdateBbox={session.updateBbox}
          onRemove={session.remove}
          onCancel={onBackToCapture}
          onCommit={onCommit}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <CaptureStep
        name={name}
        category={category}
        quantity={quantity}
        note={note}
        photoUri={photoUri}
        spaces={spaces}
        spaceId={spaceId}
        pendings={session.pendings}
        aiBusy={aiBusy}
        aiHint={aiHint}
        aiStage={progress.stage}
        onChangeName={setName}
        onChangeCategory={setCategory}
        onChangeQuantity={setQuantity}
        onChangeNote={setNote}
        onSelectSpace={setSpaceId}
        onOpenCamera={openCamera}
        onPickFromLibrary={onPickFromLibrary}
        onRecognize={onRecognize}
        onAddToSession={onAddToSession}
        onGoReview={onGoReview}
        onQuickSaveLegacy={onQuickSaveLegacy}
        onRemovePending={session.remove}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
});
