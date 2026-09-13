import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, StatusBar, Animated, Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const GREEN  = '#03632B';
const G_LT   = '#E8F5EE';
const WHITE  = '#FFFFFF';
const TEXT   = '#1A1A1A';
const MUTED  = '#6B7280';

// Header takes 65% of screen
const HEADER_H = height * 0.65;
const RING = 'rgba(255,255,255,0.14)';

const TopoDecor = () => (
  <>
    {[
      { top: -24, left: -16, w: width * 1.05, h: HEADER_H * 0.55, tl: HEADER_H * 0.28, tr: HEADER_H * 0.18, bl: HEADER_H * 0.20, br: HEADER_H * 0.32, rot: '-4deg' },
      { top: 8,   left: 14,  w: width * 0.88, h: HEADER_H * 0.46, tl: HEADER_H * 0.22, tr: HEADER_H * 0.30, bl: HEADER_H * 0.28, br: HEADER_H * 0.15, rot: '6deg'  },
      { top: 30,  left: 28,  w: width * 0.72, h: HEADER_H * 0.38, tl: HEADER_H * 0.30, tr: HEADER_H * 0.14, bl: HEADER_H * 0.16, br: HEADER_H * 0.26, rot: '-8deg' },
      { top: 50,  left: 44,  w: width * 0.58, h: HEADER_H * 0.30, tl: HEADER_H * 0.18, tr: HEADER_H * 0.26, bl: HEADER_H * 0.24, br: HEADER_H * 0.12, rot: '5deg'  },
      { top: 68,  left: 58,  w: width * 0.44, h: HEADER_H * 0.22, tl: HEADER_H * 0.24, tr: HEADER_H * 0.12, bl: HEADER_H * 0.14, br: HEADER_H * 0.22, rot: '-6deg' },
    ].map((r, i) => (
      <View key={i} style={{
        position: 'absolute', top: r.top, left: r.left,
        width: r.w, height: r.h,
        borderTopLeftRadius: r.tl, borderTopRightRadius: r.tr,
        borderBottomLeftRadius: r.bl, borderBottomRightRadius: r.br,
        borderWidth: 1, borderColor: RING,
        transform: [{ rotate: r.rot }],
      }} />
    ))}
    {[
      { t: 60,  l: 40,         s: 11 },
      { t: 88,  l: width - 52, s: 9  },
      { t: 140, l: 60,         s: 8  },
      { t: 115, l: width * 0.62, s: 10 },
      { t: 185, l: 48,         s: 7  },
      { t: 170, l: width - 44, s: 9  },
    ].map((sp, i) => (
      <View key={`sp${i}`} style={{ position: 'absolute', top: sp.t, left: sp.l, width: sp.s, height: sp.s, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ position: 'absolute', width: sp.s, height: sp.s * 0.22, backgroundColor: 'rgba(255,255,255,0.30)', borderRadius: 2 }} />
        <View style={{ position: 'absolute', width: sp.s * 0.22, height: sp.s, backgroundColor: 'rgba(255,255,255,0.30)', borderRadius: 2 }} />
      </View>
    ))}
  </>
);

const WaveCurve = () => (
  <>
    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: HEADER_H * 0.14, backgroundColor: WHITE }} />
    <View style={{ position: 'absolute', bottom: 0, left: -width * 0.08, width: width * 0.80, height: HEADER_H * 0.52, backgroundColor: WHITE, borderTopRightRadius: HEADER_H * 0.45, borderTopLeftRadius: HEADER_H * 0.06 }} />
    <View style={{ position: 'absolute', bottom: 0, right: -width * 0.04, width: width * 0.42, height: HEADER_H * 0.32, backgroundColor: WHITE, borderTopLeftRadius: HEADER_H * 0.24, borderTopRightRadius: HEADER_H * 0.04 }} />
  </>
);

export default function WelcomeScreen({ navigation }) {
  const fade   = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(24)).current;
  const logoFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoFade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(fade,   { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideY, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={GREEN} />

      <View style={s.header}>
        <TopoDecor />
        <Animated.View style={[s.brandBar, { opacity: logoFade }]}>
          <Text style={s.schoolName}>Colegio De Montalban</Text>
          <Image source={require('../images/logo.png')} style={s.logo} resizeMode="contain" />
        </Animated.View>
        <WaveCurve />
      </View>

      <View style={s.body}>
        <Animated.View style={{ opacity: fade, transform: [{ translateY: slideY }] }}>

          <Text style={s.appLabel}>STUDENT NEXUS</Text>
          <Text style={s.title}>Welcome</Text>
          <Text style={s.subtitle}>
            Your complete student hub for events,{'\n'}organizations, and achievements.
          </Text>

          <View style={s.pillsRow}>
            {[
              { icon: 'calendar', label: 'Events' },
              { icon: 'users',    label: 'Organizations' },
              { icon: 'award',    label: 'Portfolio' },
            ].map(p => (
              <View key={p.label} style={s.pill}>
                <Feather name={p.icon} size={12} color={GREEN} />
                <Text style={s.pillTxt}>{p.label}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={s.continueRow}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={s.continueTxt}>Get Started</Text>
            <View style={s.arrowCircle}>
              <Feather name="arrow-right" size={20} color={WHITE} />
            </View>
          </TouchableOpacity>

        </Animated.View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: WHITE },
  header: { height: HEADER_H, backgroundColor: GREEN, overflow: 'hidden' },

  body: {
    flex: 1,
    backgroundColor: WHITE,
    paddingHorizontal: 28,
    paddingVertical: 28,
    justifyContent: 'center',
  },

  brandBar: {
    position: 'absolute', top: 48, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    zIndex: 10,
  },
  schoolName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12, color: 'rgba(255,255,255,0.90)',
    letterSpacing: 0.3, flexShrink: 1, marginRight: 10,
  },
  logo: { width: 42, height: 42, borderRadius: 21 },

  appLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10, color: GREEN, letterSpacing: 2.5, marginBottom: 6,
  },
  title: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 34, color: TEXT, marginBottom: 10, letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14, color: MUTED, lineHeight: 22, marginBottom: 22,
  },

  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 32 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: G_LT,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  pillTxt: { fontFamily: 'Poppins_600SemiBold', fontSize: 11, color: GREEN },

  continueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  continueTxt: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: TEXT, marginRight: 14 },
  arrowCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#024d21', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
});
