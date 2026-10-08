import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, RefreshControl,
  Alert, StatusBar, Animated, Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { portfolioAPI, userAPI, eventAPI } from '../services/api';
import { supabase } from '../config/supabase';
import { useTheme } from '../context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';

function InfoRow({ icon, label, value, last, colors }) {
  return (
    <>
      <View style={ir.row}>
        <View style={[ir.iconWrap, { backgroundColor: colors.brandLight }]}>
          <Feather name={icon} size={15} color={colors.brand} />
        </View>
        <View style={ir.body}>
          <Text style={[ir.label, { color: colors.textMuted }]}>{label}</Text>
          <Text style={[ir.value, { color: colors.text }]}>{value || '—'}</Text>
        </View>
      </View>
      {!last && <View style={[ir.divider, { backgroundColor: colors.border }]} />}
    </>
  );
}
const ir = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  iconWrap:{ width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  body:    { flex: 1 },
  label:   { fontFamily: 'Poppins_600SemiBold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  value:   { fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
  divider: { height: 1, marginLeft: 50 },
});

function ActionRow({ icon, label, iconColor, bg, onPress, danger, badge, colors }) {
  const defaultIconColor = danger ? colors.error : (iconColor || colors.brand);
  const defaultBg = danger ? colors.errorLight : (bg || colors.brandLight);
  return (
    <TouchableOpacity style={[ar.row, { backgroundColor: colors.surface, shadowColor: '#000' }, danger && { backgroundColor: colors.errorLight }]} onPress={onPress} activeOpacity={0.7}>
      <View style={[ar.iconWrap, { backgroundColor: defaultBg }]}>
        <Feather name={icon} size={16} color={defaultIconColor} />
      </View>
      <Text style={[ar.label, { color: colors.text }, danger && { color: colors.error }]}>{label}</Text>
      {badge !== undefined ? (
        <View style={[ar.badge, { backgroundColor: colors.error }]}>
          <Text style={ar.badgeTxt}>{badge}</Text>
        </View>
      ) : null}
      {!danger && <Feather name="chevron-right" size={16} color={colors.textMuted} />}
    </TouchableOpacity>
  );
}
const ar = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, marginBottom: 10, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  iconWrap:  { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  label:     { fontFamily: 'Poppins_600SemiBold', flex: 1, fontSize: 14 },
  badge:     { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, marginRight: 8 },
  badgeTxt:  { fontFamily: 'Poppins_700Bold', fontSize: 10, color: '#FFF' },
});

export default function ProfileScreen({ navigation }) {
  const { colors, isDark, mode, changeThemeMode } = useTheme();
  const s = getStyles(colors, isDark);
  const { user, userProfile, signOut } = useAuth();
  
  const [refreshing, setRefreshing]   = useState(false);
  const [stats, setStats]             = useState({ portfolioCount: 0, orgCount: 0, eventsCount: 0 });
  const [myOrgs, setMyOrgs]           = useState([]);
  const [avatarUri, setAvatarUri]     = useState(null);  // local override after upload
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const headerAnim = useRef(new Animated.Value(0)).current;

  // Edit Profile / Password State
  const [isEditProfileVisible, setIsEditProfileVisible] = useState(false);
  const [isChangePasswordVisible, setIsChangePasswordVisible] = useState(false);
  const [isAppearanceVisible, setIsAppearanceVisible] = useState(false);
  const [editName, setEditName]       = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving]       = useState(false);

  useEffect(() => {
    if (userProfile) setEditName(userProfile.full_name || '');
  }, [userProfile]);

  useEffect(() => {
    loadStats();
    Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const loadStats = async () => {
    try {
      const uid = userProfile?.user_id || userProfile?.id || user?.id;
      if (!uid) return;

      const [portfolioRes, orgRes, eventsRes] = await Promise.all([
        portfolioAPI.getStudentAchievements(uid),
        userAPI.getUserOrganizations(uid),
        eventAPI.getEventsByUser(uid),
      ]);

      setMyOrgs(orgRes?.data || []);
      setStats({
        portfolioCount: portfolioRes?.data?.length || 0,
        orgCount:       orgRes?.data?.length       || 0,
        eventsCount:    eventsRes?.data?.length    || 0,
      });
    } catch (e) { console.error('Profile stats error:', e); }
  };

  const onRefresh = async () => { setRefreshing(true); await loadStats(); setRefreshing(false); };

  // ── Profile Picture Upload ───────────────────────────────────────────────
  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow photo library access to change your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.75,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const asset  = result.assets[0];
        const userId = userProfile?.user_id || userProfile?.id || user?.id;
        if (!userId) return;

        setUploadingAvatar(true);
        // Extract filename and mime from URI
        const uriParts = asset.uri.split('.');
        const ext      = (uriParts[uriParts.length - 1] || 'jpg').toLowerCase();
        const mime     = ext === 'png' ? 'image/png' : 'image/jpeg';
        const fileName = `avatar.${ext}`;

        const { publicUrl, error } = await userAPI.uploadProfilePicture(userId, asset.uri, fileName, mime);

        if (error) {
          Alert.alert('Upload Failed', error.message || 'Could not upload profile picture.');
        } else {
          setAvatarUri(publicUrl);   // immediately reflect change in UI
          Alert.alert('✅ Updated', 'Your profile picture has been updated successfully!');
        }
        setUploadingAvatar(false);
      }
    } catch (err) {
      setUploadingAvatar(false);
      Alert.alert('Error', err.message || 'Failed to pick image.');
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => await signOut() },
    ]);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }
    setIsSaving(true);
    const { error } = await userAPI.updateProfile(userProfile.user_id || userProfile.id, { full_name: editName });
    setIsSaving(false);
    if (error) {
      Alert.alert('Error', 'Failed to update profile.');
    } else {
      Alert.alert('Success', 'Profile updated successfully.');
      setIsEditProfileVisible(false);
      onRefresh();
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long.');
      return;
    }
    setIsSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsSaving(false);
    if (error) {
      Alert.alert('Error', error.message || 'Failed to change password.');
    } else {
      Alert.alert('Success', 'Password changed successfully.');
      setIsChangePasswordVisible(false);
      setNewPassword('');
    }
  };

  const displayName = userProfile?.full_name || user?.email?.split('@')[0] || 'Student';
  const initial     = displayName.charAt(0).toUpperCase();
  const displayRole = myOrgs[0]?.position || userProfile?.role?.replace(/_/g, ' ') || 'student';

  // Resolve avatar: local override > db profile_picture_url > null (initials)
  const profilePicUrl = avatarUri || userProfile?.profile_picture_url || null;

  const joinedDate = userProfile?.created_at
    ? new Date(userProfile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : null;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brand} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
      >
        <Animated.View style={[s.header, { opacity: headerAnim }]}>
          <View style={s.ring1} />
          <View style={s.ring2} />

          {/* Tappable Avatar with upload overlay */}
          <TouchableOpacity
            style={s.avatarOuter}
            onPress={handlePickAvatar}
            activeOpacity={0.8}
            disabled={uploadingAvatar}
          >
            {profilePicUrl ? (
              <Image source={{ uri: profilePicUrl }} style={s.avatarImage} />
            ) : (
              <View style={s.avatarInner}>
                <Text style={s.avatarTxt}>{initial}</Text>
              </View>
            )}

            {/* Upload overlay */}
            <View style={s.avatarEditBadge}>
              {uploadingAvatar
                ? <ActivityIndicator size="small" color="#FFF" />
                : <Feather name="camera" size={13} color="#FFF" />
              }
            </View>
          </TouchableOpacity>

          <Text style={s.name}>{displayName}</Text>
          <Text style={s.email}>{user?.email || '—'}</Text>

          <View style={s.badgeRow}>
            <View style={s.roleBadge}>
              <Feather name="shield" size={11} color="#FFF" />
              <Text style={s.roleTxt}>{displayRole.toUpperCase()}</Text>
            </View>
            {joinedDate && (
              <View style={s.joinBadge}>
                <Feather name="clock" size={11} color="rgba(255,255,255,0.85)" />
                <Text style={s.joinTxt}>Joined {joinedDate}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={s.changePicBtn} onPress={handlePickAvatar} disabled={uploadingAvatar} activeOpacity={0.8}>
            <Feather name="upload" size={11} color="rgba(255,255,255,0.9)" />
            <Text style={s.changePicTxt}>{uploadingAvatar ? 'Uploading...' : 'Change Photo'}</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={s.statsRow}>
          {[
            { label: 'Events',    val: stats.eventsCount,    icon: 'calendar' },
            { label: 'Portfolio', val: stats.portfolioCount, icon: 'award'   },
          ].map(st => (
            <View key={st.label} style={s.statCard}>
              <View style={s.statIconBox}>
                <Feather name={st.icon} size={15} color={colors.brand} />
              </View>
              <Text style={s.statVal}>{st.val}</Text>
              <Text style={s.statLbl}>{st.label}</Text>
            </View>
          ))}
        </View>

        <View style={s.body}>
          <Text style={s.sectionTitle}>Account Information</Text>
          <View style={s.card}>
            <InfoRow colors={colors} icon="user"     label="Full Name"   value={userProfile?.full_name} />
            <InfoRow colors={colors} icon="mail"     label="Email"      value={user?.email} />
            <InfoRow colors={colors} icon="shield"   label="Role"       value={displayRole} />
            <InfoRow colors={colors} icon="calendar" label="Member Since" value={joinedDate} last />
          </View>

          {/* My Organizations */}
          {myOrgs.length > 0 && (
            <>
              <Text style={s.sectionTitle}>My Organizations</Text>
              {myOrgs.map((mem, i) => (
                <ActionRow
                  key={mem.id || i}
                  colors={colors}
                  icon="users"
                  label={`${mem.organization?.name || 'Organization'}${mem.position ? ' (' + mem.position + ')' : ''}`}
                  onPress={() => navigation.navigate('OrganizationDetails', { orgId: mem.organization?.id })}
                />
              ))}
            </>
          )}

          <Text style={s.sectionTitle}>Holistic Record</Text>
          <ActionRow
            colors={colors}
            icon="award"
            label="My Portfolio & Certifications"
            onPress={() => navigation.navigate('Portfolio')}
            badge={stats.portfolioCount || undefined}
          />
          <ActionRow
            colors={colors}
            icon="archive"
            label="Organization Repository"
            onPress={() => navigation.navigate('Repository')}
            iconColor="#6366F1"
            bg={isDark ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF'}
          />

          <Text style={s.sectionTitle}>Settings</Text>
          <ActionRow
            colors={colors}
            icon="moon"
            label="Appearance"
            onPress={() => setIsAppearanceVisible(true)}
          />
          <ActionRow
            colors={colors}
            icon="camera"
            label="Change Profile Picture"
            onPress={handlePickAvatar}
            iconColor="#F59E0B"
            bg={isDark ? 'rgba(245,158,11,0.15)' : '#FEF3C7'}
          />
          <ActionRow
            colors={colors}
            icon="edit-2"
            label="Edit Profile"
            onPress={() => setIsEditProfileVisible(true)}
          />
          <ActionRow
            colors={colors}
            icon="lock"
            label="Change Password"
            onPress={() => setIsChangePasswordVisible(true)}
          />

          <View style={{ marginTop: 8 }}>
            <ActionRow
              colors={colors}
              icon="log-out"
              label="Sign Out"
              danger
              onPress={handleSignOut}
            />
          </View>

          <Text style={s.version}>Student Nexus · Colegio De Montalban</Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={isEditProfileVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setIsEditProfileVisible(false)}>
                <Feather name="x" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={s.inputLabel}>Full Name</Text>
            <TextInput
              style={s.textInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Enter your full name"
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity style={s.saveBtn} onPress={handleSaveProfile} disabled={isSaving}>
              <Text style={s.saveBtnTxt}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={isChangePasswordVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setIsChangePasswordVisible(false)}>
                <Feather name="x" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={s.inputLabel}>New Password</Text>
            <TextInput
              style={s.textInput}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
            />
            <TouchableOpacity style={s.saveBtn} onPress={handleChangePassword} disabled={isSaving}>
              <Text style={s.saveBtnTxt}>{isSaving ? 'Updating...' : 'Update Password'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Appearance Modal */}
      <Modal visible={isAppearanceVisible} animationType="fade" transparent={true}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Appearance</Text>
              <TouchableOpacity onPress={() => setIsAppearanceVisible(false)}>
                <Feather name="x" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            {['system', 'light', 'dark'].map((m) => (
              <TouchableOpacity
                key={m}
                style={[s.themeOption, mode === m && s.themeOptionSelected]}
                onPress={() => { changeThemeMode(m); setIsAppearanceVisible(false); }}
              >
                <Feather name={m === 'system' ? 'smartphone' : m === 'light' ? 'sun' : 'moon'} size={20} color={mode === m ? colors.brand : colors.textMuted} />
                <Text style={[s.themeOptionTxt, mode === m && { color: colors.brand }]}>
                  {m === 'system' ? 'System Default' : m === 'light' ? 'Light Mode' : 'Dark Mode'}
                </Text>
                {mode === m && <Feather name="check" size={20} color={colors.brand} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors, isDark) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.brand,
    paddingTop: 60, paddingBottom: 50,
    paddingHorizontal: 24,
    alignItems: 'center',
    overflow: 'hidden',
  },
  ring1: { position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', top: -60, right: -50 },
  ring2: { position: 'absolute', width: 140, height: 140, borderRadius: 70,  borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', bottom: 10, left: -30 },

  // Avatar with photo support
  avatarOuter:     { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: 'rgba(255,255,255,0.38)', alignItems: 'center', justifyContent: 'center', marginBottom: 14, position: 'relative' },
  avatarInner:     { width: 82, height: 82, borderRadius: 41, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  avatarTxt:       { fontFamily: 'Poppins_800ExtraBold', fontSize: 32, color: colors.brand },
  avatarImage:     { width: 90, height: 90, borderRadius: 45 },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.brand,
    borderWidth: 2, borderColor: '#FFF',
    alignItems: 'center', justifyContent: 'center',
  },
  changePicBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)' },
  changePicTxt:    { fontFamily: 'Poppins_500Medium', fontSize: 11, color: 'rgba(255,255,255,0.9)' },

  name:  { fontFamily: 'Poppins_800ExtraBold', fontSize: 22, color: '#FFF', marginBottom: 4 },
  email: { fontFamily: 'Poppins_400Regular',   fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 14 },
  badgeRow:  { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.20)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  roleTxt:   { fontFamily: 'Poppins_700Bold', fontSize: 11, color: '#FFF', letterSpacing: 0.5 },
  joinBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  joinTxt:   { fontFamily: 'Poppins_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.85)' },

  statsRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: -28, gap: 12 },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 18, paddingVertical: 14, alignItems: 'center', shadowColor: colors.brandDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.16, shadowRadius: 10, elevation: 6 },
  statIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.brandLight, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statVal:  { fontFamily: 'Poppins_800ExtraBold', fontSize: 20, color: colors.text, marginBottom: 2 },
  statLbl:  { fontFamily: 'Poppins_400Regular', fontSize: 11, color: colors.textMuted },

  body:         { padding: 20, paddingTop: 28 },
  sectionTitle: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: colors.text, marginBottom: 12, marginTop: 4 },
  card: { backgroundColor: colors.surface, borderRadius: 18, paddingHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, marginBottom: 22 },
  version: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 8, marginBottom: 20 },
  
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent:  { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  modalHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle:    { fontFamily: 'Poppins_700Bold', fontSize: 18, color: colors.text },
  inputLabel:    { fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: colors.text, marginBottom: 8 },
  textInput:     { backgroundColor: colors.background, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontFamily: 'Poppins_400Regular', fontSize: 14, color: colors.text, marginBottom: 24 },
  saveBtn:       { backgroundColor: colors.brand, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnTxt:    { fontFamily: 'Poppins_700Bold', fontSize: 14, color: '#FFF' },

  themeOption:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, borderRadius: 12, marginBottom: 8, backgroundColor: colors.background },
  themeOptionSelected: { backgroundColor: colors.brandLight, borderWidth: 1, borderColor: colors.brand },
  themeOptionTxt:      { flex: 1, fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: colors.text, marginLeft: 12 },
});
