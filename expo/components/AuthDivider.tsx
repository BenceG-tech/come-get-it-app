import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

function AuthDivider() {
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <Text style={styles.text}>vagy</Text>
      <View style={styles.line} />
    </View>
  );
}

export default memo(AuthDivider);

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  text: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
