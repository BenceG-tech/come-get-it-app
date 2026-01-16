import React, {
  forwardRef,
  memo,
  ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  PanResponder,
  PanResponderInstance,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { ChevronUp } from 'lucide-react-native';
import Colors from '@/constants/colors';
import React from "react";

export type BottomSheetSnapPoints = readonly [string, string, string];
export type BottomSheetIndex = 0 | 1 | 2;

export type BottomSheetChangeEvent = {
  index: BottomSheetIndex;
};

export type BottomSheetRef = {
  snapToIndex: (index: BottomSheetIndex) => void;
  snapToCollapsed: () => void;
  snapToExpanded: () => void;
  getIndex: () => BottomSheetIndex;
};

type SheetSnap = {
  heights: [number, number, number];
  expandedHeight: number;
  translateYByIndex: [number, number, number];
  maxTranslateY: number;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function parsePercentPoint(point: string): number {
  const trimmed = point.trim();
  const isPercent = trimmed.endsWith('%');
  if (!isPercent) return NaN;
  const num = Number(trimmed.slice(0, -1));
  return Number.isFinite(num) ? num / 100 : NaN;
}

function snapPointsToHeights(containerHeight: number, snapPoints: BottomSheetSnapPoints): SheetSnap {
  const collapsedPct = parsePercentPoint(snapPoints[0]);
  const halfPct = parsePercentPoint(snapPoints[1]);
  const expandedPct = parsePercentPoint(snapPoints[2]);

  const expandedHeight = clamp(containerHeight * (Number.isFinite(expandedPct) ? expandedPct : 0.92), 320, containerHeight);
  const halfHeight = clamp(containerHeight * (Number.isFinite(halfPct) ? halfPct : 0.55), 260, expandedHeight);
  const collapsedHeight = clamp(containerHeight * (Number.isFinite(collapsedPct) ? collapsedPct : 0.18), 120, halfHeight);

  const heights: [number, number, number] = [collapsedHeight, halfHeight, expandedHeight];
  const translateYByIndex: [number, number, number] = [
    expandedHeight - collapsedHeight,
    expandedHeight - halfHeight,
    0,
  ];
  const maxTranslateY = translateYByIndex[0];

  return { heights, expandedHeight, translateYByIndex, maxTranslateY };
}

export type BottomSheetProps = {
  snapPoints?: BottomSheetSnapPoints;
  children: ReactNode;
  onChange?: (event: BottomSheetChangeEvent) => void;
  title?: string;
  subtitle?: string;
  containerStyle?: StyleProp<ViewStyle>;
  sheetStyle?: StyleProp<ViewStyle>;
  sheetCardStyle?: StyleProp<ViewStyle>;
  showHeader?: boolean;
  initialIndex?: BottomSheetIndex;
  accessibilityLabel?: string;
  testID?: string;
};

function BottomSheetImpl(
  {
    snapPoints = ['18%', '55%', '92%'],
    children,
    onChange,
    title,
    subtitle,
    containerStyle,
    sheetStyle,
    sheetCardStyle,
    showHeader = true,
    initialIndex = 0,
    accessibilityLabel,
    testID,
  }: BottomSheetProps,
  ref: React.Ref<BottomSheetRef>
) {
  const [index, setIndex] = useState<BottomSheetIndex>(initialIndex);

  const snapRef = useRef<SheetSnap | null>(null);
  const translateY = useRef<Animated.Value>(new Animated.Value(0)).current;
  const translateYStart = useRef<number>(0);

  const fireOnChange = useCallback(
    (nextIndex: BottomSheetIndex) => {
      onChange?.({ index: nextIndex });
    },
    [onChange]
  );

  const snapToIndex = useCallback(
    (nextIndex: BottomSheetIndex) => {
      const snap = snapRef.current;
      if (!snap) return;

      const toValue = snap.translateYByIndex[nextIndex];
      console.log('[BottomSheet] snapToIndex', { nextIndex, toValue });

      setIndex(nextIndex);
      Animated.spring(translateY, {
        toValue,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start(() => {
        translateYStart.current = toValue;
        fireOnChange(nextIndex);
      });
    },
    [fireOnChange, translateY]
  );

  useImperativeHandle(
    ref,
    () => ({
      snapToIndex,
      snapToCollapsed: () => snapToIndex(0),
      snapToExpanded: () => snapToIndex(2),
      getIndex: () => index,
    }),
    [index, snapToIndex]
  );

  const onContainerLayout = useCallback(
    (h: number) => {
      if (!h || h <= 0) return;
      const snap = snapPointsToHeights(h, snapPoints);
      snapRef.current = snap;

      const initialTo = snap.translateYByIndex[initialIndex];
      translateY.setValue(initialTo);
      translateYStart.current = initialTo;
      setIndex(initialIndex);

      console.log('[BottomSheet] layout', { h, snapPoints, snap, initialIndex, initialTo });
    },
    [initialIndex, snapPoints, translateY]
  );

  useEffect(() => {
    if (snapRef.current) {
      snapToIndex(index);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapPoints[0], snapPoints[1], snapPoints[2]]);

  const panResponder: PanResponderInstance = useMemo(() => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_evt, g) => Math.abs(g.dy) > Math.abs(g.dx) && Math.abs(g.dy) > 4,
      onPanResponderGrant: () => {
        translateY.stopAnimation((value) => {
          translateYStart.current = typeof value === 'number' ? value : 0;
        });
      },
      onPanResponderMove: (_evt, g) => {
        const snap = snapRef.current;
        if (!snap) return;
        const next = clamp(translateYStart.current + g.dy, 0, snap.maxTranslateY);
        translateY.setValue(next);
      },
      onPanResponderRelease: (_evt, g) => {
        const snap = snapRef.current;
        if (!snap) return;

        const current = clamp(translateYStart.current + g.dy, 0, snap.maxTranslateY);
        const projected = clamp(current + g.vy * 120, 0, snap.maxTranslateY);

        const distances: [number, number, number] = [
          Math.abs(projected - snap.translateYByIndex[0]),
          Math.abs(projected - snap.translateYByIndex[1]),
          Math.abs(projected - snap.translateYByIndex[2]),
        ];

        const min = Math.min(...distances);
        const nextIndex: BottomSheetIndex = distances[0] === min ? 0 : distances[1] === min ? 1 : 2;
        snapToIndex(nextIndex);
      },
    });
  }, [snapToIndex, translateY]);

  const chevronRotation = index === 2 ? '180deg' : '0deg';

  return (
    <View
      style={[styles.container, containerStyle]}
      onLayout={(e) => onContainerLayout(e.nativeEvent.layout.height)}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      <Animated.View
        style={[
          styles.sheet,
          {
            transform: [{ translateY }],
          },
          sheetStyle,
        ]}
        pointerEvents="box-none"
      >
        <View style={[styles.sheetCard, sheetCardStyle]} pointerEvents="auto">
          <View style={styles.handleRow} {...panResponder.panHandlers} testID={testID ? `${testID}-handle` : undefined}>
            <View style={styles.handle} />
            <View style={{ flex: 1 }} />
            <Pressable
              onPress={() => snapToIndex(index === 2 ? 0 : 2)}
              accessibilityRole="button"
              accessibilityLabel={index === 2 ? 'Lista összecsukása' : 'Lista kibontása'}
              style={({ pressed }) => [styles.chevronButton, pressed && { opacity: 0.7 }]}
              testID={testID ? `${testID}-toggle` : undefined}
            >
              <ChevronUp size={18} color={Colors.text} style={{ transform: [{ rotate: chevronRotation }] }} />
            </Pressable>
          </View>

          {showHeader ? (
            <View style={styles.header} testID={testID ? `${testID}-header` : undefined}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>
                  {title ?? 'Helyszínek listája'}
                </Text>
                {subtitle ? (
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
              <View style={styles.pill}>
                <Text style={styles.pillText}>Térkép teljes nézetben</Text>
              </View>
            </View>
          ) : null}

          {children}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '92%',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  sheetCard: {
    flex: 1,
    backgroundColor: 'rgba(12, 12, 14, 0.92)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    overflow: 'hidden',
  },
  handleRow: {
    height: 44,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  chevronButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    color: '#A6A6AD',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(43, 183, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(43, 183, 255, 0.25)',
  },
  pillText: {
    color: '#CDEFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

export const BottomSheet = memo(forwardRef(BottomSheetImpl));
