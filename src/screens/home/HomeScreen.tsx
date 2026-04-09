import React, {useEffect, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Dimensions,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {HomeStackParamList} from '../../navigation/types';
import {useTemplateStore} from '../../store/templateStore';
import {useUserStore} from '../../store/userStore';
import {getTemplates, getDailyTemplates} from '../../services/templates';
import {CATEGORIES} from '../../utils/constants';
import {TemplateMeta} from '../../types/template';
import TemplateCard from '../../components/TemplateCard';
import HapticPressable from '../../components/HapticPressable';
import FadeIn from '../../components/FadeIn';
import {SkeletonCard} from '../../components/SkeletonLoader';
import {
  colors,
  typography,
  spacing,
  radii,
  shadows,
  layout,
  springs,
  pressScale,
} from '../../theme';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const CATEGORY_PILL_WIDTH = 88;
const GRID_GAP = layout.cardGap;
const GRID_PADDING = layout.screenPaddingH;
const CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeScreen'>;

/* ─── Category Pill ─────────────────────────────────────── */
function CategoryPill({
  id,
  label,
  icon,
  onPress,
  index,
}: {
  id: string;
  label: string;
  icon: string;
  onPress: () => void;
  index: number;
}) {
  return (
    <FadeIn delay={index * 40} direction="up" distance={8}>
      <HapticPressable
        onPress={onPress}
        scaleValue={pressScale.card}
        haptic="selection"
        style={styles.pill}>
        <View style={styles.pillIconWrap}>
          <Text style={styles.pillIcon}>{icon}</Text>
        </View>
        <Text style={[typography.labelSmall, styles.pillLabel]} numberOfLines={1}>
          {label}
        </Text>
      </HapticPressable>
    </FadeIn>
  );
}

/* ─── Section Header ────────────────────────────────────── */
function SectionHeader({title, delay = 0}: {title: string; delay?: number}) {
  return (
    <FadeIn delay={delay}>
      <Text style={[typography.h3, styles.sectionTitle]}>{title}</Text>
    </FadeIn>
  );
}

/* ─── Skeleton Grid ─────────────────────────────────────── */
function SkeletonGrid() {
  return (
    <View style={styles.skeletonGrid}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <SkeletonCard key={i} style={styles.skeletonCard} />
      ))}
    </View>
  );
}

/* ─── Home Screen ───────────────────────────────────────── */
export default function HomeScreen({navigation}: Props) {
  const {
    dailyTemplates,
    trendingTemplates,
    selectedLanguage,
    isLoading,
    error,
    setDailyTemplates,
    setTrendingTemplates,
    setLoading,
    setError,
  } = useTemplateStore();
  const profile = useUserStore((s) => s.profile);
  const scrollY = useSharedValue(0);
  const [refreshing, setRefreshing] = React.useState(false);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Header parallax + fade
  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 60], [1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, 100],
          [0, -20],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  useEffect(() => {
    loadContent();
  }, [selectedLanguage]);

  const loadContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [daily, trending] = await Promise.all([
        getDailyTemplates(selectedLanguage),
        getTemplates({language: selectedLanguage, limit: 10}),
      ]);
      setDailyTemplates(daily.data);
      setTrendingTemplates(trending.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [selectedLanguage]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadContent();
    setRefreshing(false);
  }

  function handleCategoryPress(categoryId: string, categoryLabel: string) {
    navigation.navigate('Category', {categoryId, categoryLabel});
  }

  function handleTemplatePress(template: TemplateMeta) {
    navigation.navigate('TemplatePreview', {template});
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      <Animated.ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }>
        {/* Greeting Header */}
        <Animated.View style={[styles.header, headerStyle]}>
          <FadeIn delay={0} direction="left">
            <Text style={[typography.bodySmall, styles.greeting]}>
              {getGreeting()}
            </Text>
            <Text style={[typography.h1, styles.userName]} numberOfLines={1}>
              {profile?.name || 'Creator'}
            </Text>
          </FadeIn>
        </Animated.View>

        {/* Categories — Horizontal Scroll */}
        <SectionHeader title="Categories" delay={80} />
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(item) => item.id}
          renderItem={({item, index}) => (
            <CategoryPill
              id={item.id}
              label={item.label}
              icon={item.icon}
              index={index}
              onPress={() => handleCategoryPress(item.id, item.label)}
            />
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillScroll}
          snapToInterval={CATEGORY_PILL_WIDTH + spacing.md}
          decelerationRate="fast"
        />

        {/* Today's Specials — Horizontal Carousel */}
        {dailyTemplates.length > 0 && (
          <>
            <SectionHeader title="Today's Specials" delay={200} />
            <FlatList
              horizontal
              data={dailyTemplates}
              keyExtractor={(item) => item.id}
              renderItem={({item, index}) => (
                <FadeIn delay={220 + index * 60} direction="right" distance={20}>
                  <TemplateCard
                    template={item}
                    onPress={() => handleTemplatePress(item)}
                    style={styles.dailyCard}
                    index={index}
                  />
                </FadeIn>
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dailyScroll}
              snapToInterval={172}
              decelerationRate="fast"
            />
          </>
        )}

        {/* Trending — 2-column Grid */}
        <SectionHeader title="Trending" delay={300} />

        {isLoading && !refreshing ? (
          <SkeletonGrid />
        ) : (
          <View style={styles.grid}>
            {trendingTemplates.map((item, index) => (
              <FadeIn
                key={item.id}
                delay={320 + index * 50}
                direction="up"
                distance={12}>
                <TemplateCard
                  template={item}
                  onPress={() => handleTemplatePress(item)}
                  style={styles.gridCard}
                  index={index}
                />
              </FadeIn>
            ))}
          </View>
        )}

        {/* Bottom spacer for tab bar */}
        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>
    </View>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },

  // Header
  header: {
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: spacing['5xl'],
    paddingBottom: spacing.lg,
  },
  greeting: {
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  userName: {
    color: colors.textPrimary,
  },

  // Section
  sectionTitle: {
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.md,
    color: colors.textPrimary,
  },

  // Category Pills
  pillScroll: {
    paddingHorizontal: layout.screenPaddingH,
    gap: spacing.md,
  },
  pill: {
    width: CATEGORY_PILL_WIDTH,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  pillIconWrap: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  pillIcon: {
    fontSize: 26,
  },
  pillLabel: {
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Daily Carousel
  dailyScroll: {
    paddingHorizontal: layout.screenPaddingH,
    gap: GRID_GAP,
  },
  dailyCard: {
    width: 160,
    height: 160,
    borderRadius: radii.lg,
  },

  // Trending Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: GRID_PADDING,
    gap: GRID_GAP,
  },
  gridCard: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
  },

  // Skeleton
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: GRID_PADDING,
    gap: GRID_GAP,
  },
  skeletonCard: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
  },

  bottomSpacer: {
    height: 100,
  },
});
