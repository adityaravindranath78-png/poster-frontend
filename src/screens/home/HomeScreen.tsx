import React, {useEffect, useCallback, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  Dimensions,
  StatusBar,
  Pressable,
  Image,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {HomeStackParamList} from '../../navigation/types';
import {useTemplateStore} from '../../store/templateStore';
import {useUserStore} from '../../store/userStore';
import {getTemplates, getDailyTemplates} from '../../services/templates';
import {CATEGORIES} from '../../utils/constants';
import {TemplateMeta} from '../../types/template';
import FadeIn from '../../components/FadeIn';

// Palette — matches Login / OTP / Profile for system cohesion
const ink = '#1A1512';
const paper = '#FAF5EC';
const paperDeep = '#F2E9D7';
const saffron = '#E85D2F';
const saffronDeep = '#C4441C';
const hair = 'rgba(26, 21, 18, 0.08)';
const hairStrong = 'rgba(26, 21, 18, 0.16)';
const ashhalf = 'rgba(26, 21, 18, 0.58)';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const SIDE_PAD = 20;
const GRID_GAP = 12;
const CARD_W = (SCREEN_WIDTH - SIDE_PAD * 2 - GRID_GAP) / 2;

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeScreen'>;

function greetingLine(): string {
  const h = new Date().getHours();
  if (h < 5) return 'LATE NIGHT';
  if (h < 12) return 'GOOD MORNING';
  if (h < 17) return 'GOOD AFTERNOON';
  if (h < 20) return 'GOOD EVENING';
  return 'GOOD NIGHT';
}

/* ─── Category card ─────────────────────────────── */
type CatCardProps = {
  label: string;
  hi: string;
  color: string;
  thumbnail?: string | null;
  width: number;
  height: number;
  onPress: () => void;
  index: number;
};

function CategoryCard({
  label,
  hi,
  color,
  thumbnail,
  width,
  height,
  onPress,
  index,
}: CatCardProps) {
  const [loaded, setLoaded] = useState(false);
  return (
    <FadeIn delay={60 + index * 30} distance={12}>
      <Pressable
        onPress={onPress}
        style={({pressed}) => [
          styles.catCard,
          {width, height, backgroundColor: color},
          pressed && styles.catCardPressed,
        ]}>
        {/* Color gradient fallback — always behind image */}
        <LinearGradient
          colors={[color, '#1A0A05']}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
        {thumbnail ? (
          <Image
            source={{uri: thumbnail}}
            style={[
              StyleSheet.absoluteFillObject,
              !loaded && {opacity: 0},
            ]}
            onLoad={() => setLoaded(true)}
            resizeMode="cover"
          />
        ) : null}
        {/* Dark fade at bottom so label is always legible on any image */}
        <LinearGradient
          colors={['transparent', 'rgba(0, 0, 0, 0.78)']}
          locations={[0.45, 1]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
        <View style={styles.catLabelWrap}>
          <Text style={styles.catLabel} numberOfLines={1}>
            {label}
          </Text>
          <Text style={styles.catHi} numberOfLines={1}>
            {hi}
          </Text>
        </View>
      </Pressable>
    </FadeIn>
  );
}

/* ─── Template card ─────────────────────────────── */
type CardProps = {
  template: TemplateMeta;
  onPress: () => void;
  width: number;
  height: number;
  index: number;
};

function TemplateCard({template, onPress, width, height, index}: CardProps) {
  const [loaded, setLoaded] = useState(false);
  return (
    <FadeIn delay={80 + index * 40} distance={12}>
      <Pressable
        onPress={onPress}
        style={({pressed}) => [
          styles.card,
          {width, height},
          pressed && styles.cardPressed,
        ]}>
        <View style={[styles.cardImageFallback, {width, height}]}>
          <Text style={styles.cardFallbackLabel}>
            {(template.title || template.category || 'Poster').slice(0, 2).toUpperCase()}
          </Text>
        </View>
        {template.thumbnail_url ? (
          <Image
            source={{uri: template.thumbnail_url}}
            style={[styles.cardImage, {width, height}, !loaded && {opacity: 0}]}
            onLoad={() => setLoaded(true)}
            resizeMode="cover"
          />
        ) : null}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)']}
          style={styles.cardGradient}
          pointerEvents="none"
        />
        {!!template.title && (
          <View style={styles.cardLabelWrap}>
            <Text style={styles.cardLabel} numberOfLines={2}>
              {template.title}
            </Text>
          </View>
        )}
      </Pressable>
    </FadeIn>
  );
}

/* ─── Section header ────────────────────────────── */
function SectionHeader({
  kicker,
  title,
  action,
  onAction,
}: {
  kicker: string;
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHead}>
      <View style={{flex: 1}}>
        <View style={styles.kickerRow}>
          <View style={styles.kickerLine} />
          <Text style={styles.kicker}>{kicker}</Text>
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {!!action && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{action} →</Text>
        </Pressable>
      )}
    </View>
  );
}

/* ─── Home Screen ───────────────────────────────── */
export default function HomeScreen({navigation}: Props) {
  const rootNav = useNavigation<any>();
  const {
    dailyTemplates,
    selectedLanguage,
    setDailyTemplates,
    setTrendingTemplates,
    setLoading,
    setError,
  } = useTemplateStore();
  const profile = useUserStore(s => s.profile);
  const scrollY = useSharedValue(0);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryPreviews, setCategoryPreviews] = useState<
    Record<string, string | null>
  >({});

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: e => {
      scrollY.value = e.contentOffset.y;
    },
  });

  const headerDivider = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, 40],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const loadContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [daily, trending, ...perCategory] = await Promise.all([
        getDailyTemplates(selectedLanguage),
        getTemplates({language: selectedLanguage, limit: 10}),
        ...CATEGORIES.map(cat =>
          getTemplates({
            category: cat.id,
            language: selectedLanguage,
            limit: 1,
          })
            .then(r => ({id: cat.id, thumb: r.data[0]?.thumbnail_url ?? null}))
            .catch(() => ({id: cat.id, thumb: null})),
        ),
      ]);
      setDailyTemplates(daily.data);
      setTrendingTemplates(trending.data);
      const previews: Record<string, string | null> = {};
      perCategory.forEach(p => {
        previews[p.id] = p.thumb;
      });
      setCategoryPreviews(previews);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedLanguage, setDailyTemplates, setTrendingTemplates, setLoading, setError]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadContent();
    setRefreshing(false);
  }

  function handleCategoryPress(id: string, label: string) {
    navigation.navigate('Category', {categoryId: id, categoryLabel: label});
  }

  function handleTemplatePress(t: TemplateMeta) {
    navigation.navigate('TemplatePreview', {template: t});
  }

  const firstName = (profile?.name || 'Creator').split(' ')[0];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={paper} />
      <LinearGradient
        colors={[paper, paperDeep]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      {/* Fixed top bar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.brandDot} />
          <Text style={styles.brand}>POSTER</Text>
        </View>
        <Pressable
          onPress={() => rootNav.navigate('Profile')}
          style={({pressed}) => [
            styles.avatarBtn,
            pressed && styles.avatarBtnPressed,
          ]}
          hitSlop={8}>
          {profile?.photoUrl ? (
            <Image
              source={{uri: profile.photoUrl}}
              style={styles.avatarImg}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>
                {firstName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </Pressable>
      </View>
      <Animated.View style={[styles.topBarDivider, headerDivider]} />

      <Animated.ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={saffron}
            colors={[saffron]}
            progressBackgroundColor={paper}
          />
        }>
        {/* Greeting */}
        <FadeIn delay={0} distance={10}>
          <View style={styles.greetingBlock}>
            <Text style={styles.greetingKicker}>{greetingLine()}</Text>
            <Text style={styles.greetingName} numberOfLines={1}>
              {firstName}
              <Text style={styles.greetingDot}>.</Text>
            </Text>
            <Text style={styles.greetingSub}>
              What will we make today?
            </Text>
          </View>
        </FadeIn>

        {/* Today's Specials */}
        {dailyTemplates.length > 0 && (
          <>
            <FadeIn delay={80} distance={10}>
              <SectionHeader kicker="TODAY" title="Daily specials" />
            </FadeIn>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dailyScroll}>
              {dailyTemplates.map((t, i) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  onPress={() => handleTemplatePress(t)}
                  width={180}
                  height={180 * 1.3}
                  index={i}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* Browse by Category — vertical grid of big category cards */}
        <FadeIn delay={160} distance={10}>
          <SectionHeader kicker="BROWSE BY" title="Category" />
        </FadeIn>
        <View style={styles.catGrid}>
          {CATEGORIES.map((cat, i) => (
            <CategoryCard
              key={cat.id}
              label={cat.label}
              hi={cat.hi}
              color={cat.color}
              thumbnail={categoryPreviews[cat.id]}
              width={CARD_W}
              height={CARD_W * 1.3}
              index={i}
              onPress={() => handleCategoryPress(cat.id, cat.label)}
            />
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: paper,
  },

  // Top bar
  topBar: {
    height: 56,
    paddingHorizontal: SIDE_PAD,
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarDivider: {
    height: 1,
    backgroundColor: hairStrong,
    marginHorizontal: SIDE_PAD,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: saffron,
    marginRight: 10,
  },
  brand: {
    fontSize: 12,
    fontWeight: '800',
    color: ink,
    letterSpacing: 2.4,
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: hairStrong,
  },
  avatarBtnPressed: {
    opacity: 0.7,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    flex: 1,
    backgroundColor: 'rgba(232, 93, 47, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 14,
    fontWeight: '800',
    color: saffron,
  },

  scroll: {flex: 1},
  scrollContent: {paddingBottom: 24},

  // Greeting
  greetingBlock: {
    paddingHorizontal: SIDE_PAD,
    paddingTop: 20,
    paddingBottom: 4,
  },
  greetingKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: saffron,
    letterSpacing: 2,
    marginBottom: 6,
  },
  greetingName: {
    fontSize: 36,
    fontWeight: '800',
    color: ink,
    letterSpacing: -1,
    lineHeight: 42,
  },
  greetingDot: {
    color: saffron,
  },
  greetingSub: {
    fontSize: 14,
    fontWeight: '400',
    color: ashhalf,
    marginTop: 4,
    lineHeight: 20,
  },

  // Section header
  sectionHead: {
    paddingHorizontal: SIDE_PAD,
    paddingTop: 28,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  kickerLine: {
    width: 18,
    height: 1,
    backgroundColor: saffron,
    marginRight: 8,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '700',
    color: saffron,
    letterSpacing: 2,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: ink,
    letterSpacing: -0.5,
  },
  sectionAction: {
    fontSize: 12,
    fontWeight: '700',
    color: ink,
    letterSpacing: 0.3,
  },

  // Daily horizontal scroll
  dailyScroll: {
    paddingHorizontal: SIDE_PAD,
    gap: GRID_GAP,
  },

  // Category card grid — vertical 2-col
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SIDE_PAD,
    gap: GRID_GAP,
  },
  catCard: {
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 14,
    shadowColor: ink,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  catCardPressed: {
    opacity: 0.88,
  },
  catLabelWrap: {
    position: 'relative',
  },
  catLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  catHi: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
    letterSpacing: 0.2,
  },

  // Card
  card: {
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: ink,
    shadowColor: ink,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardImage: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  cardImageFallback: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: saffron,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFallbackLabel: {
    fontSize: 42,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: -1,
  },
  cardGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
  },
  cardLabelWrap: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    lineHeight: 16,
  },
  cardSkeleton: {
    backgroundColor: 'rgba(26, 21, 18, 0.06)',
    borderRadius: 4,
  },

  bottomSpacer: {
    height: 40,
  },
});
