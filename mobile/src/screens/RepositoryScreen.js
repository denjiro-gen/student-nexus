import React, { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, StatusBar, Animated, Alert, Linking, Modal,
  TextInput, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../context/AuthContext';
import { orgAPI } from '../services/api';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../context/ThemeContext';

const DOC_TYPES = [
  { key: 'Constitution and By-Laws', icon: 'book', color: '#6366F1', bg: '#EEF2FF' },
  { key: 'Resolutions',              icon: 'file-text', color: '#F59E0B', bg: '#FEF3C7' },
  { key: 'Meeting Minutes',          icon: 'clipboard', color: '#EC4899', bg: '#FCE7F3' },
  { key: 'Financial Reports',        icon: 'dollar-sign', color: '#10B981', bg: '#D1FAE5' },
  { key: 'Other',                    icon: 'archive', color: '#6B7280', bg: '#F3F4F6' },
];

function DocTypeIcon({ typeKey, size = 20, isDark }) {
  const t = DOC_TYPES.find(d => d.key === typeKey) || DOC_TYPES[DOC_TYPES.length - 1];
  return (
    <View style={[ic.box, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : t.bg }]}>
      <Feather name={t.icon} size={size} color={isDark ? '#FFF' : t.color} />
    </View>
  );
}
const ic = StyleSheet.create({
  box: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});

function DocCard({ item, onDelete, colors, isDark }) {
  const t = DOC_TYPES.find(d => d.key === item.document_type) || DOC_TYPES[DOC_TYPES.length - 1];
  const date = new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <View style={[dc.card, { backgroundColor: colors.surface, shadowColor: '#000' }]}>
      <DocTypeIcon typeKey={item.document_type} isDark={isDark} />
      <View style={dc.body}>
        <Text style={[dc.title, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
        <Text style={[dc.type, { color: isDark ? '#FFF' : t.color }]}>{item.document_type}</Text>
        <Text style={[dc.date, { color: colors.textMuted }]}>{date}</Text>
      </View>
      <View style={dc.actions}>
        <TouchableOpacity style={dc.iconBtn} onPress={() => WebBrowser.openBrowserAsync(item.document_url)}>
          <Feather name="download" size={16} color={colors.brand} />
        </TouchableOpacity>
        <TouchableOpacity style={[dc.iconBtn, { marginTop: 4 }]} onPress={() => onDelete(item)}>
          <Feather name="trash-2" size={16} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
const dc = StyleSheet.create({
  card:    { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 14, marginBottom: 10, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  body:    { flex: 1, marginHorizontal: 12 },
  title:   { fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  type:    { fontFamily: 'Poppins_500Medium', fontSize: 11, marginTop: 2 },
  date:    { fontFamily: 'Poppins_400Regular', fontSize: 11, marginTop: 2 },
  actions: { alignItems: 'center' },
  iconBtn: { padding: 6 },
});

export default function RepositoryScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const s = getStyles(colors, isDark);

  const { user } = useAuth();
  const [org, setOrg] = useState(null);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('Constitution and By-Laws');
  const [selectedFile, setSelectedFile] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => { loadData(); }, [user?.id])
  );

  const loadData = async () => {
    if (!user?.id) return;
    try {
      const { data: orgData } = await orgAPI.getMyOrganization(user.id);
      if (orgData) {
        setOrg(orgData);
        const { data: docsData } = await orgAPI.getRepositoryDocuments(orgData.id);
        setDocs(docsData || []);
      }
    } catch (e) {
      console.error('Repository load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  };

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const pickFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });
    if (!res.canceled && res.assets?.length > 0) {
      setSelectedFile(res.assets[0]);
      if (!docTitle) setDocTitle(res.assets[0].name);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) { Alert.alert('No File', 'Please select a file first.'); return; }
    if (!docTitle.trim()) { Alert.alert('Missing Title', 'Please provide a document title.'); return; }
    if (!org) return;

    setUploading(true);
    try {
      const { error } = await orgAPI.uploadRepositoryDocument(
        org.id,
        selectedFile.uri,
        selectedFile.name,
        selectedFile.mimeType,
        docType,
        docTitle.trim(),
        user.id
      );
      if (error) throw error;
      Alert.alert('Uploaded', 'Document has been added to the repository.');
      setShowUpload(false);
      setDocTitle('');
      setSelectedFile(null);
      setDocType('Constitution and By-Laws');
      loadData();
    } catch (e) {
      Alert.alert('Upload Failed', e.message || 'An error occurred.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (item) => {
    Alert.alert('Delete Document', `Remove "${item.title}" from the repository?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const { error } = await orgAPI.deleteRepositoryDocument(item.id);
          if (error) {
            Alert.alert('Error', 'Could not delete document.');
          } else {
            loadData();
          }
        }
      }
    ]);
  };

  if (!loading && !org) {
    return (
      <View style={s.center}>
        <Feather name="archive" size={48} color={colors.textMuted} style={{ marginBottom: 16 }} />
        <Text style={s.centerTitle}>No Organization</Text>
        <Text style={s.centerTxt}>You are not assigned as a leader to any organization.</Text>
      </View>
    );
  }

  const grouped = DOC_TYPES.reduce((acc, t) => {
    acc[t.key] = docs.filter(d => d.document_type === t.key);
    return acc;
  }, {});

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brand} />

      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Organization Repository</Text>
          {org && <Text style={s.headerSub}>{org.name}</Text>}
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowUpload(true)}>
          <Feather name="plus" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        style={{ flex: 1, opacity: fadeAnim }}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
        showsVerticalScrollIndicator={false}
      >
        {DOC_TYPES.map(t => (
          grouped[t.key]?.length > 0 && (
            <View key={t.key} style={{ marginBottom: 20 }}>
              <View style={s.sectionHeader}>
                <View style={[s.secIconBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : t.bg }]}>
                  <Feather name={t.icon} size={14} color={isDark ? '#FFF' : t.color} />
                </View>
                <Text style={s.sectionTitle}>{t.key}</Text>
                <View style={s.countBadge}><Text style={s.countTxt}>{grouped[t.key].length}</Text></View>
              </View>
              {grouped[t.key].map(doc => (
                <DocCard key={doc.id} item={doc} onDelete={handleDelete} colors={colors} isDark={isDark} />
              ))}
            </View>
          )
        ))}
        {!loading && docs.length === 0 && (
          <View style={s.emptyWrap}>
            <Feather name="archive" size={48} color={colors.textMuted} style={{ marginBottom: 12 }} />
            <Text style={s.emptyTitle}>Repository is Empty</Text>
            <Text style={s.emptyTxt}>Tap the + button to start uploading official documents.</Text>
          </View>
        )}
      </Animated.ScrollView>

      <Modal visible={showUpload} animationType="slide" transparent>
        <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Upload Document</Text>
              <TouchableOpacity onPress={() => setShowUpload(false)}>
                <Feather name="x" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.fieldLabel}>Document Type</Text>
              {DOC_TYPES.map(t => (
                <TouchableOpacity
                  key={t.key}
                  style={[s.typeBtn, docType === t.key && { borderColor: colors.brand, backgroundColor: colors.brandLight }]}
                  onPress={() => setDocType(t.key)}
                >
                  <Feather name={t.icon} size={14} color={docType === t.key ? colors.brand : colors.textMuted} />
                  <Text style={[s.typeTxt, docType === t.key && { color: colors.brand }]}>{t.key}</Text>
                  {docType === t.key && <Feather name="check" size={14} color={colors.brand} style={{ marginLeft: 'auto' }} />}
                </TouchableOpacity>
              ))}

              <Text style={[s.fieldLabel, { marginTop: 16 }]}>Document Title</Text>
              <TextInput
                style={s.input}
                value={docTitle}
                onChangeText={setDocTitle}
                placeholder="e.g. 2024-2025 Constitution"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={[s.fieldLabel, { marginTop: 4 }]}>File</Text>
              <TouchableOpacity style={s.filePicker} onPress={pickFile}>
                <Feather name={selectedFile ? 'file-text' : 'upload-cloud'} size={20} color={selectedFile ? colors.brand : colors.textMuted} />
                <Text style={[s.filePickerTxt, selectedFile && { color: colors.text }]} numberOfLines={1}>
                  {selectedFile ? selectedFile.name : 'Select a file (PDF, image, etc.)'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.uploadBtn, uploading && { opacity: 0.6 }]}
                onPress={handleUpload}
                disabled={uploading}
              >
                <Feather name="upload-cloud" size={18} color="#FFF" />
                <Text style={s.uploadBtnTxt}>{uploading ? 'Uploading...' : 'Upload to Repository'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const getStyles = (colors, isDark) => StyleSheet.create({
  root:        { flex: 1, backgroundColor: colors.background },
  header:      { backgroundColor: colors.brand, paddingTop: 60, paddingBottom: 20, paddingHorizontal: 24, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, flexDirection: 'row', alignItems: 'flex-end', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  headerTitle: { fontFamily: 'Poppins_800ExtraBold', fontSize: 22, color: '#FFF', letterSpacing: -0.5 },
  headerSub:   { fontFamily: 'Poppins_500Medium', fontSize: 12, color: colors.brandLight, marginTop: 2 },
  addBtn:      { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  content:     { padding: 20, paddingBottom: 40 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  secIconBox:  { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionTitle:{ fontFamily: 'Poppins_700Bold', fontSize: 14, color: colors.text, flex: 1 },
  countBadge:  { backgroundColor: colors.brandLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  countTxt:    { fontFamily: 'Poppins_700Bold', fontSize: 11, color: colors.brand },
  emptyWrap:   { alignItems: 'center', paddingTop: 60 },
  emptyTitle:  { fontFamily: 'Poppins_700Bold', fontSize: 18, color: colors.text, marginBottom: 8 },
  emptyTxt:    { fontFamily: 'Poppins_400Regular', fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: colors.background },
  centerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: colors.text, marginBottom: 8 },
  centerTxt:   { fontFamily: 'Poppins_400Regular', fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard:   { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle:  { fontFamily: 'Poppins_700Bold', fontSize: 18, color: colors.text },
  fieldLabel:  { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: colors.text, marginBottom: 8 },
  typeBtn:     { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, padding: 12, marginBottom: 8 },
  typeTxt:     { fontFamily: 'Poppins_500Medium', fontSize: 13, color: colors.textMuted },
  input:       { borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, padding: 14, fontFamily: 'Poppins_400Regular', fontSize: 14, color: colors.text, marginBottom: 8 },
  filePicker:  { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, padding: 14, marginBottom: 20 },
  filePickerTxt: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: colors.textMuted, flex: 1 },
  uploadBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.brand, borderRadius: 14, paddingVertical: 14, marginBottom: 40 },
  uploadBtnTxt:{ fontFamily: 'Poppins_700Bold', fontSize: 15, color: '#FFF' },
});
