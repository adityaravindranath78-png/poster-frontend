import AsyncStorage from '@react-native-async-storage/async-storage';
import {useEffect, useState} from 'react';
import api from './api';

export interface LoginHero {
  headline: {
    before: string;
    accent: string;
    after: string;
  };
  subtitle: string;
  poster: {
    greetingHi: string;
    greetingEn: string;
    gradient: [string, string, string];
    nameLabel: string;
    motif: string;
  };
  callout: string;
}

// Each variant showcases a different use case the app solves.
export const DEFAULT_VARIANTS: LoginHero[] = [
  {
    headline: {
      before: 'Festival posters with ',
      accent: 'your name',
      after: ' on them.',
    },
    subtitle:
      'Pick a template, add your photo —\nshare on WhatsApp in seconds.',
    poster: {
      greetingHi: 'शुभ प्रभात',
      greetingEn: 'good morning',
      gradient: ['#F4A72C', '#E85D2F', '#C4441C'],
      nameLabel: 'YOUR NAME',
      motif: '❋',
    },
    callout: 'Your photo. Your name.',
  },
  {
    headline: {
      before: 'Business ads that ',
      accent: 'sell',
      after: ', not decorate.',
    },
    subtitle:
      'Offers, menus, launches —\nyour brand, your language.',
    poster: {
      greetingHi: 'ग्रैंड ओपनिंग',
      greetingEn: 'grand opening',
      gradient: ['#2A5A7F', '#143B5E', '#0A2540'],
      nameLabel: 'YOUR SHOP',
      motif: '◆',
    },
    callout: 'Your shop. Your ad.',
  },
  {
    headline: {
      before: 'Devotional posts, ',
      accent: 'every morning',
      after: ', with your name.',
    },
    subtitle: 'Send daily blessings on WhatsApp —\npersonal, in seconds.',
    poster: {
      greetingHi: 'जय श्री राम',
      greetingEn: 'jai shri ram',
      gradient: ['#9C2223', '#6B1010', '#3A0808'],
      nameLabel: 'YOUR NAME',
      motif: '✿',
    },
    callout: 'Devotion. Daily.',
  },
  {
    headline: {
      before: 'Birthdays, weddings — ',
      accent: 'every wish',
      after: ' looks special.',
    },
    subtitle: 'Personalized greetings —\nready to share in one tap.',
    poster: {
      greetingHi: 'जन्मदिन मुबारक',
      greetingEn: 'happy birthday',
      gradient: ['#EC407A', '#C2185B', '#880E4F'],
      nameLabel: 'DEAR FRIEND',
      motif: '✦',
    },
    callout: 'Make their day.',
  },
  {
    headline: {
      before: 'Status quotes styled for ',
      accent: 'your feed',
      after: '.',
    },
    subtitle: 'Daily motivation, branded —\nready to post instantly.',
    poster: {
      greetingHi: 'मेहनत जारी',
      greetingEn: 'keep going',
      gradient: ['#2E7D5C', '#1E5240', '#0E2E23'],
      nameLabel: 'BY YOU',
      motif: '✧',
    },
    callout: 'Words that move.',
  },
];

export const DEFAULT_LOGIN_HERO: LoginHero = DEFAULT_VARIANTS[0];

const CACHE_KEY = 'login_hero_variants_v1';

function isValidVariant(v: unknown): v is LoginHero {
  const hero = v as LoginHero;
  return !!(hero && hero.headline && hero.poster && hero.subtitle);
}

export function useLoginVariants(): LoginHero[] {
  const [variants, setVariants] = useState<LoginHero[]>(DEFAULT_VARIANTS);

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(CACHE_KEY)
      .then(cached => {
        if (cancelled || !cached) return;
        try {
          const parsed = JSON.parse(cached) as LoginHero[];
          if (Array.isArray(parsed) && parsed.length && parsed.every(isValidVariant)) {
            setVariants(parsed);
          }
        } catch {
          // ignore bad cache
        }
      })
      .catch(() => {});

    api
      .get<{success: boolean; data: {variants: LoginHero[]} | null}>(
        '/config/login-hero',
      )
      .then(res => {
        if (cancelled) return;
        const list = res.data?.data?.variants;
        if (Array.isArray(list) && list.length && list.every(isValidVariant)) {
          setVariants(list);
          AsyncStorage.setItem(CACHE_KEY, JSON.stringify(list)).catch(() => {});
        }
      })
      .catch(() => {
        // silent — defaults already showing
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return variants;
}

// Legacy single-variant hook (kept for compatibility).
export function useLoginHero(): LoginHero {
  const variants = useLoginVariants();
  return variants[0] ?? DEFAULT_LOGIN_HERO;
}
