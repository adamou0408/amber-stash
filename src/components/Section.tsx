import { StyleSheet, Text, View, type ViewProps } from 'react-native';
import { colors } from '@/theme/colors';

type Props = ViewProps & {
  title?: string;
  subtitle?: string;
};

export function Section({ title, subtitle, children, style, ...rest }: Props) {
  return (
    <View style={[styles.section, style]} {...rest}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 10,
  },
});
