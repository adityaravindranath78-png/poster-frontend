/**
 * Poster Design System — Typography
 *
 * Clean geometric sans-serif for UI text.
 * Never competes with the poster content.
 * Uses system font (SF Pro / Roboto) for max readability.
 */

import {Platform, TextStyle} from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

const base: TextStyle = {
  fontFamily,
  color: '#1A1A1A',
  letterSpacing: -0.2,
};

export const typography = {
  // Display — splash, hero moments
  displayLarge: {
    ...base,
    fontSize: 42,
    fontWeight: '800' as const,
    lineHeight: 48,
    letterSpacing: -1.2,
  },
  displayMedium: {
    ...base,
    fontSize: 34,
    fontWeight: '800' as const,
    lineHeight: 40,
    letterSpacing: -0.8,
  },

  // Headings
  h1: {
    ...base,
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
    letterSpacing: -0.6,
  },
  h2: {
    ...base,
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  h3: {
    ...base,
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: -0.2,
  },

  // Body
  bodyLarge: {
    ...base,
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyMedium: {
    ...base,
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodySmall: {
    ...base,
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },

  // Labels & Buttons
  labelLarge: {
    ...base,
    fontSize: 16,
    fontWeight: '700' as const,
    lineHeight: 22,
    letterSpacing: 0,
  },
  labelMedium: {
    ...base,
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: 0,
  },
  labelSmall: {
    ...base,
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
    letterSpacing: 0.2,
  },

  // Caption
  caption: {
    ...base,
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    color: '#6B7280',
  },
} as const;
