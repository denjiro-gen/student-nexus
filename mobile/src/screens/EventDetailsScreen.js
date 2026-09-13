import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, StatusBar, Alert, Linking
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../context/AuthContext';
import { eventAPI } from '../services/api';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../context/ThemeContext';

function formatDate(dateStr) {
  if (!dateStr) return 'TBA';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const d = new Date();
  d.setHours(h, m);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function InfoRow({ icon, label, value, last, colors }) {
  if (!value) return null;
  return (
    <>
      <View style={s.infoRow}>
        <View style={s.iconBox}><Feather name={icon} size={16} color={colors.brand} /></View>
        <View style={{ flex: 1 }}>
          <Text style={[s.infoLbl, { color: colors.textMuted }]}>{label}</Text>
          <Text style={[s.infoVal, { color: colors.text }]}>{value}</Text>
        </View>
      </View>
      {!last && <View style={[s.divider, { backgroundColor: colors.border }]} />}
    </>
  );
}
const s = StyleSheet.create({
  infoRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  infoLbl:  { fontFamily: 'Poppins_500Medium', fontSize: 12 },
  infoVal:  { fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
  divider:  { height: 1, marginVertical: 14 },
});

export default function EventDetailsScreen({ navigation, route }) {
  const { eventId } = route.params;
  const { user, userProfile } = useAuth();
  const { colors, isDark } = useTheme();
  const ds = getStyles(colors, isDark);

  const [event, setEvent]           = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading]       = useState(true);

  const myId = userProfile?.id || userProfile?.user_id || user?.id;

  useEffect(() => {
    if (eventId) loadDetails();
  }, [eventId]);

  const loadDetails = async () => {
    try {
      setLoading(true);
      const [evRes, attRes] = await Promise.all([
        eventAPI.getEventById(eventId),
        eventAPI.getEventAttachments(eventId),
      ]);
      if (evRes.error) throw evRes.error;
      setEvent(evRes.data);
      setAttachments(attRes.data || []);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to load event details.');
    } finally {
      setLoading(false);
    }
  };

  const STATUS_CFG = {
    approved: { color: colors.success,  bg: colors.successLight, label: 'Approved', icon: 'check-circle' },
    pending:  { color: colors.warning,  bg: colors.warningLight, label: 'Pending',  icon: 'clock'        },
    rejected: { color: colors.error,    bg: colors.errorLight,   label: 'Rejected', icon: 'x-circle'     },
  };

  if (loading) {
    return (
      <View style={[ds.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[ds.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={ds.title}>Event not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.brand, fontFamily: 'Poppins_600SemiBold' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const cfg = STATUS_CFG[event.status] || { color: colors.textMuted, bg: colors.border, label: event.status || 'Unknown', icon: 'circle', key: event.status };
  const isOwner     = myId && event.submitted_by === myId;
  const canEdit     = isOwner && event.status === 'pending';
  const isApproved  = event.status === 'approved';
  const isCompleted = event.status === 'completed';
  const isRejected  = event.status === 'rejected';

  const allAttachments = [];
  if (event.file_url) {
    allAttachments.push({ id: 'legacy', file_name: event.file_name || 'Attachment', file_url: event.file_url });
  }
  (attachments || []).forEach(a => {
    if (a.file_url && !allAttachments.find(x => x.file_url === a.file_url)) {
      allAttachments.push(a);
    }
  });

  return (
    <View style={ds.root}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.surface} />

      <View style={ds.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={ds.backBtn} activeOpacity={0.8}>
          <Feather name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={ds.headerTitle} numberOfLines={1}>Event Details</Text>
        {canEdit ? (
          <TouchableOpacity onPress={() => navigation.navigate('CreateEvent', { editEvent: event })} style={ds.editBtn} activeOpacity={0.8}>
            <Feather name="edit-2" size={18} color={colors.brand} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 32 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={ds.content} showsVerticalScrollIndicator={false}>

        {isOwner && (
          <View style={[ds.ownerBanner, { backgroundColor: isApproved ? colors.successLight : isRejected ? colors.errorLight : colors.warningLight }]}>
            <Feather name={isApproved ? 'check-circle' : isRejected ? 'x-circle' : 'clock'} size={16} color={isApproved ? colors.success : isRejected ? colors.error : colors.warning} />
            <Text style={[ds.ownerBannerTxt, { color: isApproved ? colors.success : isRejected ? colors.error : colors.warning }]}>
              {isApproved
                ? 'Your proposal has been approved!'
                : isRejected
                ? 'Your proposal was rejected. See remarks below.'
                : 'Your proposal is pending OSAS review.'}
            </Text>
          </View>
        )}

        <View style={ds.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <Text style={[ds.title, { flex: 1, marginRight: 8, color: colors.text }]}>{event.title}</Text>
            {isOwner && (
              <View style={[ds.youBadge, { backgroundColor: colors.brandLight }]}>
                <Text style={[ds.youBadgeTxt, { color: colors.brand }]}>YOUR EVENT</Text>
              </View>
            )}
          </View>

          <View style={[ds.badge, { backgroundColor: cfg.bg, alignSelf: 'flex-start', marginBottom: 16 }]}>
            <Feather name={cfg.icon} size={12} color={cfg.color} />
            <Text style={[ds.badgeTxt, { color: cfg.color }]}>{cfg.label}</Text>
          </View>

          <InfoRow colors={colors} icon="calendar" label="Date & Time"
            value={formatDate(event.event_date) + (event.event_time_start ? ` • ${formatTime(event.event_time_start)}` : '') + (event.event_time_end ? ` - ${formatTime(event.event_time_end)}` : '')}
          />
          <View style={[ds.divider, { backgroundColor: colors.border }]} />
          <InfoRow colors={colors} icon="map-pin"  label="Venue"        value={event.venue || 'TBA'} />
          <View style={[ds.divider, { backgroundColor: colors.border }]} />
          <InfoRow colors={colors} icon="users"    label="Organization"  value={event.organization?.name || 'Independent'} last />
        </View>

        <Text style={ds.sectionTitle}>Description</Text>
        <View style={ds.card}>
          <Text style={ds.descTxt}>{event.description || 'No description provided.'}</Text>
        </View>

        {!!event.review_notes && (
          <>
            <Text style={ds.sectionTitle}>Admin Remarks</Text>
            <View style={[ds.card, { borderColor: isDark ? 'rgba(239,68,68,0.5)' : '#FCA5A5', borderWidth: 1, backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 6 }}>
                <Feather name="alert-circle" size={14} color={colors.error} />
                <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 12, color: colors.error }}>OSAS Feedback</Text>
              </View>
              <Text style={[ds.descTxt, { color: isDark ? '#FCA5A5' : '#991B1B' }]}>{event.review_notes}</Text>
            </View>
          </>
        )}

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <View style={ds.halfCard}>
            <Feather name="user-plus" size={18} color={colors.textMuted} style={{ marginBottom: 4 }} />
            <Text style={ds.halfVal}>{event.expected_attendees || 'N/A'}</Text>
            <Text style={ds.halfLbl}>Expected</Text>
          </View>
          <View style={ds.halfCard}>
            <Feather name="dollar-sign" size={18} color={colors.textMuted} style={{ marginBottom: 4 }} />
            <Text style={ds.halfVal}>{event.budget_amount ? `₱${Number(event.budget_amount).toLocaleString()}` : 'N/A'}</Text>
            <Text style={ds.halfLbl}>Budget</Text>
          </View>
        </View>

        {event.submitter && (
          <>
            <Text style={ds.sectionTitle}>Submitted By</Text>
            <View style={ds.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[ds.avatarSmall, { backgroundColor: colors.brand }]}>
                  <Text style={ds.avatarSmallTxt}>{(event.submitter.full_name || 'S').charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 14, color: colors.text }}>{event.submitter.full_name}</Text>
                  <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, color: colors.textMuted }}>{event.submitter.email}</Text>
                </View>
                {isOwner && (
                  <View style={{ backgroundColor: colors.brandLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                    <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 10, color: colors.brand }}>YOU</Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}

        <Text style={ds.sectionTitle}>Supporting Documents</Text>
        {allAttachments.length === 0 ? (
          <View style={ds.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Feather name="file-text" size={16} color={colors.textMuted} />
              <Text style={[ds.descTxt, { color: colors.textMuted }]}>No supporting documents attached.</Text>
            </View>
          </View>
        ) : (
          allAttachments.map((att, i) => (
            <TouchableOpacity 
              key={i} 
              style={[ds.card, { flexDirection: 'row', alignItems: 'center', marginBottom: 8, padding: 12 }]}
              onPress={() => WebBrowser.openBrowserAsync(att.file_url)}
            >
              <View style={[ds.iconBox, { backgroundColor: colors.brandLight, marginRight: 12 }]}>
                <Feather name="file-text" size={16} color={colors.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: colors.text }}>{att.file_name || 'Document'}</Text>
                <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 11, color: colors.textMuted }}>
                  {att.category === 'post_event' ? 'Post-Event Requirement' : 'Proposal Document'}
                </Text>
              </View>
              <Feather name="download" size={16} color={colors.brand} />
            </TouchableOpacity>
          ))
        )}

        {isOwner && (isApproved || isCompleted) && (
          <View style={{ marginTop: 24 }}>
            <Text style={ds.sectionTitle}>Post-Event Requirements</Text>
            <View style={[ds.checklistCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F9FAFB', borderColor: colors.border }]}>
              <Text style={ds.checklistTitle}>Please submit the following requirements as a single merged PDF (or ZIP archive) after your event:</Text>
              <View style={ds.checklistItem}><Feather name="check-square" size={14} color={colors.success} /><Text style={ds.checklistTxt}>Post-Event Report</Text></View>
              <View style={ds.checklistItem}><Feather name="check-square" size={14} color={colors.success} /><Text style={ds.checklistTxt}>Narrative Report</Text></View>
              <View style={ds.checklistItem}><Feather name="check-square" size={14} color={colors.success} /><Text style={ds.checklistTxt}>Attendance Sheet</Text></View>
              <View style={ds.checklistItem}><Feather name="check-square" size={14} color={colors.success} /><Text style={ds.checklistTxt}>Photos/Documentation</Text></View>
              <View style={ds.checklistItem}><Feather name="check-square" size={14} color={colors.success} /><Text style={ds.checklistTxt}>Financial Liquidation</Text></View>
              <View style={ds.checklistItem}><Feather name="check-square" size={14} color={colors.success} /><Text style={ds.checklistTxt}>Official Receipts (if applicable)</Text></View>
              <View style={ds.checklistItem}><Feather name="check-square" size={14} color={colors.success} /><Text style={ds.checklistTxt}>Event Summary</Text></View>
            </View>

            <TouchableOpacity 
              style={[ds.editCta, { backgroundColor: colors.brand, marginBottom: 20 }]} 
              activeOpacity={0.8}
              onPress={async () => {
                try {
                  const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
                  if (!res.canceled && res.assets?.length > 0) {
                    const file = res.assets[0];
                    Alert.alert('Uploading...', 'Uploading post-event requirements, please wait.');
                    const { error } = await eventAPI.uploadEventAttachment(event.id, file.uri, file.name, file.mimeType, user?.id, 'post_event');
                    if (error) throw error;
                    Alert.alert('Success', 'Post-Event requirements uploaded successfully!');
                    loadDetails();
                  }
                } catch(e) {
                  Alert.alert('Upload Failed', e.message);
                }
              }}
            >
              <Feather name="upload-cloud" size={18} color="#FFF" />
              <Text style={ds.editCtaTxt}>Upload Documents</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const getStyles = (colors, isDark) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: 54, paddingBottom: 16, paddingHorizontal: 20,
    backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3,
    zIndex: 10
  },
  headerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: colors.text, flex: 1, textAlign: 'center' },
  backBtn:     { padding: 4, width: 32 },
  editBtn:     { padding: 4, width: 32, alignItems: 'flex-end' },

  ownerBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12, marginBottom: 16 },
  ownerBannerTxt: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, flex: 1 },

  content: { padding: 16, paddingBottom: 48 },

  card: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2
  },
  title:     { fontFamily: 'Poppins_800ExtraBold', fontSize: 20, color: colors.text },
  badge:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 4 },
  badgeTxt:  { fontFamily: 'Poppins_700Bold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  youBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  youBadgeTxt:{ fontFamily: 'Poppins_700Bold', fontSize: 9, letterSpacing: 0.5 },
  
  divider:  { height: 1, backgroundColor: colors.border, marginVertical: 14 },

  sectionTitle: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: colors.text, marginBottom: 12, marginLeft: 4 },
  descTxt:      { fontFamily: 'Poppins_400Regular', fontSize: 14, color: colors.text, lineHeight: 22 },

  halfCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2
  },
  halfVal: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: colors.text },
  halfLbl: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: colors.textMuted },

  avatarSmall:    { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarSmallTxt: { fontFamily: 'Poppins_800ExtraBold', fontSize: 16, color: '#FFF' },

  iconBox: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  
  checklistCard: { borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1 },
  checklistTitle:{ fontFamily: 'Poppins_500Medium', fontSize: 12, color: colors.text, marginBottom: 8 },
  checklistItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  checklistTxt:  { fontFamily: 'Poppins_400Regular', fontSize: 12, color: colors.textMuted },

  editCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 30, paddingVertical: 16, marginTop: 8,
    shadowColor: colors.brandDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  editCtaTxt: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: '#FFF' },
});
