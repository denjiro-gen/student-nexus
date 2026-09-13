import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, FlatList,
  RefreshControl, TouchableOpacity,
  StatusBar, Animated, Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { orgAPI } from '../services/api';
import { supabase } from '../config/supabase';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../context/ThemeContext';

function ReqCard({ item, onUpload, uploadingId, colors, isDark }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusKey = item.record
    ? (item.record.status === 'approved' ? 'compliant' : item.record.status)
    : 'missing';
  
  const STATUS_CFG = {
    compliant: { color: colors.success,  bg: colors.successLight, label: 'Approved',  icon: 'check-circle' },
    approved:  { color: colors.success,  bg: colors.successLight, label: 'Approved',  icon: 'check-circle' },
    pending:   { color: colors.warning, bg: colors.warningLight,  label: 'Pending Review', icon: 'clock'   },
    under_review: { color: colors.info, bg: colors.infoLight, label: 'Under Review', icon: 'eye'    },
    rejected:  { color: colors.error,   bg: colors.errorLight,  label: 'Rejected',  icon: 'x-circle'     },
    missing:   { color: colors.textMuted, bg: colors.border, label: 'Not Submitted', icon: 'alert-circle'},
  };
    
  const cfg = STATUS_CFG[statusKey] || STATUS_CFG.missing;
  const isUploading = uploadingId === item.id;
  const hasAdminFeedback = !!item.record?.notes;
  const submittedAt = item.record?.created_at
    ? new Date(item.record.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <TouchableOpacity
      style={[rc.card, { backgroundColor: colors.surface, shadowColor: '#000' }]}
      activeOpacity={0.75}
      onPress={() => setIsExpanded(!isExpanded)}
    >
      <View style={rc.body}>
        <View style={rc.topRow}>
          <Text style={[rc.title, { color: colors.text }]} numberOfLines={isExpanded ? 5 : 1}>{item.name}</Text>
          <View style={[rc.badge, { backgroundColor: cfg.bg }]}>
            <Feather name={cfg.icon} size={10} color={cfg.color} />
            <Text style={[rc.badgeTxt, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        <View style={rc.hintRow}>
          {submittedAt && !isExpanded ? (
            <Text style={[rc.metaHint, { color: colors.textMuted }]}>Submitted {submittedAt}</Text>
          ) : null}
          {hasAdminFeedback && !isExpanded ? (
            <View style={[rc.feedbackDot, { backgroundColor: colors.warning }]} />
          ) : null}
          <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
        </View>

        {isExpanded && (
          <>
            {item.description ? (
              <Text style={[rc.desc, { color: colors.textMuted }]}>{item.description}</Text>
            ) : null}

            <View style={rc.metaBlock}>
              <View style={rc.metaRow}>
                <Feather name="calendar" size={12} color={colors.textMuted} />
                <Text style={[rc.meta, { color: colors.textMuted }]}>Deadline: {item.deadline_type}</Text>
              </View>
              {submittedAt ? (
                <View style={rc.metaRow}>
                  <Feather name="upload" size={12} color={colors.textMuted} />
                  <Text style={[rc.meta, { color: colors.textMuted }]}>Submitted: {submittedAt}</Text>
                </View>
              ) : null}
            </View>

            {hasAdminFeedback ? (
              <View style={[rc.feedbackBox, { borderColor: statusKey === 'rejected' ? colors.error : colors.brand }]}>
                <View style={rc.feedbackHeader}>
                  <Feather name="message-square" size={12} color={statusKey === 'rejected' ? colors.error : colors.brand} />
                  <Text style={[rc.feedbackLabel, { color: statusKey === 'rejected' ? colors.error : colors.brand }]}>Admin Feedback</Text>
                </View>
                <Text style={[rc.feedbackTxt, { color: colors.text }]}>{item.record.notes}</Text>
              </View>
            ) : statusKey !== 'missing' ? (
              <View style={[rc.noFeedbackBox, { backgroundColor: colors.background }]}>
                <Text style={[rc.noFeedbackTxt, { color: colors.textMuted }]}>No feedback from admin yet.</Text>
              </View>
            ) : null}
          </>
        )}

        {(statusKey === 'missing' || statusKey === 'rejected') && (
          <TouchableOpacity
            style={[rc.uploadBtn, { backgroundColor: colors.brand }, isUploading && rc.uploadBtnDisabled]}
            onPress={() => !isUploading && onUpload(item)}
            activeOpacity={0.7}
            disabled={isUploading}
          >
            <Feather name={isUploading ? 'loader' : 'upload-cloud'} size={13} color="#FFF" />
            <Text style={rc.uploadTxt}>{isUploading ? 'Uploading...' : statusKey === 'rejected' ? 'Re-submit Document' : 'Upload Document'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const rc = StyleSheet.create({
  card:       { borderRadius: 16, marginBottom: 12, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, overflow: 'hidden' },
  body:       { padding: 16 },
  topRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  title:      { flex: 1, fontFamily: 'Poppins_700Bold', fontSize: 14, marginRight: 8, lineHeight: 20 },
  badge:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  badgeTxt:   { fontFamily: 'Poppins_600SemiBold', fontSize: 10 },
  hintRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  metaHint:   { fontFamily: 'Poppins_400Regular', fontSize: 11 },
  feedbackDot:{ width: 7, height: 7, borderRadius: 4, marginLeft: 6 },
  desc:       { fontFamily: 'Poppins_400Regular', fontSize: 13, marginBottom: 12, lineHeight: 19 },
  metaBlock:  { gap: 5, marginBottom: 12 },
  metaRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta:       { fontFamily: 'Poppins_500Medium', fontSize: 12 },
  feedbackBox:{ borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12 },
  feedbackHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5 },
  feedbackLabel: { fontFamily: 'Poppins_700Bold', fontSize: 11 },
  feedbackTxt:{ fontFamily: 'Poppins_400Regular', fontSize: 12, lineHeight: 18 },
  noFeedbackBox: { borderRadius: 8, padding: 10, marginBottom: 12 },
  noFeedbackTxt: { fontFamily: 'Poppins_400Regular', fontSize: 11, textAlign: 'center' },
  uploadBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, gap: 6, marginTop: 4 },
  uploadBtnDisabled: { opacity: 0.6 },
  uploadTxt:  { fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: '#FFF' },
});

export default function ComplianceScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const s = getStyles(colors, isDark);

  const { user } = useAuth();
  const [org, setOrg] = useState(null);
  const [reqs, setReqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const orgRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user?.id])
  );

  useEffect(() => {
    if (!orgRef.current?.id) return;

    const channel = supabase
      .channel(`compliance-${orgRef.current.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'organization_compliance',
        filter: `organization_id=eq.${orgRef.current.id}`,
      }, () => {
        orgAPI.getComplianceRequirements(orgRef.current.id).then(({ data }) => {
          if (data) setReqs(data);
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [org?.id]);

  const loadData = async () => {
    if (!user?.id) return;
    try {
      const { data: orgData } = await orgAPI.getMyOrganization(user.id);
      if (orgData) {
        orgRef.current = orgData;
        setOrg(orgData);
        const { data: rData } = await orgAPI.getComplianceRequirements(orgData.id);
        setReqs(rData || []);
      }
    } catch (e) {
      console.error('Compliance load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  };

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const complianceRate = reqs.length === 0 ? 0 : Math.round(
    (reqs.filter(r => r.record && (r.record.status === 'approved' || r.record.status === 'compliant')).length / reqs.length) * 100
  );
  const approvedCount = reqs.filter(r => r.record && (r.record.status === 'approved' || r.record.status === 'compliant')).length;
  const pendingCount  = reqs.filter(r => r.record && r.record.status === 'pending').length;
  const missingCount  = reqs.filter(r => !r.record).length;

  const handleUpload = async (req) => {
    if (!org) return;
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        setUploadingId(req.id);

        const { error } = await orgAPI.submitComplianceDocument(
          org.id,
          req.id,
          file.uri,
          file.name,
          file.mimeType
        );

        if (error) throw error;
        Alert.alert('✅ Submitted', 'Your document has been submitted. The admin will review it shortly.');
        loadData();
      }
    } catch (e) {
      Alert.alert('Upload Failed', e.message || 'An error occurred during upload.');
    } finally {
      setUploadingId(null);
    }
  };

  if (!loading && !org) {
    return (
      <View style={s.center}>
        <Feather name="shield-off" size={48} color={colors.textMuted} style={{ marginBottom: 16 }} />
        <Text style={s.centerTitle}>No Organization</Text>
        <Text style={s.centerTxt}>You are not assigned as a leader to any organization.</Text>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brand} />

      <View style={s.header}>
        <Text style={s.headerTitle}>Org & Compliance</Text>
        {org && <Text style={s.headerSub}>{org.name}</Text>}
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {org && (
          <View style={s.scoreWrap}>
            <View style={s.scoreCard}>
              <View style={{ flex: 1 }}>
                <Text style={s.scoreLbl}>Compliance Rate</Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
                  <Text style={[s.scoreVal, { color: complianceRate >= 80 ? colors.success : complianceRate >= 50 ? colors.warning : colors.error }]}>
                    {complianceRate}%
                  </Text>
                  <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 12, color: colors.textMuted, marginBottom: 6 }}>
                    ({approvedCount}/{reqs.length} approved)
                  </Text>
                </View>
                <View style={s.progressTrack}>
                  <View style={[s.progressFill, {
                    width: `${complianceRate}%`,
                    backgroundColor: complianceRate >= 80 ? colors.success : complianceRate >= 50 ? colors.warning : colors.error
                  }]} />
                </View>
              </View>
              <View style={s.scoreIcon}>
                <Feather
                  name={complianceRate >= 80 ? 'award' : 'alert-triangle'}
                  size={26}
                  color={complianceRate >= 80 ? colors.success : colors.warning}
                />
              </View>
            </View>

            <View style={s.statsRow}>
              <View style={[s.statChip, { backgroundColor: colors.successLight }]}>
                <Text style={[s.statNum, { color: colors.success }]}>{approvedCount}</Text>
                <Text style={[s.statLbl, { color: colors.success }]}>Approved</Text>
              </View>
              <View style={[s.statChip, { backgroundColor: colors.warningLight }]}>
                <Text style={[s.statNum, { color: colors.warning }]}>{pendingCount}</Text>
                <Text style={[s.statLbl, { color: colors.warning }]}>Pending</Text>
              </View>
              <View style={[s.statChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }]}>
                <Text style={[s.statNum, { color: colors.textMuted }]}>{missingCount}</Text>
                <Text style={[s.statLbl, { color: colors.textMuted }]}>Missing</Text>
              </View>
            </View>
          </View>
        )}

        <FlatList
          data={reqs}
          keyExtractor={item => item.id}
          contentContainerStyle={s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
          ListHeaderComponent={(
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 4 }}>
              <Text style={s.sectionTitle}>Requirements</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success }} />
                <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 11, color: colors.textMuted }}>Live updates on</Text>
              </View>
            </View>
          )}
          renderItem={({ item }) => (
            <ReqCard item={item} onUpload={handleUpload} uploadingId={uploadingId} colors={colors} isDark={isDark} />
          )}
          ListEmptyComponent={!loading && (
            <Text style={s.emptyTxt}>No compliance requirements found.</Text>
          )}
        />
      </Animated.View>
    </View>
  );
}

const getStyles = (colors, isDark) => StyleSheet.create({
  root:         { flex: 1, backgroundColor: colors.background },
  header:       { backgroundColor: colors.brand, paddingTop: 60, paddingBottom: 20, paddingHorizontal: 24, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8, zIndex: 10 },
  headerTitle:  { fontFamily: 'Poppins_800ExtraBold', fontSize: 26, color: '#FFF', letterSpacing: -0.5 },
  headerSub:    { fontFamily: 'Poppins_500Medium', fontSize: 13, color: colors.brandLight, marginTop: 4 },

  scoreWrap:    { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 },
  scoreCard:    { backgroundColor: colors.surface, borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, marginBottom: 10 },
  scoreLbl:     { fontFamily: 'Poppins_500Medium', fontSize: 12, color: colors.textMuted, marginBottom: 2 },
  scoreVal:     { fontFamily: 'Poppins_800ExtraBold', fontSize: 34, lineHeight: 40 },
  progressTrack:{ height: 6, backgroundColor: colors.border, borderRadius: 3, marginTop: 8, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  scoreIcon:    { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },

  statsRow:     { flexDirection: 'row', gap: 8, marginBottom: 4 },
  statChip:     { flex: 1, borderRadius: 12, padding: 10, alignItems: 'center' },
  statNum:      { fontFamily: 'Poppins_800ExtraBold', fontSize: 18 },
  statLbl:      { fontFamily: 'Poppins_500Medium', fontSize: 10 },

  listContent:  { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 },
  sectionTitle: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: colors.text },

  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: colors.background },
  centerTitle:  { fontFamily: 'Poppins_700Bold', fontSize: 18, color: colors.text, marginBottom: 8 },
  centerTxt:    { fontFamily: 'Poppins_400Regular', fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  emptyTxt:     { fontFamily: 'Poppins_400Regular', fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 20 },
});
