import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, FlatList,
  RefreshControl, TouchableOpacity,
  TextInput, StatusBar, Animated, ScrollView
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { eventAPI } from '../services/api';
import { supabase } from '../config/supabase';
import { useTheme } from '../context/ThemeContext';

const FILTERS = ['all', 'pending', 'approved', 'completed', 'rejected'];

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function EventCard({ item, onPress, colors, isDark }) {
  const STATUS_CFG = {
    approved:  { color: colors.success,  bg: colors.successLight, label: 'Approved',  icon: 'check-circle' },
    pending:   { color: colors.warning,  bg: colors.warningLight, label: 'Pending',   icon: 'clock'        },
    rejected:  { color: colors.error,    bg: colors.errorLight,   label: 'Rejected',  icon: 'x-circle'     },
    completed: { color: '#6366F1',       bg: isDark ? 'rgba(99,102,241,0.2)' : '#EEF2FF', label: 'Completed', icon: 'award' },
    revision:  { color: colors.warning,  bg: colors.warningLight, label: 'Revision',  icon: 'edit'         },
    cancelled: { color: colors.textMuted, bg: colors.background,  label: 'Cancelled', icon: 'slash'        },
  };
  
  const cfg = STATUS_CFG[item.status] || { color: colors.textMuted, bg: colors.background, label: item.status, icon: 'circle' };
  
  return (
    <TouchableOpacity style={[ec.card, { backgroundColor: colors.surface }]} onPress={onPress} activeOpacity={0.8}>
      <View style={ec.body}>
        <View style={ec.topRow}>
          <Text style={[ec.title, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
          <View style={[ec.badge, { backgroundColor: cfg.bg }]}>
            <Feather name={cfg.icon} size={10} color={cfg.color} />
            <Text style={[ec.badgeTxt, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        {item.description ? (
          <Text style={[ec.desc, { color: colors.textMuted }]} numberOfLines={1}>{item.description}</Text>
        ) : null}

        <View style={ec.footer}>
          <View style={ec.metaRow}>
            <Feather name="calendar" size={11} color={colors.brand} />
            <Text style={[ec.meta, { color: colors.brand }]}>{formatDate(item.event_date)}</Text>
          </View>
          {item.venue ? (
            <View style={ec.metaRow}>
              <Feather name="map-pin" size={11} color={colors.textMuted} />
              <Text style={[ec.meta, { color: colors.textMuted }]} numberOfLines={1}>{item.venue}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Feather name="chevron-right" size={16} color={colors.textMuted} style={{ alignSelf: 'center' }} />
    </TouchableOpacity>
  );
}

const ec = StyleSheet.create({
  card:     { flexDirection: 'row', borderRadius: 18, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3, overflow: 'hidden', padding: 14 },
  body:     { flex: 1, padding: 14, paddingLeft: 12 },
  topRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  title:    { fontFamily: 'Poppins_700Bold', flex: 1, fontSize: 14, marginRight: 8 },
  badge:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, gap: 4 },
  badgeTxt: { fontFamily: 'Poppins_700Bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.3 },
  desc:     { fontFamily: 'Poppins_400Regular', fontSize: 12, marginBottom: 6 },
  metaRow:  { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  meta:     { fontFamily: 'Poppins_500Medium', fontSize: 12, marginLeft: 5 },
  footer:   { marginTop: 2, gap: 2 },
});

export default function EventsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const s = getStyles(colors, isDark);
  
  const { userProfile, user } = useAuth();
  const [events,     setEvents]     = useState([]);
  const [filter,     setFilter]     = useState('all');
  const [search,     setSearch]     = useState('');
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [filter, user?.id])
  );

  useEffect(() => {
    const channel = supabase.channel('mobile_event_proposals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_proposals' }, () => {
        console.log('Realtime event_proposals update in mobile');
        loadEvents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadEvents = async () => {
    try {
      let result;
      
      const uid = userProfile?.id || userProfile?.user_id || user?.id;
      if (!uid) { setLoading(false); return; }
      if (filter === 'all') {
        result = await eventAPI.getEventsByUser(uid);
      } else {
        result = await eventAPI.getEventsByStatus(filter);
      }
      setEvents(result.data || []);
    } catch (e) { console.error('Events error:', e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = () => { setRefreshing(true); loadEvents(); };

  const filtered = events.filter(ev =>
    !search.trim() ||
    ev.title?.toLowerCase().includes(search.toLowerCase()) ||
    ev.venue?.toLowerCase().includes(search.toLowerCase()) ||
    ev.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brand} />

      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Events</Text>
          <Text style={s.headerSub}>{filtered.length} event{filtered.length !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      <View style={s.searchWrap}>
        <Feather name="search" size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={s.searchInput}
          placeholder="Search title, venue, description..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Feather name="x" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={s.filtersRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[s.chip, filter === f && s.chipActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.8}
            >
              <Text style={[s.chipTxt, filter === f && s.chipTxtActive]}>
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        renderItem={({ item }) => (
          <EventCard
            item={item}
            colors={colors}
            isDark={isDark}
            onPress={() => navigation.navigate('EventDetails', { eventId: item.proposal_id })}
          />
        )}
        keyExtractor={item => item.proposal_id?.toString()}
        contentContainerStyle={s.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={s.emptyIconBox}>
              <Feather name="calendar" size={36} color={colors.brand} />
            </View>
            <Text style={s.emptyTitle}>No events found</Text>
            <Text style={s.emptyMsg}>
              {search ? 'Try different search keywords' : 'Your events will appear here'}
            </Text>
          </View>
        }
      />
      <TouchableOpacity style={s.fab} activeOpacity={0.9} onPress={() => navigation.navigate('CreateEvent')}>
        <Feather name="plus" size={24} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (colors, isDark) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.brand, paddingTop: 54, paddingBottom: 20, paddingHorizontal: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, zIndex: 10 },
  headerTitle: { fontFamily: 'Poppins_800ExtraBold', fontSize: 26, color: '#FFF' },
  headerSub:   { fontFamily: 'Poppins_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  fab:         { position: 'absolute', bottom: 100, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', shadowColor: colors.brandDark, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8, zIndex: 99 },

  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, marginHorizontal: 16, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, marginVertical: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3 },
  searchInput: { flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 14, color: colors.text },

  filtersRow: { paddingHorizontal: 16, paddingBottom: 12 },
  chip:       { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginRight: 8 },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipTxt:    { fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: colors.textMuted },
  chipTxtActive: { color: '#FFF' },

  listContent: { paddingHorizontal: 16, paddingBottom: 40 },

  empty:       { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyIconBox:{ width: 76, height: 76, borderRadius: 24, backgroundColor: colors.brandLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle:  { fontFamily: 'Poppins_700Bold', fontSize: 16, color: colors.text, marginBottom: 6 },
  emptyMsg:    { fontFamily: 'Poppins_400Regular', fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
