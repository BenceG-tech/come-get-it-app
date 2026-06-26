import React, { memo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const CYAN = '#00C8E8' as const;
const BLUE = '#1D6DFF' as const;

export interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
}

function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  testID,
}: PrimaryButtonProps) {
  const active = !disabled && !loading;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={!active}
      style={({ pressed }) => [
        styles.outer,
        !active && styles.disabled,
        pressed && active && styles.pressed,
      ]}
    >
      <LinearGradient
        colors={[CYAN, BLUE]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color="#001014" size="small" />
        ) : (
          <Text style={styles.text}>{label}</Text>
        )}
      </LinearGradient>
      {active ? <View pointerEvents="none" style={styles.innerStroke} /> : null}
    </Pressable>
  );
}

export default memo(PrimaryButton);

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: CYAN,
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#001014',
    fontSize: 17,
    fontWeight: '800' as const,
    letterSpacing: -0.1,
  },
  disabled: {
    opacity: 0.58,
    shadowOpacity: 0,
    elevation: 0,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  innerStroke: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
  },
});
