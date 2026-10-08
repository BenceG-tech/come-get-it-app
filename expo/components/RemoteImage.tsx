import React, { useEffect, useMemo, useReducer } from 'react';
import { ActivityIndicator, AppState, Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { RotateCw } from 'lucide-react-native';
import { imageCandidates, imageLoadReducer, imageRequestKey, initialImageLoadState, type ImageSize } from '@/lib/imageLoading';

const brandPlaceholder = require('@/assets/images/login-logo-attached.png');
type Props = {
  uri?: string | null;
  fallbackUris?: (string | null | undefined)[];
  size?: ImageSize;
  style: StyleProp<ViewStyle>;
  priority?: 'low' | 'normal' | 'high';
  enabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
};

export default function RemoteImage({ uri, fallbackUris = [], size = 960, ...props }: Props) {
  const candidates = imageCandidates([uri, ...fallbackUris], size);
  // A recycled card/new venue starts with its own loading state. Old native callbacks cannot overwrite it.
  return <ImageRequest key={JSON.stringify(candidates)} {...props} candidates={candidates} />;
}

function ImageRequest({ candidates, style, priority = 'normal', enabled = true, accessibilityLabel, testID }: Omit<Props, 'uri' | 'fallbackUris' | 'size'> & { candidates: string[] }) {
  const [state, dispatch] = useReducer(imageLoadReducer, initialImageLoadState);
  const request = imageRequestKey(state);
  const count = candidates.length;
  const uri = candidates[state.attempt % count];
  const source = useMemo(() => ({ uri, headers: { Accept: 'image/webp,image/*;q=0.8' } }), [uri]);

  useEffect(() => {
    if (!enabled || count === 0 || state.status === 'loaded' || state.status === 'failed') return;
    const waiting = state.status === 'waiting';
    const timer = setTimeout(() => dispatch({ type: waiting ? 'next' : 'error', request, count }), waiting ? 800 : 12_000);
    return () => clearTimeout(timer);
  }, [enabled, count, request, state.status]);

  useEffect(() => {
    const listener = AppState.addEventListener('change', (next) => {
      if (next === 'active' && state.status === 'failed') dispatch({ type: 'reset' });
    });
    return () => listener.remove();
  }, [state.status]);

  const failed = state.status === 'failed';
  return (
    <View style={[styles.container, style]} testID={testID}>
      <Image source={brandPlaceholder} style={styles.placeholder} contentFit="contain" accessible={false} />
      {enabled && uri && !failed ? (
        <Image
          key={request}
          source={source}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          priority={priority}
          recyclingKey={`${uri}:${request}`}
          transition={Platform.OS === 'web' ? 0 : 120}
          accessibilityLabel={accessibilityLabel}
          onLoad={() => dispatch({ type: 'loaded', request, count })}
          onError={() => dispatch({ type: 'error', request, count })}
        />
      ) : null}
      {enabled && count > 0 && state.status !== 'loaded' && !failed ? (
        <ActivityIndicator style={styles.progress} size="small" color="#00D1FF" />
      ) : null}
      {enabled && failed && count > 0 ? (
        <Pressable
          style={styles.retry}
          accessibilityRole="button"
          accessibilityLabel={`${accessibilityLabel ?? 'Kép'} újratöltése`}
          testID={testID ? `${testID}-retry` : undefined}
          onPress={(event) => { event.stopPropagation(); dispatch({ type: 'reset' }); }}
          hitSlop={8}
        >
          <RotateCw size={20} color="#00D1FF" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#07191F', overflow: 'hidden' },
  placeholder: { position: 'absolute', width: '44%', height: '44%', top: '28%', left: '28%', opacity: 0.6 },
  progress: { position: 'absolute', left: 12, bottom: 12 },
  retry: { position: 'absolute', left: 10, bottom: 10, padding: 9, borderRadius: 24, backgroundColor: '#07191F' },
});
