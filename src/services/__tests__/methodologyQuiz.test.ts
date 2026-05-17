import {
  QUIZ_QUESTIONS,
  scoreQuiz,
  topRecommendations,
  type SelectedAnswers,
} from '@/services/methodologyQuiz';
import { ALL_METHODOLOGIES } from '@/services/methodologies';

describe('methodologyQuiz', () => {
  test('has exactly 5 questions covering core axes', () => {
    expect(QUIZ_QUESTIONS.length).toBe(5);
    const axes = QUIZ_QUESTIONS.map((q) => q.id);
    expect(axes).toEqual(['pain', 'emotion', 'tempo', 'housing', 'goal']);
  });

  test('every option has at least one scoring target', () => {
    for (const q of QUIZ_QUESTIONS) {
      for (const opt of q.options) {
        expect(opt.scores.length).toBeGreaterThan(0);
        for (const s of opt.scores) {
          expect(s.weight).toBeGreaterThan(0);
          // 引用的 methodologyId 必須真的存在
          expect(ALL_METHODOLOGIES.some((m) => m.id === s.methodologyId)).toBe(true);
        }
      }
    }
  });

  test('every option id is unique within its question', () => {
    for (const q of QUIZ_QUESTIONS) {
      const ids = q.options.map((o) => o.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  test('scoreQuiz with empty answers returns empty scores', () => {
    expect(scoreQuiz({})).toEqual({});
  });

  test('scoreQuiz aggregates weights correctly', () => {
    const answers: SelectedAnswers = {
      pain: 'too-much', // danshari +3, konmari +2
      emotion: 'rational', // danshari +3, kashiwa-sato +2
    };
    const scores = scoreQuiz(answers);
    expect(scores['danshari-zh']).toBe(6);
    expect(scores['konmari-zh']).toBe(2);
    expect(scores['kashiwa-sato-zh']).toBe(2);
  });

  test('scoreQuiz ignores unknown answers', () => {
    const answers: SelectedAnswers = {
      pain: 'nonexistent',
      unknown: 'whatever',
    };
    expect(scoreQuiz(answers)).toEqual({});
  });

  test('topRecommendations returns top N sorted desc', () => {
    const answers: SelectedAnswers = {
      pain: 'too-much',
      emotion: 'rational',
      tempo: 'mindset-first',
      goal: 'mental-calm',
    };
    const scores = scoreQuiz(answers);
    const recs = topRecommendations(scores, ALL_METHODOLOGIES, 3);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs.length).toBeLessThanOrEqual(3);
    // first should be 斷捨離 (heavily favored by all answers)
    expect(recs[0].methodology.id).toBe('danshari-zh');
    // sorted desc
    for (let i = 1; i < recs.length; i++) {
      expect(recs[i - 1].score).toBeGreaterThanOrEqual(recs[i].score);
    }
  });

  test('topRecommendations filters out zero-score methodologies', () => {
    const answers: SelectedAnswers = { pain: 'too-much' };
    const scores = scoreQuiz(answers);
    const recs = topRecommendations(scores, ALL_METHODOLOGIES, 10);
    // only danshari + konmari should appear
    expect(recs.length).toBe(2);
  });

  test('classic profile: messy IG-aesthetic seeker → home-edit + amberstash + 衣櫥', () => {
    const answers: SelectedAnswers = {
      pain: 'not-pretty', // home-edit +3
      emotion: 'rational', // danshari +3, kashiwa-sato +2
      tempo: 'weekend-marathon', // konmari +3, wardrobe-doctor +2
      housing: 'normal', // amberstash +1, home-edit +1
      goal: 'visual-pretty', // home-edit +3
    };
    const recs = topRecommendations(scoreQuiz(answers), ALL_METHODOLOGIES, 3);
    expect(recs[0].methodology.id).toBe('home-edit-zh');
  });

  test('classic profile: ADHD / 整理不維持 → gentle-zh', () => {
    const answers: SelectedAnswers = {
      pain: 'cant-maintain', // gentle +3
      emotion: 'keep-ok', // gentle +3, elder +2
      tempo: 'low-energy', // gentle +3, elder +2
      housing: 'normal',
      goal: 'sustainable', // gentle +2, amberstash +2
    };
    const recs = topRecommendations(scoreQuiz(answers), ALL_METHODOLOGIES, 3);
    expect(recs[0].methodology.id).toBe('gentle-zh');
  });

  test('classic profile: 多代同堂 + 紀念品困擾 → 廖心筠 or elder', () => {
    const answers: SelectedAnswers = {
      pain: 'cant-find', // 廖心筠 +3
      emotion: 'family-burden', // 廖心筠 +3, elder +2
      tempo: 'daily-15min', // gentle +3, amberstash +2, 廖心筠 +1
      housing: 'multi-gen', // 廖心筠 +3, elder +2
      goal: 'find-fast', // 廖心筠 +3, amberstash +2
    };
    const recs = topRecommendations(scoreQuiz(answers), ALL_METHODOLOGIES, 3);
    expect(recs[0].methodology.id).toBe('liaohsinyun-zh');
  });

  test('classic profile: 小坪數租屋 → micro-rental-zh', () => {
    const answers: SelectedAnswers = {
      pain: 'cant-find',
      emotion: 'rational',
      tempo: 'daily-15min',
      housing: 'rental', // micro-rental +3
      goal: 'sustainable',
    };
    const recs = topRecommendations(scoreQuiz(answers), ALL_METHODOLOGIES, 3);
    expect(recs.some((r) => r.methodology.id === 'micro-rental-zh')).toBe(true);
  });

  test('classic profile: 衣物專注 → wardrobe-doctor-zh', () => {
    const answers: SelectedAnswers = {
      pain: 'too-much',
      emotion: 'rational',
      tempo: 'weekend-marathon', // wardrobe-doctor +2
      housing: 'normal',
      goal: 'wardrobe-focus', // wardrobe-doctor +3
    };
    const recs = topRecommendations(scoreQuiz(answers), ALL_METHODOLOGIES, 3);
    expect(recs.some((r) => r.methodology.id === 'wardrobe-doctor-zh')).toBe(true);
  });
});
