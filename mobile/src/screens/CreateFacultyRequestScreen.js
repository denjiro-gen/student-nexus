import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar, Alert, ActivityIndicator,
  Platform, KeyboardAvoidingView, Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { useAuth } from '../context/AuthContext';
import { facultyAPI } from '../services/api';
import { supabase } from '../config/supabase';
import { useTheme } from '../context/ThemeContext';

const REQUEST_CATEGORIES = [
  { id: 'chairs',    icon: 'grid',        label: 'Chairs / Tables' },
  { id: 'equipment', icon: 'tool',        label: 'Equipment' },
  { id: 'venue',     icon: 'map-pin',     label: 'Venue / Room' },
  { id: 'supplies',  icon: 'package',     label: 'Supplies' },
  { id: 'av',        icon: 'monitor',     label: 'AV / Projector' },
  { id: 'other',     icon: 'more-horizontal', label: 'Other' },
];

export default function CreateFacultyRequestScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const s = getStyles(colors, isDark);

  const { user, userProfile } = useAuth();
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [category,    setCategory]    = useState('');
  const [quantity,    setQuantity]    = useState('');
  const [neededDate,  setNeededDate]  = useState('');
  const [docName,     setDocName]     = useState('');
  const [docUri,      setDocUri]      = useState('');
  const [uploading,   setUploading]   = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [errors,      setErrors]      = useState({});

  function Field({ label, required, error, children }) {
    return (
      <View style={s.fieldWrap}>
        <Text style={s.label}>
          {label}
          {required && <Text style={{ color: colors.error }}> *</Text>}
        </Text>
        {children}
        {!!error && <Text style={s.errorTxt}>{error}</Text>}
      </View>
    );
  }

  const pickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets?.length > 0) {
        const file = res.assets[0];
        setDocName(file.name);
        setDocUri(file.uri);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open document picker.');
    }
  };

  const uploadDocument = async () => {
    if (!docUri) return null;
    try {
      setUploading(true);
      const ext = (docName.split('.').pop() || 'pdf').toLowerCase();
      const uid = userProfile?.id || userProfile?.user_id || user?.id;
      const path = `faculty-requests/${uid}/${Date.now()}.${ext}`;

      const mime = ext === 'pdf' ? 'application/pdf'
        : ext === 'png'  ? 'image/png'
        : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
        : 'application/octet-stream';

      const base64 = await FileSystem.readAsStringAsync(docUri, { encoding: 'base64' });
      const arrayBuffer = decode(base64);

      const { data, error } = await supabase.storage
        .from('event_attachments')
        .upload(path, arrayBuffer, { contentType: mime, upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage.from('event_attachments').getPublicUrl(path);
      return urlData.publicUrl;
    } catch (e) {
      console.warn('Upload error:', e.message);
      Alert.alert('Upload Error', e.message || 'Failed to upload document. Please try again.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const validate = () => {
    const e = {};
    if (!title.trim())       e.title = 'Request title is required';
    if (!category)           e.category = 'Please select a request category';
    if (!description.trim()) e.description = 'Description / justification is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const uid = userProfile?.id || userProfile?.user_id || user?.id;

      let documentUrl = null;
      if (docUri) {
        documentUrl = await uploadDocument();
        if (!documentUrl) {
          return Alert.alert(
            'Upload Failed',
            'The document could not be uploaded. Would you like to submit the request without it?',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => setSubmitting(false) },
              { text: 'Submit Without Document', onPress: async () => {
                  await submitRequest(uid, null);
                }
              },
            ]
          );
        }
      }

      await submitRequest(uid, documentUrl);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to submit request.');
      setSubmitting(false);
    }
  };

  const submitRequest = async (uid, documentUrl) => {
    try {
      const fullTitle = category
        ? `[${REQUEST_CATEGORIES.find(c => c.id === category)?.label}] ${title.trim()}`
        : title.trim();

      const fullDesc = [
        description.trim(),
        quantity   ? `Quantity: ${quantity}`     : null,
        neededDate ? `Needed by: ${neededDate}`  : null,
      ].filter(Boolean).join('\n\n');

      const { error } = await facultyAPI.createRequest(uid, fullTitle, fullDesc, documentUrl);
      if (error) throw error;

      Alert.alert(
        'Request Submitted!',
        'Your request has been submitted to OSAS for review. You will be notified once it has been processed.',
        [{ text: 'Done', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.surface} />

      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>New Request</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.heroCard}>
          <View style={s.heroIcon}><Feather name="file-plus" size={22} color={colors.brand} /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.heroTitle}>Facility Request Form</Text>
            <Text style={s.heroSub}>Submit requests for chairs, equipment, venues, and more. Attach supporting documents for faster processing.</Text>
          </View>
        </View>

        <Field label="Request Category" required error={errors.category}>
          <View style={s.categoryGrid}>
            {REQUEST_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[s.catBtn, category === cat.id && s.catBtnActive]}
                onPress={() => { setCategory(cat.id); if (errors.category) setErrors(p => ({...p, category: ''})); }}
                activeOpacity={0.8}
              >
                <Feather name={cat.icon} size={18} color={category === cat.id ? colors.brand : colors.textMuted} />
                <Text style={[s.catTxt, category === cat.id && s.catTxtActive]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        <Field label="Request Title" required error={errors.title}>
          <View style={[s.inputBox, errors.title && s.inputBoxErr]}>
            <Feather name="edit-3" size={15} color={colors.textMuted} />
            <TextInput
              style={s.input}
              value={title}
              onChangeText={v => { setTitle(v); if (errors.title) setErrors(p => ({...p, title: ''})); }}
              placeholder="e.g. Request for 50 Monobloc Chairs"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="sentences"
            />
          </View>
        </Field>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Field label="Quantity">
              <View style={s.inputBox}>
                <Feather name="hash" size={15} color={colors.textMuted} />
                <TextInput
                  style={s.input}
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="e.g. 50"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                />
              </View>
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Needed By">
              <View style={s.inputBox}>
                <Feather name="calendar" size={15} color={colors.textMuted} />
                <TextInput
                  style={s.input}
                  value={neededDate}
                  onChangeText={setNeededDate}
                  placeholder="MM/DD/YYYY"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </Field>
          </View>
        </View>

        <Field label="Justification / Description" required error={errors.description}>
          <View style={[s.textareaBox, errors.description && s.inputBoxErr]}>
            <TextInput
              style={s.textarea}
              value={description}
              onChangeText={v => { setDescription(v); if (errors.description) setErrors(p => ({...p, description: ''})); }}
              placeholder="Describe why this request is needed, the event or purpose it supports, and any other relevant details..."
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
              autoCapitalize="sentences"
            />
          </View>
        </Field>

        <Field label="Supporting Document">
          {docUri ? (
            <View style={s.docPreview}>
              <View style={s.docIconBox}><Feather name="file-text" size={18} color={colors.brand} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.docName} numberOfLines={1}>{docName}</Text>
                <Text style={s.docSub}>Tap to view or change</Text>
              </View>
              <TouchableOpacity onPress={pickDocument} style={s.changeBtn}>
                <Text style={s.changeBtnTxt}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={s.uploadBtn} onPress={pickDocument} activeOpacity={0.78}>
              <Feather name="upload" size={18} color={colors.brand} />
              <Text style={s.uploadTxt}>Attach PDF or Image</Text>
              <Text style={s.uploadHint}>Optional but recommended</Text>
            </TouchableOpacity>
          )}
        </Field>

        <TouchableOpacity
          style={[s.submitBtn, (submitting || uploading) && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={submitting || uploading}
          activeOpacity={0.85}
        >
          {(submitting || uploading) ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ActivityIndicator color="#FFF" size="small" />
              <Text style={s.submitTxt}>{uploading ? 'Uploading…' : 'Submitting…'}</Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Feather name="send" size={18} color="#FFF" />
              <Text style={s.submitTxt}>Submit Request</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={s.disclaimer}>
          Your request will be reviewed by the OSAS office. You will receive a notification once a decision has been made.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors, isDark) => StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: 54, paddingBottom: 14, paddingHorizontal: 20,
    backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
  },
  backBtn:     { padding: 4, width: 36 },
  headerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 17, color: colors.text },

  body: { padding: 18, paddingBottom: 48 },

  heroCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    backgroundColor: colors.surface, borderRadius: 16, padding: 18, marginBottom: 22,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  heroIcon:  { width: 44, height: 44, borderRadius: 13, backgroundColor: colors.brandLight, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: colors.text, marginBottom: 4 },
  heroSub:   { fontFamily: 'Poppins_400Regular', fontSize: 12, color: colors.textMuted, lineHeight: 18 },

  fieldWrap: { marginBottom: 20 },
  label:     { fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: colors.text, marginBottom: 8 },
  errorTxt:  { fontFamily: 'Poppins_400Regular', fontSize: 11, color: colors.error, marginTop: 5 },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10,
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
  },
  catBtnActive: { borderColor: colors.brand, backgroundColor: colors.brandLight },
  catTxt:       { fontFamily: 'Poppins_500Medium', fontSize: 12, color: colors.textMuted },
  catTxtActive: { color: colors.brand },

  inputBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 2,
    borderWidth: 1.5, borderColor: colors.border,
  },
  inputBoxErr: { borderColor: colors.error },
  input: { flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 14, color: colors.text, paddingVertical: 12 },

  textareaBox: {
    backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1.5, borderColor: colors.border,
  },
  textarea: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: colors.text, minHeight: 120, lineHeight: 22 },

  docPreview: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.brandLight, borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: colors.brand,
  },
  docIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  docName:    { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: colors.text },
  docSub:     { fontFamily: 'Poppins_400Regular', fontSize: 11, color: colors.textMuted, marginTop: 2 },
  changeBtn:  { backgroundColor: colors.brand, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  changeBtnTxt: { fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: '#FFF' },

  uploadBtn: {
    alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: colors.brand, borderStyle: 'dashed',
    borderRadius: 12, paddingVertical: 22, backgroundColor: colors.brandLight,
  },
  uploadTxt:  { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: colors.brand },
  uploadHint: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: colors.textMuted },

  submitBtn: {
    backgroundColor: colors.brand, borderRadius: 30, paddingVertical: 16, alignItems: 'center',
    shadowColor: colors.brandDark, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
    marginTop: 8, marginBottom: 14,
  },
  submitTxt: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: '#FFF', letterSpacing: 0.3 },

  disclaimer: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
});
