import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import { colors } from '@/theme/colors';

type Props = PressableProps & {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger';
};

export function Button({ title, variant = 'primary', style, disabled, onPress, ...rest }: Props) {
  const bg =
    variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : colors.surface;
  const fg = variant === 'secondary' ? colors.text : '#fff';
  const border = variant === 'secondary' ? colors.border : 'transparent';
  // Disabled buttons swallow press at the composite layer too — so tests / parent
  // press handlers cannot accidentally re-enter the button when it's grey.
  const safeOnPress = disabled ? undefined : onPress;
  return (
    <Pressable
      {...rest}
      onPress={safeOnPress}
      disabled={disabled}
      accessibilityState={{ disabled: !!disabled }}
      pointerEvents={disabled ? 'none' : 'auto'}
      style={(state) => [
        styles.btn,
        {
          backgroundColor: bg,
          borderColor: border,
          opacity: disabled ? 0.45 : state.pressed ? 0.85 : 1,
        },
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
