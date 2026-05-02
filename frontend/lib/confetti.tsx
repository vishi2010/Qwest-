import { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

type Particle = {
  key: string;
  x: number;
  size: number;
  color: string;
  drift: number;
  rotation: number;
};

const COLORS = ['#FFB800', '#22C55E', '#60A5FA', '#FB7185', '#A78BFA', '#F97316', '#F43F5E'];

export function ConfettiBurst({
  active,
  durationMs = 1400,
  count = 70,
}: {
  active: boolean;
  durationMs?: number;
  count?: number;
}) {
  const { width, height } = Dimensions.get('window');
  const baseY = useRef(new Animated.Value(-30)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const particles = useMemo<Particle[]>(() => {
    const arr: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const size = 6 + Math.random() * 8;
      arr.push({
        key: `p-${i}-${Math.random().toString(16).slice(2)}`,
        x: Math.random() * (width - 20) + 10,
        size,
        color: COLORS[i % COLORS.length],
        drift: (Math.random() - 0.5) * 120,
        rotation: Math.random() * 180,
      });
    }
    return arr;
  }, [count, width]);

  useEffect(() => {
    if (!active) return;
    baseY.setValue(-30);
    opacity.setValue(1);
    Animated.parallel([
      Animated.timing(baseY, {
        toValue: height + 30,
        duration: durationMs,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(Math.max(0, durationMs - 250)),
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]),
    ]).start();
  }, [active, baseY, durationMs, height, opacity]);

  if (!active) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map((p, idx) => {
        const translateX = baseY.interpolate({
          inputRange: [-30, height + 30],
          outputRange: [p.x, p.x + p.drift],
        });
        const rotate = baseY.interpolate({
          inputRange: [-30, height + 30],
          outputRange: [`${p.rotation}deg`, `${p.rotation + 240 + idx * 3}deg`],
        });
        const translateY = baseY.interpolate({
          inputRange: [-30, height + 30],
          outputRange: [-30 - (idx % 6) * 18, height + 30],
        });
        return (
          <Animated.View
            key={p.key}
            style={[
              styles.p,
              {
                width: p.size,
                height: p.size * 1.6,
                backgroundColor: p.color,
                opacity,
                transform: [{ translateX }, { translateY }, { rotate }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  p: {
    position: 'absolute',
    borderRadius: 2,
  },
});

