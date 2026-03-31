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

export const shadows = {
  card:   { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 2, elevation: 1 },
  button: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 },
  large:  { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 6 },
} as const;

export const layout = {
  /** Horizontal screen padding — wider on tablets, tighter on small phones */
  screenPadding: isTablet ? ms(24) : isSmallPhone ? ms(12) : ms(16),
  /** Tab bar height — scaled but constrained so it never eats too much screen */
  tabBarHeight:  isTablet ? mvs(72) : isSmallPhone ? mvs(60) : mvs(68),
  /** App header height */
  headerHeight:  mvs(56),
} as const;
