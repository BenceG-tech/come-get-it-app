import React, { memo } from 'react';
import { Linking, StyleSheet, Text } from 'react-native';

const CYAN = '#00C8E8' as const;
const PRIVACY_URL = 'https://github.com/BenceG-tech/come-get-it-app/blob/main/PRIVACY.md';

function AuthLegalText() {
  return (
    <Text style={styles.text}>
      A folytatással elfogadod az{' '}
      <Text
        accessibilityRole="link"
        onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}
        style={styles.link}
      >
        Használati Feltételeket
      </Text>
      {' '}és az{' '}
      <Text
        accessibilityRole="link"
        onPress={() => Linking.openURL(PRIVACY_URL)}
        style={styles.link}
      >
        Adatvédelmi Szabályzatot
      </Text>.
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
