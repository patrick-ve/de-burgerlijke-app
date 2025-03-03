import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  runOnJS,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutRight,
  SlideInUp,
  SlideOutDown,
} from 'react-native-reanimated';
import { useEffect } from 'react';

interface AnimatedLayoutProps {
  children: ReactNode;
  entering?: any;
  exiting?: any;
  style?: any;
}

/**
 * A wrapper component that provides smooth animations for screen transitions
 */
export function AnimatedLayout({
  children,
  entering = FadeIn.duration(300),
  exiting = FadeOut.duration(200),
  style,
}: AnimatedLayoutProps) {
  return (
    <Animated.View
      style={[styles.container, style]}
      entering={entering}
      exiting={exiting}
    >
      {children}
    </Animated.View>
  );
}

/**
 * A layout component for card-style screen transitions (horizontal slide)
 */
export function CardLayout({
  children,
  style,
}: Omit<AnimatedLayoutProps, 'entering' | 'exiting'>) {
  return (
    <AnimatedLayout
      entering={SlideInRight.duration(350)}
      exiting={SlideOutRight.duration(250)}
      style={style}
    >
      {children}
    </AnimatedLayout>
  );
}

/**
 * A layout component for modal-style screen transitions (vertical slide)
 */
export function ModalLayout({
  children,
  style,
}: Omit<AnimatedLayoutProps, 'entering' | 'exiting'>) {
  return (
    <AnimatedLayout
      entering={SlideInUp.duration(400)}
      exiting={SlideOutDown.duration(300)}
      style={style}
    >
      {children}
    </AnimatedLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
