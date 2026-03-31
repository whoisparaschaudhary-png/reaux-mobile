/**
 * Responsive utility for React Native
 * Baseline: 375px wide (iPhone 14 / standard design target)
 * All scale functions read from Dimensions at module load time (portrait assumed).
 */

import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const BASE_WIDTH  = 375;
const BASE_HEIGHT = 812;

/** True if running on a tablet-sized device (≥600dp wide) */
export const isTablet     = SCREEN_W >= 600;
/** True if running on a small phone (<360dp wide, e.g. iPhone SE 1st gen) */
export const isSmallPhone = SCREEN_W < 360;

export const screenWidth  = SCREEN_W;
export const screenHeight = SCREEN_H;

/**
 * Scales a value linearly with screen width.
 * Use for things that MUST fill the width (images, containers).
 */
export const scale = (size: number): number =>
  Math.round((SCREEN_W / BASE_WIDTH) * size);

/**
 * Scales a value linearly with screen height.
 * Use for vertical padding / heights tied to content area.
 */
export const verticalScale = (size: number): number =>
  Math.round((SCREEN_H / BASE_HEIGHT) * size);

/**
 * Moderate scale — scales with width but dampened by `factor` (default 0.45).
 * Best for font sizes and UI element sizes: grows on large screens, shrinks on
 * small ones, but never as aggressively as a full linear scale.
 *
 * factor 0  → no scaling (always returns base size)
 * factor 1  → same as scale()
 */
export const moderateScale = (size: number, factor = 0.45): number =>
  Math.round(size + (scale(size) - size) * factor);

/**
 * Moderate vertical scale — same idea applied to height axis.
 */
export const moderateVerticalScale = (size: number, factor = 0.45): number =>
  Math.round(size + (verticalScale(size) - size) * factor);

/** Convenience shorthands */
export const ms  = moderateScale;
export const mvs = moderateVerticalScale;
export const s   = scale;
export const vs  = verticalScale;

/**
 * Returns a percentage of the screen width.
 * e.g. wp(50) → half the screen width
 */
export const wp = (percent: number): number =>
  Math.round(SCREEN_W * (percent / 100));

/**
 * Returns a percentage of the screen height.
 */
export const hp = (percent: number): number =>
  Math.round(SCREEN_H * (percent / 100));

/**
 * Dynamic column count for grid layouts.
 * Provides sensible defaults; pass a custom map to override.
 */
export const getColumns = (
  map: { sm?: number; md?: number; lg?: number } = {}
): number => {
  if (SCREEN_W >= 768) return map.lg ?? 4;
  if (SCREEN_W >= 600) return map.md ?? 3;
  return map.sm ?? 2;
};

/**
 * Responsive screen padding — tighter on small phones, more generous on tablets.
 */
export const responsivePadding = (): number => {
  if (isTablet)     return ms(24);
  if (isSmallPhone) return ms(12);
  return ms(16);
};
