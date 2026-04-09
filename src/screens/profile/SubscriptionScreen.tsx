import React from 'react';
import {View, Text, StyleSheet, ScrollView, Alert} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {useSubscriptionStore} from '../../store/subscriptionStore';
import {SUBSCRIPTION_PLANS} from '../../utils/constants';
import {formatPrice} from '../../utils/helpers';
import Button from '../../components/Button';
import HapticPressable from '../../components/HapticPressable';
import FadeIn from '../../components/FadeIn';
import {
  colors,
  typography,
  spacing,
  radii,
  shadows,
  layout,
  pressScale,
} from '../../theme';

function PlanCard({
  plan,
  isActive,
  recommended,
  index,
  onSubscribe,
}: {
  plan: (typeof SUBSCRIPTION_PLANS)[number];
  isActive: boolean;
  recommended: boolean;
  index: number;
  onSubscribe: () => void;
}) {
  return (
    <FadeIn delay={100 + index * 80} direction="up" distance={16}>
      <HapticPressable
        onPress={onSubscribe}
        haptic="light"
        scaleValue={pressScale.card}
        disabled={isActive || plan.id === 'free'}
        style={[
          styles.card,
          isActive && styles.cardActive,
          recommended && styles.cardRecommended,
        ]}>
        {recommended && (
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={styles.recommendedBadge}>
            <Text style={[typography.labelSmall, styles.recommendedText]}>
              BEST VALUE
            </Text>
          </LinearGradient>
        )}

        <View style={styles.cardHeader}>
          <View>
            <Text style={[typography.h3, styles.planName]}>{plan.name}</Text>
            {isActive && (
              <Text style={[typography.caption, styles.currentLabel]}>
                Current plan
              </Text>
            )}
          </View>
          <Text style={[typography.h2, styles.planPrice]}>
            {plan.price === 0
              ? 'Free'
              : formatPrice(plan.price)}
            {plan.price > 0 && (
              <Text style={[typography.bodySmall, styles.planInterval]}>
                /{plan.interval === 'monthly' ? 'mo' : 'yr'}
              </Text>
            )}
          </Text>
        </View>

        <View style={styles.featureList}>
          {plan.features.map((feature, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.checkmark}>
                {isActive || plan.id === 'free' ? '✓' : '○'}
              </Text>
              <Text style={[typography.bodySmall, styles.featureText]}>
                {feature}
              </Text>
            </View>
          ))}
        </View>

        {plan.id !== 'free' && !isActive && (
          <Button
            title="Subscribe"
            onPress={onSubscribe}
            size="medium"
            variant={recommended ? 'primary' : 'ghost'}
            style={styles.subscribeButton}
          />
        )}
      </HapticPressable>
    </FadeIn>
  );
}

export default function SubscriptionScreen() {
  const {status} = useSubscriptionStore();

  function handleSubscribe(planId: string) {
    ReactNativeHapticFeedback.trigger('impactMedium', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
    Alert.alert(
      'Coming Soon',
      'Payments will be integrated with Razorpay in the next update.',
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <FadeIn delay={0}>
        <Text style={[typography.displayMedium, styles.title]}>
          Go Premium
        </Text>
      </FadeIn>
      <FadeIn delay={60}>
        <Text style={[typography.bodyMedium, styles.subtitle]}>
          Remove watermarks, unlock all templates,{'\n'}and access premium fonts
        </Text>
      </FadeIn>

      {SUBSCRIPTION_PLANS.map((plan, index) => {
        const isActive =
          plan.id === status ||
          (plan.id === 'free' && status === 'free');
        const recommended = plan.id === 'premium_yearly';
        return (
          <PlanCard
            key={plan.id}
            plan={plan}
            isActive={isActive}
            recommended={recommended}
            index={index}
            onSubscribe={() => handleSubscribe(plan.id)}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: layout.screenPaddingH,
    paddingTop: spacing['3xl'],
    paddingBottom: spacing['6xl'],
  },
  title: {
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing['3xl'],
    lineHeight: 22,
  },

  // Cards
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.sm,
    position: 'relative',
    overflow: 'hidden',
  },
  cardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  cardRecommended: {
    borderColor: colors.primary,
    ...shadows.glow,
  },
  recommendedBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderBottomLeftRadius: radii.md,
  },
  recommendedText: {
    color: colors.textOnPrimary,
    fontSize: 9,
    letterSpacing: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  planName: {
    color: colors.textPrimary,
  },
  currentLabel: {
    color: colors.primary,
    marginTop: 2,
  },
  planPrice: {
    color: colors.primary,
  },
  planInterval: {
    color: colors.textTertiary,
    fontWeight: '400',
  },
  featureList: {
    gap: spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkmark: {
    fontSize: 14,
    color: colors.success,
    width: 20,
    textAlign: 'center',
  },
  featureText: {
    color: colors.textSecondary,
    flex: 1,
  },
  subscribeButton: {
    marginTop: spacing.lg,
  },
});
