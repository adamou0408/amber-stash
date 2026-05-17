import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import {
  LIFECYCLE_DESC,
  LIFECYCLE_EMOJI,
  LIFECYCLE_LABEL,
} from '@/types/methodology';
import {
  ALL_METHODOLOGIES,
  CIR_DESCRIPTION,
  CIR_LABEL,
  CIR_SEVERE_ADVISORY,
  CIR_TO_PHASE,
  getExpertFor,
  methodologyForPhase,
  type CIRLevel,
} from '@/services/methodologies';
import {
  QUIZ_QUESTIONS,
  scoreQuiz,
  topRecommendations,
  type SelectedAnswers,
} from '@/services/methodologyQuiz';
import { setActiveMethodology, markOnboarded } from '@/storage/preferencesStorage';

type Props = {
  onDone: () => void;
};

type Step = 'cir' | 'severe-warning' | 'quiz' | 'recommendations';

const CIR_LEVELS: CIRLevel[] = ['light', 'moderate', 'severe'];

const CIR_EMOJI: Record<CIRLevel, string> = {
  light: '🟢',
  moderate: '🟡',
  severe: '🔴',
};

export function OnboardingScreen({ onDone }: Props) {
  const [step, setStep] = useState<Step>('cir');
  const [cirChoice, setCirChoice] = useState<CIRLevel | null>(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [answers, setAnswers] = useState<SelectedAnswers>({});

  const scores = useMemo(() => scoreQuiz(answers), [answers]);
  const recommendations = useMemo(
    () => topRecommendations(scores, ALL_METHODOLOGIES, 3),
    [scores],
  );

  function onPickCIR(level: CIRLevel) {
    setCirChoice(level);
    if (level === 'severe') {
      setStep('severe-warning');
    } else {
      setStep('quiz');
      setQuizIndex(0);
      setAnswers({});
    }
  }

  function onPickQuizOption(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    if (quizIndex + 1 < QUIZ_QUESTIONS.length) {
      setQuizIndex(quizIndex + 1);
    } else {
      setStep('recommendations');
    }
  }

  function onBackQuiz() {
    if (quizIndex > 0) {
      setQuizIndex(quizIndex - 1);
    } else {
      setStep('cir');
    }
  }

  async function onAcceptGentle() {
    const m = methodologyForPhase('gentle-reset');
    await setActiveMethodology(m.id);
    onDone();
  }

  async function onPickRecommended(methodologyId: string) {
    await setActiveMethodology(methodologyId);
    onDone();
  }

  async function onSkip() {
    await markOnboarded();
    onDone();
  }

  // ============================================================
  // Step 1 · CIR 自評
  // ============================================================
  if (step === 'cir') {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.stepHint}>1 / 3 · 自評嚴重程度</Text>
          <Text style={styles.title}>歡迎來到 Amber Stash</Text>
          <Text style={styles.subtitle}>
            開始前，讓我了解你現在的家狀況。三個選項任選最像的一個 — 這不是評斷你，是用 Frost
            雜物影像評估量表（CIR）幫你選對工具。
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

  // ============================================================
  // Step 1.5 · 重度警示
  // ============================================================
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

  // ============================================================
  // Step 2 · Quiz（5 題）
  // ============================================================
  if (step === 'quiz') {
    const q = QUIZ_QUESTIONS[quizIndex];
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.stepHint}>
            2 / 3 · 核心概念問答（{quizIndex + 1} / {QUIZ_QUESTIONS.length}）
          </Text>

          <View style={styles.progressBar}>
            {QUIZ_QUESTIONS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  i <= quizIndex && styles.progressDotActive,
                ]}
              />
            ))}
          </View>

          <Text style={styles.questionText}>{q.text}</Text>
          <Text style={styles.questionAxis}>{q.axis}</Text>

          {q.options.map((opt) => (
            <Pressable
              key={opt.id}
              style={({ pressed }) => [
                styles.optionCard,
                pressed && styles.cardPressed,
              ]}
              onPress={() => onPickQuizOption(q.id, opt.id)}
            >
              <Text style={styles.optionLabel}>{opt.label}</Text>
            </Pressable>
          ))}

          <Pressable onPress={onBackQuiz} style={styles.skipBtn}>
            <Text style={styles.skipText}>← {quizIndex === 0 ? '回自評' : '上一題'}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ============================================================
  // Step 3 · 推薦結果
  // ============================================================
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.stepHint}>3 / 3 · 你的推薦</Text>
        <Text style={styles.title}>依你的回答，我們推薦…</Text>
        <Text style={styles.subtitle}>
          以下是匹配度最高的前 3 派。沒有絕對的對錯 — 選一個現在最有感的開始，之後在「建議」tab
          隨時可換派。
        </Text>

        {recommendations.length === 0 ? (
          <Text style={styles.empty}>
            分數計算不到結果。請回去自評或跳過用預設派。
          </Text>
        ) : (
          recommendations.map((rec, idx) => {
            const m = rec.methodology;
            const expert = getExpertFor(m.id);
            const isTop = idx === 0;
            return (
              <Pressable
                key={m.id}
                style={({ pressed }) => [
                  styles.card,
                  isTop && styles.cardSuggested,
                  pressed && styles.cardPressed,
                ]}
                onPress={() => onPickRecommended(m.id)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardEmoji}>{LIFECYCLE_EMOJI[m.lifecyclePhase]}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardPhase}>
                      {idx === 0 ? '★ 最推薦：' : `${idx + 1}. `}
                      {m.name}
                    </Text>
                    <Text style={styles.cardQuestion}>
                      {LIFECYCLE_LABEL[m.lifecyclePhase]} 階段 · 匹配 {rec.score} 分
                      {expert ? ` · by ${expert.displayName}` : ''}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardDesc}>{m.description}</Text>
              </Pressable>
            );
          })
        )}

        <View style={styles.divider} />

        <Text style={styles.expandHint}>或從全部 10 派中選</Text>
        {ALL_METHODOLOGIES.filter(
          (m) => !recommendations.some((r) => r.methodology.id === m.id),
        ).map((m) => (
          <Pressable
            key={m.id}
            style={({ pressed }) => [styles.miniCard, pressed && styles.cardPressed]}
            onPress={() => onPickRecommended(m.id)}
          >
            <Text style={styles.miniCardText}>
              {LIFECYCLE_EMOJI[m.lifecyclePhase]} {m.name}（{LIFECYCLE_LABEL[m.lifecyclePhase]}）
            </Text>
          </Pressable>
        ))}

        <Pressable onPress={() => setStep('quiz')} style={styles.skipBtn}>
          <Text style={styles.skipText}>← 回去重答問題</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  stepHint: { fontSize: 12, color: colors.textMuted, marginTop: 8, marginBottom: 6 },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 21,
    marginBottom: 24,
  },
  questionText: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
    marginBottom: 4,
    lineHeight: 26,
  },
  questionAxis: { fontSize: 12, color: colors.textMuted, marginBottom: 18 },
  progressBar: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  progressDotActive: { backgroundColor: colors.primary },
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
    backgroundColor: colors.card,
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
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  cardDesc: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 19,
    marginTop: 10,
  },
  optionCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  optionLabel: { fontSize: 14, color: colors.text, lineHeight: 21 },
  miniCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  miniCardText: { fontSize: 13, color: colors.text },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  expandHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 8,
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
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    padding: 20,
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
