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

export type BottomSheetSnapPoints = readonly [string, string];
export type BottomSheetIndex = 0 | 1;

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
  expandedHeight: number;
  collapsedHeight: number;
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
  const expandedPct = parsePercentPoint(snapPoints[1]);
  const collapsedPct = parsePercentPoint(snapPoints[0]);

  const expandedHeight = clamp(containerHeight * (Number.isFinite(expandedPct) ? expandedPct : 0.9), 260, containerHeight);
  const collapsedHeight = clamp(containerHeight * (Number.isFinite(collapsedPct) ? collapsedPct : 0.25), 160, expandedHeight);
  const maxTranslateY = expandedHeight - collapsedHeight;

  return { expandedHeight, collapsedHeight, maxTranslateY };
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
    snapPoints = ['25%', '90%'],
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

      const toValue = nextIndex === 1 ? 0 : snap.maxTranslateY;
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
      snapToExpanded: () => snapToIndex(1),
      getIndex: () => index,
    }),
    [index, snapToIndex]
  );

  const onContainerLayout = useCallback(
    (h: number) => {
      if (!h || h <= 0) return;
      const snap = snapPointsToHeights(h, snapPoints);
      snapRef.current = snap;

      const initialTo = initialIndex === 1 ? 0 : snap.maxTranslateY;
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
  }, [snapPoints[0], snapPoints[1]]);

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

        const shouldExpand = g.vy < -0.25 || g.dy < -snap.maxTranslateY * 0.2;
        const shouldCollapse = g.vy > 0.25 || g.dy > snap.maxTranslateY * 0.2;

        if (shouldExpand) snapToIndex(1);
        else if (shouldCollapse) snapToIndex(0);
        else snapToIndex(index);
      },
    });
  }, [index, snapToIndex, translateY]);

  const chevronRotation = index === 1 ? '180deg' : '0deg';

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
              onPress={() => snapToIndex(index === 1 ? 0 : 1)}
              accessibilityRole="button"
              accessibilityLabel={index === 1 ? 'Lista összecsukása' : 'Lista kibontása'}
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
