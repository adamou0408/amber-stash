import { useMemo, useState } from 'react';
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
  ALL_METHODOLOGIES,
  CIR_SEVERE_ADVISORY,
  getExpertFor,
  methodologiesForPhase,
  methodologyForPhase,
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

type Step =
  | 'welcome' // Step 1: 5 phase cards
  | 'confirm' // Step 2: 接受推薦 / 換同階段其他派
  | 'severe-warning' // gentle-reset 分支：CIR 醫療警示
  | 'quiz' // 進階：5 題精準
  | 'recommendations'; // 進階：quiz 結果

/**
 * Welcome 畫面卡片 — 每個 lifecycle phase 一張，文字以「使用者語言」描述
 * 而非工程術語（不要寫 "mindset phase"，要寫「想改變對物品的想法」）
 */
const WELCOME_CARDS: {
  phase: LifecyclePhase;
  headline: string;
  sub: string;
}[] = [
  {
    phase: 'deep-clean',
    headline: '徹底整理一次',
    sub: '想花週末把家裡好好整理過',
  },
  {
    phase: 'mindset',
    headline: '改變對物品的想法',
    sub: '想先想清楚再動手',
  },
  {
    phase: 'maintenance',
    headline: '每天能維持就好',
    sub: '不大整理，只要日常順手',
  },
  {
    phase: 'aesthetic',
    headline: '家裡要美美的',
    sub: '基礎收納 OK 了，想再升級視覺',
  },
  {
    phase: 'gentle-reset',
    headline: '整理過維持不住',
    sub: '不想被責備、想用溫和方式',
  },
];

export function OnboardingScreen({ onDone }: Props) {
  const [step, setStep] = useState<Step>('welcome');
  const [chosenPhase, setChosenPhase] = useState<LifecyclePhase | null>(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [answers, setAnswers] = useState<SelectedAnswers>({});

  const scores = useMemo(() => scoreQuiz(answers), [answers]);
  const recommendations = useMemo(
    () => topRecommendations(scores, ALL_METHODOLOGIES, 3),
    [scores],
  );

  // ============================================================
  // 主動作 — 一鍵完成 onboarding（最少 click）
  // ============================================================
  async function applyAndDone(methodologyId: string) {
    await setActiveMethodology(methodologyId);
    onDone();
  }

  async function onSkip() {
    await markOnboarded();
    onDone();
  }

  function onPickWelcome(phase: LifecyclePhase) {
    setChosenPhase(phase);
    if (phase === 'gentle-reset') {
      // 維持不住 → 進 CIR 安全網
      setStep('severe-warning');
    } else {
      setStep('confirm');
    }
  }

  function onStartQuiz() {
    setQuizIndex(0);
    setAnswers({});
    setStep('quiz');
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
      setStep('confirm');
    }
  }

  // ============================================================
  // Step 1 · Welcome（5 phase 卡片）
  // ============================================================
  if (step === 'welcome') {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.brand}>Amber Stash</Text>
          <Text style={styles.heroTitle}>整理沒有對錯</Text>
          <Text style={styles.heroSub}>選一個現在感覺對的開始，之後隨時可以換。</Text>

          {WELCOME_CARDS.map(({ phase, headline, sub }) => (
            <Pressable
              key={phase}
              style={({ pressed }) => [styles.heroCard, pressed && styles.cardPressed]}
              onPress={() => onPickWelcome(phase)}
            >
              <Text style={styles.heroEmoji}>{LIFECYCLE_EMOJI[phase]}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroCardTitle}>{headline}</Text>
                <Text style={styles.heroCardSub}>{sub}</Text>
              </View>
              <Text style={styles.heroChevron}>›</Text>
            </Pressable>
          ))}

          <Pressable onPress={onSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>我先看看 →</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ============================================================
  // Step 2 · Confirm（接受推薦 / 換同階段其他派 / 進 quiz）
  // ============================================================
  if (step === 'confirm' && chosenPhase) {
    const recommended = methodologyForPhase(chosenPhase);
    const expert = getExpertFor(recommended.id);
    const alternatives = methodologiesForPhase(chosenPhase).filter(
      (m) => m.id !== recommended.id,
    );

    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable onPress={() => setStep('welcome')} style={styles.backLink}>
            <Text style={styles.backLinkText}>← 重選</Text>
          </Pressable>

          <Text style={styles.confirmHello}>
            {LIFECYCLE_EMOJI[chosenPhase]} {LIFECYCLE_LABEL[chosenPhase]} 階段
          </Text>
          <Text style={styles.confirmHeadline}>{recommended.name}</Text>
          <Text style={styles.confirmAuthor}>by {expert?.displayName ?? '系統'}</Text>
          <Text style={styles.confirmDesc}>{recommended.description}</Text>

          <Pressable
            onPress={() => applyAndDone(recommended.id)}
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          >
            <Text style={styles.ctaText}>就這樣開始 →</Text>
          </Pressable>

          {alternatives.length > 0 && (
            <>
              <Text style={styles.altTitle}>或同階段的其他派</Text>
              {alternatives.map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => applyAndDone(m.id)}
                  style={({ pressed }) => [styles.altCard, pressed && styles.cardPressed]}
                >
                  <Text style={styles.altName}>{m.name}</Text>
                  <Text style={styles.altDesc} numberOfLines={2}>
                    {m.description}
                  </Text>
                </Pressable>
              ))}
            </>
          )}

          <Pressable onPress={onStartQuiz} style={styles.advLink}>
            <Text style={styles.advLinkText}>還不確定？回答 5 題以更精準推薦</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ============================================================
  // Step 2.5 · gentle-reset 分支：CIR 醫療警示
  // ============================================================
  if (step === 'severe-warning') {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable onPress={() => setStep('welcome')} style={styles.backLink}>
            <Text style={styles.backLinkText}>← 重選</Text>
          </Pressable>

          <Text style={styles.confirmHello}>🌿 你選了「維持不住」</Text>
          <Text style={styles.confirmHeadline}>謝謝你的誠實</Text>
          <View style={styles.warningCard}>
            <Text style={styles.warningText}>{CIR_SEVERE_ADVISORY}</Text>
          </View>

          <Text style={styles.confirmDesc}>
            Amber Stash 不會也不應該取代專業協助。但作為陪伴工具，「寬容派」會給你最低壓力的支援。
          </Text>

          <Pressable
            onPress={() => applyAndDone('gentle-zh')}
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          >
            <Text style={styles.ctaText}>進入寬容派 →</Text>
          </Pressable>

          <Text style={styles.altTitle}>或選銀髮 / 遺物整理版</Text>
          <Pressable
            onPress={() => applyAndDone('elder-zh')}
            style={({ pressed }) => [styles.altCard, pressed && styles.cardPressed]}
          >
            <Text style={styles.altName}>銀髮 / 傳承整理</Text>
            <Text style={styles.altDesc} numberOfLines={2}>
              為長輩或家屬陪伴整理 — 安全 + 傳承優先於減量。
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ============================================================
  // 進階路徑 · Quiz（5 題）
  // ============================================================
  if (step === 'quiz') {
    const q = QUIZ_QUESTIONS[quizIndex];
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable onPress={onBackQuiz} style={styles.backLink}>
            <Text style={styles.backLinkText}>
              ← {quizIndex === 0 ? '回確認' : '上一題'}
            </Text>
          </Pressable>

          <View style={styles.progressBar}>
            {QUIZ_QUESTIONS.map((_, i) => (
              <View
                key={i}
                style={[styles.progressDot, i <= quizIndex && styles.progressDotActive]}
              />
            ))}
          </View>

          <Text style={styles.questionText}>{q.text}</Text>

          {q.options.map((opt) => (
            <Pressable
              key={opt.id}
              style={({ pressed }) => [styles.optionCard, pressed && styles.cardPressed]}
              onPress={() => onPickQuizOption(q.id, opt.id)}
            >
              <Text style={styles.optionLabel}>{opt.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ============================================================
  // 進階路徑 · 推薦結果（quiz 跑完）
  // ============================================================
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.confirmHello}>依你的回答</Text>
        <Text style={styles.confirmHeadline}>最推薦…</Text>

        {recommendations.length === 0 ? (
          <Text style={styles.empty}>分數不到結果。請回去重答或跳過。</Text>
        ) : (
          recommendations.map((rec, idx) => {
            const m = rec.methodology;
            const expert = getExpertFor(m.id);
            const isTop = idx === 0;
            return (
              <Pressable
                key={m.id}
                onPress={() => applyAndDone(m.id)}
                style={({ pressed }) => [
                  styles.recCard,
                  isTop && styles.recCardTop,
                  pressed && styles.cardPressed,
                ]}
              >
                {isTop && <Text style={styles.recBadge}>★ 最匹配</Text>}
                <Text style={styles.recName}>
                  {LIFECYCLE_EMOJI[m.lifecyclePhase]} {m.name}
                </Text>
                <Text style={styles.recMeta}>
                  匹配 {rec.score} 分 · by {expert?.displayName ?? '系統'}
                </Text>
                <Text style={styles.recDesc} numberOfLines={2}>
                  {m.description}
                </Text>
              </Pressable>
            );
          })
        )}

        <Pressable onPress={() => setStep('quiz')} style={styles.advLink}>
          <Text style={styles.advLinkText}>← 重答問題</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },

  // Welcome (Step 1)
  brand: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 24,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginTop: 8,
  },
  heroSub: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 8,
    marginBottom: 28,
    lineHeight: 22,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 10,
    gap: 14,
  },
  heroEmoji: { fontSize: 28 },
  heroCardTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  heroCardSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  heroChevron: { fontSize: 22, color: colors.textMuted, fontWeight: '300' },

  // Confirm (Step 2)
  backLink: { alignSelf: 'flex-start', paddingVertical: 8, marginBottom: 12 },
  backLinkText: { fontSize: 14, color: colors.textMuted },
  confirmHello: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: 4,
  },
  confirmHeadline: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  confirmAuthor: { fontSize: 13, color: colors.textMuted, marginBottom: 12 },
  confirmDesc: { fontSize: 14, color: colors.text, lineHeight: 22, marginBottom: 24 },

  // CTA (主動作)
  cta: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  ctaPressed: { opacity: 0.85 },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  // Alternatives (同階段其他派)
  altTitle: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 4,
  },
  altCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 8,
  },
  altName: { fontSize: 15, fontWeight: '700', color: colors.text },
  altDesc: { fontSize: 12, color: colors.textMuted, marginTop: 4, lineHeight: 17 },

  // Advanced link (進 quiz)
  advLink: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  advLinkText: {
    fontSize: 13,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },

  // Skip (最不顯眼)
  skipBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  skipText: { fontSize: 13, color: colors.textMuted },

  // Severe warning
  warningCard: {
    backgroundColor: '#fff4e1',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#e67e22',
    padding: 14,
    marginBottom: 16,
  },
  warningText: { fontSize: 13, color: '#5a3a0a', lineHeight: 20 },

  // Card press state
  cardPressed: { opacity: 0.85, backgroundColor: colors.card },

  // Quiz
  progressBar: { flexDirection: 'row', gap: 6, marginBottom: 20 },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  progressDotActive: { backgroundColor: colors.primary },
  questionText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 18,
    lineHeight: 30,
  },
  optionCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 10,
  },
  optionLabel: { fontSize: 15, color: colors.text, lineHeight: 22 },

  // Recommendations
  recCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 10,
  },
  recCardTop: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.card,
  },
  recBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  recName: { fontSize: 17, fontWeight: '700', color: colors.text },
  recMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  recDesc: { fontSize: 13, color: colors.text, marginTop: 8, lineHeight: 19 },

  empty: { textAlign: 'center', color: colors.textMuted, padding: 20 },
});
