import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  Alert, StatusBar, Dimensions, Animated, Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { organizationAPI } from '../services/api';

const { width, height } = Dimensions.get('window');

const HEADER_H = height * 0.26;

const GREEN = '#03632B';
const GREEN_DARK = '#024d21';
const G_LT = '#E8F5EE';
const WHITE = '#FFFFFF';
const TEXT = '#1A1A1A';
const MUTED = '#9CA3AF';
const BORDER = '#E5E7EB';
const INFO_BG = '#EFF6FF';
const INFO_TEXT = '#1D4ED8';
const C = 'rgba(255,255,255,0.18)';

const ORG_POSITIONS = [
  'President',
  'Vice-President',
  'Secretary',
  'Treasurer',
  'Auditor',
  'Public Relations Officer',
];

// ── Decorative header shapes ─────────────────────────────────────────────────
const TopoDecor = () => (
  <>
    {[
      { top: -20, left: -14, w: width * 1.0, h: HEADER_H * 1.10, tl: 80, tr: 60, bl: 70, br: 100, rot: '-6deg' },
      { top: 10, left: 10, w: width * 0.85, h: HEADER_H * 0.90, tl: 60, tr: 90, bl: 80, br: 50, rot: '5deg' },
      { top: 28, left: 28, w: width * 0.70, h: HEADER_H * 0.70, tl: 90, tr: 50, bl: 55, br: 80, rot: '-8deg' },
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
    {[{ t: 20, l: 50, s: 8 }, { t: 38, l: width - 50, s: 7 }].map((sp, i) => (
      <View key={`sp${i}`} style={{ position: 'absolute', top: sp.t, left: sp.l, width: sp.s, height: sp.s, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ position: 'absolute', width: sp.s, height: sp.s * 0.22, backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 2 }} />
        <View style={{ position: 'absolute', width: sp.s * 0.22, height: sp.s, backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 2 }} />
      </View>
    ))}
  </>
);

const WaveCurve = () => (
  <>
    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: HEADER_H * 0.22, backgroundColor: WHITE }} />
    <View style={{ position: 'absolute', bottom: 0, left: -width * 0.08, width: width * 0.78, height: HEADER_H * 0.65, backgroundColor: WHITE, borderTopRightRadius: HEADER_H * 0.75, borderTopLeftRadius: HEADER_H * 0.08 }} />
    <View style={{ position: 'absolute', bottom: 0, right: -width * 0.04, width: width * 0.46, height: HEADER_H * 0.40, backgroundColor: WHITE, borderTopLeftRadius: HEADER_H * 0.40, borderTopRightRadius: HEADER_H * 0.04 }} />
  </>
);

// ── Underline-style input ────────────────────────────────────────────────────
function InputField({ label, icon, secureEntry, ...props }) {
  const [focused, setFocused] = useState(false);
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
          onBlur={() => setFocused(false)}
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

// ── Dropdown field ───────────────────────────────────────────────────────────
function DropdownField({ label, icon, value, placeholder, options, onSelect, displayKey = 'label', valueKey = 'value' }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => (o[valueKey] || o) === value);
  const displayText = selected ? (selected[displayKey] || selected) : null;

  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TouchableOpacity style={s.fieldRow} activeOpacity={0.7} onPress={() => setOpen(p => !p)}>
        <Feather name={icon} size={17} color={open ? GREEN : '#C0C0C0'} style={{ marginRight: 10 }} />
        <View style={s.fieldSep} />
        <Text style={[s.fieldInput, { color: displayText ? TEXT : MUTED, paddingVertical: 10 }]}>
          {displayText || placeholder}
        </Text>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={16} color={MUTED} />
      </TouchableOpacity>
      <View style={[s.fieldLine, { backgroundColor: open ? GREEN : BORDER }]} />

      {open && (
        <View style={s.dropList}>
          {options.map((opt, i) => {
            const val = opt[valueKey] || opt;
            const lbl = opt[displayKey] || opt;
            const sel = val === value;
            return (
              <TouchableOpacity
                key={i}
                style={[s.dropItem, sel && s.dropItemSel]}
                onPress={() => { onSelect(val); setOpen(false); }}
              >
                <Text style={[s.dropItemTxt, sel && { color: GREEN, fontFamily: 'Poppins_700Bold' }]}>{lbl}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────
export default function SignupScreen({ navigation }) {
  const { signUp } = useAuth();

  const [loading, setLoading] = useState(false);
  const [orgs, setOrgs] = useState([]);
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [role, setRole] = useState('student_leader'); // 'student_leader' | 'faculty'

  // Shared fields
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Student-only fields
  const [studentId, setStudentId] = useState('');
  const [program, setProgram] = useState('');
  const [orgId, setOrgId] = useState('');
  const [orgRole, setOrgRole] = useState('');

  useEffect(() => {
    const loadOrgs = async () => {
      setOrgsLoading(true);
      const { data } = await organizationAPI.getAllOrganizations();
      if (data) setOrgs(data);
      setOrgsLoading(false);
    };
    loadOrgs();
  }, []);

  const handleSignup = async () => {
    if (!email || !fullName || !password) {
      Alert.alert('Required', 'Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }
    if (role === 'student_leader' && (!orgId || !orgRole)) {
      Alert.alert('Required', 'Please select your organization and position.');
      return;
    }

    setLoading(true);
    try {
      const meta = {
        full_name: fullName,
        student_id: studentId,
        academic_program: program,
        role,
        organization_id: role === 'student_leader' ? orgId : null,
        position: role === 'student_leader' ? orgRole : null,
      };
      const { error } = await signUp(email, password, meta);
      if (error) {
        Alert.alert('Signup Failed', error.message);
      } else {
        Alert.alert('Success', 'Account created! Waiting for admin approval.');
      }
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

          <Text style={s.pageTitle}>Sign up</Text>
          <View style={s.titleAccent} />

          {/* Role tab selector */}
          <View style={s.tabRow}>
            <TouchableOpacity
              style={[s.tab, role === 'student_leader' && s.tabActive]}
              onPress={() => setRole('student_leader')}
              activeOpacity={0.8}
            >
              <Text style={[s.tabTxt, role === 'student_leader' && s.tabTxtActive]}>Student Leader</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.tab, role === 'faculty' && s.tabActive]}
              onPress={() => setRole('faculty')}
              activeOpacity={0.8}
            >
              <Text style={[s.tabTxt, role === 'faculty' && s.tabTxtActive]}>Faculty</Text>
            </TouchableOpacity>
          </View>

          {/* Shared fields */}
          <InputField label="Email Address" icon="mail" placeholder="you@email.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
          <InputField label="Full Name" icon="user" placeholder="Enter your full name" autoCapitalize="words" value={fullName} onChangeText={setFullName} />

          {/* Student-only fields */}
          {role === 'student_leader' && (
            <>
              <InputField label="Student ID" icon="hash" placeholder="e.g. 12-3456" autoCapitalize="none" value={studentId} onChangeText={setStudentId} />
              <InputField label="Academic Program" icon="book-open" placeholder="e.g. BS Computer Science" autoCapitalize="words" value={program} onChangeText={setProgram} />

              <DropdownField
                label="Organization"
                icon="users"
                placeholder={orgsLoading ? 'Loading...' : 'Select your organization'}
                value={orgId}
                onSelect={setOrgId}
                options={orgs}
                displayKey="name"
                valueKey="id"
              />

              <DropdownField
                label="Your Role / Position in the Organization"
                icon="award"
                placeholder="Select your role"
                value={orgRole}
                onSelect={setOrgRole}
                options={ORG_POSITIONS}
              />
            </>
          )}

          {/* Faculty info box */}
          {role === 'faculty' && (
            <View style={s.infoBox}>
              <Feather name="info" size={16} color={INFO_TEXT} style={{ marginTop: 2 }} />
              <Text style={s.infoTxt}>Faculty accounts can submit requests for equipment, chairs, and other facility needs directly to OSAS.</Text>
            </View>
          )}

          <InputField label="Password" icon="lock" placeholder="Min. 6 characters" secureEntry value={password} onChangeText={setPassword} />
          <InputField label="Confirm Password" icon="lock" placeholder="Re-enter password" secureEntry value={confirmPassword} onChangeText={setConfirmPassword} />

          {/* Create Account button */}
          <TouchableOpacity
            style={[s.createBtn, loading && { opacity: 0.7 }]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Feather name="user-plus" size={18} color={WHITE} style={{ marginRight: 8 }} />
            <Text style={s.createBtnTxt}>{loading ? 'Creating Account...' : 'Create Account'}</Text>
          </TouchableOpacity>

          {/* Login link */}
          <View style={s.footerRow}>
            <Text style={s.footerTxt}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
              <Text style={s.footerLink}>Login</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: WHITE },
  header: { height: HEADER_H, backgroundColor: GREEN, overflow: 'hidden' },

  brandBar: {
    position: 'absolute', top: Platform.OS === 'ios' ? 52 : 36,
    left: 20, right: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    zIndex: 10,
  },
  schoolName: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: WHITE, letterSpacing: 0.3 },
  logo: { width: 40, height: 40, borderRadius: 20 },

  body: { paddingHorizontal: 28, paddingTop: 28, paddingBottom: 48 },

  pageTitle: { fontFamily: 'Poppins_800ExtraBold', fontSize: 34, color: TEXT, marginBottom: 10 },
  titleAccent: { width: 44, height: 4, backgroundColor: GREEN, borderRadius: 2, marginBottom: 28 },

  // Tab selector
  tabRow: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 50, padding: 4, marginBottom: 28 },
  tab: { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 50 },
  tabActive: { backgroundColor: GREEN, shadowColor: GREEN_DARK, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  tabTxt: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: MUTED },
  tabTxtActive: { color: WHITE },

  // Input fields
  fieldWrap: { marginBottom: 18 },
  fieldLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: TEXT, marginBottom: 10 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', paddingBottom: 10 },
  fieldSep: { width: 1, height: 18, backgroundColor: BORDER, marginRight: 12 },
  fieldInput: { flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 15, color: TEXT },
  fieldLine: { height: 1.5, borderRadius: 1, backgroundColor: BORDER },

  // Dropdown
  dropList: { marginTop: 4, backgroundColor: WHITE, borderRadius: 12, borderWidth: 1, borderColor: BORDER, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  dropItem: { paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: BORDER },
  dropItemSel: { backgroundColor: G_LT },
  dropItemTxt: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: TEXT },

  // Faculty info box
  infoBox: { flexDirection: 'row', gap: 10, backgroundColor: INFO_BG, padding: 14, borderRadius: 12, marginBottom: 18 },
  infoTxt: { flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 13, color: INFO_TEXT, lineHeight: 20 },

  // Create Account button
  createBtn: { flexDirection: 'row', backgroundColor: GREEN, borderRadius: 50, paddingVertical: 18, alignItems: 'center', justifyContent: 'center', marginTop: 8, shadowColor: GREEN_DARK, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  createBtnTxt: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: WHITE },

  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  footerTxt: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: MUTED },
  footerLink: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: GREEN },
});
