import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  StatusBar, Animated, RefreshControl, Alert, Modal, ActivityIndicator
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { messageAPI, userAPI } from '../services/api';
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
const initial = (n) => (n || '?').charAt(0).toUpperCase();

function ConvoItem({ item, myId, onPress, colors, isDark }) {
  const partner = item.sender_id === myId ? item.recipient : item.sender;
  const name    = partner?.full_name || 'Workspace Admin';
  const unread  = !item.read && item.recipient_id === myId;
  const scale   = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[ci.row, { backgroundColor: colors.surface }, unread && { backgroundColor: isDark ? 'rgba(3, 99, 43, 0.15)' : '#F0FAF4' }]}
        onPress={() => onPress(partner)}
        onPressIn={() => Animated.timing(scale, { toValue: 0.97, duration: 80, useNativeDriver: true }).start()}
        onPressOut={() => Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }).start()}
        activeOpacity={1}
      >
        <View style={[ci.avatar, { backgroundColor: colors.brandLight }, unread && { backgroundColor: colors.brand }]}>
          <Text style={[ci.avatarTxt, { color: colors.brand }, unread && { color: '#FFF' }]}>{initial(name)}</Text>
        </View>
        <View style={ci.body}>
          <View style={ci.top}>
            <Text style={[ci.name, { color: colors.text }, unread && { fontFamily: 'Poppins_700Bold', color: colors.brandDark }]} numberOfLines={1}>{name}</Text>
            <Text style={[ci.time, { color: colors.textMuted }, unread && { fontFamily: 'Poppins_600SemiBold', color: colors.brand }]}>{fmtTime(item.created_at)}</Text>
          </View>
          <View style={ci.bot}>
            <Text style={[ci.preview, { color: colors.textMuted }, unread && { fontFamily: 'Poppins_500Medium', color: colors.text }]} numberOfLines={1}>
              {item.sender_id === myId ? 'You: ' : ''}{item.body || '…'}
            </Text>
            {unread && <View style={[ci.dot, { backgroundColor: colors.brand }]} />}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
const ci = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, marginBottom: 2 },
  avatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  avatarTxt: { fontFamily: 'Poppins_700Bold', fontSize: 18 },
  body: { flex: 1 },
  top: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  name: { fontFamily: 'Poppins_500Medium', fontSize: 15, flex: 1, marginRight: 8 },
  time: { fontFamily: 'Poppins_400Regular', fontSize: 12 },
  bot: { flexDirection: 'row', alignItems: 'center' },
  preview: { fontFamily: 'Poppins_400Regular', fontSize: 13, flex: 1, marginRight: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});

function Bubble({ msg, isMe, colors, isDark }) {
  return (
    <View style={[bb.wrap, isMe ? bb.wrapMe : bb.wrapOther]}>
      {!isMe && (
        <View style={[bb.senderDot, { backgroundColor: colors.brandLight }]}>
          <Text style={[bb.senderTxt, { color: colors.brand }]}>{initial(msg.sender?.full_name)}</Text>
        </View>
      )}
      <View style={[bb.bubble, isMe ? [bb.me, { backgroundColor: colors.brand }] : [bb.other, { backgroundColor: colors.surface, shadowColor: '#000' }]]}>
        <Text style={[bb.text, { color: colors.text }, isMe && { color: '#FFF' }]}>{msg.body}</Text>
        <Text style={[bb.ts, isMe ? bb.tsMe : { color: colors.textMuted }]}>{fmtTime(msg.created_at)}</Text>
      </View>
    </View>
  );
}
const bb = StyleSheet.create({
  wrap: { flexDirection: 'row', marginVertical: 4, paddingHorizontal: 16 },
  wrapMe: { justifyContent: 'flex-end' },
  wrapOther: { justifyContent: 'flex-start' },
  senderDot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginRight: 8, alignSelf: 'flex-end' },
  senderTxt: { fontFamily: 'Poppins_700Bold', fontSize: 11 },
  bubble: { maxWidth: '72%', borderRadius: 20, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6 },
  me: { borderBottomRightRadius: 4 },
  other: { borderBottomLeftRadius: 4, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  text: { fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 21 },
  ts: { fontFamily: 'Poppins_400Regular', fontSize: 10, marginTop: 3 },
  tsMe: { color: 'rgba(255,255,255,0.6)', textAlign: 'right' },
});

function ChatView({ partner, allMsgs, myId, onSend, onBack, sending, colors, isDark }) {
  const [text, setText] = useState('');
  const listRef = useRef(null);
  const hFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(hFade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    
    if (partner?.id) {
      messageAPI.markThreadAsRead(myId, partner.id);
    }
  }, []);

  const send = () => {
    const t = text.trim();
    if (!t || sending) return;
    onSend(t);
    setText('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Animated.View style={[ch.header, { backgroundColor: colors.brand, opacity: hFade }]}>
        <TouchableOpacity onPress={onBack} style={ch.back} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={ch.pAvatar}>
          <Text style={ch.pAvatarTxt}>{initial(partner?.full_name)}</Text>
        </View>
        <View style={ch.pInfo}>
          <Text style={ch.pName}>{partner?.full_name || 'Workspace Admin'}</Text>
          <Text style={ch.pSub}>Admin Support</Text>
        </View>
      </Animated.View>

      <FlatList
        ref={listRef}
        data={allMsgs}
        keyExtractor={m => m.id?.toString() || Math.random().toString()}
        renderItem={({ item }) => <Bubble msg={item} isMe={item.sender_id === myId} colors={colors} isDark={isDark} />}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 24, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={ch.empty}>
            <View style={[ch.emptyIcon, { backgroundColor: colors.brandLight }]}><Feather name="message-circle" size={36} color={colors.brand} /></View>
            <Text style={[ch.emptyTitle, { color: colors.text }]}>Start a conversation</Text>
            <Text style={[ch.emptyMsg, { color: colors.textMuted }]}>Send a message to {partner?.full_name}</Text>
          </View>
        }
      />

      <View style={[ch.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TextInput style={[ch.input, { backgroundColor: colors.background, color: colors.text }]} value={text} onChangeText={setText}
          placeholder="Type a message…" placeholderTextColor={colors.textMuted} multiline maxLength={500} />
        <TouchableOpacity style={[ch.sendBtn, { backgroundColor: colors.brand, shadowColor: colors.brandDark }, !text.trim() && { backgroundColor: isDark ? colors.border : '#B0C4B9', shadowOpacity: 0 }]}
          onPress={send} disabled={!text.trim() || sending} activeOpacity={0.8}>
          <Feather name="send" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
const ch = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 54 : 44, paddingBottom: 14, paddingHorizontal: 16 },
  back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  pAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  pAvatarTxt: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: '#FFF' },
  pInfo: { flex: 1 },
  pName: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: '#FFF' },
  pSub: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyIcon: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontFamily: 'Poppins_700Bold', fontSize: 17, marginBottom: 6 },
  emptyMsg: { fontFamily: 'Poppins_400Regular', fontSize: 13, textAlign: 'center' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 28 : 12, borderTopWidth: 1 },
  input: { flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 14, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, maxHeight: 100, marginRight: 10 },
  sendBtn: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 5 },
});

export default function MessagesScreen() {
  const { colors, isDark } = useTheme();
  const s = getStyles(colors, isDark);

  const { user, userProfile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chatPartner, setChatPartner] = useState(null);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [threadMsgs, setThreadMsgs] = useState([]);

  const [showCompose, setShowCompose] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const myId = userProfile?.id || user?.id;

  useEffect(() => { loadMessages(); }, [myId]);

  useEffect(() => {
    if (!myId) return;
    const messageSubscription = supabase
      .channel('messages_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${myId}`,
        },
        (payload) => {
          loadMessages();
          if (chatPartner && payload.new.sender_id === chatPartner.id) {
            loadThread(chatPartner.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageSubscription);
    };
  }, [myId, chatPartner]);

  const loadMessages = async () => {
    if (!myId) { setLoading(false); return; }
    try {
      const { data, error } = await messageAPI.getConversations(myId);
      if (error && error.code !== '42P01') throw error;
      
      const msgs = data || [];
      const seen = new Map();
      msgs.forEach(m => {
        const pid = m.sender_id === myId ? m.recipient_id : m.sender_id;
        const ex = seen.get(pid);
        if (!ex || new Date(m.created_at) > new Date(ex.created_at)) seen.set(pid, m);
      });
      setMessages(Array.from(seen.values()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (e) { console.error('Messages error:', e); }
    finally {
      setLoading(false); setRefreshing(false);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]).start();
    }
  };

  const loadThread = async (partnerId) => {
    if (!myId) return;
    const { data } = await messageAPI.getThread(myId, partnerId);
    setThreadMsgs(data || []);
  };

  const openChat = async (partner) => {
    setShowCompose(false);
    setChatPartner(partner);
    await loadThread(partner.id);
  };

  const onRefresh = () => { setRefreshing(true); loadMessages(); };

  const handleCompose = async () => {
    setShowCompose(true);
    setContactsLoading(true);
    const { data } = await userAPI.getAllUsers();
    
    if (data) {
      const myRole = userProfile?.role || 'student';
      setContacts(data.filter(u => {
        if (u.id === myId) return false;
        if (myRole !== 'osas_admin' && u.role !== 'osas_admin') return false;
        return true;
      }));
    }
    setContactsLoading(false);
  };

  const handleSend = async (content) => {
    if (!chatPartner || !myId) return;
    setSending(true);
    try {
      const partnerId = chatPartner.id;
      const { data, error } = await messageAPI.sendMessage(myId, partnerId, content);
      if (error) throw error;
      if (data) {
        const newMsg = { ...data, sender: { id: myId, full_name: userProfile?.full_name } };
        setThreadMsgs(prev => [...prev, newMsg]);
        loadMessages(); 
      }
    } catch (e) { Alert.alert('Error', e.message || 'Failed to send'); }
    finally { setSending(false); }
  };

  const filtered = messages.filter(m => {
    const p = m.sender_id === myId ? m.recipient : m.sender;
    return !search.trim() || (p?.full_name || '').toLowerCase().includes(search.toLowerCase());
  });

  if (chatPartner) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.surface} />
        <ChatView partner={chatPartner} allMsgs={threadMsgs} myId={myId}
          onSend={handleSend} onBack={() => { setChatPartner(null); loadMessages(); }} sending={sending} colors={colors} isDark={isDark} />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brand} />
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Messages</Text>
          <Text style={s.headerSub}>{filtered.length} conversation{filtered.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={s.compose} activeOpacity={0.8} onPress={handleCompose}>
          <Feather name="edit" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={s.searchWrap}>
        <Feather name="search" size={15} color={colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput style={s.searchInput} placeholder="Search conversations…"
          placeholderTextColor={colors.textMuted} value={search} onChangeText={setSearch} />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Feather name="x" size={15} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <FlatList
          data={filtered}
          keyExtractor={m => (m.id || Math.random()).toString()}
          renderItem={({ item }) => <ConvoItem item={item} myId={myId} onPress={(p) => openChat(p)} colors={colors} isDark={isDark} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.empty}>
              <View style={s.emptyIconBox}><Feather name="message-circle" size={36} color={colors.brand} /></View>
              <Text style={s.emptyTitle}>{loading ? 'Loading…' : 'No messages yet'}</Text>
              <Text style={s.emptyMsg}>{loading ? '' : 'Your conversations will appear here'}</Text>
            </View>
          }
        />
      </Animated.View>

      <Modal visible={showCompose} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCompose(false)}>
        <View style={s.modalHeader}>
          <Text style={s.modalTitle}>New Message</Text>
          <TouchableOpacity onPress={() => setShowCompose(false)} style={s.modalClose}>
            <Feather name="x" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {contactsLoading ? (
            <ActivityIndicator size="large" color={colors.brand} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={contacts}
              keyExtractor={c => c.id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={s.contactCard} onPress={() => openChat(item)}>
                  <View style={s.contactAvatar}>
                    <Text style={s.contactAvatarTxt}>{item.full_name?.charAt(0) || 'U'}</Text>
                  </View>
                  <View>
                    <Text style={s.contactName}>{item.full_name}</Text>
                    <Text style={s.contactRole}>{item.role}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors, isDark) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.brand, paddingTop: 54, paddingBottom: 18, paddingHorizontal: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, zIndex: 10 },
  headerTitle: { fontFamily: 'Poppins_800ExtraBold', fontSize: 26, color: '#FFF' },
  headerSub: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  compose: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, marginHorizontal: 16, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, marginTop: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3 },
  searchInput: { flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 14, color: colors.text },
  empty: { alignItems: 'center', paddingVertical: 70, paddingHorizontal: 32 },
  emptyIconBox: { width: 76, height: 76, borderRadius: 24, backgroundColor: colors.brandLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: colors.text, marginBottom: 6 },
  emptyMsg: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  modalHeader: { backgroundColor: colors.surface, paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: colors.text },
  modalClose: { padding: 4 },
  contactCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  contactAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brandLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  contactAvatarTxt: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: colors.brand },
  contactName: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: colors.text },
  contactRole: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: colors.textMuted, textTransform: 'capitalize' },
});
