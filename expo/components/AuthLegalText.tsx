import React, { memo } from 'react';
import { Linking, StyleSheet, Text } from 'react-native';

const CYAN = '#00C8E8' as const;
const TERMS_URL = 'https://come-get-it.app/felhasznalasi-feltetelek';
const PRIVACY_URL = 'https://come-get-it.app/adatvedelmi-szabalyzat';

function AuthLegalText() {
  return (
    <Text style={styles.text}>
      A folytatással elfogadod a{' '}
      <Text
        accessibilityRole="link"
        onPress={() => Linking.openURL(TERMS_URL)}
        style={styles.link}
      >
        használati feltételeket
      </Text>
      {'. Az adatkezelésről az '}
      <Text
        accessibilityRole="link"
        onPress={() => Linking.openURL(PRIVACY_URL)}
        style={styles.link}
      >
        adatvédelmi szabályzatban
      </Text>{' olvashatsz.'}
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
