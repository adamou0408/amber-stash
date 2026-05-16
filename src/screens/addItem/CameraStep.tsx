import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CameraView, type CameraView as CameraViewType } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';

type Props = {
  onCancel: () => void;
  onCapture: (result: { uri: string; base64?: string }) => void;
};

/**
 * 全屏相機 UI — 拍照→把 uri / base64 給父層。
 */
export function CameraStep({ onCancel, onCapture }: Props) {
  const [cameraRef, setCameraRef] = useState<CameraViewType | null>(null);

  const takePhoto = useCallback(async () => {
    if (!cameraRef) return;
    const photo = await cameraRef.takePictureAsync({ quality: 0.6, base64: true });
    if (photo?.uri) {
      onCapture({ uri: photo.uri, base64: photo.base64 ?? undefined });
    }
  }, [cameraRef, onCapture]);

  return (
    <View style={styles.cameraWrap}>
      <CameraView ref={setCameraRef} style={StyleSheet.absoluteFillObject} facing="back" />
      <SafeAreaView edges={['bottom']} style={styles.cameraControls}>
        <Button title="取消" variant="secondary" onPress={onCancel} />
        <Button title="拍照" onPress={takePhoto} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
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
