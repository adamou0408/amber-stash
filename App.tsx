import { Alert, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from '@/navigation/RootNavigator';

// react-native-web 上 Alert.alert 是 silent no-op。
// 用 window.alert / confirm 補上，讓 dev 在瀏覽器看得到驗證訊息。
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  Alert.alert = (title, message, buttons) => {
    const text = message ? `${title}\n\n${message}` : title;
    if (buttons && buttons.length > 1) {
      const ok = window.confirm(text);
      const target = ok
        ? buttons.find((b) => b.style !== 'cancel') ?? buttons[buttons.length - 1]
        : buttons.find((b) => b.style === 'cancel') ?? buttons[0];
      target?.onPress?.();
    } else {
      window.alert(text);
      buttons?.[0]?.onPress?.();
    }
  };
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <RootNavigator />
        <StatusBar style="dark" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
