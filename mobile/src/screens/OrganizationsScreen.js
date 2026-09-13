import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl,
  TextInput, Alert, StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { organizationAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const FILTERS = [
  { key: 'all',        label: 'All'        },
  { key: 'accredited', label: 'Accredited' },
  { key: 'pending',    label: 'Pending'    },
];

function OrgCard({ org, onPress, colors, isDark }) {
  const STATUS_CFG = {
    accredited: { color: colors.success,  bg: colors.successLight, label: 'Accredited' },
    pending:    { color: colors.warning, bg: colors.warningLight,  label: 'Pending'    },
    inactive:   { color: colors.error,   bg: colors.errorLight,  label: 'Inactive'   },
  };
  
  const cfg = STATUS_CFG[org.accreditation_status] || { color: colors.textMuted, bg: colors.background, label: 'Unknown' };
  
  const orgName = org.org_name || org.name || 'Unnamed';
  const initials = orgName.substring(0, 2).toUpperCase();

  return (
    <TouchableOpacity style={[oc.card, { backgroundColor: colors.surface }]} onPress={onPress} activeOpacity={0.8}>
      <View style={oc.header}>
        <View style={[oc.avatar, { backgroundColor: colors.brandLight }]}>
          <Text style={[oc.avatarTxt, { color: colors.brand }]}>{initials}</Text>
        </View>
        <View style={oc.info}>
          <Text style={[oc.name, { color: colors.text }]} numberOfLines={1}>{orgName}</Text>
          <Text style={[oc.compStat, { color: colors.textMuted }]}>Compliance: {org.compliance_status || 'N/A'}</Text>
        </View>
        <View style={[oc.badge, { backgroundColor: cfg.bg }]}>
          <Text style={[oc.badgeTxt, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      <View style={[oc.statsRow, { backgroundColor: colors.background }]}>
        <View style={oc.statItem}>
          <Feather name="users" size={14} color={colors.brand} />
          <Text style={[oc.statVal, { color: colors.text }]}>{org.member_count?.length ?? org.member_count ?? 0}</Text>
          <Text style={[oc.statLbl, { color: colors.textMuted }]}>Members</Text>
        </View>
        <View style={[oc.statDivider, { backgroundColor: colors.border }]} />
        <View style={oc.statItem}>
          <Feather name="calendar" size={14} color={colors.brand} />
          <Text style={[oc.statVal, { color: colors.text }]}>{org.event_count?.length ?? org.event_count ?? 0}</Text>
          <Text style={[oc.statLbl, { color: colors.textMuted }]}>Events</Text>
        </View>
        <View style={[oc.statDivider, { backgroundColor: colors.border }]} />
        <View style={oc.statItem}>
          <Feather name="shield" size={14} color={colors.brand} />
          <Text style={[oc.statVal, { color: colors.text }]}>{org.accreditation_status === 'accredited' ? '✓' : '–'}</Text>
          <Text style={[oc.statLbl, { color: colors.textMuted }]}>Status</Text>
        </View>
      </View>

      <TouchableOpacity style={[oc.detailBtn, { backgroundColor: colors.brandLight }]} onPress={onPress}>
        <Text style={[oc.detailTxt, { color: colors.brand }]}>View Details</Text>
        <Feather name="arrow-right" size={13} color={colors.brand} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const oc = StyleSheet.create({
  card:       { borderRadius: 18, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  header:     { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  avatar:     { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarTxt:  { fontFamily: 'Poppins_800ExtraBold', fontSize: 15 },
  info:       { flex: 1, marginRight: 8 },
  name:       { fontFamily: 'Poppins_700Bold', fontSize: 15, marginBottom: 2 },
  compStat:   { fontFamily: 'Poppins_400Regular', fontSize: 11 },
  badge:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeTxt:   { fontFamily: 'Poppins_700Bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.3 },
  statsRow:   { flexDirection: 'row', borderRadius: 12, paddingVertical: 12, marginBottom: 14 },
  statItem:   { flex: 1, alignItems: 'center', gap: 3 },
  statVal:    { fontFamily: 'Poppins_700Bold', fontSize: 14 },
  statLbl:    { fontFamily: 'Poppins_400Regular', fontSize: 10 },
  statDivider:{ width: 1 },
  detailBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 12 },
  detailTxt:  { fontFamily: 'Poppins_700Bold', fontSize: 13 },
});

export default function OrganizationsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const s = getStyles(colors, isDark);
  
  const [organizations, setOrganizations] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [searchQuery,   setSearch]        = useState('');
  const [filter,        setFilter]        = useState('all');

  useEffect(() => { loadOrganizations(); }, []);

  const loadOrganizations = async () => {
    try {
      const { data, error } = await organizationAPI.getAllOrganizations();
      if (error) throw error;
      setOrganizations(data || []);
    } catch (e) {
      console.error('Orgs error:', e);
      Alert.alert('Error', 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => { setRefreshing(true); await loadOrganizations(); setRefreshing(false); };

  const handleViewDetails = (org) => {
    const id = org.org_id || org.id;
    if (id) {
      navigation.navigate('OrganizationDetails', { orgId: id });
    } else {
      Alert.alert('Error', 'Organization ID missing');
    }
  };

  const filtered = organizations.filter(org => {
    const orgName = org.org_name || org.name || '';
    const matchSearch = !searchQuery.trim() ||
      orgName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchFilter = filter === 'all' || org.accreditation_status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brand} />

      <View style={s.header}>
        <Text style={s.headerTitle}>Organizations</Text>
        <Text style={s.headerSub}>{filtered.length} listed</Text>
      </View>

      <View style={s.searchWrap}>
        <Feather name="search" size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={s.searchInput}
          placeholder="Search by name..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearch}
        />
        {!!searchQuery && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Feather name="x" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
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
        renderItem={({ item }) => (
          <OrgCard org={item} onPress={() => handleViewDetails(item)} colors={colors} isDark={isDark} />
        )}
        keyExtractor={item => (item.org_id || item.id)?.toString()}
        contentContainerStyle={s.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={s.emptyIconBox}>
              <Feather name="users" size={36} color={colors.brand} />
            </View>
            <Text style={s.emptyTitle}>{searchQuery ? 'No results' : 'No organizations'}</Text>
            <Text style={s.emptyMsg}>{searchQuery ? 'Try a different name' : 'Organizations will appear here'}</Text>
          </View>
        }
      />
    </View>
  );
}

const getStyles = (colors, isDark) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.brand, paddingTop: 54, paddingBottom: 20, paddingHorizontal: 22, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, zIndex: 10 },
  headerTitle: { fontFamily: 'Poppins_800ExtraBold', fontSize: 26, color: '#FFF' },
  headerSub:   { fontFamily: 'Poppins_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, marginHorizontal: 16, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, marginVertical: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3 },
  searchInput: { flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 14, color: colors.text },

  filtersRow: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  chip:       { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipTxt:    { fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: colors.textMuted },
  chipTxtActive: { color: '#FFF' },

  listContent: { paddingHorizontal: 16, paddingBottom: 40 },

  empty:       { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyIconBox:{ width: 76, height: 76, borderRadius: 24, backgroundColor: colors.brandLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle:  { fontFamily: 'Poppins_700Bold', fontSize: 16, color: colors.text, marginBottom: 6 },
  emptyMsg:    { fontFamily: 'Poppins_400Regular', fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
