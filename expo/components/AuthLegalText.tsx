import React, { memo } from 'react';
import { StyleSheet, Text } from 'react-native';

const CYAN = '#00C8E8' as const;

function AuthLegalText() {
  return (
    <Text style={styles.text}>
      A folytatással elfogadod az{' '}
      <Text style={styles.link}>Általános Szerződési Feltételeket</Text>
      {' '}és az{' '}
      <Text style={styles.link}>Adatvédelmi Szabályzatot</Text>.
    </Text>
  );
}

export default memo(AuthLegalText);

const styles = StyleSheet.create({
  text: {
    color: 'rgba(255,255,255,0.56)',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 330,
  },
  link: {
    color: CYAN,
    fontWeight: '700' as const,
  },
});
