import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '@/components/Button';
import { colors } from '@/theme/colors';
import { CATEGORY_LABEL, SPACE_EMOJI, type ItemCategory, type Space } from '@/types';
import { addItem } from '@/storage/itemsStorage';
import { loadSpaces } from '@/storage/spacesStorage';
import type { ItemsStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<ItemsStackParamList, 'AddItem'>;

const CATEGORIES = Object.keys(CATEGORY_LABEL) as ItemCategory[];

export function AddItemScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ItemCategory>('other');
  const [quantity, setQuantity] = useState('1');
  const [note, setNote] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [spaceId, setSpaceId] = useState<string | undefined>();

  const [cameraOpen, setCameraOpen] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);

  useEffect(() => {
    loadSpaces().then(setSpaces);
  }, []);

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
    const photo = await cameraRef.takePictureAsync({ quality: 0.6 });
    if (photo?.uri) {
      setPhotoUri(photo.uri);
      setCameraOpen(false);
    }
  }

  async function pickFromLibrary() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function onSave() {
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

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.photoBox}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} />
          ) : (
            <Text style={styles.photoHint}>還沒有照片</Text>
          )}
        </View>
        <View style={styles.row}>
          <Button title="拍照" onPress={openCamera} style={styles.rowBtn} />
          <Button title="從相簿選" variant="secondary" onPress={pickFromLibrary} style={styles.rowBtn} />
        </View>

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

        <Button title="儲存" onPress={onSave} style={{ marginTop: 16 }} />
      </ScrollView>
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
});
