import React, { memo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

const CYAN = '#00C8E8' as const;
const TEXT_WHITE = '#FFFFFF' as const;

export interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}

function SecondaryButton({
  label,
  onPress,
  disabled = false,
  testID,
}: SecondaryButtonProps) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

export default memo(SecondaryButton);

const styles = StyleSheet.create({
  btn: {
    width: '100%',
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 8, 12, 0.34)',
    borderWidth: 1.5,
    borderColor: CYAN,
  },
  text: {
    color: TEXT_WHITE,
    fontSize: 19,
    fontWeight: '700' as const,
    letterSpacing: -0.1,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
});
