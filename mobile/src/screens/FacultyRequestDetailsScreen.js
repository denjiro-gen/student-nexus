import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Linking, Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—';

export default function FacultyRequestDetailsScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const s = getStyles(colors, isDark);
  const { request } = route.params || {};

  const STATUS = {
    pending:  { label: 'Pending Review', color: colors.warning, bg: colors.warningLight,  icon: 'clock'        },
    approved: { label: 'Approved',       color: colors.success, bg: colors.successLight, icon: 'check-circle' },
    rejected: { label: 'Rejected',       color: colors.error,   bg: colors.errorLight,  icon: 'x-circle'     },
  };

  const st = STATUS[request?.status] || STATUS.pending;

  if (!request) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ fontFamily: 'Poppins_600SemiBold', color: colors.textMuted }}>Request not found.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ fontFamily: 'Poppins_600SemiBold', color: colors.brand }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.surface} />

      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Request Details</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>

        <View style={[s.statusBanner, { backgroundColor: st.bg }]}>
          <Feather name={st.icon} size={16} color={st.color} />
          <Text style={[s.statusTxt, { color: st.color }]}>{st.label}</Text>
        </View>

        <View style={s.card}>
          <Text style={s.requestTitle}>{request.title}</Text>
          <Text style={s.dateSubmitted}>
            Submitted {request.created_at ? fmtDate(request.created_at) : '—'}
          </Text>
        </View>

        <Text style={s.sectionLabel}>Justification / Description</Text>
        <View style={s.card}>
          <Text style={s.descText}>{request.description || 'No description provided.'}</Text>
        </View>

        {!!request.review_notes && (
          <>
            <Text style={s.sectionLabel}>OSAS Feedback</Text>
            <View style={[s.card, { borderColor: colors.error, borderWidth: 1, backgroundColor: isDark ? 'rgba(239,68,68,0.08)' : '#FEF2F2' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Feather name="alert-circle" size={14} color={colors.error} />
                <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 12, color: colors.error }}>OSAS Remarks</Text>
              </View>
              <Text style={[s.descText, { color: isDark ? '#FCA5A5' : '#991B1B' }]}>{request.review_notes}</Text>
            </View>
          </>
        )}

        <Text style={s.sectionLabel}>Supporting Document</Text>
        {request.document_url ? (
          <TouchableOpacity
            style={s.docCard}
            onPress={() => Linking.openURL(request.document_url).catch(() => Alert.alert('Error', 'Cannot open this file.'))}
            activeOpacity={0.8}
          >
            <View style={s.docIconBox}><Feather name="file-text" size={20} color={colors.brand} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.docTxt}>Supporting Document</Text>
              <Text style={s.docSub}>Tap to view</Text>
            </View>
            <Feather name="external-link" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ) : (
          <View style={s.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Feather name="file-text" size={16} color={colors.textMuted} />
              <Text style={[s.descText, { color: colors.textMuted }]}>No document attached to this request.</Text>
            </View>
          </View>
        )}

        {request.status === 'pending' && (
          <View style={s.pendingNote}>
            <Feather name="info" size={14} color={colors.textMuted} />
            <Text style={s.pendingNoteTxt}>This request is currently being reviewed by OSAS. You will receive a notification once a decision has been made.</Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const getStyles = (colors, isDark) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: 54, paddingBottom: 14, paddingHorizontal: 20, backgroundColor: colors.surface,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
  },
  backBtn: { padding: 4, width: 36 },
  headerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 17, color: colors.text },
  body: { padding: 18, paddingBottom: 48 },
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 12, padding: 14, marginBottom: 16,
  },
  statusTxt: { fontFamily: 'Poppins_700Bold', fontSize: 14 },
  card: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 18, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  requestTitle: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: colors.text, marginBottom: 6 },
  dateSubmitted: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: colors.textMuted },
  sectionLabel: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: colors.text, marginBottom: 10, marginLeft: 4 },
  descText: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: colors.text, lineHeight: 22 },
  docCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  docIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.brandLight, alignItems: 'center', justifyContent: 'center' },
  docTxt: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: colors.text },
  docSub: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: colors.textMuted, marginTop: 2 },
  pendingNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F9FAFB', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.border,
  },
  pendingNoteTxt: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: colors.textMuted, flex: 1, lineHeight: 18 },
});
