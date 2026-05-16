import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { colors } from '@/theme/colors';
import { ALL_METHODOLOGIES, getExpertFor } from '@/services/methodologies';
import { DEFAULT_METHODOLOGY } from '@/services/methodologies/default';
import { setActiveMethodology } from '@/storage/preferencesStorage';
import { saveOnboarding } from '@/storage/onboardingStorage';
import { loadDemoData } from '@/services/demoData';
import type { Methodology, MethodologyPricing } from '@/types/methodology';

type Step = 'welcome' | 'methodology' | 'data';

type Props = {
  /** Called once onboarding is complete. RootNavigator re-renders into the main tabs. */
  onDone: () => void;
};

/**
 * Onboarding 三步：
 *   1. Welcome — 講三句定位
 *   2. Methodology — 選一套收納方法（提前露出付費鉤子）
 *   3. Data — 載入示範資料 or 自己建
 *
 * 完成後寫 onboarding state，下次開 app 直接跳過。
 */
export function OnboardingScreen({ onDone }: Props) {
  const [step, setStep] = useState<Step>('welcome');
  const [picked, setPicked] = useState<Methodology>(DEFAULT_METHODOLOGY);
  const [busy, setBusy] = useState(false);

  async function finish(loadDemo: boolean) {
    setBusy(true);
    try {
      await setActiveMethodology(picked.id);
      if (loadDemo) await loadDemoData();
      await saveOnboarding({
        completedAt: Date.now(),
        pickedMethodologyId: picked.id,
        loadedDemo: loadDemo,
      });
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {step === 'welcome' && <WelcomeStep onNext={() => setStep('methodology')} />}
        {step === 'methodology' && (
          <MethodologyStep
            picked={picked}
            onPick={setPicked}
            onNext={() => setStep('data')}
            onBack={() => setStep('welcome')}
          />
        )}
        {step === 'data' && (
          <DataStep
            picked={picked}
            busy={busy}
            onLoadDemo={() => finish(true)}
            onStartFresh={() => finish(false)}
            onBack={() => setStep('methodology')}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <View>
      <Text style={styles.hero}>把家整理好</Text>
      <Text style={styles.heroSub}>從拍 10 張照片開始</Text>
      <View style={styles.pitchList}>
        <PitchRow emoji="📸" title="拍照即入庫" body="AI 自動辨識物品名稱、類別、數量" />
        <PitchRow emoji="🧠" title="收納顧問" body="可切換不同收納師的方法論，看到誰的建議" />
        <PitchRow emoji="🏷️" title="標籤與雷雕箱" body="一鍵生成印貼紙或客製收納箱設計稿" />
      </View>
      <Button title="開始" onPress={onNext} style={{ marginTop: 24 }} />
    </View>
  );
}

function PitchRow({ emoji, title, body }: { emoji: string; title: string; body: string }) {
  return (
    <View style={styles.pitchRow}>
      <Text style={styles.pitchEmoji}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.pitchTitle}>{title}</Text>
        <Text style={styles.pitchBody}>{body}</Text>
      </View>
    </View>
  );
}

function MethodologyStep({
  picked,
  onPick,
  onNext,
  onBack,
}: {
  picked: Methodology;
  onPick: (m: Methodology) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <View>
      <Text style={styles.stepTitle}>選一套收納方法</Text>
      <Text style={styles.stepBody}>
        每個方法論都是一個「腦袋」，會決定 app 給你什麼建議。免費的可以一直用，付費的有更深的框架。之後在「建議」tab 隨時可換。
      </Text>
      {ALL_METHODOLOGIES.map((m) => {
        const on = m.id === picked.id;
        const expert = getExpertFor(m.id);
        return (
          <Pressable
            key={m.id}
            style={[styles.methodCard, on && styles.methodCardOn]}
            onPress={() => onPick(m)}
          >
            <View style={styles.methodCardHead}>
              <Text style={[styles.methodCardTitle, on && styles.methodCardTitleOn]}>{m.name}</Text>
              <Text style={[styles.methodCardPrice, on && styles.methodCardPriceOn]}>
                {formatPricing(m.pricing)}
              </Text>
            </View>
            <Text style={[styles.methodCardAuthor, on && styles.methodCardAuthorOn]}>
              by {expert?.displayName ?? '未知作者'}
            </Text>
            <Text style={[styles.methodCardDesc, on && styles.methodCardDescOn]}>
              {m.description}
            </Text>
          </Pressable>
        );
      })}
      <View style={styles.actionRow}>
        <Button title="返回" variant="secondary" onPress={onBack} style={{ flex: 1 }} />
        <Button title="下一步" onPress={onNext} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

function DataStep({
  picked,
  busy,
  onLoadDemo,
  onStartFresh,
  onBack,
}: {
  picked: Methodology;
  busy: boolean;
  onLoadDemo: () => void;
  onStartFresh: () => void;
  onBack: () => void;
}) {
  return (
    <View>
      <Text style={styles.stepTitle}>怎麼開始？</Text>
      <Text style={styles.stepBody}>
        選 <Text style={{ fontWeight: '700' }}>{picked.name}</Text>，接下來：
      </Text>
      <Pressable style={styles.choiceCard} disabled={busy} onPress={onLoadDemo}>
        <Text style={styles.choiceEmoji}>📦</Text>
        <Text style={styles.choiceTitle}>載入示範資料（推薦先看）</Text>
        <Text style={styles.choiceBody}>
          5 個空間、14 件物品、3 個購物項目 — 可以快速感受所有功能，之後隨時可清掉。
        </Text>
      </Pressable>
      <Pressable style={styles.choiceCard} disabled={busy} onPress={onStartFresh}>
        <Text style={styles.choiceEmoji}>🧹</Text>
        <Text style={styles.choiceTitle}>從頭開始</Text>
        <Text style={styles.choiceBody}>
          先建一個空間（衣櫃 / 抽屜 / 書桌），然後拍第一張照片試 AI 辨識。
        </Text>
      </Pressable>
      <View style={styles.actionRow}>
        <Button title="返回" variant="secondary" onPress={onBack} disabled={busy} style={{ flex: 1 }} />
      </View>
    </View>
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
  content: { padding: 24, paddingBottom: 40 },
  hero: { fontSize: 32, fontWeight: '900', color: colors.text, marginTop: 24 },
  heroSub: { fontSize: 18, fontWeight: '700', color: colors.primary, marginTop: 4, marginBottom: 24 },
  pitchList: { gap: 14, marginTop: 8 },
  pitchRow: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pitchEmoji: { fontSize: 28 },
  pitchTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  pitchBody: { fontSize: 13, color: colors.textMuted, marginTop: 2, lineHeight: 18 },
  stepTitle: { fontSize: 22, fontWeight: '900', color: colors.text, marginTop: 16, marginBottom: 8 },
  stepBody: { fontSize: 14, color: colors.textMuted, marginBottom: 16, lineHeight: 20 },
  methodCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: 12,
  },
  methodCardOn: { borderColor: colors.primary, backgroundColor: colors.card },
  methodCardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  methodCardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  methodCardTitleOn: { color: colors.primaryDark },
  methodCardPrice: { fontSize: 12, color: colors.textMuted, fontWeight: '700' },
  methodCardPriceOn: { color: colors.primary },
  methodCardAuthor: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  methodCardAuthorOn: { color: colors.text },
  methodCardDesc: { fontSize: 13, color: colors.text, marginTop: 8, lineHeight: 18 },
  methodCardDescOn: { color: colors.text },
  choiceCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  choiceEmoji: { fontSize: 28, marginBottom: 6 },
  choiceTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  choiceBody: { fontSize: 13, color: colors.textMuted, marginTop: 4, lineHeight: 18 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
});
