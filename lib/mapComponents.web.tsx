import React from 'react';
import { View, StyleSheet } from 'react-native';

interface MapViewProps {
  style?: any;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  pitchEnabled?: boolean;
  rotateEnabled?: boolean;
  testID?: string;
  children?: React.ReactNode;
}

export const MapView: React.FC<MapViewProps> = ({ style, initialRegion, testID }) => {
  if (!initialRegion) return null;
  
  const { latitude, longitude } = initialRegion;
  
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}&layer=mapnik&marker=${latitude},${longitude}`;
  
  return (
    <View style={[styles.container, style]} testID={testID}>
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 12,
          overflow: 'hidden',
        }}
        dangerouslySetInnerHTML={{
          __html: `<iframe src="${mapUrl}" style="width: 100%; height: 100%; border: none;" title="Venue Map"></iframe>`
        }}
      />
    </View>
  );
};

export const Marker: any = null;
export const PROVIDER_DEFAULT: any = null;

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden' as const,
  },
});
