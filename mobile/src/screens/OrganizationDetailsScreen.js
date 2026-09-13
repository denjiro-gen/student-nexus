import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, StatusBar, Image, Alert, TextInput
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../context/AuthContext';
import { organizationAPI, authAPI, orgAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function OrganizationDetailsScreen({ route, navigation }) {
  const { orgId } = route.params;
  const { user, userProfile } = useAuth();
  const { colors, isDark } = useTheme();
  
  const [org, setOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [editMission, setEditMission] = useState('');
  const [editVision, setEditVision] = useState('');
  const [editBackground, setEditBackground] = useState('');
  const [editAdvisor, setEditAdvisor] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [complianceRate, setComplianceRate] = useState(null);

  useEffect(() => {
    loadDetails();
  }, [orgId]);

  const loadDetails = async () => {
    try {
      setLoading(true);
      const [orgRes, memRes, userRes] = await Promise.all([
        organizationAPI.getOrganization(orgId),
        organizationAPI.getOrgMembers(orgId),
        authAPI.getCurrentUser()
      ]);
      
      if (orgRes.error) throw orgRes.error;
      setOrg(orgRes.data);
      setEditMission(orgRes.data.mission || '');
      setEditVision(orgRes.data.vision || '');
      setEditBackground(orgRes.data.background || '');
      setEditAdvisor(orgRes.data.advisor_name || '');
      
      if (memRes.data) setMembers(memRes.data);
      if (userRes.data?.user) setCurrentUser(userRes.data.user);

      // compliance calculation
      const complianceRes = await orgAPI.getComplianceRequirements(orgId);
      if (complianceRes.data && complianceRes.data.length > 0) {
        const approved = complianceRes.data.filter(r => r.status === 'approved').length;
        setComplianceRate(Math.round((approved / complianceRes.data.length) * 100));
      } else {
        setComplianceRate(0);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to load organization details.');
    } finally {
      setLoading(false);
    }
  };

  const STATUS_CFG = {
    accredited: { color: colors.success,  bg: colors.successLight, label: 'Accredited' },
    pending:    { color: colors.warning, bg: colors.warningLight,  label: 'Pending'    },
    inactive:   { color: colors.error,   bg: colors.errorLight,  label: 'Inactive'   },
  };

  const s = getStyles(colors, isDark);

  if (loading) {
    return (
      <View style={[s.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  if (!org) {
    return (
      <View style={[s.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={s.title}>Organization not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.brand, fontFamily: 'Poppins_600SemiBold' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const cfg = STATUS_CFG[org.accreditation_status] || { color: colors.textMuted, bg: colors.border, label: org.accreditation_status || 'Unknown' };

  const handleSaveDetails = async () => {
    try {
      setSaving(true);
      const updates = {
        mission: editMission,
        vision: editVision,
        background: editBackground,
        advisor_name: editAdvisor,
      };
      const { data, error } = await organizationAPI.updateOrganizationDetails(orgId, updates);
      if (error) throw error;
      setOrg(prev => ({ ...prev, ...data }));
      setIsEditing(false);
      Alert.alert('Success', 'Organization details updated.');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save details.');
    } finally {
      setSaving(false);
    }
  };

  const handlePickLogo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled === false && result.assets?.length > 0) {
        const file = result.assets[0];
        setUploadingLogo(true);
        const { publicUrl, error } = await organizationAPI.uploadOrganizationLogo(orgId, file.uri, file.name, file.mimeType);
        if (error) {
          Alert.alert('Upload Failed', error.message || 'Could not upload logo.');
        } else if (publicUrl) {
          setOrg(prev => ({ ...prev, logo_url: publicUrl }));
          Alert.alert('Success', 'Organization logo updated.');
        }
        setUploadingLogo(false);
      }
    } catch (e) {
      console.warn('Document picker error:', e);
      setUploadingLogo(false);
    }
  };

  const handlePickBackground = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled === false && result.assets?.length > 0) {
        const file = result.assets[0];
        setUploadingBg(true);
        const { publicUrl, error } = await organizationAPI.uploadOrganizationBackground(orgId, file.uri, file.name, file.mimeType);
        if (error) {
          Alert.alert('Upload Failed', error.message || 'Could not upload background image.');
        } else if (publicUrl) {
          setOrg(prev => ({ ...prev, background_image_url: publicUrl }));
          Alert.alert('Success', 'Organization background updated.');
        }
        setUploadingBg(false);
      }
    } catch (e) {
      console.warn('Document picker error:', e);
      setUploadingBg(false);
    }
  };

  const currentUserId = user?.id || currentUser?.id;
  const currentUserEmail = user?.email || currentUser?.email;

  const isAuthorizedLeader = members.some(m => {
    const memberId = m.user?.id;
    const memberEmail = m.user?.email;
    const isMatch = (memberId && memberId === currentUserId) ||
                    (memberEmail && memberEmail === currentUserEmail);
    const isLeaderRole = ['President', 'Vice President', 'Vice-President', 'Secretary', 'Treasurer'].includes(m.position);
    return isMatch && isLeaderRole;
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.surface} />
      
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.8}>
          <Feather name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{org.acronym || 'Details'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        
        <View style={s.bannerCard}>
          {org.background_image_url ? (
             <Image source={{ uri: org.background_image_url }} style={s.bannerBg} resizeMode="cover" />
          ) : (
             <View style={s.bannerBgPlaceholder} />
          )}
          
          {isAuthorizedLeader && (
            <TouchableOpacity 
              style={s.bgUploadBtn}
              onPress={handlePickBackground}
              disabled={uploadingBg}
            >
              {uploadingBg ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Feather name="image" size={16} color="#FFF" />
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={s.avatar} 
            activeOpacity={isAuthorizedLeader ? 0.7 : 1}
            onPress={isAuthorizedLeader ? handlePickLogo : undefined}
            disabled={uploadingLogo}
          >
            {uploadingLogo ? (
              <ActivityIndicator color={colors.brand} />
            ) : org.logo_url ? (
              <Image source={{ uri: org.logo_url }} style={{ width: 80, height: 80, borderRadius: 20 }} resizeMode="cover" />
            ) : (
              <Text style={s.avatarTxt}>{org.name?.substring(0, 2).toUpperCase()}</Text>
            )}
            {isAuthorizedLeader && !uploadingLogo && (
              <View style={s.cameraIcon}>
                <Feather name="camera" size={14} color={colors.brand} />
              </View>
            )}
          </TouchableOpacity>
          <Text style={s.orgName}>{org.name}</Text>
          <View style={[s.badge, { backgroundColor: cfg.bg }]}>
            <Text style={[s.badgeTxt, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        <View style={s.actionRow}>
          {isAuthorizedLeader && !isEditing && (
             <TouchableOpacity style={s.editBtn} onPress={() => setIsEditing(true)}>
               <Feather name="edit-3" size={14} color="#FFF" />
               <Text style={s.editBtnTxt}>Edit Details</Text>
             </TouchableOpacity>
          )}
          {isEditing && (
            <>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setIsEditing(false)}>
                <Text style={s.cancelBtnTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={handleSaveDetails} disabled={saving}>
                <Text style={s.saveBtnTxt}>{saving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* DETAILS SECTION */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>About</Text>
          <Text style={s.descTxt}>{org.description || 'No description available.'}</Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Mission</Text>
          {isEditing ? (
            <TextInput
              style={s.inputMulti}
              multiline
              value={editMission}
              onChangeText={setEditMission}
              placeholder="Enter organization mission"
              placeholderTextColor={colors.textMuted}
            />
          ) : (
            <Text style={s.descTxt}>{org.mission || 'Not specified'}</Text>
          )}
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Vision</Text>
          {isEditing ? (
            <TextInput
              style={s.inputMulti}
              multiline
              value={editVision}
              onChangeText={setEditVision}
              placeholder="Enter organization vision"
              placeholderTextColor={colors.textMuted}
            />
          ) : (
            <Text style={s.descTxt}>{org.vision || 'Not specified'}</Text>
          )}
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Background</Text>
          {isEditing ? (
            <TextInput
              style={s.inputMulti}
              multiline
              value={editBackground}
              onChangeText={setEditBackground}
              placeholder="Enter historical background"
              placeholderTextColor={colors.textMuted}
            />
          ) : (
            <Text style={s.descTxt}>{org.background || 'Not specified'}</Text>
          )}
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Faculty Advisor</Text>
          {isEditing ? (
            <TextInput
              style={s.inputSingle}
              value={editAdvisor}
              onChangeText={setEditAdvisor}
              placeholder="Advisor name"
              placeholderTextColor={colors.textMuted}
            />
          ) : (
            <View style={s.advisorRow}>
              <View style={s.advisorIcon}>
                <Feather name="user" size={16} color={colors.brand} />
              </View>
              <Text style={s.advisorTxt}>{org.advisor_name || 'Not assigned'}</Text>
            </View>
          )}
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Compliance Status</Text>
          <View style={s.complianceBox}>
            <View style={s.compRow}>
              <Text style={s.compLbl}>Semester Requirements</Text>
              <Text style={s.compVal}>{complianceRate}%</Text>
            </View>
            <View style={s.compBarBg}>
              <View style={[s.compBarFg, { width: `${complianceRate || 0}%`, backgroundColor: (complianceRate >= 100) ? colors.success : (complianceRate > 50 ? colors.brand : colors.warning) }]} />
            </View>
          </View>
        </View>

        <View style={s.section}>
          <View style={s.rowBetween}>
            <Text style={s.sectionTitle}>Leadership & Members</Text>
            <Text style={s.memberCount}>{members.length} Members</Text>
          </View>
          
          {members.length === 0 ? (
            <Text style={s.descTxt}>No members found.</Text>
          ) : (
            members.map((m, i) => (
              <View key={m.id || i} style={s.memberRow}>
                <View style={s.memAvatar}>
                  <Text style={s.memInit}>
                    {(m.user?.full_name || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.memName}>{m.user?.full_name || 'Unknown'}</Text>
                  <Text style={s.memPos}>{m.position}</Text>
                </View>
              </View>
            ))
          )}
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const getStyles = (colors, isDark) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, paddingTop: 50, paddingBottom: 16, paddingHorizontal: 24,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: colors.text, flex: 1, textAlign: 'center' },

  content: { padding: 20 },
  
  bannerCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 20, paddingTop: 40, alignItems: 'center', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, overflow: 'hidden' },
  bannerBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 100, opacity: 0.8 },
  bannerBgPlaceholder: { position: 'absolute', top: 0, left: 0, right: 0, height: 100, backgroundColor: colors.brandLight },
  bgUploadBtn: { position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  
  avatar: { width: 80, height: 80, borderRadius: 20, backgroundColor: colors.brandLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 3, borderColor: colors.surface, marginTop: 20, zIndex: 5 },
  avatarTxt: { fontFamily: 'Poppins_800ExtraBold', fontSize: 28, color: colors.brand },
  cameraIcon: { position: 'absolute', bottom: -5, right: -5, backgroundColor: colors.surface, borderRadius: 12, padding: 4, elevation: 2 },
  
  orgName: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: colors.text, textAlign: 'center', marginBottom: 12 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  badgeTxt: { fontFamily: 'Poppins_600SemiBold', fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' },

  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16, gap: 10 },
  editBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.brand, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 6 },
  editBtnTxt: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: '#FFF' },
  cancelBtn: { backgroundColor: colors.border, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  cancelBtnTxt: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: colors.text },
  saveBtn: { backgroundColor: colors.success, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveBtnTxt: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: '#FFF' },

  section: { backgroundColor: colors.surface, padding: 20, borderRadius: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  sectionTitle: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: colors.text, marginBottom: 12 },
  descTxt: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: colors.textMuted, lineHeight: 22 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  memberCount: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: colors.brand },

  inputMulti: { backgroundColor: colors.background, borderRadius: 12, padding: 12, fontFamily: 'Poppins_400Regular', fontSize: 14, color: colors.text, minHeight: 80, textAlignVertical: 'top' },
  inputSingle: { backgroundColor: colors.background, borderRadius: 12, padding: 12, fontFamily: 'Poppins_400Regular', fontSize: 14, color: colors.text },

  advisorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  advisorIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.brandLight, alignItems: 'center', justifyContent: 'center' },
  advisorTxt: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: colors.text },

  complianceBox: { backgroundColor: colors.background, borderRadius: 12, padding: 16 },
  compRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  compLbl: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: colors.text },
  compVal: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: colors.text },
  compBarBg: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  compBarFg: { height: '100%', borderRadius: 4 },

  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  memAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brandLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  memInit: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: colors.brand },
  memName: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: colors.text },
  memPos: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: colors.textMuted },
});
