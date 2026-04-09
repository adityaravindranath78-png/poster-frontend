/**
 * Poster Design System — Animation Primitives
 *
 * Spring-based by default. Snappy, not floaty.
 * Every transition should feel physical and rewarding.
 */

import {WithSpringConfig, WithTimingConfig, Easing} from 'react-native-reanimated';

// Springs — the default motion language
export const springs = {
  // Snappy tap response (buttons, cards)
  snappy: {
    damping: 15,
    stiffness: 400,
    mass: 0.8,
  } satisfies WithSpringConfig,

  // Smooth transitions (sheets, overlays)
  smooth: {
    damping: 20,
    stiffness: 200,
    mass: 1,
  } satisfies WithSpringConfig,

  // Bouncy entrance (modals, toasts)
  bouncy: {
    damping: 12,
    stiffness: 180,
    mass: 0.9,
  } satisfies WithSpringConfig,

  // Gentle settle (list items, fade-ins)
  gentle: {
    damping: 25,
    stiffness: 120,
    mass: 1,
  } satisfies WithSpringConfig,

  // Quick snap (toggle, chip select)
  quick: {
    damping: 20,
    stiffness: 600,
    mass: 0.6,
  } satisfies WithSpringConfig,
};

// Timing — for opacity, progress bars, sequential reveals
export const timing = {
  fast: {
    duration: 150,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  } satisfies WithTimingConfig,

  normal: {
    duration: 250,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  } satisfies WithTimingConfig,

  slow: {
    duration: 400,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  } satisfies WithTimingConfig,

  // For skeleton shimmer
  shimmer: {
    duration: 1200,
    easing: Easing.linear,
  } satisfies WithTimingConfig,
};

// Scale values for press states
export const pressScale = {
  button: 0.97,
  card: 0.98,
  icon: 0.9,
  subtle: 0.995,
};
