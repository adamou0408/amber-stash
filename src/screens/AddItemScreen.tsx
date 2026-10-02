import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import uuid from 'react-native-uuid';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '@/components/Button';
import { colors } from '@/theme/colors';
import { CATEGORY_LABEL, SPACE_EMOJI, type ItemCategory, type Space } from '@/types';
import type { Detection } from '@/types/snapshot';
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
import { getActiveBackend } from '@/services/ai/config';
import { listFixtures, type FixtureScenario } from '@/services/detectionSource';
import type { ItemsStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<ItemsStackParamList, 'AddItem'>;

const CATEGORIES = Object.keys(CATEGORY_LABEL) as ItemCategory[];

type Mode = 'capture' | 'review';

type PendingDetection = Omit<Detection, 'id'> & { id: string };

export function AddItemScreen({ navigation }: Props) {
  // ---------- inputs ----------
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ItemCategory>('other');
  const [quantity, setQuantity] = useState('1');
  const [note, setNote] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [spaceId, setSpaceId] = useState<string | undefined>();

  // ---------- session state ----------
  const [mode, setMode] = useState<Mode>('capture');
  const [pendings, setPendings] = useState<PendingDetection[]>([]);

  // ---------- AI ----------
  const [photoBase64, setPhotoBase64] = useState<string | undefined>();
  const [aiBusy, setAiBusy] = useState(false);
  const [aiHint, setAiHint] = useState<string | undefined>();

  // ---------- camera ----------
  const [cameraOpen, setCameraOpen] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);

  // ---------- fixture picker (dev / web 用，跳過相機直接注入假資料) ----------
  const [fixturePickerOpen, setFixturePickerOpen] = useState(false);
  const fixtures = useMemo<FixtureScenario[]>(() => listFixtures(), []);
  /** 載入 fixture 時記錄它的展示照片（Metro asset module ID），讓 photoBox 也顯示出來。 */
  const [fixturePhoto, setFixturePhoto] = useState<number | undefined>();

  useEffect(() => {
    loadSpaces().then(setSpaces);
  }, []);

  const canReview = pendings.length > 0 && !!spaceId;

  async function openCamera() {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert('需要相機權限', '請到設定開啟相機權限後再試一次。');
        return;
      }
    }
    setCameraOpen(true);
  }

  async function takePhoto() {
    if (!cameraRef) return;
    const photo = await cameraRef.takePictureAsync({ quality: 0.6, base64: true });
    if (photo?.uri) {
      setPhotoUri(photo.uri);
      setPhotoBase64(photo.base64);
      setFixturePhoto(undefined);
      setCameraOpen(false);
      setAiHint(undefined);
    }
  }

  async function pickFromLibrary() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setPhotoBase64(result.assets[0].base64 ?? undefined);
      setFixturePhoto(undefined);
      setAiHint(undefined);
    }
  }

  /**
   * 從 fixture 注入 detections — 跳過相機 + AI。
   * 給 Chrome 模擬手機開發用：不用真的拍照、不用真的打 API。
   */
  function onPickFixture(scenario: FixtureScenario) {
    if (!spaceId) {
      Alert.alert('請先選空間', 'Fixture 結果會進到 session，要先指定空間。');
      return;
    }
    setFixturePickerOpen(false);
    setPendings((prev) => [...scenario.detections, ...prev]);
    // 用 fixture 的展示照片取代 photoBox（真實相機 / 相簿來源優先，這裡走 fallback）
    setPhotoUri(undefined);
    setPhotoBase64(undefined);
    setFixturePhoto(scenario.photo);
    const lowConf = scenario.detections.filter((d) => d.confidence < 0.6).length;
    const lowConfLabel = lowConf > 0 ? ` · ${lowConf} 筆低信心` : '';
    setAiHint(`✓ 載入 fixture「${scenario.label}」（${scenario.detections.length} 筆）${lowConfLabel}`);
  }

  async function onRecognize() {
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
    try {
      const result = await recognizeItems({ photoUri, base64: photoBase64 });
      if (result.detections.length === 0) {
        setAiHint('AI 沒辨識到任何物品。試試另一張照片，或手動加入。');
        return;
      }
      setPendings((prev) => [...result.detections, ...prev]);
      const lowConf = result.detections.filter((d) => d.confidence < 0.6).length;
      const backendLabel =
        result.backend === 'mock' ? '（mock 模式 — 未設 API key）' : `（${result.backend}）`;
      const quotaLabel =
        result.backend === 'mock'
          ? ''
          : ` · 配額 ${result.quotaUsed}/${result.quotaLimit}`;
      const lowConfLabel = lowConf > 0 ? ` · ${lowConf} 筆低信心請確認` : '';
      setAiHint(`✓ 加入 ${result.detections.length} 筆 ${backendLabel}${quotaLabel}${lowConfLabel}`);
    } catch (err) {
      if (err instanceof QuotaExceededError) {
        Alert.alert('本月配額已用完', err.message);
      } else {
        Alert.alert('AI 識別失敗', err instanceof Error ? err.message : String(err));
      }
    } finally {
      setAiBusy(false);
    }
  }

  function resetCurrentInputs() {
    setName('');
    setQuantity('1');
    setNote('');
    setPhotoUri(undefined);
    setPhotoBase64(undefined);
    setFixturePhoto(undefined);
  }

  /**
   * 把目前輸入丟進 pending list（= session 暫存）。
   * 還沒寫進 storage —— 只在 commit 時才寫 snapshot。
   */
  function onAddToSession() {
    if (!name.trim()) {
      Alert.alert('物品名稱必填');
      return;
    }
    if (!spaceId) {
      Alert.alert('請先選擇空間', '在 session 模式下，先選定一個空間再開始整理。');
      return;
    }
    const qty = Number.parseInt(quantity, 10);
    const pending: PendingDetection = {
      id: String(uuid.v4()),
      name: name.trim(),
      category,
      quantity: Number.isFinite(qty) && qty > 0 ? qty : 1,
      confidence: 1,
      sourceType: 'manual',
      photoUri,
      note: note.trim() || undefined,
    };
    setPendings((p) => [pending, ...p]);
    resetCurrentInputs();
  }

  function onRemovePending(id: string) {
    setPendings((p) => p.filter((d) => d.id !== id));
  }

  /**
   * 直接走舊版單一物品 quick-save（沒選空間時的 fallback）。
   * 維持向後相容性 — 不破壞 M2/M3 流程。
   */
  async function onQuickSaveLegacy() {
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
  }

  async function onGoReview() {
    if (!canReview) {
      Alert.alert('還不能 commit', '請至少加入一筆 detection 並選定空間。');
      return;
    }
    setMode('review');
  }

  /**
   * Commit：把 pending detections 寫成這個空間的新 snapshot。
   * 同時寫一份 Item 維持 M2/M3 向後相容。
   */
  async function onCommit() {
    if (!spaceId || pendings.length === 0) return;

    // 先檢查異常
    const latest = await loadLatestSnapshotForSpace(spaceId);
    const anomalies = detectAnomalies(pendings, latest);
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

    const session = await createSession(spaceId);
    for (const p of pendings) {
      await addDetectionToSession(session.id, p);
    }
    await commitSnapshot(session.id);

    // 同時寫進 items storage 維持向後相容
    for (const p of pendings) {
      await addItem({
        name: p.name,
        category: p.category,
        quantity: p.quantity,
        photoUri: p.photoUri,
        note: p.note,
        spaceId,
      });
    }

    navigation.goBack();
  }

  const selectedSpace = useMemo(
    () => spaces.find((s) => s.id === spaceId),
    [spaces, spaceId],
  );

  if (cameraOpen) {
    return (
      <View style={styles.cameraWrap}>
        <CameraView ref={setCameraRef} style={StyleSheet.absoluteFillObject} facing="back" />
        <SafeAreaView edges={['bottom']} style={styles.cameraControls}>
          <Button title="取消" variant="secondary" onPress={() => setCameraOpen(false)} />
          <Button title="拍照" onPress={takePhoto} />
        </SafeAreaView>
      </View>
    );
  }

  if (mode === 'review') {
    return (
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.reviewTitle}>確認 Snapshot</Text>
          <Text style={styles.reviewBody}>
            這份 snapshot 會{selectedSpace ? `寫到「${selectedSpace.name}」` : ''}，取代該空間的當前狀態（不累加）。確認無誤後送出。
          </Text>
          {pendings.map((p) => (
            <View key={p.id} style={styles.pendingCard}>
              <Text style={styles.pendingName}>{p.name}</Text>
              <Text style={styles.pendingMeta}>
                {CATEGORY_LABEL[p.category]} · 數量 {p.quantity}
              </Text>
              {p.note ? <Text style={styles.pendingNote}>{p.note}</Text> : null}
            </View>
          ))}
          <View style={styles.reviewActions}>
            <Button title="返回編輯" variant="secondary" onPress={() => setMode('capture')} style={styles.rowBtn} />
            <Button title="commit snapshot" onPress={onCommit} style={styles.rowBtn} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.photoBox}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} />
          ) : fixturePhoto ? (
            <Image source={fixturePhoto} style={styles.photo} />
          ) : (
            <Text style={styles.photoHint}>還沒有照片</Text>
          )}
        </View>
        <View style={styles.row}>
          <Button title="拍照" onPress={openCamera} style={styles.rowBtn} />
          <Button title="從相簿選" variant="secondary" onPress={pickFromLibrary} style={styles.rowBtn} />
        </View>

        {__DEV__ ? (
          <Pressable
            onPress={() => setFixturePickerOpen(true)}
            style={styles.fixtureBtn}
          >
            <Text style={styles.fixtureBtnText}>📋 載入測試 fixture（跳過相機 / AI）</Text>
          </Pressable>
        ) : null}

        {photoUri ? (
          <View style={styles.aiBox}>
            <Pressable
              onPress={onRecognize}
              disabled={aiBusy}
              style={[styles.aiBtn, aiBusy && styles.aiBtnDisabled]}
            >
              {aiBusy ? (
                <View style={styles.row}>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.aiBtnText}>  AI 辨識中…</Text>
                </View>
              ) : (
                <Text style={styles.aiBtnText}>
                  🤖 用 AI 辨識這張照片{getActiveBackend() === 'mock' ? '（mock）' : ''}
                </Text>
              )}
            </Pressable>
            {aiHint ? <Text style={styles.aiHint}>{aiHint}</Text> : null}
          </View>
        ) : null}

        <Text style={styles.label}>物品名稱</Text>
        <TextInput
          style={styles.input}
          placeholder="例如：冬季羽絨外套"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>分類</Text>
        <View style={styles.chips}>
          {CATEGORIES.map((c) => {
            const active = c === category;
            return (
              <Pressable
                key={c}
                onPress={() => setCategory(c)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {CATEGORY_LABEL[c]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {spaces.length > 0 && (
          <>
            <Text style={styles.label}>放在哪個空間</Text>
            <View style={styles.chips}>
              <Pressable
                onPress={() => setSpaceId(undefined)}
                style={[styles.chip, !spaceId && styles.chipActive]}
              >
                <Text style={[styles.chipText, !spaceId && styles.chipTextActive]}>未指定</Text>
              </Pressable>
              {spaces.map((s) => {
                const active = spaceId === s.id;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => setSpaceId(s.id)}
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
        )}

        <Text style={styles.label}>數量</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={quantity}
          onChangeText={setQuantity}
        />

        <Text style={styles.label}>備註</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          multiline
          placeholder="保存期限、買的地點、誰的…"
          value={note}
          onChangeText={setNote}
        />

        {pendings.length > 0 && (
          <View style={styles.pendingList}>
            <Text style={styles.pendingHeader}>本次 session 已加入 {pendings.length} 筆</Text>
            {pendings.map((p) => (
              <View key={p.id} style={styles.pendingItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pendingItemText}>
                    {p.name} · {CATEGORY_LABEL[p.category]} × {p.quantity}
                  </Text>
                </View>
                <Pressable
                  onPress={() => onRemovePending(p.id)}
                  style={styles.pendingDelBtn}
                  hitSlop={8}
                >
                  <Text style={styles.pendingDelBtnText}>✕</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {spaceId ? (
          <>
            <Button title="加入這次 session" onPress={onAddToSession} style={{ marginTop: 16 }} />
            <Button
              title={`下一步：審核並 commit (${pendings.length})`}
              variant="secondary"
              onPress={onGoReview}
              style={{ marginTop: 8 }}
            />
          </>
        ) : (
          <Button title="儲存" onPress={onQuickSaveLegacy} style={{ marginTop: 16 }} />
        )}
      </ScrollView>

      <Modal
        visible={fixturePickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setFixturePickerOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setFixturePickerOpen(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>選擇一份測試 fixture</Text>
            <Text style={styles.modalSubtitle}>
              直接注入 detections 進 session，不用拍照、不打 AI API。
            </Text>
            <ScrollView style={styles.fixtureList}>
              {fixtures.map((f) => (
                <Pressable
                  key={f.id}
                  onPress={() => onPickFixture(f)}
                  style={styles.fixtureRow}
                >
                  {f.photo ? (
                    <Image source={f.photo} style={styles.fixtureThumb} />
                  ) : (
                    <View style={[styles.fixtureThumb, styles.fixtureThumbEmpty]}>
                      <Text style={styles.photoHint}>無照片</Text>
                    </View>
                  )}
                  <View style={styles.fixtureBody}>
                    <Text style={styles.fixtureLabel}>{f.label}</Text>
                    {f.description ? (
                      <Text style={styles.fixtureDesc}>{f.description}</Text>
                    ) : null}
                    <Text style={styles.fixtureMeta}>{f.detections.length} 筆 detection</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
            <Button
              title="取消"
              variant="secondary"
              onPress={() => setFixturePickerOpen(false)}
              style={{ marginTop: 12 }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
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
  cameraWrap: { flex: 1, backgroundColor: '#000' },
  cameraControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    gap: 12,
  },
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  pendingItemText: { fontSize: 13, color: colors.text },
  pendingItemHint: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  pendingDelBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    marginLeft: 8,
  },
  pendingDelBtnText: { fontSize: 12, color: colors.textMuted, fontWeight: '700' },
  reviewTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 6 },
  reviewBody: { fontSize: 13, color: colors.textMuted, marginBottom: 14, lineHeight: 19 },
  pendingCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 8,
  },
  pendingName: { fontSize: 14, fontWeight: '600', color: colors.text },
  pendingMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  pendingNote: { fontSize: 12, color: colors.text, marginTop: 4 },
  reviewActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
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
  fixtureBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.surface,
    alignItems: 'center',
    marginBottom: 12,
  },
  fixtureBtnText: { fontSize: 13, color: colors.textMuted },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    maxHeight: '80%',
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
  modalSubtitle: { fontSize: 12, color: colors.textMuted, marginBottom: 12, lineHeight: 18 },
  fixtureList: { maxHeight: 360 },
  fixtureThumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: colors.bg,
    marginRight: 12,
  },
  fixtureThumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  fixtureBody: { flex: 1 },
  fixtureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  fixtureLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  fixtureDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  fixtureMeta: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
});
