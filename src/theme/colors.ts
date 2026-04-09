/**
 * Poster Design System — Color Tokens
 *
 * Warm, confident palette. Orange as primary action color,
 * near-black for text, soft grays for surfaces.
 * Dark mode ready — swap surface/text pairs.
 */

export const colors = {
  // Primary — the brand pulse
  primary: '#FF6B35',
  primaryLight: '#FF8F65',
  primaryDark: '#E55A28',
  primaryMuted: 'rgba(255, 107, 53, 0.12)',
  primaryGlow: 'rgba(255, 107, 53, 0.25)',

  // Accent — for premium badges, highlights
  accent: '#FFD700',
  accentDark: '#E6C200',

  // Surfaces
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceOverlay: 'rgba(0, 0, 0, 0.45)',
  surfaceBlur: 'rgba(255, 255, 255, 0.72)',
  surfaceDark: '#1A1A1A',
  surfaceDarkElevated: '#2A2A2A',

  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  textOnPrimary: '#FFFFFF',

  // Borders & Dividers
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  borderFocused: '#FF6B35',

  // Semantic
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Skeleton
  skeletonBase: '#E5E7EB',
  skeletonHighlight: '#F3F4F6',

  // Shadows (used in StyleSheet)
  shadowLight: 'rgba(0, 0, 0, 0.04)',
  shadowMedium: 'rgba(0, 0, 0, 0.08)',
  shadowHeavy: 'rgba(0, 0, 0, 0.16)',
} as const;
