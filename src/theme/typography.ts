import { StyleSheet } from 'react-native';
import { ms } from '../utils/responsive';

export const fontFamily = {
  regular: 'SplineSans-Regular',
  medium:  'SplineSans-Medium',
  bold:    'SplineSans-Bold',
} as const;

export const typography = StyleSheet.create({
  h1:             { fontFamily: fontFamily.bold,    fontSize: ms(28), lineHeight: ms(34) },
  h2:             { fontFamily: fontFamily.bold,    fontSize: ms(24), lineHeight: ms(30) },
  h3:             { fontFamily: fontFamily.bold,    fontSize: ms(20), lineHeight: ms(28) },
  h4:             { fontFamily: fontFamily.bold,    fontSize: ms(18), lineHeight: ms(22) },
  body:           { fontFamily: fontFamily.regular, fontSize: ms(16), lineHeight: ms(24) },
  bodyMedium:     { fontFamily: fontFamily.medium,  fontSize: ms(16), lineHeight: ms(24) },
  bodyBold:       { fontFamily: fontFamily.bold,    fontSize: ms(16), lineHeight: ms(24) },
  caption:        { fontFamily: fontFamily.medium,  fontSize: ms(14), lineHeight: ms(20) },
  captionRegular: { fontFamily: fontFamily.regular, fontSize: ms(14), lineHeight: ms(20) },
  small:          { fontFamily: fontFamily.regular, fontSize: ms(12), lineHeight: ms(16) },
  smallMedium:    { fontFamily: fontFamily.medium,  fontSize: ms(12), lineHeight: ms(16) },
  micro:          { fontFamily: fontFamily.bold,    fontSize: ms(10), lineHeight: ms(15) },
});
