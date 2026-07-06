import React, { useMemo, useState, useCallback } from 'react';
import { View, Image, Text, StyleSheet, Pressable, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { Venue } from '@/types/venue';

const TILE_SIZE = 256 as const;
const BUDAPEST = { latitude: 47.4979, longitude: 19.0402 } as const;

export type ResolvedCoordinate = {
  latitude: number;
  longitude: number;
  approximate: boolean;
};

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Returns a usable coordinate for a venue. Falls back to a deterministic
 * position around Budapest (derived from the venue id + address) so the map
 * never looks empty when precise coordinates are missing.
 */
export function resolveVenueCoordinate(venue: Venue): ResolvedCoordinate {
  const latRaw = venue.coordinates?.lat ?? venue.latitude;
  const lngRaw = venue.coordinates?.lng ?? venue.longitude;
  const latitude = typeof latRaw === 'number' ? latRaw : typeof latRaw === 'string' ? Number(latRaw) : NaN;
  const longitude = typeof lngRaw === 'number' ? lngRaw : typeof lngRaw === 'string' ? Number(lngRaw) : NaN;

  if (Number.isFinite(latitude) && Number.isFinite(longitude) && !(latitude === 0 && longitude === 0)) {
    return { latitude, longitude, approximate: false };
  }

  const hash = hashString(`${String(venue.id)}::${venue.address ?? ''}`);
  const latOffset = ((hash % 997) / 997 - 0.5) * 0.026;
  const lngOffset = ((Math.floor(hash / 997) % 997) / 997 - 0.5) * 0.05;

  return {
    latitude: BUDAPEST.latitude + latOffset,
    longitude: BUDAPEST.longitude + lngOffset,
    approximate: true,
  };
}

function lngToTileX(lng: number, zoom: number): number {
  return ((lng + 180) / 360) * Math.pow(2, zoom);
}

function latToTileY(lat: number, zoom: number): number {
  const rad = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * Math.pow(2, zoom);
}

type TileSpec = {
  key: string;
  uri: string;
  left: number;
  top: number;
};

type MarkerSpec = {
  venue: Venue;
  left: number;
  top: number;
};

type DarkMapPreviewProps = {
  venues: Venue[];
  zoom?: number;
  style?: StyleProp<ViewStyle>;
  onMarkerPress?: (venue: Venue) => void;
  showAttribution?: boolean;
  testID?: string;
};

/**
 * Always-visible dark map rendered from CARTO dark basemap tiles with
 * cyan venue markers. Works on web and native (plain Image tiles),
 * so the venue list map header never appears blank.
 */
export default function DarkMapPreview({
  venues,
  zoom = 13,
  style,
  onMarkerPress,
  showAttribution = true,
  testID,
}: DarkMapPreviewProps) {
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
  }, []);

  const coordinates = useMemo(() => {
    return venues.slice(0, 30).map((venue) => ({ venue, coord: resolveVenueCoordinate(venue) }));
  }, [venues]);

  const center = useMemo(() => {
    const precise = coordinates.filter((item) => !item.coord.approximate);
    const source = precise.length > 0 ? precise : coordinates;
    if (source.length === 0) return { latitude: BUDAPEST.latitude, longitude: BUDAPEST.longitude };
    const latSum = source.reduce((sum, item) => sum + item.coord.latitude, 0);
    const lngSum = source.reduce((sum, item) => sum + item.coord.longitude, 0);
    return { latitude: latSum / source.length, longitude: lngSum / source.length };
  }, [coordinates]);

  const { tiles, markers } = useMemo(() => {
    if (size.width <= 0 || size.height <= 0) {
      return { tiles: [] as TileSpec[], markers: [] as MarkerSpec[] };
    }

    const worldTiles = Math.pow(2, zoom);
    const centerPxX = lngToTileX(center.longitude, zoom) * TILE_SIZE;
    const centerPxY = latToTileY(center.latitude, zoom) * TILE_SIZE;
    const originX = centerPxX - size.width / 2;
    const originY = centerPxY - size.height / 2;

    const startTileX = Math.floor(originX / TILE_SIZE);
    const endTileX = Math.floor((originX + size.width) / TILE_SIZE);
    const startTileY = Math.floor(originY / TILE_SIZE);
    const endTileY = Math.floor((originY + size.height) / TILE_SIZE);

    const subdomains = ['a', 'b', 'c', 'd'] as const;
    const tileList: TileSpec[] = [];

    for (let tx = startTileX; tx <= endTileX; tx++) {
      for (let ty = startTileY; ty <= endTileY; ty++) {
        if (ty < 0 || ty >= worldTiles) continue;
        const wrappedX = ((tx % worldTiles) + worldTiles) % worldTiles;
        const subdomain = subdomains[(Math.abs(tx) + Math.abs(ty)) % subdomains.length];
        tileList.push({
          key: `${tx}-${ty}`,
          uri: `https://${subdomain}.basemaps.cartocdn.com/dark_all/${zoom}/${wrappedX}/${ty}@2x.png`,
          left: tx * TILE_SIZE - originX,
          top: ty * TILE_SIZE - originY,
        });
      }
    }

    const markerList: MarkerSpec[] = coordinates
      .map(({ venue, coord }) => ({
        venue,
        left: lngToTileX(coord.longitude, zoom) * TILE_SIZE - originX,
        top: latToTileY(coord.latitude, zoom) * TILE_SIZE - originY,
      }))
      .filter((marker) => marker.left >= -20 && marker.left <= size.width + 20 && marker.top >= -20 && marker.top <= size.height + 20);

    return { tiles: tileList, markers: markerList };
  }, [size, center, zoom, coordinates]);

  return (
    <View style={[styles.container, style]} onLayout={onLayout} testID={testID}>
      {tiles.map((tile) => (
        <Image
          key={tile.key}
          source={{ uri: tile.uri }}
          style={[styles.tile, { left: tile.left, top: tile.top }]}
          resizeMode="cover"
        />
      ))}

      {markers.map((marker) => {
        const dot = (
          <View style={styles.markerOuter}>
            <View style={styles.markerInner} />
          </View>
        );

        if (onMarkerPress) {
          return (
            <Pressable
              key={`marker-${String(marker.venue.id)}`}
              onPress={() => onMarkerPress(marker.venue)}
              style={[styles.markerHitBox, { left: marker.left - 18, top: marker.top - 18 }]}
              accessibilityRole="button"
              accessibilityLabel={`${marker.venue.name} a térképen`}
              testID={`map-marker-${String(marker.venue.id)}`}
            >
              {dot}
            </Pressable>
          );
        }

        return (
          <View
            key={`marker-${String(marker.venue.id)}`}
            style={[styles.markerHitBox, { left: marker.left - 18, top: marker.top - 18 }]}
            pointerEvents="none"
          >
            {dot}
          </View>
        );
      })}

      {showAttribution && (
        <Text style={styles.attribution}>© OpenStreetMap © CARTO</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#0B0F14',
  },
  tile: {
    position: 'absolute',
    width: TILE_SIZE,
    height: TILE_SIZE,
  },
  markerHitBox: {
    position: 'absolute',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 209, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#00D1FF',
    borderWidth: 2,
    borderColor: '#001014',
  },
  attribution: {
    position: 'absolute',
    right: 6,
    bottom: 4,
    fontSize: 8,
    color: 'rgba(255,255,255,0.4)',
  },
});
