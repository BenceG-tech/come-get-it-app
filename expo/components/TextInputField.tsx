import React, { forwardRef, memo } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput as RNTextInput,
  View,
} from 'react-native';
import type { ReactNode } from 'react';

const CYAN = '#00C8E8' as const;
const SURFACE_DARK = 'rgba(10, 16, 22, 0.78)' as const;
const SURFACE_BORDER = 'rgba(255, 255, 255, 0.14)' as const;
const TEXT_WHITE = '#FFFFFF' as const;

export interface TextInputFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  leftIcon: ReactNode;
  rightIcon?: ReactNode;
  onRightIconPress?: () => void;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  secureTextEntry?: boolean;
  keyboardType?: RNTextInput['props']['keyboardType'];
  autoComplete?: RNTextInput['props']['autoComplete'];
  textContentType?: RNTextInput['props']['textContentType'];
  returnKeyType?: RNTextInput['props']['returnKeyType'];
  onSubmitEditing?: () => void;
  testID?: string;
}

const TextInputField = forwardRef<RNTextInput, TextInputFieldProps>(
  function TextInputField(
    {
      value,
      onChangeText,
      placeholder,
      leftIcon,
      rightIcon,
      onRightIconPress,
      focused,
      onFocus,
      onBlur,
      secureTextEntry,
      keyboardType,
      autoComplete,
      textContentType,
      returnKeyType,
      onSubmitEditing,
      testID,
    },
    ref,
  ) {
    return (
      <View style={[styles.wrap, focused && styles.wrapFocused]}>
        <View style={styles.iconLeft}>{leftIcon}</View>
        <RNTextInput
          ref={ref}
          testID={testID}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.48)"
          autoCapitalize="none"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          textContentType={textContentType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={onFocus}
          onBlur={onBlur}
          selectionColor={CYAN}
          style={styles.input}
        />
        {rightIcon ? (
          <Pressable
            onPress={onRightIconPress}
            hitSlop={12}
            style={styles.iconRight}
          >
            {rightIcon}
          </Pressable>
        ) : null}
      </View>
    );
  },
);

export default memo(TextInputField);

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    borderRadius: 22,
    backgroundColor: SURFACE_DARK,
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
    paddingHorizontal: 21,
  },
  wrapFocused: {
    borderColor: CYAN,
    shadowColor: CYAN,
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  iconLeft: {
    marginRight: 13,
  },
  input: {
    flex: 1,
    color: TEXT_WHITE,
    fontSize: 17,
    fontWeight: '600' as const,
    padding: 0,
  },
  iconRight: {
    marginLeft: 10,
    padding: 4,
  },
});
