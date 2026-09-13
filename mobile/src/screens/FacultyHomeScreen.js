import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, RefreshControl, ActivityIndicator, Alert, Dimensions
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { facultyAPI } from '../services/api';
import { supabase } from '../config/supabase';
import { useTheme } from '../context/ThemeContext';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const { width } = Dimensions.get('window');

function RequestCard({ item, onPress, colors, isDark }) {
  const STATUS = {
    pending:  { label: 'Pending',  color: colors.warning, bg: colors.warningLight,  icon: 'clock'        },
    approved: { label: 'Approved', color: colors.success, bg: colors.successLight, icon: 'check-circle' },
    rejected: { label: 'Rejected', color: colors.error,   bg: colors.errorLight,  icon: 'x-circle'     },
  };
  const st = STATUS[item.status] || STATUS.pending;
  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface, shadowColor: '#000' }]} onPress={() => onPress(item)} activeOpacity={0.82}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
          <Text style={[styles.cardDate, { color: colors.textMuted }]}>
            {item.created_at ? fmtDate(item.created_at) : '—'}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: st.bg }]}>
          <Feather name={st.icon} size={11} color={st.color} />
          <Text style={[styles.badgeTxt, { color: st.color }]}>{st.label}</Text>
        </View>
      </View>
      {!!item.description && (
        <Text style={[styles.cardDesc, { color: colors.textMuted }]} numberOfLines={2}>{item.description}</Text>
      )}
      <View style={styles.cardBottom}>
        <Feather name="file-text" size={13} color={item.document_url ? colors.brand : colors.textMuted} />
        <Text style={[styles.cardAttTxt, { color: item.document_url ? colors.textMuted : colors.textMuted }]}>
          {item.document_url ? 'Supporting document attached' : 'No document attached'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function StatPill({ icon, value, label, color, bg }) {
  return (
    <View style={[styles.statPill, { backgroundColor: bg }]}>
      <Feather name={icon} size={18} color={color} />
      <Text style={[styles.statVal, { color }]}>{value}</Text>
      <Text style={[styles.statLbl, { color }]}>{label}</Text>
    </View>
  );
}

export default function FacultyHomeScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  
  const { user, userProfile, signOut } = useAuth();
  const [requests,   setRequests]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const displayName = userProfile?.full_name || user?.email?.split('@')[0] || 'Faculty';
  const initial = displayName.charAt(0).toUpperCase();

  const loadRequests = useCallback(async () => {
    const uid = userProfile?.id || userProfile?.user_id || user?.id;
    if (!uid) return;
    const { data } = await facultyAPI.getRequests(uid);
    setRequests(data || []);
    setLoading(false);
  }, [user, userProfile]);

  useEffect(() => {
    loadRequests();
    
    const channel = supabase
      .channel('faculty-home-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'faculty_requests' },
        () => {
          console.log('Real-time update received for faculty_requests on Mobile');
          loadRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadRequests]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        await signOut();
      }},
    ]);
  };

  const pending  = requests.filter(r => r.status === 'pending').length;
  const approved = requests.filter(r => r.status === 'approved').length;
  const rejected = requests.filter(r => r.status === 'rejected').length;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brand} />

      <View style={[styles.header, { backgroundColor: colors.brand }]}>
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />

        <View style={styles.headerInner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Good day,</Text>
            <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
            <View style={styles.facultyBadge}>
              <Feather name="shield" size={10} color="#FFF" />
              <Text style={styles.facultyBadgeTxt}>FACULTY</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.avatar} onPress={handleSignOut}>
            <Text style={styles.avatarTxt}>{initial}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <StatPill icon="clock"        value={pending}           label="Pending"  color={colors.warning} bg={isDark ? 'rgba(245,158,11,0.1)' : "rgba(245,158,11,0.18)"} />
          <View style={styles.statDivider} />
          <StatPill icon="check-circle" value={approved}          label="Approved" color={colors.success}  bg={isDark ? 'rgba(16,185,129,0.1)' : "rgba(16,185,129,0.16)"} />
          <View style={styles.statDivider} />
          <StatPill icon="inbox"        value={requests.length}   label="Total"    color="#FFF" bg="rgba(255,255,255,0.16)" />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 18, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>My Requests</Text>
          {requests.length > 0 && (
            <View style={{ backgroundColor: colors.brandLight, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 }}>
              <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 11, color: colors.brand }}>{requests.length}</Text>
            </View>
          )}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.brand} style={{ marginTop: 48 }} />
        ) : requests.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.surface }]}>
              <Feather name="inbox" size={36} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Requests Yet</Text>
            <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>Tap the button below to submit your first facility request.</Text>
          </View>
        ) : (
          requests.map(item => (
            <RequestCard
              key={item.id}
              item={item}
              colors={colors}
              isDark={isDark}
              onPress={() => navigation.navigate('FacultyRequestDetails', { request: item })}
            />
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.brand, shadowColor: colors.brandDark }]}
        onPress={() => navigation.navigate('CreateFacultyRequest')}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={26} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    paddingTop: 56,
    paddingBottom: 28,
    paddingHorizontal: 22,
    overflow: 'hidden',
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
  },
  decorCircle1: {
    position: 'absolute', width: 240, height: 240, borderRadius: 120,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    top: -80, right: -60,
  },
  decorCircle2: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    bottom: 10, left: -30,
  },
  headerInner: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },

  greeting: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  name:     { fontFamily: 'Poppins_800ExtraBold', fontSize: 22, color: '#FFF', marginBottom: 6 },
  facultyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start',
  },
  facultyBadgeTxt: { fontFamily: 'Poppins_700Bold', fontSize: 10, color: '#FFF', letterSpacing: 0.6 },

  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
  },
  avatarTxt: { fontFamily: 'Poppins_800ExtraBold', fontSize: 22, color: '#FFF' },

  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  statPill: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14, gap: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.14)', marginHorizontal: 4 },
  statVal: { fontFamily: 'Poppins_800ExtraBold', fontSize: 20 },
  statLbl: { fontFamily: 'Poppins_400Regular', fontSize: 10 },

  sectionTitle: { fontFamily: 'Poppins_700Bold', fontSize: 17 },

  card: {
    borderRadius: 16, padding: 18, marginBottom: 12,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardTop:    { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle:  { fontFamily: 'Poppins_700Bold', fontSize: 14, lineHeight: 20 },
  cardDate:   { fontFamily: 'Poppins_400Regular', fontSize: 11, marginTop: 2 },
  cardDesc:   { fontFamily: 'Poppins_400Regular', fontSize: 12, lineHeight: 18, marginBottom: 10 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardAttTxt: { fontFamily: 'Poppins_400Regular', fontSize: 11 },

  badge:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 16 },
  badgeTxt: { fontFamily: 'Poppins_700Bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4 },

  empty:     { alignItems: 'center', paddingTop: 48, paddingHorizontal: 24 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle:{ fontFamily: 'Poppins_700Bold', fontSize: 18, marginBottom: 8 },
  emptyDesc: { fontFamily: 'Poppins_400Regular', fontSize: 13, textAlign: 'center', lineHeight: 20 },

  fab: {
    position: 'absolute', bottom: 30, right: 22,
    width: 58, height: 58, borderRadius: 29,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 10,
  },
});
