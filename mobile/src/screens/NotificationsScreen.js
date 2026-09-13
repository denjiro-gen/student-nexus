import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl, StatusBar
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { notificationAPI } from '../services/api';
import { supabase } from '../config/supabase';
import { useTheme } from '../context/ThemeContext';

const fmtTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Math.floor((new Date() - d) / 86400000);
  if (diff === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diff === 1) return 'Yesterday';
  if (diff < 7)  return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

function NotifItem({ item, onPress, onMarkRead, colors, isDark }) {
  const isUnread = !item.is_read;

  const TYPE_ICON = {
    event_approval: { icon: 'calendar',       color: colors.success },
    faculty_request:{ icon: 'package',        color: colors.warning },
    compliance_update:{ icon: 'shield',       color: colors.info },
    event_submission:{ icon: 'file-plus',     color: colors.brand },
    system:         { icon: 'bell',           color: colors.brand },
    info:           { icon: 'info',           color: colors.info },
    warning:        { icon: 'alert-triangle', color: colors.warning },
    error:          { icon: 'x-circle',       color: colors.error },
  };
  
  const cfg = TYPE_ICON[item.type] || TYPE_ICON.system;

  return (
    <TouchableOpacity
      style={[ni.row, { backgroundColor: colors.surface }, isUnread && { backgroundColor: isDark ? 'rgba(3,99,43,0.15)' : '#F0FAF4' }]}
      onPress={() => onPress(item)}
      activeOpacity={0.75}
    >
      <View style={[ni.iconBox, { backgroundColor: isUnread ? colors.brand : colors.brandLight }]}>
        <Feather name={cfg.icon} size={18} color={isUnread ? '#FFF' : cfg.color} />
      </View>
      <View style={ni.body}>
        {item.title ? (
          <Text style={[ni.title, { color: colors.text }, isUnread && { fontFamily: 'Poppins_700Bold' }]} numberOfLines={1}>{item.title}</Text>
        ) : null}
        <Text style={[ni.msg, { color: colors.textMuted }, isUnread && { fontFamily: 'Poppins_500Medium', color: colors.text }]} numberOfLines={2}>{item.message}</Text>
        <Text style={[ni.time, { color: colors.textMuted }, isUnread && { color: colors.brand, fontFamily: 'Poppins_500Medium' }]}>{fmtTime(item.created_at)}</Text>
      </View>
      {isUnread && (
        <TouchableOpacity onPress={() => onMarkRead(item.id)} style={ni.dotBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <View style={[ni.unreadDot, { backgroundColor: colors.brand }]} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const ni = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, marginBottom: 2 },
  iconBox: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 14, flexShrink: 0 },
  body: { flex: 1, justifyContent: 'center' },
  title: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, marginBottom: 2 },
  msg: { fontFamily: 'Poppins_400Regular', fontSize: 12, lineHeight: 18, marginBottom: 4 },
  time: { fontFamily: 'Poppins_400Regular', fontSize: 10 },
  dotBtn: { justifyContent: 'center', paddingLeft: 8 },
  unreadDot: { width: 10, height: 10, borderRadius: 5 },
});

export default function NotificationsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const s = getStyles(colors, isDark);

  const { user, userProfile } = useAuth();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const myId = userProfile?.id || userProfile?.user_id || user?.id;

  const load = useCallback(async () => {
    if (!myId) return;
    try {
      const { data, error } = await notificationAPI.getUserNotifications(myId);
      if (error) throw error;
      setNotifs(data || []);
    } catch (e) {
      console.error('Notifications load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [myId]);

  useEffect(() => {
    load();

    if (!myId) return;
    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${myId}` },
        () => load()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [load, myId]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const handleMarkRead = async (id) => {
    await notificationAPI.markAsRead(id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleMarkAllRead = async () => {
    if (!myId) return;
    await notificationAPI.markAllAsRead(myId);
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handlePress = async (item) => {
    if (!item.is_read) {
      await notificationAPI.markAsRead(item.id);
      setNotifs(prev => prev.map(n => n.id === item.id ? { ...n, is_read: true } : n));
    }
  };

  const unreadCount = notifs.filter(n => !n.is_read).length;

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.surface} />
      
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={s.subtitle}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} style={s.markAllBtn}>
            <Feather name="check-circle" size={14} color={colors.brand} />
            <Text style={s.markAllTxt}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifs}
        keyExtractor={n => n.id.toString()}
        renderItem={({ item }) => (
          <NotifItem
            item={item}
            onPress={handlePress}
            onMarkRead={handleMarkRead}
            colors={colors}
            isDark={isDark}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={notifs.length === 0 && { flex: 1 }}
        ListEmptyComponent={
          !loading && (
            <View style={s.empty}>
              <View style={s.emptyIconBox}>
                <Feather name="bell-off" size={38} color={colors.brand} />
              </View>
              <Text style={s.emptyTitle}>All caught up!</Text>
              <Text style={s.emptyMsg}>You don't have any notifications right now.</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const getStyles = (colors, isDark) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20,
    backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    zIndex: 10,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
  },
  backBtn: { marginRight: 12, padding: 4 },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: colors.text },
  subtitle: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: colors.brand },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: colors.brandLight, borderRadius: 20 },
  markAllTxt: { fontFamily: 'Poppins_600SemiBold', fontSize: 11, color: colors.brand },
  
  empty: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 32 },
  emptyIconBox:{ width: 80, height: 80, borderRadius: 24, backgroundColor: colors.brandLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle:  { fontFamily: 'Poppins_700Bold', fontSize: 16, color: colors.text, marginBottom: 8 },
  emptyMsg:    { fontFamily: 'Poppins_400Regular', fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
