import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  Alert, ActivityIndicator
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { portfolioAPI } from '../services/api';
import { hasPermission, ROLES } from '../config/security';
import { useTheme } from '../context/ThemeContext';

export default function UploadAchievementScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const s = getStyles(colors, isDark);

  const { user, userProfile } = useAuth();
  const { editItem } = route?.params || {};
  
  const [title, setTitle] = useState('');
  const [dateObj, setDateObj] = useState(new Date());
  const [dateStr, setDateStr] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachment, setAttachment] = useState(null);

  React.useEffect(() => {
    if (editItem) {
      setTitle(editItem.title || '');
      setDesc(editItem.description || '');
      if (editItem.achievement_date) {
        setDateStr(editItem.achievement_date);
        setDateObj(new Date(editItem.achievement_date));
      }
    }
  }, [editItem]);

  React.useEffect(() => {
    if (userProfile && !hasPermission(userProfile.role, 'UPLOAD_DOCUMENTS')) {
      Alert.alert('Access Denied', 'Only student leaders can upload achievements.');
      navigation.goBack();
    }
  }, [userProfile]);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled === false && result.assets?.length > 0) {
        setAttachment(result.assets[0]);
      }
    } catch (err) {
      console.warn('Document picker error:', err);
    }
  };

  const handleUpload = async () => {
    if (!title.trim() || !dateStr.trim()) {
      Alert.alert('Missing Fields', 'Please provide a title and date.');
      return;
    }

    setLoading(true);
    try {
      const myId = userProfile?.id || userProfile?.user_id || user?.id;
      if (!myId) {
        Alert.alert('Error', 'User session not ready. Please sign out and sign in again.');
        setLoading(false);
        return;
      }
      
      let file_url = null;
      let file_name = null;
      let file_type = null;

      if (attachment) {
        const { publicUrl, error: uploadErr } = await portfolioAPI.uploadPortfolioAttachment(
          attachment.uri,
          attachment.name,
          attachment.mimeType,
          myId
        );
        if (uploadErr) {
          console.warn('Failed to upload portfolio attachment:', uploadErr.message);
          
        } else {
          file_url = publicUrl;
          file_name = attachment.name;
          file_type = attachment.mimeType;
        }
      }

      const achievementData = {
        title: title.trim(),
        description: desc.trim(),
        achievement_date: dateStr,
        user_id: myId,
        verified: false,
        achievement_type: 'Certificate',
        points: 0,
        file_url,
        file_name,
        file_type
      };

      if (editItem) {
        const { error } = await portfolioAPI.updateAchievement(editItem.id, achievementData);
        if (error) throw error;
        Alert.alert('Success', 'Achievement updated successfully.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        const { error } = await portfolioAPI.addAchievement(achievementData);
        if (error) throw error;
        Alert.alert('Upload Success', 'Your certificate has been added to the Portfolio DB successfully!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to upload achievement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>{editItem ? 'Edit Achievement' : 'Upload Achievement'}</Text>
      </View>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        <View style={s.infoBanner}>
          <Feather name="award" size={20} color={colors.brand} style={{ marginTop: 2 }} />
          <Text style={s.infoTxt}>
            Upload a certificate or record of achievement to add it to your student portfolio.
          </Text>
        </View>

        <View style={s.form}>
          <Text style={s.label}>Certificate Title</Text>
          <TextInput
            style={s.input}
            placeholder="e.g. Dean's Lister, Workshop Certificate"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={s.label}>Date Achieved</Text>
          <TouchableOpacity 
            style={[s.input, { justifyContent: 'center' }]} 
            onPress={() => setShowPicker(true)}
            activeOpacity={0.8}
          >
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: dateStr ? colors.text : colors.textMuted }}>
              {dateStr || 'Select a date'}
            </Text>
          </TouchableOpacity>

          {showPicker && (
              <DateTimePicker
                value={dateObj}
                mode="date"
                display="default"
                themeVariant={isDark ? "dark" : "light"}
                onValueChange={(event, selectedDate) => {
                setShowPicker(Platform.OS === 'ios');
                if (selectedDate) {
                  setDateObj(selectedDate);
                  setDateStr(selectedDate.toISOString().split('T')[0]);
                }
              }}
              onDismiss={() => setShowPicker(false)}
            />
          )}

          <Text style={s.label}>Description (Optional)</Text>
          <TextInput
            style={[s.input, s.textArea]}
            placeholder="Additional details..."
            placeholderTextColor={colors.textMuted}
            value={desc}
            onChangeText={setDesc}
            multiline
            textAlignVertical="top"
          />

          <Text style={s.label}>Supporting Document (Optional)</Text>
          <TouchableOpacity 
            style={[s.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }]} 
            onPress={pickDocument}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <Feather name={attachment ? 'file-text' : 'paperclip'} size={18} color={attachment ? colors.brand : colors.textMuted} />
              <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: attachment ? colors.text : colors.textMuted, flex: 1 }} numberOfLines={1}>
                {attachment ? attachment.name : 'Attach a certificate (PDF/Image)'}
              </Text>
            </View>
            {attachment && (
              <TouchableOpacity onPress={() => setAttachment(null)} style={{ padding: 4 }}>
                <Feather name="x" size={16} color={colors.error} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[s.submitBtn, loading && s.submitBtnDisabled]} 
            onPress={handleUpload} 
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={s.submitTxt}>Upload to Portfolio</Text>
                <Feather name="upload" size={18} color="#FFF" />
              </>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors, isDark) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20,
    backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    zIndex: 10,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
  },
  backBtn: { marginRight: 16, padding: 4 },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: colors.text },
  
  content: { flex: 1, padding: 20 },
  
  infoBanner: { flexDirection: 'row', backgroundColor: colors.brandLight, padding: 16, borderRadius: 12, marginBottom: 20, gap: 12 },
  infoTxt: { flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 13, color: colors.brandDark, lineHeight: 20 },
  
  form: { backgroundColor: colors.surface, padding: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  label: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: colors.text, marginBottom: 8 },
  input: {
    fontFamily: 'Poppins_400Regular', fontSize: 14, color: colors.text,
    backgroundColor: colors.background, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    marginBottom: 20, borderWidth: 1, borderColor: colors.border
  },
  textArea: { height: 90, paddingTop: 14 },
  
  submitBtn: {
    flexDirection: 'row', backgroundColor: colors.brand, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: colors.brandDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitTxt: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: '#FFF' },
});
