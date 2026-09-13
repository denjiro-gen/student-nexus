import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  RefreshControl, TouchableOpacity,
  Dimensions, Animated, StatusBar, Platform, Image
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, eventAPI, notificationAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

function QuickActionBtn({ label, icon, color, bg, onPress, isDark }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.timing(scale, { toValue: 0.95, duration: 100, useNativeDriver: true }).start();
  const pressOut = () => Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }).start();
  
  return (
    <Animated.View style={{ flex: 1, transform: [{ scale }] }}>
      <TouchableOpacity 
        style={[qa.btn, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF' }]} 
        onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} activeOpacity={1}
      >
        <View style={[qa.iconBox, { backgroundColor: bg }]}>
          <Feather name={icon} size={22} color={color} />
        </View>
        <Text style={[qa.label, { color: isDark ? '#F3F4F6' : '#1F2937' }]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const qa = StyleSheet.create({
  btn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  iconBox: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  label: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, textAlign: 'center' }
});

function EventRow({ event, onPress, colors, isDark }) {
  const d  = new Date(event.event_date);
  const dd = d.getDate();
  const mo = d.toLocaleString('default', { month: 'short' });
  const statusColor = event.status === 'approved' ? colors.success : (event.status === 'pending' ? colors.warning : colors.error);
  
  return (
    <TouchableOpacity style={[er.card, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF' }]} onPress={onPress} activeOpacity={0.7}>
      <View style={[er.dateBox, { backgroundColor: isDark ? 'rgba(3, 99, 43, 0.2)' : '#F0FDF4' }]}>
        <Text style={[er.dd, { color: colors.brand }]}>{dd}</Text>
        <Text style={[er.mo, { color: colors.brand }]}>{mo.toUpperCase()}</Text>
      </View>
      <View style={er.info}>
        <Text style={[er.title, { color: colors.text }]} numberOfLines={1}>{event.title}</Text>
        <View style={er.row}>
          <Feather name="clock" size={12} color={colors.textMuted} />
          <Text style={[er.meta, { color: colors.textMuted }]}>{event.event_time || 'TBA'}</Text>
          {event.venue && (
            <>
              <View style={er.dot} />
              <Feather name="map-pin" size={12} color={colors.textMuted} />
              <Text style={[er.meta, { color: colors.textMuted }]} numberOfLines={1}>{event.venue}</Text>
            </>
          )}
        </View>
      </View>
      <View style={[er.statusBadge, { backgroundColor: statusColor + '20' }]}>
        <Text style={[er.statusTxt, { color: statusColor }]}>{event.status?.toUpperCase()}</Text>
      </View>
    </TouchableOpacity>
  );
}

const er = StyleSheet.create({
  card:    { flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  dateBox: { width: 55, height: 60, alignItems: 'center', justifyContent: 'center', borderRadius: 14, marginRight: 14 },
  dd:      { fontFamily: 'Poppins_800ExtraBold', fontSize: 18, lineHeight: 22 },
  mo:      { fontFamily: 'Poppins_700Bold', fontSize: 10, letterSpacing: 0.5 },
  info:    { flex: 1, marginRight: 10 },
  title:   { fontFamily: 'Poppins_700Bold', fontSize: 15, marginBottom: 6 },
  row:     { flexDirection: 'row', alignItems: 'center' },
  meta:    { fontFamily: 'Poppins_500Medium', fontSize: 11, marginLeft: 4, marginRight: 6 },
  dot:     { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#9CA3AF', marginHorizontal: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusTxt: { fontFamily: 'Poppins_700Bold', fontSize: 9, letterSpacing: 0.5 },
});

function AnnouncementCard({ item, isDark }) {
  const d = new Date(item.created_at);
  const time = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return (
    <View style={[an.card, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF', borderColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE' }]}>
      <View style={an.header}>
        <View style={an.badge}>
          <Feather name="info" size={12} color="#FFF" />
          <Text style={an.badgeTxt}>OSAS ANNOUNCEMENT</Text>
        </View>
        <Text style={[an.time, { color: isDark ? '#60A5FA' : '#3B82F6' }]}>{time}</Text>
      </View>
      <Text style={[an.title, { color: isDark ? '#93C5FD' : '#1D4ED8' }]}>{item.title}</Text>
      <Text style={[an.body, { color: isDark ? '#DBEAFE' : '#1E3A8A' }]} numberOfLines={3}>{item.content}</Text>
    </View>
  );
}

const an = StyleSheet.create({
  card: { borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#3B82F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeTxt: { fontFamily: 'Poppins_700Bold', fontSize: 9, color: '#FFF', letterSpacing: 0.5 },
  time: { fontFamily: 'Poppins_600SemiBold', fontSize: 11 },
  title: { fontFamily: 'Poppins_800ExtraBold', fontSize: 16, marginBottom: 6 },
  body: { fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 20 },
});

export default function HomeScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { userProfile, user } = useAuth();
  const [stats,    setStats]    = useState(null);
  const [events,   setEvents]   = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const s = getStyles(colors, isDark);

  useEffect(() => {
    loadData();
  }, [user?.id, userProfile?.id]);

  const loadData = async () => {
    try {
      const uid = userProfile?.id || userProfile?.user_id || user?.id;
      if (uid) {
        const { data: st } = await dashboardAPI.getUserStats(uid);
        setStats(st);
        const { data: myEv } = await eventAPI.getEventsByUser(uid);
        setEvents(myEv?.slice(0, 5) || []);
      } else {
        const { data: ev } = await eventAPI.getEventsByStatus('approved');
        setEvents(ev?.slice(0, 5) || []);
      }

      const { data: ann } = await notificationAPI.getOfficialAnnouncements();
      setAnnouncements(ann || []);
    } catch (e) { console.error('Dashboard error:', e); }
    finally {
      setRefreshing(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }
  };

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const getGreeting = () => {
    const hour = (new Date().getUTCHours() + 8) % 24;
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brand} />
      
      {/* Premium Header */}
      <View style={s.headerBg}>
        <View style={s.headerTop}>
          <TouchableOpacity style={s.avatarWrap} activeOpacity={0.9} onPress={() => navigation.navigate('Profile')}>
            {userProfile?.profile_picture_url ? (
              <Image source={{ uri: userProfile.profile_picture_url }} style={s.avatarImg} />
            ) : (
              <View style={s.avatar}>
                <Text style={s.avatarTxt}>{userProfile?.full_name?.charAt(0).toUpperCase() || 'S'}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <View style={s.headerTextWrap}>
            <Text style={s.greeting}>{getGreeting()},</Text>
            <Text style={s.name} numberOfLines={1}>{userProfile?.full_name || 'Student Leader'}</Text>
          </View>
          
          <TouchableOpacity style={s.notifBtn} activeOpacity={0.8} onPress={() => navigation.navigate('Notifications')}>
            <Feather name="bell" size={22} color="#FFFFFF" />
            {stats?.unreadNotifications > 0 && (
              <View style={s.notifBadge}>
                <View style={s.notifBadgeDot} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Dashboard Stats Row */}
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Text style={s.statVal}>{stats?.eventsCount || 0}</Text>
            <Text style={s.statLbl}>My Events</Text>
          </View>
          <View style={s.statDivider} />
          <TouchableOpacity style={s.statItem} onPress={() => navigation.navigate('Messages')}>
            <Text style={s.statVal}>{stats?.unreadMessages || 0}</Text>
            <Text style={s.statLbl}>Unread Msg</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* Quick Actions (Highly Usable) */}
          <View style={s.actionsContainer}>
            <QuickActionBtn 
              label="Create Event" icon="plus" 
              color={colors.brand} bg={isDark ? 'rgba(3, 99, 43, 0.2)' : '#F0FDF4'} 
              onPress={() => navigation.navigate('CreateEvent')} isDark={isDark} 
            />
            <View style={{ width: 12 }} />
            <QuickActionBtn 
              label="Messages" icon="message-square" 
              color="#3B82F6" bg={isDark ? 'rgba(59, 130, 246, 0.2)' : '#EFF6FF'} 
              onPress={() => navigation.navigate('Messages')} isDark={isDark} 
            />
          </View>

          {/* Announcements */}
          {announcements.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Important Updates</Text>
              {announcements.map(ann => (
                <AnnouncementCard key={ann.id} item={ann} isDark={isDark} />
              ))}
            </View>
          )}

          {/* Upcoming Events */}
          <View style={[s.sectionRow, { marginTop: announcements.length ? 10 : 0 }]}>
            <Text style={s.sectionTitle}>Upcoming Events</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Events')}>
              <Text style={s.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {events.length === 0 ? (
            <View style={s.empty}>
              <View style={s.emptyIconBox}>
                <Feather name="calendar" size={32} color={colors.textMuted} />
              </View>
              <Text style={s.emptyTxt}>No upcoming events</Text>
              <Text style={s.emptySubTxt}>Your schedule is clear right now.</Text>
            </View>
          ) : events.map(ev => (
            <EventRow
              key={ev.proposal_id}
              event={ev}
              colors={colors}
              isDark={isDark}
              onPress={() => navigation.navigate('EventDetails', { eventId: ev.proposal_id })}
            />
          ))}

        </Animated.View>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors, isDark) => StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.background },
  headerBg: {
    backgroundColor: colors.brand,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  avatarWrap: { marginRight: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 },
  avatarImg: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: '#FFFFFF' },
  avatarTxt: { fontFamily: 'Poppins_800ExtraBold', fontSize: 20, color: colors.brand },
  
  headerTextWrap: { flex: 1 },
  greeting: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  name: { fontFamily: 'Poppins_700Bold', fontSize: 22, color: '#FFFFFF', marginTop: -2 },
  
  notifBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  notifBadge: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  notifBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },

  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.1)', marginHorizontal: 24, borderRadius: 20, paddingVertical: 12 },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontFamily: 'Poppins_800ExtraBold', fontSize: 20, color: '#FFFFFF' },
  statLbl: { fontFamily: 'Poppins_500Medium', fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: -2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 6 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 20 },
  
  actionsContainer: { flexDirection: 'row', marginBottom: 24 },
  
  section: { marginBottom: 24 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontFamily: 'Poppins_800ExtraBold', fontSize: 18, color: colors.text, marginBottom: 14, marginTop: 4 },
  seeAll: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: colors.brand },
  
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' },
  emptyIconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTxt: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: colors.text },
  emptySubTxt: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: colors.textMuted, marginTop: 4 },
});
