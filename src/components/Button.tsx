import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import { colors } from '@/theme/colors';

type Props = PressableProps & {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger';
};

export function Button({ title, variant = 'primary', style, ...rest }: Props) {
  const bg =
    variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : colors.surface;
  const fg = variant === 'secondary' ? colors.text : '#fff';
  const border = variant === 'secondary' ? colors.border : 'transparent';
  return (
    <Pressable
      {...rest}
      style={(state) => [
        styles.btn,
        { backgroundColor: bg, borderColor: border, opacity: state.pressed ? 0.85 : 1 },
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      <Text style={[styles.text, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
  },
});
