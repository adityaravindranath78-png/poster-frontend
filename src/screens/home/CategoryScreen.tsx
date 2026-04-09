import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {HomeStackParamList} from '../../navigation/types';
import {useTemplateStore} from '../../store/templateStore';
import {getTemplates} from '../../services/templates';
import {TemplateMeta} from '../../types/template';
import TemplateCard from '../../components/TemplateCard';
import FadeIn from '../../components/FadeIn';
import {SkeletonCard} from '../../components/SkeletonLoader';
import ErrorState from '../../components/ErrorState';
import {colors, spacing, layout} from '../../theme';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const GRID_GAP = layout.cardGap;
const GRID_PADDING = layout.screenPaddingH;
const CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;

type Props = NativeStackScreenProps<HomeStackParamList, 'Category'>;

export default function CategoryScreen({route, navigation}: Props) {
  const {categoryId} = route.params;
  const selectedLanguage = useTemplateStore((s) => s.selectedLanguage);
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  const [nextKey, setNextKey] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setTemplates((prev) => [...prev, ...res.data]);
      setNextKey(res.nextKey);
    } catch {
      // Silently fail on pagination
    } finally {
      setLoadingMore(false);
    }
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadTemplates} />;
  }

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.skeletonGrid}>
          {Array.from({length: 8}).map((_, i) => (
            <FadeIn key={i} delay={i * 40} direction="up" distance={8}>
              <SkeletonCard style={styles.skeletonCard} />
            </FadeIn>
          ))}
        </View>
      ) : (
        <FlatList
          data={templates}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({item, index}) => (
            <FadeIn delay={index * 35} direction="up" distance={10}>
              <TemplateCard
                template={item}
                onPress={() =>
                  navigation.navigate('TemplatePreview', {template: item})
                }
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
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                color={colors.primary}
                style={styles.footerLoader}
              />
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: GRID_PADDING,
    paddingBottom: 100,
  },
  row: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: GRID_PADDING,
    gap: GRID_GAP,
  },
  skeletonCard: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
  },
  footerLoader: {
    paddingVertical: spacing.xl,
  },
});
