import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import {
  LIFECYCLE_DESC,
  LIFECYCLE_EMOJI,
  LIFECYCLE_LABEL,
  type LifecyclePhase,
} from '@/types/methodology';
import {
  CIR_DESCRIPTION,
  CIR_LABEL,
  CIR_SEVERE_ADVISORY,
  CIR_TO_PHASE,
  methodologyForPhase,
  type CIRLevel,
} from '@/services/methodologies';
import { setActiveMethodology, markOnboarded } from '@/storage/preferencesStorage';

type Props = {
  onDone: () => void;
};

type Step = 'cir' | 'phase' | 'severe-warning';

const PHASES: { phase: LifecyclePhase; question: string }[] = [
  { phase: 'mindset', question: '想先改變消費 / 對物品的想法' },
  { phase: 'deep-clean', question: '想一次性把家裡徹底整理過一遍' },
  { phase: 'maintenance', question: '已經整理過，想找方法每天維持' },
  { phase: 'aesthetic', question: '基礎收納 OK 了，想再升級視覺美感' },
  { phase: 'gentle-reset', question: '整理過很多次但維持不住 / 容易自責' },
];

const CIR_LEVELS: CIRLevel[] = ['light', 'moderate', 'severe'];

const CIR_EMOJI: Record<CIRLevel, string> = {
  light: '🟢',
  moderate: '🟡',
  severe: '🔴',
};

export function OnboardingScreen({ onDone }: Props) {
  const [step, setStep] = useState<Step>('cir');
  const [cirChoice, setCirChoice] = useState<CIRLevel | null>(null);

  async function onPickCIR(level: CIRLevel) {
    setCirChoice(level);
    if (level === 'severe') {
      setStep('severe-warning');
    } else {
      // 直接套對應方法論
      const phase = CIR_TO_PHASE[level];
      const m = methodologyForPhase(phase);
      await setActiveMethodology(m.id);
      // 但仍進入 phase 選擇讓使用者可以微調
      setStep('phase');
    }
  }

  async function onAcceptGentle() {
    const m = methodologyForPhase('gentle-reset');
    await setActiveMethodology(m.id);
    onDone();
  }

  async function onPickPhase(phase: LifecyclePhase) {
    const m = methodologyForPhase(phase);
    await setActiveMethodology(m.id);
    onDone();
  }

  async function onSkip() {
    await markOnboarded();
    onDone();
  }

  if (step === 'cir') {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>歡迎來到 Amber Stash</Text>
          <Text style={styles.subtitle}>
            開始前，先讓我了解你現在的家狀況 — 三個選項任選最像的一個。
            {'\n\n'}
            這是 Frost 雜物影像評估量表（CIR）的簡化版，用來判斷哪一派方法論最適合你 — 不是評斷你。
          </Text>

          {CIR_LEVELS.map((level) => (
            <Pressable
              key={level}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => onPickCIR(level)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardEmoji}>{CIR_EMOJI[level]}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardPhase}>{CIR_LABEL[level]}</Text>
                </View>
              </View>
              <Text style={styles.cardDesc}>{CIR_DESCRIPTION[level]}</Text>
            </Pressable>
          ))}

          <Pressable onPress={onSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>跳過 — 用預設方法論</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (step === 'severe-warning') {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>謝謝你的誠實</Text>
          <View style={styles.warningCard}>
            <Text style={styles.warningText}>{CIR_SEVERE_ADVISORY}</Text>
          </View>
          <Text style={[styles.subtitle, { marginTop: 16 }]}>
            Amber Stash 不會也不應該取代專業協助。但作為陪伴工具，我們會用「寬容派」給你最低壓力的支援。準備好了嗎？
          </Text>
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={onAcceptGentle}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardEmoji}>🌿</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardPhase}>進入寬容派模式</Text>
                <Text style={styles.cardQuestion}>「家為你服務，不是你為家服務」</Text>
              </View>
            </View>
            <Text style={styles.cardDesc}>{LIFECYCLE_DESC['gentle-reset']}</Text>
          </Pressable>
          <Pressable onPress={() => setStep('cir')} style={styles.skipBtn}>
            <Text style={styles.skipText}>← 回上一步</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // step === 'phase'
  const suggestedPhase = cirChoice ? CIR_TO_PHASE[cirChoice] : 'maintenance';

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>選一個現在的階段</Text>
        <Text style={styles.subtitle}>
          基於你剛剛的自評（{cirChoice ? CIR_LABEL[cirChoice] : '未選'}），我們推薦 「
          {LIFECYCLE_LABEL[suggestedPhase]}」階段。但你可以選其他派 — 之後在「建議」tab 隨時換。
        </Text>

        {PHASES.map(({ phase, question }) => {
          const m = methodologyForPhase(phase);
          const suggested = phase === suggestedPhase;
          return (
            <Pressable
              key={phase}
              style={({ pressed }) => [
                styles.card,
                suggested && styles.cardSuggested,
                pressed && styles.cardPressed,
              ]}
              onPress={() => onPickPhase(phase)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardEmoji}>{LIFECYCLE_EMOJI[phase]}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardPhase}>
                    {LIFECYCLE_LABEL[phase]} 階段
                    {suggested ? ' · ★ 推薦' : ''}
                  </Text>
                  <Text style={styles.cardQuestion}>「{question}」</Text>
                </View>
              </View>
              <Text style={styles.cardDesc}>{LIFECYCLE_DESC[phase]}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardMethod}>→ 推薦方法：{m.name}</Text>
              </View>
            </Pressable>
          );
        })}

        <Pressable onPress={onSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>跳過 — 用預設方法論</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 21,
    marginBottom: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  cardSuggested: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  cardPressed: { opacity: 0.85, backgroundColor: colors.card },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardEmoji: { fontSize: 32 },
  cardPhase: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  cardQuestion: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  cardDesc: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 19,
    marginTop: 10,
  },
  cardFooter: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cardMethod: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
  },
  warningCard: {
    backgroundColor: '#fff4e1',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#e67e22',
    padding: 14,
  },
  warningText: {
    fontSize: 13,
    color: '#5a3a0a',
    lineHeight: 20,
  },
  skipBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  skipText: {
    fontSize: 13,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
});
