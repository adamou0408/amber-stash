import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Section } from '@/components/Section';
import { QuotaPill } from '@/components/QuotaPill';
import { colors } from '@/theme/colors';
import { ALL_METHODOLOGIES, getExpertFor, getMethodology } from '@/services/methodologies';
import { DEFAULT_METHODOLOGY } from '@/services/methodologies/default';
import { loadPreferences, setActiveMethodology } from '@/storage/preferencesStorage';
import { resetOnboarding } from '@/storage/onboardingStorage';
import { clearAllData, loadDemoData } from '@/services/demoData';
import { getActiveBackend, getAiConfig } from '@/services/ai/config';
import type { Methodology, MethodologyPricing } from '@/types/methodology';

export function SettingsScreen() {
  const [active, setActive] = useState<Methodology>(DEFAULT_METHODOLOGY);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const prefs = await loadPreferences();
    setActive(getMethodology(prefs.activeMethodologyId) ?? DEFAULT_METHODOLOGY);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      refresh().then(() => {
        if (!alive) return;
      });
      return () => {
        alive = false;
      };
    }, [refresh]),
  );

  async function onSwitchMethodology(id: string) {
    await setActiveMethodology(id);
    await refresh();
  }

  async function onLoadDemo() {
    setBusy(true);
    try {
      await loadDemoData();
      Alert.alert('已載入', '示範資料：5 個空間、14 件物品、3 個購物項目。');
    } finally {
      setBusy(false);
    }
  }

  async function onClearAll() {
    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert('清除所有資料', '會把物品 / 空間 / 購物全部清空。要繼續嗎？', [
        { text: '取消', style: 'cancel', onPress: () => resolve(false) },
        { text: '清除', style: 'destructive', onPress: () => resolve(true) },
      ]);
    });
    if (!confirmed) return;
    setBusy(true);
    try {
      await clearAllData();
      Alert.alert('已清除');
    } finally {
      setBusy(false);
    }
  }

  async function onResetOnboarding() {
    await resetOnboarding();
    Alert.alert('已重置', '下次開 app 會看到 onboarding。');
  }

  const backend = getActiveBackend();
  const cfg = getAiConfig();
  const backendLabel =
    backend === 'mock' ? 'mock 假資料' : backend === 'direct' ? '直接打 Anthropic' : '走自架 proxy';

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Section title="收納方法論" subtitle="切換後，建議與購物推薦會跟著變">
          {ALL_METHODOLOGIES.map((m) => {
            const on = m.id === active.id;
            const expert = getExpertFor(m.id);
            return (
              <Pressable
                key={m.id}
                style={[styles.methodRow, on && styles.methodRowOn]}
                onPress={() => onSwitchMethodology(m.id)}
              >
                <View style={{ flex: 1 }}>
                  <View style={styles.methodHead}>
                    <Text style={[styles.methodName, on && styles.methodNameOn]}>{m.name}</Text>
                    <Text style={[styles.methodPrice, on && styles.methodPriceOn]}>
                      {formatPricing(m.pricing)}
                    </Text>
                  </View>
                  <Text style={styles.methodAuthor}>by {expert?.displayName ?? '未知作者'}</Text>
                  <Text style={styles.methodDesc}>{m.description}</Text>
                </View>
                {on ? <Text style={styles.checkMark}>✓</Text> : null}
              </Pressable>
            );
          })}
        </Section>

        <Section title="AI 設定" subtitle="決定 AI 辨識走哪個 backend">
          <Text style={styles.fieldLabel}>當前 backend</Text>
          <Text style={styles.fieldValue}>{backendLabel}</Text>
          <Text style={styles.fieldLabel}>模型</Text>
          <Text style={styles.fieldValue}>{cfg.anthropicModel}</Text>
          <Text style={styles.fieldLabel}>本月配額</Text>
          <View style={{ marginTop: 4, marginBottom: 6 }}>
            <QuotaPill />
          </View>
          <Text style={styles.helperText}>
            生產環境請走自架 proxy（隱藏 key、加 rate limit 與 Stripe 計費）。要切 backend，編輯 `.env`
            並重啟 app。
          </Text>
        </Section>

        <Section title="資料管理">
          <Button
            title={busy ? '處理中…' : '載入示範資料'}
            variant="secondary"
            onPress={onLoadDemo}
            disabled={busy}
            style={{ marginBottom: 8 }}
          />
          <Button
            title="清除所有資料"
            variant="danger"
            onPress={onClearAll}
            disabled={busy}
            style={{ marginBottom: 8 }}
          />
          <Button title="重置 onboarding" variant="secondary" onPress={onResetOnboarding} />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatPricing(p: MethodologyPricing): string {
  switch (p.kind) {
    case 'free':
      return '免費';
    case 'subscription':
      return `NT$ ${p.monthlyTwd}/月`;
    case 'oneTime':
      return `NT$ ${p.priceTwd}`;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  methodRow: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  methodRowOn: { backgroundColor: colors.card, borderColor: colors.primary },
  methodHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  methodName: { fontSize: 14, fontWeight: '700', color: colors.text },
  methodNameOn: { color: colors.primaryDark },
  methodPrice: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  methodPriceOn: { color: colors.primary },
  methodAuthor: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  methodDesc: { fontSize: 12, color: colors.text, marginTop: 6, lineHeight: 17 },
  checkMark: { fontSize: 20, color: colors.primary, marginLeft: 10, fontWeight: '900' },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginTop: 10 },
  fieldValue: { fontSize: 14, color: colors.text, marginTop: 2 },
  helperText: { fontSize: 11, color: colors.textMuted, marginTop: 10, lineHeight: 16 },
});
