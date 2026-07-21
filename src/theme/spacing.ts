import { ms, mvs, isTablet, isSmallPhone } from '../utils/responsive';

export const spacing = {
  xs:   ms(4),
  sm:   ms(8),
  md:   ms(12),
  lg:   ms(16),
  xl:   ms(20),
  xxl:  ms(24),
  xxxl: ms(32),
} as const;

export const borderRadius = {
  sm:   ms(4),
  md:   ms(8),
  lg:   ms(12),
  card: ms(16),
  xl:   ms(20),
  pill: 9999,
  tag:  ms(2),
} as const;

// Soft, diffuse elevation for a premium feel. Shadows are tinted with the warm
// brand-dark (#1c1c0d) rather than pure black so they read soft, not harsh, on
// the light (#f8f8f5) background.
export const shadows = {
  // Subtle lift for small chips / inputs / secondary surfaces.
  soft:   { shadowColor: '#1c1c0d', shadowOffset: { width: 0, height: 2 },  shadowOpacity: 0.05, shadowRadius: 8,  elevation: 2 },
  // Standard card elevation — clearly separated from the background.
  card:   { shadowColor: '#1c1c0d', shadowOffset: { width: 0, height: 6 },  shadowOpacity: 0.08, shadowRadius: 18, elevation: 4 },
  // Primary CTA / raised buttons.
  button: { shadowColor: '#1c1c0d', shadowOffset: { width: 0, height: 4 },  shadowOpacity: 0.12, shadowRadius: 12, elevation: 4 },
  // Modals, sheets, FABs, floating cart.
  large:  { shadowColor: '#1c1c0d', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.18, shadowRadius: 32, elevation: 12 },
} as const;

export const layout = {
  /** Horizontal screen padding — wider on tablets, tighter on small phones */
  screenPadding: isTablet ? ms(24) : isSmallPhone ? ms(12) : ms(16),
  /** Tab bar height — scaled but constrained so it never eats too much screen */
  tabBarHeight:  isTablet ? mvs(72) : isSmallPhone ? mvs(60) : mvs(68),
  /** App header height */
  headerHeight:  mvs(56),
} as const;
