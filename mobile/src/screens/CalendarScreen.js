import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, StatusBar, Animated, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { eventAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const STATUS_CFG = {
  approved:  { color: '#22C55E', bg: '#DCFCE7',           label: 'Approved'  },
  pending:   { color: '#F59E0B', bg: '#FEF3C7',           label: 'Pending'   },
  completed: { color: '#6366F1', bg: '#EEF2FF',           label: 'Completed' },
  rejected:  { color: '#EF4444', bg: '#FEE2E2',           label: 'Rejected'  },
};

function getStatusCfg(status, colors, isDark) {
  const map = {
    approved:  { color: colors.success,  bg: isDark ? 'rgba(34,197,94,0.2)'   : '#DCFCE7', label: 'Approved'  },
    pending:   { color: colors.warning,  bg: isDark ? 'rgba(245,158,11,0.2)'  : '#FEF3C7', label: 'Pending'   },
    completed: { color: '#6366F1',       bg: isDark ? 'rgba(99,102,241,0.2)'  : '#EEF2FF', label: 'Completed' },
    rejected:  { color: colors.error,    bg: isDark ? 'rgba(239,68,68,0.2)'   : '#FEE2E2', label: 'Rejected'  },
  };
  return map[status] || { color: colors.textMuted, bg: colors.border, label: status };
}

const DOT_COLORS = { approved: '#22C55E', pending: '#F59E0B', completed: '#6366F1', rejected: '#EF4444' };

function isSameDay(dateStr, year, month, day) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const d = new Date(); d.setHours(Number(h), Number(m));
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// ─── Event Card ───────────────────────────────────────────────────────────────
function EventCard({ event, onPress, colors, isDark }) {
  const cfg  = getStatusCfg(event.status, colors, isDark);
  const org  = event.organization?.acronym || event.organization?.name || '';
  const time = event.event_time_start ? formatTime(event.event_time_start) : '';
  return (
    <TouchableOpacity
      style={[ec.card, { backgroundColor: colors.surface, shadowColor: '#000', borderLeftColor: cfg.color }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={ec.body}>
        <View style={ec.titleRow}>
          <Text style={[ec.title, { color: colors.text }]} numberOfLines={1}>{event.title}</Text>
          <View style={[ec.badge, { backgroundColor: cfg.bg }]}>
            <Text style={[ec.badgeTxt, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>
        <View style={ec.metaRow}>
          {!!time && (
            <View style={ec.meta}>
              <Feather name="clock" size={11} color={colors.textMuted} />
              <Text style={[ec.metaTxt, { color: colors.textMuted }]}>{time}</Text>
            </View>
          )}
          {!!event.venue && (
            <View style={ec.meta}>
              <Feather name="map-pin" size={11} color={colors.textMuted} />
              <Text style={[ec.metaTxt, { color: colors.textMuted }]} numberOfLines={1}>{event.venue}</Text>
            </View>
          )}
          {!!org && (
            <View style={ec.meta}>
              <Feather name="users" size={11} color={colors.textMuted} />
              <Text style={[ec.metaTxt, { color: colors.textMuted }]}>{org}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
const ec = StyleSheet.create({
  card:     { borderRadius: 14, marginBottom: 10, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, borderLeftWidth: 4 },
  body:     { padding: 14 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 8 },
  title:    { flex: 1, fontFamily: 'Poppins_700Bold', fontSize: 13 },
  badge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeTxt: { fontFamily: 'Poppins_700Bold', fontSize: 10 },
  metaRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  meta:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTxt:  { fontFamily: 'Poppins_400Regular', fontSize: 11 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CalendarScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const s = getStyles(colors, isDark);

  const now = new Date();
  const [year, setYear]           = useState(now.getFullYear());
  const [month, setMonth]         = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(now.getDate());
  const [events, setEvents]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [])
  );

  const loadEvents = async () => {
    try {
      const { data } = await eventAPI.getCalendarEvents();
      setEvents(data || []);
    } catch (e) {
      console.error('Calendar load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    }
  };

  const onRefresh = () => { setRefreshing(true); loadEvents(); };

  // ── Calendar grid helpers ──────────────────────────────────────────────────
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Build map: day -> [events] for this month/year
  const eventMap = {};
  events.forEach(ev => {
    const d = new Date(ev.event_date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!eventMap[day]) eventMap[day] = [];
      eventMap[day].push(ev);
    }
  });

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else { setMonth(m => m - 1); }
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else { setMonth(m => m + 1); }
    setSelectedDay(null);
  };

  // Events for the selected day
  const selectedEvents = selectedDay
    ? (eventMap[selectedDay] || []).sort((a, b) => (a.event_time_start || '') > (b.event_time_start || '') ? 1 : -1)
    : [];

  // All events for the current month in order (shown below calendar when no day selected)
  const monthEvents = Object.entries(eventMap)
    .sort(([a], [b]) => Number(a) - Number(b))
    .flatMap(([, evs]) => evs);

  const displayEvents = selectedDay !== null ? selectedEvents : monthEvents;

  // Build calendar grid cells
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday = (d) => {
    const t = new Date();
    return d === t.getDate() && month === t.getMonth() && year === t.getFullYear();
  };

  // Count summary for month
  const approvedCount  = events.filter(e => { const d = new Date(e.event_date); return d.getFullYear() === year && d.getMonth() === month && e.status === 'approved'; }).length;
  const pendingCount   = events.filter(e => { const d = new Date(e.event_date); return d.getFullYear() === year && d.getMonth() === month && e.status === 'pending'; }).length;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brand} />

      <View style={s.header}>
        <View style={s.headerTop}>
          <Text style={s.headerTitle}>Event Calendar</Text>
          <TouchableOpacity onPress={onRefresh} style={s.refreshBtn} activeOpacity={0.7}>
            <Feather name="refresh-cw" size={17} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
        </View>

        {/* Month summary chips */}
        <View style={s.summaryRow}>
          <View style={s.summaryChip}>
            <View style={[s.summaryDot, { backgroundColor: '#22C55E' }]} />
            <Text style={s.summaryTxt}>{approvedCount} Approved</Text>
          </View>
          <View style={s.summaryChip}>
            <View style={[s.summaryDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={s.summaryTxt}>{pendingCount} Pending</Text>
          </View>
        </View>
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
        >
          {/* ── Calendar Card ── */}
          <View style={[s.calendarCard, { backgroundColor: colors.surface }]}>
            {/* Month navigation */}
            <View style={s.navRow}>
              <TouchableOpacity onPress={prevMonth} style={s.navBtn} activeOpacity={0.7}>
                <Feather name="chevron-left" size={22} color={colors.text} />
              </TouchableOpacity>
              <Text style={[s.monthLabel, { color: colors.text }]}>{MONTHS[month]} {year}</Text>
              <TouchableOpacity onPress={nextMonth} style={s.navBtn} activeOpacity={0.7}>
                <Feather name="chevron-right" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Day headers */}
            <View style={s.dayHeaderRow}>
              {DAYS.map(d => (
                <Text key={d} style={[s.dayHeader, { color: colors.textMuted }]}>{d}</Text>
              ))}
            </View>

            {/* Grid */}
            <View style={s.grid}>
              {cells.map((day, i) => {
                if (day === null) return <View key={`empty-${i}`} style={s.cell} />;
                const dayEvents  = eventMap[day] || [];
                const isSelected = selectedDay === day;
                const today      = isToday(day);
                const hasDots    = dayEvents.length > 0;
                // Unique status colors for dots (max 3)
                const dotStatuses = [...new Set(dayEvents.map(e => e.status))].slice(0, 3);

                return (
                  <TouchableOpacity
                    key={day}
                    style={[
                      s.cell,
                      isSelected && [s.cellSelected, { backgroundColor: colors.brand }],
                      today && !isSelected && [s.cellToday, { borderColor: colors.brand }],
                    ]}
                    onPress={() => setSelectedDay(isSelected ? null : day)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      s.dayNum,
                      { color: isSelected ? '#FFF' : today ? colors.brand : colors.text },
                      isSelected && { fontFamily: 'Poppins_700Bold' },
                    ]}>
                      {day}
                    </Text>
                    {hasDots && (
                      <View style={s.dotsRow}>
                        {dotStatuses.map((st, di) => (
                          <View key={di} style={[s.dot, { backgroundColor: DOT_COLORS[st] || colors.textMuted }]} />
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Events List ── */}
          <View style={s.listSection}>
            <View style={s.listHeader}>
              <Text style={[s.listTitle, { color: colors.text }]}>
                {selectedDay !== null
                  ? `Events on ${MONTHS[month]} ${selectedDay}`
                  : `All Events in ${MONTHS[month]}`}
              </Text>
              {selectedDay !== null && (
                <TouchableOpacity onPress={() => setSelectedDay(null)} style={s.clearBtn}>
                  <Text style={[s.clearTxt, { color: colors.brand }]}>Show All</Text>
                </TouchableOpacity>
              )}
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={colors.brand} style={{ marginTop: 40 }} />
            ) : displayEvents.length === 0 ? (
              <View style={s.empty}>
                <Feather name="calendar" size={40} color={colors.textMuted} style={{ marginBottom: 12 }} />
                <Text style={[s.emptyTitle, { color: colors.text }]}>
                  {selectedDay !== null ? 'No events on this day' : 'No events this month'}
                </Text>
                <Text style={[s.emptyTxt, { color: colors.textMuted }]}>
                  {selectedDay !== null ? 'Select another date or tap Show All.' : 'All approved and upcoming events will appear here.'}
                </Text>
              </View>
            ) : (
              displayEvents.map((ev, i) => (
                <EventCard
                  key={ev.id || i}
                  event={ev}
                  colors={colors}
                  isDark={isDark}
                  onPress={() => navigation.navigate('EventDetails', { eventId: ev.id })}
                />
              ))
            )}

            {/* Legend */}
            <View style={s.legendRow}>
              {Object.entries(DOT_COLORS).map(([status, color]) => (
                <View key={status} style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: color }]} />
                  <Text style={[s.legendTxt, { color: colors.textMuted }]}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const getStyles = (colors, isDark) => StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.brand, paddingTop: 58, paddingBottom: 18, paddingHorizontal: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 6, zIndex: 10 },
  headerTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  headerTitle:  { fontFamily: 'Poppins_800ExtraBold', fontSize: 26, color: '#FFF' },
  refreshBtn:   { padding: 6 },
  summaryRow:   { flexDirection: 'row', gap: 10 },
  summaryChip:  { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  summaryDot:   { width: 8, height: 8, borderRadius: 4 },
  summaryTxt:   { fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: '#FFF' },

  calendarCard: { margin: 16, borderRadius: 20, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 4 },
  navRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  navBtn:        { padding: 6 },
  monthLabel:    { fontFamily: 'Poppins_700Bold', fontSize: 18 },

  dayHeaderRow:  { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  dayHeader:     { fontFamily: 'Poppins_600SemiBold', fontSize: 11, width: 38, textAlign: 'center' },

  grid:          { flexDirection: 'row', flexWrap: 'wrap' },
  cell:          { width: '14.28%', alignItems: 'center', paddingVertical: 5, borderRadius: 10, marginBottom: 4 },
  cellSelected:  { borderRadius: 24 },
  cellToday:     { borderWidth: 1.5, borderRadius: 24 },
  dayNum:        { fontFamily: 'Poppins_500Medium', fontSize: 14, lineHeight: 20 },
  dotsRow:       { flexDirection: 'row', justifyContent: 'center', gap: 2, marginTop: 2 },
  dot:           { width: 5, height: 5, borderRadius: 3 },

  listSection:   { paddingHorizontal: 16, paddingBottom: 40 },
  listHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  listTitle:     { fontFamily: 'Poppins_700Bold', fontSize: 16 },
  clearBtn:      { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  clearTxt:      { fontFamily: 'Poppins_600SemiBold', fontSize: 13 },

  empty:         { alignItems: 'center', paddingVertical: 40 },
  emptyTitle:    { fontFamily: 'Poppins_700Bold', fontSize: 16, marginBottom: 6 },
  emptyTxt:      { fontFamily: 'Poppins_400Regular', fontSize: 13, textAlign: 'center', lineHeight: 20 },

  legendRow:     { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
  legendItem:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:     { width: 8, height: 8, borderRadius: 4 },
  legendTxt:     { fontFamily: 'Poppins_500Medium', fontSize: 11 },
});
