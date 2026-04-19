import React from 'react';
import {View, Text, StyleSheet, StatusBar, Pressable} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import FadeIn from '../../components/FadeIn';

const ink = '#1A1512';
const paper = '#FAF5EC';
const paperDeep = '#F2E9D7';
const saffron = '#E85D2F';
const saffronDeep = '#C4441C';
const hairStrong = 'rgba(26, 21, 18, 0.18)';
const ashhalf = 'rgba(26, 21, 18, 0.58)';

export default function MyWorkScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={paper} />
      <LinearGradient
        colors={[paper, paperDeep]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <View style={styles.container}>
        <FadeIn delay={0} distance={8}>
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <View style={styles.brandDot} />
              <Text style={styles.brand}>MY WORK</Text>
            </View>
          </View>
        </FadeIn>

        <View style={styles.body}>
          <FadeIn delay={120} distance={14}>
            <View style={styles.emptyCard}>
              <View style={styles.iconWrap}>
                <View style={styles.pageBack} />
                <View style={styles.pageFront}>
                  <View style={styles.pageLine} />
                  <View style={[styles.pageLine, styles.pageLineShort]} />
                </View>
              </View>
              <Text style={styles.emptyKicker}>NOTHING HERE YET</Text>
              <Text style={styles.emptyTitle}>
                Your posters will{'\n'}
                <Text style={styles.emptyAccent}>live here</Text>.
              </Text>
              <Text style={styles.emptyBody}>
                Pick a template, make it yours, and every one you download or
                share gets saved to this space.
              </Text>

              <Pressable
                onPress={() => (navigation as any).navigate('Home')}
                style={({pressed}) => [
                  styles.cta,
                  pressed && styles.ctaPressed,
                ]}>
                <Text style={styles.ctaText}>Browse templates</Text>
              </Pressable>
            </View>
          </FadeIn>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: paper},
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 20,
  },
  header: {marginBottom: 18},
  brandRow: {flexDirection: 'row', alignItems: 'center'},
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

  body: {flex: 1, alignItems: 'center', justifyContent: 'center'},

  emptyCard: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  iconWrap: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  pageBack: {
    position: 'absolute',
    width: 48,
    height: 60,
    borderWidth: 1.5,
    borderColor: hairStrong,
    top: 4,
    left: 20,
    transform: [{rotate: '6deg'}],
    backgroundColor: 'rgba(255, 245, 224, 0.5)',
  },
  pageFront: {
    position: 'absolute',
    width: 48,
    height: 60,
    borderWidth: 1.5,
    borderColor: ink,
    top: 10,
    left: 12,
    transform: [{rotate: '-4deg'}],
    backgroundColor: paper,
    padding: 7,
    justifyContent: 'flex-start',
    gap: 4,
  },
  pageLine: {
    height: 2,
    backgroundColor: saffron,
    width: '100%',
  },
  pageLineShort: {
    width: '65%',
    backgroundColor: hairStrong,
  },
  emptyKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: saffron,
    letterSpacing: 2,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: ink,
    textAlign: 'center',
    lineHeight: 32,
    letterSpacing: -0.6,
    marginBottom: 14,
  },
  emptyAccent: {color: saffron},
  emptyBody: {
    fontSize: 14,
    fontWeight: '400',
    color: ashhalf,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
    maxWidth: 300,
  },
  cta: {
    backgroundColor: saffron,
    paddingHorizontal: 28,
    paddingVertical: 14,
    shadowColor: saffronDeep,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  ctaPressed: {backgroundColor: saffronDeep},
  ctaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
