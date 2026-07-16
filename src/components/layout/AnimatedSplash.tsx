import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { colors } from '../../theme';

// Natural size of assets/splash-logo.png (the REAUX + LABS lockup exported from Figma).
const LOGO_ASPECT = 1247 / 324;

// Minimum time the branded splash stays up so a fast launch doesn't flash it.
const MIN_VISIBLE_MS = 900;

interface AnimatedSplashProps {
  /** True once fonts are loaded and the session has finished restoring. */
  appReady: boolean;
  /** Called after the overlay has faded out and can be unmounted. */
  onFinish: () => void;
}

/**
 * Full-screen branded splash that mirrors the native (expo-splash-screen) frame —
 * the REAUX logo centered on brand yellow — so the hand-off from the OS splash to
 * JS is seamless. It fades itself out once the app is ready to render.
 */
export function AnimatedSplash({ appReady, onFinish }: AnimatedSplashProps) {
  const { width } = useWindowDimensions();
  const logoWidth = Math.min(width * 0.62, 340);
  const logoHeight = logoWidth / LOGO_ASPECT;

  const containerOpacity = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.92)).current;
  const [minTimePassed, setMinTimePassed] = useState(false);

  // Logo entrance.
  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 7,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => setMinTimePassed(true), MIN_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [logoOpacity, logoScale]);

  const runExit = useCallback(() => {
    Animated.timing(containerOpacity, {
      toValue: 0,
      duration: 400,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => onFinish());
  }, [containerOpacity, onFinish]);

  // Fade out once the app is ready and the minimum display time has elapsed.
  useEffect(() => {
    if (appReady && minTimePassed) {
      runExit();
    }
  }, [appReady, minTimePassed, runExit]);

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.container, { opacity: containerOpacity }]}
    >
      <Animated.Image
        source={require('../../../assets/splash-logo.png')}
        resizeMode="contain"
        style={{
          width: logoWidth,
          height: logoHeight,
          opacity: logoOpacity,
          transform: [{ scale: logoScale }],
        }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
});
