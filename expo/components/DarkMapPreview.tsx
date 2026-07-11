import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  PanResponder,
  Animated,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Plus, Minus, Crosshair } from 'lucide-react-native';
import { Venue } from '@/types/venue';

const TILE_SIZE = 256 as const;
const BUDAPEST = { latitude: 47.4979, longitude: 19.0402 } as const;
const MIN_ZOOM = 11 as const;
const MAX_ZOOM = 18 as const;

export type ResolvedCoordinate = {
  latitude: number;
  longitude: number;
  approximate: boolean;
};

type MapView = {
  latitude: number;
  longitude: number;
  zoom: number;
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

function tileXToLng(x: number, zoom: number): number {
  return (x / Math.pow(2, zoom)) * 360 - 180;
}

function tileYToLat(y: number, zoom: number): number {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, zoom);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function touchDistance(evt: GestureResponderEvent): number | null {
  const touches = evt.nativeEvent.touches;
  if (touches.length < 2) return null;
  const dx = touches[0].pageX - touches[1].pageX;
  const dy = touches[0].pageY - touches[1].pageY;
  return Math.sqrt(dx * dx + dy * dy);
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

type GestureStart = {
  view: MapView;
  pinchDist: number | null;
  pinchZoom: number;
  pinchCenter: { latitude: number; longitude: number };
  panDisabled: boolean;
};

type DarkMapPreviewProps = {
  venues: Venue[];
  zoom?: number;
  style?: StyleProp<ViewStyle>;
  onMarkerPress?: (venue: Venue) => void;
  showAttribution?: boolean;
  /** Enables drag-to-pan, pinch-to-zoom and zoom controls. */
  interactive?: boolean;
  /** Bottom offset for the zoom controls (to clear overlaying sheets). */
  controlsBottomOffset?: number;
  /** The user's current position — rendered as a pulsing blue dot. */
  userCoordinate?: { latitude: number; longitude: number } | null;
  /** When true, auto-center on userCoordinate when it arrives (one-shot). */
  centerOnUser?: boolean;
  testID?: string;
};

/**
 * Always-visible dark map rendered from CARTO dark basemap tiles with
 * cyan venue markers. Works on web and native (plain Image tiles).
 * When `interactive` is true it supports drag panning, pinch zoom and
 * on-screen +/- and re-center controls.
 */
export default function DarkMapPreview({
  venues,
  zoom = 13,
  style,
  onMarkerPress,
  showAttribution = true,
  interactive = false,
  controlsBottomOffset = 24,
  userCoordinate = null,
  centerOnUser = false,
  testID,
}: DarkMapPreviewProps) {
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [viewOverride, setViewOverride] = useState<MapView | null>(null);
  const hasAutoCenteredRef = useRef<boolean>(false);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
  }, []);

  const coordinates = useMemo(() => {
    return venues.slice(0, 30).map((venue) => ({ venue, coord: resolveVenueCoordinate(venue) }));
  }, [venues]);

  const defaultCenter = useMemo(() => {
    const precise = coordinates.filter((item) => !item.coord.approximate);
    const source = precise.length > 0 ? precise : coordinates;
    if (source.length === 0) return { latitude: BUDAPEST.latitude, longitude: BUDAPEST.longitude };
    const latSum = source.reduce((sum, item) => sum + item.coord.latitude, 0);
    const lngSum = source.reduce((sum, item) => sum + item.coord.longitude, 0);
    return { latitude: latSum / source.length, longitude: lngSum / source.length };
  }, [coordinates]);

  const view: MapView = useMemo(
    () =>
      viewOverride ?? {
        latitude: defaultCenter.latitude,
        longitude: defaultCenter.longitude,
        zoom,
      },
    [viewOverride, defaultCenter, zoom]
  );

  const viewRef = useRef<MapView>(view);
  const interactiveRef = useRef<boolean>(interactive);
  const gestureRef = useRef<GestureStart | null>(null);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  // Auto-center on user location when it first arrives (one-shot).
  useEffect(() => {
    if (!centerOnUser || !userCoordinate || hasAutoCenteredRef.current) return;
    hasAutoCenteredRef.current = true;
    setViewOverride({
      latitude: userCoordinate.latitude,
      longitude: userCoordinate.longitude,
      zoom: Math.max(zoom, 14),
    });
  }, [centerOnUser, userCoordinate, zoom]);

  useEffect(() => {
    interactiveRef.current = interactive;
  }, [interactive]);

  const panResponder = useMemo(() => {
    const applyPan = (dx: number, dy: number) => {
      const g = gestureRef.current;
      if (!g || g.panDisabled) return;
      const start = g.view;
      const worldPx = TILE_SIZE * Math.pow(2, start.zoom);
      const startX = lngToTileX(start.longitude, start.zoom) * TILE_SIZE;
      const startY = latToTileY(start.latitude, start.zoom) * TILE_SIZE;
      const nextX = startX - dx;
      const nextY = clampNumber(startY - dy, 0, worldPx);
      setViewOverride({
        latitude: tileYToLat(nextY / TILE_SIZE, start.zoom),
        longitude: tileXToLng(((nextX % worldPx) + worldPx) % worldPx / TILE_SIZE, start.zoom),
        zoom: start.zoom,
      });
    };

    const applyPinch = (dist: number) => {
      const g = gestureRef.current;
      if (!g) return;
      if (g.pinchDist === null || g.pinchDist <= 0) {
        g.pinchDist = dist;
        g.pinchZoom = viewRef.current.zoom;
        g.pinchCenter = { latitude: viewRef.current.latitude, longitude: viewRef.current.longitude };
        g.panDisabled = true;
        return;
      }
      const nextZoom = clampNumber(g.pinchZoom + Math.log2(dist / g.pinchDist), MIN_ZOOM, MAX_ZOOM);
      setViewOverride({
        latitude: g.pinchCenter.latitude,
        longitude: g.pinchCenter.longitude,
        zoom: nextZoom,
      });
    };

    return PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, g) => {
        if (!interactiveRef.current) return false;
        return evt.nativeEvent.touches.length >= 2 || Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4;
      },
      onPanResponderGrant: () => {
        gestureRef.current = {
          view: { ...viewRef.current },
          pinchDist: null,
          pinchZoom: viewRef.current.zoom,
          pinchCenter: { latitude: viewRef.current.latitude, longitude: viewRef.current.longitude },
          panDisabled: false,
        };
      },
      onPanResponderMove: (evt, g) => {
        const dist = touchDistance(evt);
        if (dist !== null) {
          applyPinch(dist);
        } else {
          applyPan(g.dx, g.dy);
        }
      },
      onPanResponderRelease: () => {
        gestureRef.current = null;
      },
      onPanResponderTerminate: () => {
        gestureRef.current = null;
      },
    });
  }, []);

  const zoomBy = useCallback((delta: number) => {
    const current = viewRef.current;
    setViewOverride({
      latitude: current.latitude,
      longitude: current.longitude,
      zoom: clampNumber(current.zoom + delta, MIN_ZOOM, MAX_ZOOM),
    });
  }, []);

  const resetView = useCallback(() => {
    if (userCoordinate) {
      setViewOverride({
        latitude: userCoordinate.latitude,
        longitude: userCoordinate.longitude,
        zoom: Math.max(viewRef.current.zoom, 14),
      });
      return;
    }
    setViewOverride(null);
  }, [userCoordinate]);

  const userPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!userCoordinate) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(userPulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(userPulse, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [userCoordinate, userPulse]);

  const { tiles, markers } = useMemo(() => {
    if (size.width <= 0 || size.height <= 0) {
      return { tiles: [] as TileSpec[], markers: [] as MarkerSpec[] };
    }

    const tileZoom = Math.round(clampNumber(view.zoom, 3, MAX_ZOOM));
    const scale = Math.pow(2, view.zoom - tileZoom);
    const scaledTile = TILE_SIZE * scale;
    const worldTiles = Math.pow(2, tileZoom);
    const centerPxX = lngToTileX(view.longitude, tileZoom) * scaledTile;
    const centerPxY = latToTileY(view.latitude, tileZoom) * scaledTile;
    const originX = centerPxX - size.width / 2;
    const originY = centerPxY - size.height / 2;

    const startTileX = Math.floor(originX / scaledTile);
    const endTileX = Math.floor((originX + size.width) / scaledTile);
    const startTileY = Math.floor(originY / scaledTile);
    const endTileY = Math.floor((originY + size.height) / scaledTile);

    const subdomains = ['a', 'b', 'c', 'd'] as const;
    const tileList: TileSpec[] = [];

    for (let tx = startTileX; tx <= endTileX; tx++) {
      for (let ty = startTileY; ty <= endTileY; ty++) {
        if (ty < 0 || ty >= worldTiles) continue;
        const wrappedX = ((tx % worldTiles) + worldTiles) % worldTiles;
        const subdomain = subdomains[(Math.abs(tx) + Math.abs(ty)) % subdomains.length];
        tileList.push({
          key: `${tileZoom}-${tx}-${ty}`,
          uri: `https://${subdomain}.basemaps.cartocdn.com/dark_nolabels/${tileZoom}/${wrappedX}/${ty}@2x.png`,
          left: tx * scaledTile - originX,
          top: ty * scaledTile - originY,
        });
      }
    }

    const markerList: MarkerSpec[] = coordinates
      .map(({ venue, coord }) => ({
        venue,
        left: lngToTileX(coord.longitude, tileZoom) * scaledTile - originX,
        top: latToTileY(coord.latitude, tileZoom) * scaledTile - originY,
      }))
      .filter((marker) => marker.left >= -20 && marker.left <= size.width + 20 && marker.top >= -20 && marker.top <= size.height + 20);

    return { tiles: tileList, markers: markerList };
  }, [size, view, coordinates]);

  const userMarker = useMemo(() => {
    if (!userCoordinate || size.width <= 0 || size.height <= 0) return null;
    const tileZoom = Math.round(clampNumber(view.zoom, 3, MAX_ZOOM));
    const scale = Math.pow(2, view.zoom - tileZoom);
    const scaledTile = TILE_SIZE * scale;
    const originX = lngToTileX(view.longitude, tileZoom) * scaledTile - size.width / 2;
    const originY = latToTileY(view.latitude, tileZoom) * scaledTile - size.height / 2;
    const left = lngToTileX(userCoordinate.longitude, tileZoom) * scaledTile - originX;
    const top = latToTileY(userCoordinate.latitude, tileZoom) * scaledTile - originY;
    if (left < -30 || left > size.width + 30 || top < -30 || top > size.height + 30) return null;
    return { left, top };
  }, [userCoordinate, size, view]);

  const tileZoomForRender = Math.round(clampNumber(view.zoom, 3, MAX_ZOOM));
  const renderedTileSize = TILE_SIZE * Math.pow(2, view.zoom - tileZoomForRender);

  return (
    <View
      style={[styles.container, style]}
      onLayout={onLayout}
      testID={testID}
      {...panResponder.panHandlers}
    >
      {tiles.map((tile) => (
        <Image
          key={tile.key}
          source={{ uri: tile.uri }}
          style={[styles.tile, { left: tile.left, top: tile.top, width: renderedTileSize, height: renderedTileSize }]}
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

      {userMarker && (
        <View
          style={[styles.userMarkerBox, { left: userMarker.left - 24, top: userMarker.top - 24 }]}
          pointerEvents="none"
          testID="map-user-location"
        >
          <Animated.View
            style={[
              styles.userPulseRing,
              {
                opacity: userPulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
                transform: [{ scale: userPulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.5] }) }],
              },
            ]}
          />
          <View style={styles.userDotOuter}>
            <View style={styles.userDotInner} />
          </View>
        </View>
      )}

      {interactive && (
        <View style={[styles.controls, { bottom: controlsBottomOffset }]} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => zoomBy(1)}
            activeOpacity={0.8}
            accessibilityLabel="Közelítés"
            testID="map-zoom-in"
          >
            <Plus size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => zoomBy(-1)}
            activeOpacity={0.8}
            accessibilityLabel="Távolítás"
            testID="map-zoom-out"
          >
            <Minus size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={resetView}
            activeOpacity={0.8}
            accessibilityLabel="Alaphelyzet"
            testID="map-recenter"
          >
            <Crosshair size={17} color="#00D1FF" />
          </TouchableOpacity>
        </View>
      )}

      {showAttribution && (
        <Text style={styles.attribution}>© OpenStreetMap © CARTO</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#0A0A0A',
  },
  tile: {
    position: 'absolute',
  },
  markerHitBox: {
    position: 'absolute',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerOuter: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0, 209, 255, 0.26)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00D1FF',
    shadowOpacity: 0.9,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  markerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00D1FF',
    borderWidth: 2,
    borderColor: '#001016',
  },
  userMarkerBox: {
    position: 'absolute',
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userPulseRing: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2B7FFF',
  },
  userDotOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(43, 127, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2B7FFF',
    shadowOpacity: 0.8,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  userDotInner: {
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#2B7FFF',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  controls: {
    position: 'absolute',
    right: 12,
    gap: 8,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 6, 10, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  attribution: {
    position: 'absolute',
    right: 6,
    bottom: 4,
    fontSize: 8,
    color: 'rgba(255,255,255,0.65)',
  },
});
