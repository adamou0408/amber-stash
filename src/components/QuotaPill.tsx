import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { getActiveBackend, getAiConfig } from '@/services/ai/config';
import { getQuotaUsage } from '@/services/ai/quota';

type Props = {
  /** 每次 AI call 後手動 bump 一次（傳遞變更值會重抓配額）。 */
  bumpToken?: number;
};

/**
 * AI 配額視覺指示。mock 模式顯示「mock」、proxy/direct 顯示 used/limit。
 * 用在 AddItem 標題附近、Settings 內、未來也可放 hero 卡片。
 */
export function QuotaPill({ bumpToken = 0 }: Props) {
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null);
  const backend = getActiveBackend();
  const cfg = getAiConfig();

  useEffect(() => {
    let alive = true;
    if (backend === 'mock') {
      setUsage(null);
      return;
    }
    getQuotaUsage(cfg.freeMonthlyQuota).then((u) => {
      if (alive) setUsage(u);
    });
    return () => {
      alive = false;
    };
  }, [backend, cfg.freeMonthlyQuota, bumpToken]);

  if (backend === 'mock') {
    return (
      <View style={[styles.pill, styles.mockBg]}>
        <Text style={styles.text}>AI · mock 模式</Text>
      </View>
    );
  }

  if (!usage) {
    return (
      <View style={[styles.pill, styles.neutralBg]}>
        <Text style={styles.text}>AI · 載入中</Text>
      </View>
    );
  }

  const ratio = usage.used / usage.limit;
  const bg = ratio >= 1 ? styles.dangerBg : ratio >= 0.8 ? styles.warnBg : styles.okBg;
  return (
    <View style={[styles.pill, bg]}>
      <Text style={styles.text}>
        AI · {usage.used}/{usage.limit} 本月
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: { fontSize: 11, fontWeight: '700', color: colors.text },
  mockBg: { backgroundColor: colors.card },
  neutralBg: { backgroundColor: colors.surface },
  okBg: { backgroundColor: '#E2EFE5' },
  warnBg: { backgroundColor: '#FCEDD5' },
  dangerBg: { backgroundColor: '#FCE0DD' },
});
