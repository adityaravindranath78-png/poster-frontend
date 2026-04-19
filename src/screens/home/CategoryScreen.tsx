import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Pressable,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {HomeStackParamList} from '../../navigation/types';
import {useTemplateStore} from '../../store/templateStore';
import {getTemplates, getTemplateSchema} from '../../services/templates';
import {TemplateMeta} from '../../types/template';
import TemplateCard from '../../components/TemplateCard';
import FadeIn from '../../components/FadeIn';
import {SkeletonCard} from '../../components/SkeletonLoader';
import ErrorState from '../../components/ErrorState';
import {CATEGORIES} from '../../utils/constants';

// Editorial palette — matches Home / Login / Preview
const ink = '#1A1512';
const paper = '#FAF5EC';
const paperDeep = '#F2E9D7';
const saffron = '#E85D2F';
const hair = 'rgba(26, 21, 18, 0.08)';
const hairStrong = 'rgba(26, 21, 18, 0.18)';
const ashhalf = 'rgba(26, 21, 18, 0.58)';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const SIDE_PAD = 20;
const GRID_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - SIDE_PAD * 2 - GRID_GAP) / 2;

type Props = NativeStackScreenProps<HomeStackParamList, 'Category'>;

export default function CategoryScreen({route, navigation}: Props) {
  const {categoryId, categoryLabel} = route.params;
  const selectedLanguage = useTemplateStore(s => s.selectedLanguage);
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  const [nextKey, setNextKey] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const categoryMeta = CATEGORIES.find(c => c.id === categoryId);
  const categoryColor = categoryMeta?.color ?? saffron;
  const categoryHi = categoryMeta?.hi;

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTemplates({
        category: categoryId,
        language: selectedLanguage,
        limit: 20,
      });
      setTemplates(res.data);
      setNextKey(res.nextKey);
    } catch (err: any) {
      setError(err.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [categoryId, selectedLanguage]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadTemplates();
    setRefreshing(false);
  }

  async function loadMore() {
    if (!nextKey || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await getTemplates({
        category: categoryId,
        language: selectedLanguage,
        limit: 20,
        nextKey,
      });
      setTemplates(prev => [...prev, ...res.data]);
      setNextKey(res.nextKey);
    } catch {
      // Silently fail on pagination
    } finally {
      setLoadingMore(false);
    }
  }

  function handleBack() {
    ReactNativeHapticFeedback.trigger('impactLight', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
    navigation.goBack();
  }

  async function handleTemplatePress(meta: TemplateMeta) {
    if (openingId) return;
    ReactNativeHapticFeedback.trigger('impactMedium', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
    setOpeningId(meta.id);
    try {
      const schema = await getTemplateSchema(meta.schema_url);
      navigation.navigate('Editor', {template: schema});
    } catch {
      Alert.alert('Error', 'Could not open this template. Try another.');
    } finally {
      setOpeningId(null);
    }
  }

  function Header() {
    return (
      <FadeIn delay={0} distance={6}>
        <View style={styles.header}>
          <Pressable
            onPress={handleBack}
            style={({pressed}) => [
              styles.backBtn,
              pressed && styles.backBtnPressed,
            ]}
            hitSlop={10}>
            <View style={styles.backArrow} />
          </Pressable>
          <View style={styles.headerMeta}>
            <View style={styles.kickerRow}>
              <View
                style={[styles.kickerDot, {backgroundColor: categoryColor}]}
              />
              <Text style={styles.kicker} numberOfLines={1}>
                BROWSE
              </Text>
              {templates.length > 0 && (
                <>
                  <View style={styles.kickerSep} />
                  <Text style={styles.kicker}>
                    {templates.length} {templates.length === 1 ? 'DESIGN' : 'DESIGNS'}
                  </Text>
                </>
              )}
            </View>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {categoryLabel}
            </Text>
            {!!categoryHi && (
              <Text style={styles.headerHi} numberOfLines={1}>
                {categoryHi}
              </Text>
            )}
          </View>
        </View>
      </FadeIn>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={paper} />
        <LinearGradient
          colors={[paper, paperDeep]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
        <Header />
        <ErrorState message={error} onRetry={loadTemplates} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={paper} />
      <LinearGradient
        colors={[paper, paperDeep]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <Header />

      {loading && !refreshing ? (
        <View style={styles.skeletonGrid}>
          {Array.from({length: 6}).map((_, i) => (
            <FadeIn key={i} delay={i * 40} direction="up" distance={8}>
              <SkeletonCard style={styles.skeletonCard} />
            </FadeIn>
          ))}
        </View>
      ) : (
        <FlatList
          data={templates}
          keyExtractor={item => item.id}
          numColumns={2}
          renderItem={({item, index}) => (
            <FadeIn delay={index * 35} direction="up" distance={10}>
              <TemplateCard
                template={item}
                onPress={() => handleTemplatePress(item)}
                style={styles.card}
                index={index}
              />
            </FadeIn>
          )}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={saffron}
              colors={[saffron]}
              progressBackgroundColor={paper}
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={saffron} style={styles.footerLoader} />
            ) : null
          }
        />
      )}

      {openingId && (
        <View style={styles.openingOverlay} pointerEvents="auto">
          <View style={styles.openingCard}>
            <ActivityIndicator color={saffron} size="large" />
            <Text style={styles.openingText}>Opening editor…</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: paper,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: SIDE_PAD,
    gap: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: hairStrong,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  backBtnPressed: {
    backgroundColor: paperDeep,
  },
  backArrow: {
    width: 9,
    height: 9,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: ink,
    transform: [{rotate: '45deg'}],
    marginLeft: 4,
  },
  headerMeta: {
    flex: 1,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  kickerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    color: ink,
    letterSpacing: 1.8,
  },
  kickerSep: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: hairStrong,
    marginHorizontal: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: ink,
    letterSpacing: -0.6,
    marginTop: 4,
  },
  headerHi: {
    fontSize: 14,
    fontWeight: '500',
    color: ashhalf,
    marginTop: 2,
    letterSpacing: 0.2,
  },

  // Grid
  list: {
    paddingHorizontal: SIDE_PAD,
    paddingBottom: 100,
  },
  row: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.3,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SIDE_PAD,
    gap: GRID_GAP,
  },
  skeletonCard: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.3,
  },
  footerLoader: {
    paddingVertical: 28,
  },

  // "Opening editor" overlay
  openingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 21, 18, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  openingCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    paddingVertical: 22,
    borderRadius: 6,
    alignItems: 'center',
    gap: 12,
    shadowColor: ink,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
  },
  openingText: {
    fontSize: 13,
    fontWeight: '700',
    color: ink,
    letterSpacing: 0.4,
  },
});
