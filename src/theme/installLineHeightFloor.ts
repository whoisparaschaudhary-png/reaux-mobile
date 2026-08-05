import { StyleSheet } from 'react-native';

/**
 * Guarantees every text style has enough line box for its glyphs to render whole.
 *
 * Why this exists
 * ---------------
 * assets/fonts/SplineSans-*.ttf were GitHub 404 HTML pages saved with a .ttf
 * extension, so Spline Sans never actually loaded and every `fontFamily` silently
 * fell back to the system face. San Francisco packs its Latin ink into a 1.1777 em
 * line box, which is loose enough that the tight `lineHeight` values in this app
 * mostly got away with it.
 *
 * Real Spline Sans has a natural line box of 1.2000 em, and its Bold ascenders
 * overshoot the ascent by a further ~0.011 em. So the moment the fonts are fixed,
 * every style with a ratio under ~1.222 starts clipping — restoring the fonts
 * without this floor would make the cropping worse, not better. The two changes
 * belong together.
 *
 * Why patch StyleSheet.create rather than edit the styles
 * ------------------------------------------------------
 * There are 480 `lineHeight` declarations across ~103 files. Verified before
 * writing this: every single one sits in an object that also declares `fontSize`
 * (zero orphans), and there are zero inline `style={{ lineHeight }}` props — so
 * this one hook covers 100% of them, and keeps covering new ones as they are
 * written. RN's `StyleSheet.create` is an identity function, so wrapping it is
 * cheap and non-destructive.
 *
 * It only ever RAISES a lineHeight that is already present. It never adds one,
 * which matters: a numeric `lineHeight` on a TextInput mis-positions the text box
 * on iOS, so those styles deliberately have none and must stay that way.
 */

// (R - 1.2) / 2 is the half-leading at ratio R; R >= 1.222 clears Bold's overshoot.
// 1.25 leaves a small margin and is a common, visually comfortable body ratio.
export const MIN_LINE_HEIGHT_RATIO = 1.25;

const original = StyleSheet.create.bind(StyleSheet);

// @ts-expect-error deliberately replacing RN's identity implementation
StyleSheet.create = (styles: Record<string, any>) => {
  for (const key in styles) {
    const s = styles[key];
    if (!s || typeof s !== 'object') continue;
    // Both must be plain numbers. Skip anything else, and never invent a lineHeight.
    if (typeof s.fontSize !== 'number' || typeof s.lineHeight !== 'number') continue;
    const floor = Math.ceil(s.fontSize * MIN_LINE_HEIGHT_RATIO);
    if (s.lineHeight < floor) s.lineHeight = floor;
  }
  return original(styles);
};
