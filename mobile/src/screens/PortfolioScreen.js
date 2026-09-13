import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl,
  Alert, StatusBar, Linking, Modal, Image, Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../context/AuthContext';
import { portfolioAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const FILTERS = [
  { key: 'all',   label: 'All'   },
  { key: 'verified',  label: 'Verified' },
  { key: 'unverified',label: 'Unverified' },
];

function formatDate(ds) {
  if (!ds) return '—';
  return new Date(ds).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function PortfolioCard({ item, onViewImage, onEdit, colors, isDark }) {
  const title      = item.cert_title || item.title || 'Untitled';
  const verified   = item.verified;
  const uploadDate = item.upload_date || item.achievement_date || item.created_at;
  const hasFile    = !!item.file_url;

  const handleOpenFile = () => {
    if (item.file_url) {
      const ext = item.file_url.split('.').pop().toLowerCase();
      const isImg = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) || item.file_type?.startsWith('image/');
      if (isImg) {
        onViewImage(item.file_url);
      } else {
        WebBrowser.openBrowserAsync(item.file_url).catch(() => Alert.alert('Error', 'Cannot open this file.'));
      }
    }
  };

  return (
    <View style={[ac.card, { backgroundColor: colors.surface, shadowColor: '#000' }]}>
      <View style={[ac.iconBox, { backgroundColor: colors.brandLight }]}>
        <Feather name={hasFile ? 'file-text' : 'award'} size={22} color={colors.brand} />
      </View>

      <View style={ac.body}>
        <View style={ac.titleRow}>
          <Text style={[ac.title, { color: colors.text }]} numberOfLines={2}>{title}</Text>
          {!verified && (
            <TouchableOpacity onPress={() => onEdit(item)} style={{ padding: 4, marginRight: 6 }}>
              <Feather name="edit-2" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          )}
          {verified ? (
            <View style={[ac.fileBadge, { backgroundColor: colors.successLight }]}>
              <Feather name="check-circle" size={10} color={colors.success} />
              <Text style={[ac.fileTxt, { color: colors.success }]}>Verified</Text>
            </View>
          ) : (
            <View style={[ac.noFileBadge, { backgroundColor: colors.warningLight }]}>
              <Feather name="clock" size={10} color={colors.warning} />
              <Text style={[ac.noFileTxt, { color: colors.warning }]}>Pending</Text>
            </View>
          )}
        </View>

        <View style={ac.metaRow}>
          <Feather name="calendar" size={11} color={colors.textMuted} />
          <Text style={[ac.metaTxt, { color: colors.textMuted }]}>{formatDate(uploadDate)}</Text>
        </View>

        {hasFile && (
          <TouchableOpacity style={[ac.fileBtn, { backgroundColor: colors.brandLight }]} onPress={handleOpenFile} activeOpacity={0.7}>
            <Feather name="paperclip" size={12} color={colors.brand} />
            <Text style={[ac.fileBtnTxt, { color: colors.brand }]} numberOfLines={1}>{item.file_name || 'View Attachment'}</Text>
            <Feather name="external-link" size={12} color={colors.brand} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const ac = StyleSheet.create({
  card:        { borderRadius: 18, padding: 16, marginBottom: 12, flexDirection: 'row', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3 },
  iconBox:     { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14, flexShrink: 0 },
  body:        { flex: 1 },
  titleRow:    { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6, gap: 6 },
  title:       { fontFamily: 'Poppins_700Bold', flex: 1, fontSize: 14 },
  fileBadge:   { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  fileTxt:     { fontFamily: 'Poppins_700Bold', fontSize: 10 },
  noFileBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  noFileTxt:   { fontFamily: 'Poppins_700Bold', fontSize: 10 },
  metaRow:     { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 5 },
  metaTxt:     { fontFamily: 'Poppins_400Regular', fontSize: 11, flex: 1 },
  fileBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  fileBtnTxt:  { fontFamily: 'Poppins_600SemiBold', fontSize: 11, flex: 1 },
});

export default function PortfolioScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const s = getStyles(colors, isDark);

  const { user, userProfile } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [filter,       setFilter]       = useState('all');
  const [modalImage,   setModalImage]   = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadAchievements();
    }, [user?.id])
  );

  const loadAchievements = async () => {
    const uid = userProfile?.id || userProfile?.user_id || user?.id;
    if (!uid) { setLoading(false); return; }
    try {
      const { data, error } = await portfolioAPI.getStudentAchievements(uid);
      if (error) throw error;
      setAchievements(data || []);
    } catch (e) {
      console.error('Portfolio error:', e);
      Alert.alert('Error', 'Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => { setRefreshing(true); await loadAchievements(); setRefreshing(false); };

  const filtered = achievements.filter(item => {
    if (filter === 'verified')   return item.verified;
    if (filter === 'unverified') return !item.verified;
    return true;
  });

  const numVerified   = achievements.filter(a => a.verified).length;
  const numUnverified = achievements.length - numVerified;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brand} />

      <View style={s.header}>
        <Text style={s.headerTitle}>My Portfolio</Text>
        <View style={s.countBox}>
          <Feather name="folder" size={16} color="#FFF" />
          <Text style={s.countVal}>{achievements.length}</Text>
          <Text style={s.countLbl}>Certificates</Text>
        </View>
      </View>

      <View style={s.statsStrip}>
        {[
          { label: 'Total',       val: achievements.length, color: colors.text  },
          { label: 'Verified',    val: numVerified,         color: colors.success  },
          { label: 'Pending',     val: numUnverified,       color: colors.warning },
        ].map((st, i) => (
          <React.Fragment key={st.label}>
            {i > 0 && <View style={s.statDiv} />}
            <View style={s.statBox}>
              <Text style={[s.statVal, { color: st.color }]}>{st.val}</Text>
              <Text style={s.statLbl}>{st.label}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>

      <View style={s.filtersRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[s.chip, filter === f.key && s.chipActive]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.8}
          >
            <Text style={[s.chipTxt, filter === f.key && s.chipTxtActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        renderItem={({ item }) => <PortfolioCard item={item} onViewImage={setModalImage} onEdit={(i) => navigation.navigate('UploadAchievement', { editItem: i })} colors={colors} isDark={isDark} />}
        keyExtractor={item => (item.portfolio_id || item.id)?.toString()}
        contentContainerStyle={s.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={s.emptyIconBox}>
              <Feather name="award" size={38} color={colors.brand} />
            </View>
            <Text style={s.emptyTxt}>No portfolio items yet</Text>
            <Text style={s.emptySub}>
              Your certificates and achievements will appear here.{'\n'}Participate in events to build your portfolio!
            </Text>
          </View>
        }
      />
      <TouchableOpacity style={s.fab} activeOpacity={0.9} onPress={() => navigation.navigate('UploadAchievement')}>
        <Feather name="plus" size={24} color="#FFF" />
      </TouchableOpacity>

      <Modal visible={!!modalImage} transparent={true} animationType="fade" onRequestClose={() => setModalImage(null)}>
        <View style={s.modalBg}>
          <TouchableOpacity style={s.modalClose} onPress={() => setModalImage(null)}>
            <Feather name="x" size={28} color="#FFF" />
          </TouchableOpacity>
          {modalImage && (
            <Image source={{ uri: modalImage }} style={s.modalImg} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors, isDark) => StyleSheet.create({
  root:        { flex: 1, backgroundColor: colors.background },
  header:      { backgroundColor: colors.brand, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 24, paddingHorizontal: 24, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6, zIndex: 10 },
  headerTitle: { fontFamily: 'Poppins_800ExtraBold', fontSize: 24, color: '#FFF', marginBottom: 12 },
  countBox:    { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 8 },
  countVal:    { fontFamily: 'Poppins_700Bold', fontSize: 16, color: '#FFF' },
  countLbl:    { fontFamily: 'Poppins_500Medium', fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  
  statsStrip:  { flexDirection: 'row', backgroundColor: colors.surface, marginHorizontal: 24, marginTop: -20, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 4, zIndex: 20 },
  statBox:     { flex: 1, alignItems: 'center' },
  statVal:     { fontFamily: 'Poppins_800ExtraBold', fontSize: 20, marginBottom: 2 },
  statLbl:     { fontFamily: 'Poppins_600SemiBold', fontSize: 10, color: colors.textMuted },
  statDiv:     { width: 1, height: '100%', backgroundColor: colors.border },

  filtersRow:  { flexDirection: 'row', paddingHorizontal: 24, marginTop: 24, marginBottom: 12, gap: 10 },
  chip:        { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipActive:  { backgroundColor: colors.brand, borderColor: colors.brand },
  chipTxt:     { fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: colors.textMuted },
  chipTxtActive:{ color: '#FFF' },

  listContent: { paddingHorizontal: 24, paddingBottom: 100, flexGrow: 1 },
  empty:       { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyIconBox:{ width: 76, height: 76, borderRadius: 24, backgroundColor: colors.brandLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTxt:    { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: colors.text, marginTop: 12 },
  emptySub:    { fontFamily: 'Poppins_400Regular', fontSize: 13, color: colors.textMuted, marginTop: 4, textAlign: 'center' },

  fab:         { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', shadowColor: colors.brandDark, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8, zIndex: 99 },

  modalBg:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalClose:  { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 20, right: 20, zIndex: 2 },
  modalImg:    { width: '90%', height: '80%' },
});
