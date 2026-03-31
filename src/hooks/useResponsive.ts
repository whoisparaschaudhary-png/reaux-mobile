/**
 * useResponsive — reactive hook that re-fires on orientation / window resize.
 * Use inside components that need to react to dimension changes at runtime.
 * For static style sheets (StyleSheet.create) use the utils/responsive helpers directly.
 */

import { useWindowDimensions } from 'react-native';

export const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  const isSmallPhone = width < 360;
  const isTablet     = width >= 600;
  const isLargeTablet = width >= 768;

  /** Dynamic column count for grids */
  const cols = (map: { sm?: number; md?: number; lg?: number } = {}) => {
    if (width >= 768) return map.lg ?? 4;
    if (width >= 600) return map.md ?? 3;
    return map.sm ?? 2;
  };

  /** Moderate scale relative to current window width */
  const ms = (size: number, factor = 0.45) => {
    const ratio = width / 375;
    return Math.round(size + (ratio * size - size) * factor);
  };

  /** Width percentage */
  const wp = (pct: number) => Math.round(width * (pct / 100));

  /** Height percentage */
  const hp = (pct: number) => Math.round(height * (pct / 100));

  /** Responsive horizontal screen padding */
  const screenPadding = isTablet ? ms(24) : isSmallPhone ? ms(12) : ms(16);

  /** Responsive tab bar height */
  const tabBarHeight = isTablet ? 72 : isSmallPhone ? 60 : 68;

  return {
    width,
    height,
    isSmallPhone,
    isTablet,
    isLargeTablet,
    cols,
    ms,
    wp,
    hp,
    screenPadding,
    tabBarHeight,
  };
};
