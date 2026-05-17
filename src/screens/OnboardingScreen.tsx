import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import {
  LIFECYCLE_DESC,
  LIFECYCLE_EMOJI,
  LIFECYCLE_LABEL,
  type LifecyclePhase,
} from '@/types/methodology';
import { methodologyForPhase } from '@/services/methodologies';
import { setActiveMethodology, markOnboarded } from '@/storage/preferencesStorage';

type Props = {
  onDone: () => void;
};

const PHASES: { phase: LifecyclePhase; question: string }[] = [
  {
    phase: 'mindset',
    question: '想先改變消費 / 對物品的想法',
  },
  {
    phase: 'deep-clean',
    question: '想一次性把家裡徹底整理過一遍',
  },
  {
    phase: 'maintenance',
    question: '已經整理過，想找方法每天維持',
  },
  {
    phase: 'aesthetic',
    question: '基礎收納 OK 了，想再升級視覺美感',
  },
];

export function OnboardingScreen({ onDone }: Props) {
  async function onPick(phase: LifecyclePhase) {
    const m = methodologyForPhase(phase);
    await setActiveMethodology(m.id);
    onDone();
  }

  async function onSkip() {
    await markOnboarded();
    onDone();
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>歡迎來到 Amber Stash</Text>
        <Text style={styles.subtitle}>
          收納方法論很多派 — 沒有對錯，只有「現在的你在哪個階段」。
          {'\n'}先選一個最貼近你現況的，建議內容會跟著切換。之後隨時可以在「建議」頁換派。
        </Text>

        {PHASES.map(({ phase, question }) => {
          const m = methodologyForPhase(phase);
          return (
            <Pressable
              key={phase}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => onPick(phase)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardEmoji}>{LIFECYCLE_EMOJI[phase]}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardPhase}>
                    {LIFECYCLE_LABEL[phase]} 階段
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
