import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';

const SURFACE_DARK = 'rgba(10, 16, 22, 0.78)' as const;
const SURFACE_BORDER = 'rgba(255, 255, 255, 0.14)' as const;
const TEXT_WHITE = '#FFFFFF' as const;

export interface SocialButtonProps {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}

function SocialButton({
  icon,
  label,
  onPress,
  disabled = false,
  testID,
}: SocialButtonProps) {
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
      <View style={styles.icon}>{icon}</View>
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

export default memo(SocialButton);

const styles = StyleSheet.create({
  btn: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SURFACE_DARK,
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
  },
  icon: {
    position: 'absolute',
    left: 22,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: TEXT_WHITE,
    fontSize: 17,
    fontWeight: '600' as const,
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
