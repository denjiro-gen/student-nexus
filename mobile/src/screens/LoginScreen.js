import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Alert, TouchableOpacity,
  StatusBar, Dimensions, Animated, Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../config/supabase';

const { width, height } = Dimensions.get('window');

// Short decorative header — leaves maximum white space for the form
const HEADER_H = height * 0.28;

const GREEN      = '#03632B';
const GREEN_DARK = '#024d21';
const WHITE      = '#FFFFFF';
const TEXT       = '#1A1A1A';
const MUTED      = '#9CA3AF';
const BORDER     = '#E5E7EB';
const C          = 'rgba(255,255,255,0.18)';

// ── Decorative rings inside header ──────────────────────────────────────────
const TopoDecor = () => (
  <>
    {[
      { top: -20, left: -14, w: width * 1.0, h: HEADER_H * 1.10, tl: 80, tr: 60, bl: 70, br: 100, rot: '-6deg' },
      { top: 10,  left: 10,  w: width * 0.85, h: HEADER_H * 0.90, tl: 60, tr: 90, bl: 80, br: 50,  rot: '5deg'  },
      { top: 28,  left: 28,  w: width * 0.70, h: HEADER_H * 0.70, tl: 90, tr: 50, bl: 55, br: 80,  rot: '-8deg' },
    ].map((r, i) => (
      <View key={i} style={{
        position: 'absolute', top: r.top, left: r.left,
        width: r.w, height: r.h,
        borderTopLeftRadius: r.tl, borderTopRightRadius: r.tr,
        borderBottomLeftRadius: r.bl, borderBottomRightRadius: r.br,
        borderWidth: 1, borderColor: C,
        transform: [{ rotate: r.rot }],
      }} />
    ))}
    {/* sparkle dots */}
    {[{ t: 20, l: 50, s: 8 }, { t: 38, l: width - 50, s: 7 }, { t: 55, l: 80, s: 6 }].map((sp, i) => (
      <View key={`sp${i}`} style={{ position: 'absolute', top: sp.t, left: sp.l, width: sp.s, height: sp.s, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ position: 'absolute', width: sp.s, height: sp.s * 0.22, backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 2 }} />
        <View style={{ position: 'absolute', width: sp.s * 0.22, height: sp.s, backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 2 }} />
      </View>
    ))}
  </>
);

// ── Organic wave at bottom of header ────────────────────────────────────────
const WaveCurve = () => (
  <>
    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: HEADER_H * 0.22, backgroundColor: WHITE }} />
    <View style={{ position: 'absolute', bottom: 0, left: -width * 0.08, width: width * 0.78, height: HEADER_H * 0.65, backgroundColor: WHITE, borderTopRightRadius: HEADER_H * 0.75, borderTopLeftRadius: HEADER_H * 0.08 }} />
    <View style={{ position: 'absolute', bottom: 0, right: -width * 0.04, width: width * 0.46, height: HEADER_H * 0.40, backgroundColor: WHITE, borderTopLeftRadius: HEADER_H * 0.40, borderTopRightRadius: HEADER_H * 0.04 }} />
  </>
);

// ── Input field with underline only ─────────────────────────────────────────
function InputField({ label, icon, secureEntry, ...props }) {
  const [focused,  setFocused]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: focused ? 1 : 0, duration: 200, useNativeDriver: false }).start();
  }, [focused]);

  const lineColor = anim.interpolate({ inputRange: [0, 1], outputRange: [BORDER, GREEN] });

  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={s.fieldRow}>
        <Feather name={icon} size={17} color={focused ? GREEN : '#C0C0C0'} style={{ marginRight: 10 }} />
        <View style={s.fieldSep} />
        <TextInput
          style={s.fieldInput}
          placeholderTextColor={MUTED}
          onFocus={() => setFocused(true)}
          onBlur={()  => setFocused(false)}
          secureTextEntry={secureEntry && !showPass}
          {...props}
        />
        {secureEntry && (
          <TouchableOpacity onPress={() => setShowPass(p => !p)} style={{ padding: 4 }}>
            <Feather name={showPass ? 'eye' : 'eye-off'} size={18} color={MUTED} />
          </TouchableOpacity>
        )}
      </View>
      <Animated.View style={[s.fieldLine, { backgroundColor: lineColor }]} />
    </View>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────
export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();

  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [rememberMe,  setRememberMe]  = useState(false);
  const [loading,     setLoading]     = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Required', 'Please enter your email and password.');
      return;
    }
    if (!isSupabaseConfigured()) {
      Alert.alert('Configuration Error', 'Supabase is not configured.');
      return;
    }
    setLoading(true);
    try {
      const result = await signIn(email, password);
      if (!result.success) {
        // result.error is already a plain string from AuthContext
        const msg = result.error || 'Login failed. Please check your credentials.';
        Alert.alert('Login Failed', msg);
      }
      // On success, AuthContext onAuthStateChange handles navigation automatically
    } catch (e) {
      Alert.alert('Error', e.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={GREEN} />

      {/* ── Header ── */}
      <View style={s.header}>
        <TopoDecor />
        <View style={s.brandBar}>
          <Text style={s.schoolName}>Colegio De Montalban</Text>
          <Image source={require('../images/logo.png')} style={s.logo} resizeMode="contain" />
        </View>
        <WaveCurve />
      </View>

      {/* ── Form ── */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Page title */}
          <Text style={s.pageTitle}>Sign in</Text>
          <View style={s.titleAccent} />

          <InputField
            label="Email"
            icon="mail"
            placeholder="demo@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <InputField
            label="Password"
            icon="lock"
            placeholder="enter your password"
            secureEntry
            value={password}
            onChangeText={setPassword}
          />

          {/* Remember me + Forgot password */}
          <View style={s.optionsRow}>
            <TouchableOpacity style={s.rememberRow} onPress={() => setRememberMe(p => !p)} activeOpacity={0.7}>
              <View style={[s.checkbox, rememberMe && s.checkboxChecked]}>
                {rememberMe && <Feather name="check" size={11} color={WHITE} />}
              </View>
              <Text style={s.rememberTxt}>Remember Me</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={s.forgotTxt}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Login button */}
          <TouchableOpacity
            style={[s.loginBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={s.loginBtnTxt}>{loading ? 'Signing In...' : 'Login'}</Text>
          </TouchableOpacity>

          {/* Sign up link */}
          <View style={s.footerRow}>
            <Text style={s.footerTxt}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')} activeOpacity={0.7}>
              <Text style={s.footerLink}>Sign up</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: WHITE },
  header: { height: HEADER_H, backgroundColor: GREEN, overflow: 'hidden' },

  brandBar: {
    position: 'absolute', top: Platform.OS === 'ios' ? 52 : 36,
    left: 20, right: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    zIndex: 10,
  },
  schoolName: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: WHITE, letterSpacing: 0.3 },
  logo:       { width: 40, height: 40, borderRadius: 20 },

  body: { paddingHorizontal: 28, paddingTop: 32, paddingBottom: 48 },

  pageTitle: { fontFamily: 'Poppins_800ExtraBold', fontSize: 34, color: TEXT, marginBottom: 10 },
  titleAccent: { width: 44, height: 4, backgroundColor: GREEN, borderRadius: 2, marginBottom: 32 },

  // Input fields
  fieldWrap:  { marginBottom: 20 },
  fieldLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: TEXT, marginBottom: 10 },
  fieldRow:   { flexDirection: 'row', alignItems: 'center', paddingBottom: 10 },
  fieldSep:   { width: 1, height: 18, backgroundColor: BORDER, marginRight: 12 },
  fieldInput: { flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 15, color: TEXT },
  fieldLine:  { height: 1.5, borderRadius: 1, backgroundColor: BORDER },

  // Options row
  optionsRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, marginTop: 8 },
  rememberRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox:     { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: GREEN, borderColor: GREEN },
  rememberTxt:  { fontFamily: 'Poppins_400Regular', fontSize: 13, color: TEXT },
  forgotTxt:    { fontFamily: 'Poppins_700Bold', fontSize: 13, color: GREEN },

  // Login button
  loginBtn:    { backgroundColor: GREEN, borderRadius: 50, paddingVertical: 18, alignItems: 'center', shadowColor: GREEN_DARK, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  loginBtnTxt: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: WHITE },

  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 28 },
  footerTxt:  { fontFamily: 'Poppins_400Regular', fontSize: 13, color: MUTED },
  footerLink: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: GREEN },
});
