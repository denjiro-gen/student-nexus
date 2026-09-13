import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  Alert, ActivityIndicator, StatusBar
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { eventAPI, organizationAPI, notificationAPI } from '../services/api';
import { hasPermission, auditTrail } from '../config/security';
import { useTheme } from '../context/ThemeContext';

export default function CreateEventScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const s = getStyles(colors, isDark);

  const { user, userProfile } = useAuth();
  const { editEvent } = route?.params || {};
  
  const [title, setTitle] = useState('');
  
  const [dateObj, setDateObj] = useState(new Date());
  const [dateStr, setDateStr] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [venue, setVenue] = useState('');
  const [desc, setDesc] = useState('');
  
  const [budget, setBudget] = useState('');
  
  const [timeStartObj, setTimeStartObj] = useState(new Date());
  const [timeEndObj, setTimeEndObj] = useState(new Date());
  const [showTimeStartPicker, setShowTimeStartPicker] = useState(false);
  const [showTimeEndPicker, setShowTimeEndPicker] = useState(false);
  const [timeStart, setTimeStart] = useState('');
  const [timeEnd, setTimeEnd] = useState('');
  
  const [attendees, setAttendees] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [conflictError, setConflictError] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [dateWarning, setDateWarning] = useState(null);

  const [leaderOrgs, setLeaderOrgs] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState(null);

  React.useEffect(() => {
    if (userProfile && !hasPermission(userProfile.role, 'SUBMIT_EVENT_PROPOSAL')) {
      Alert.alert('Access Denied', 'Only student leaders can create events.');
      navigation.goBack();
      return;
    }

    const fetchOrgs = async () => {
      const myId = userProfile?.id || userProfile?.user_id || user?.id;
      if (myId) {
        const { data } = await organizationAPI.getLeaderOrganizations(myId);
        if (data && data.length > 0) {
          setLeaderOrgs(data);
          setSelectedOrgId(editEvent?.organization_id || data[0].id); 
        }
      }
    };
    fetchOrgs();

    if (editEvent) {
      setTitle(editEvent.title || '');
      setVenue(editEvent.venue || '');
      setDesc(editEvent.description || '');
      setBudget(editEvent.budget_amount ? String(editEvent.budget_amount) : '');
      setAttendees(editEvent.expected_attendees ? String(editEvent.expected_attendees) : '');
      
      if (editEvent.event_date) {
        const d = new Date(editEvent.event_date);
        setDateObj(d);
        setDateStr(editEvent.event_date);
      }
      
      if (editEvent.event_time_start) {
        setTimeStart(editEvent.event_time_start);
        const [h, m] = editEvent.event_time_start.split(':');
        const d = new Date(); d.setHours(h, m, 0);
        setTimeStartObj(d);
      }
      
      if (editEvent.event_time_end) {
        setTimeEnd(editEvent.event_time_end);
        const [h, m] = editEvent.event_time_end.split(':');
        const d = new Date(); d.setHours(h, m, 0);
        setTimeEndObj(d);
      }
    }
  }, [userProfile?.id, user?.id, editEvent]);

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

  const handleSubmit = async () => {
    if (!title.trim() || !dateStr.trim() || !venue.trim() || !desc.trim()) {
      Alert.alert('Missing Fields', 'Please fill out all fields.');
      return;
    }

    setLoading(true);
    setConflictError(null);

    try {
      const { conflict, conflictData, error: checkErr } = await eventAPI.checkEventConflict(dateStr, venue);
      
      if (checkErr) throw checkErr;

      if (conflict) {
        const conflictingEvents = conflictData.map(e => e.title).join(', ');
        setConflictError(`Conflict found at ${venue} on ${dateStr}. Existing event(s): ${conflictingEvents}`);
        setLoading(false);
        return;
      }

      const myId = userProfile?.id || userProfile?.user_id || user?.id;
      if (!myId) {
        Alert.alert('Error', 'Your user session could not be resolved. Please sign out and sign in again.');
        setLoading(false);
        return;
      }
      const eventData = {
        title: title.trim(),
        event_date: dateStr,
        venue: venue.trim(),
        description: desc.trim(),
        budget_amount: budget ? parseFloat(budget) : null,
        event_time_start: timeStart.trim() || null,
        event_time_end: timeEnd.trim() || null,
        expected_attendees: attendees ? parseInt(attendees, 10) : null,
        status: 'pending', 
        submitted_by: myId,
        organization_id: selectedOrgId
      };

      let resultData;
      if (editEvent) {
        const { data, error } = await eventAPI.updateEvent(editEvent.id, eventData);
        if (error) throw error;
        resultData = data;
        
        await auditTrail.log(
          'UPDATE_EVENT_PROPOSAL',
          'event_proposal',
          resultData.id,
          null,
          { title: resultData.title, venue: resultData.venue, date: resultData.event_date }
        );
      } else {
        const { data, error } = await eventAPI.createEvent(eventData);
        if (error) throw error;
        resultData = data;
        
        await auditTrail.log(
          'CREATE_EVENT_PROPOSAL',
          'event_proposal',
          resultData.id,
          null,
          { title: resultData.title, venue: resultData.venue, date: resultData.event_date }
        );

        await notificationAPI.notifyAdmins(
          `New Event Proposal Submitted: ${resultData.title}`,
          'event_submission',
          { event_id: resultData.id }
        );
      }

      if (attachment && resultData?.id) {
        const { error: attachErr } = await eventAPI.uploadEventAttachment(
          resultData.id,
          attachment.uri,
          attachment.name,
          attachment.mimeType,
          myId
        );
        if (attachErr) {
          console.warn('Attachment upload failed:', attachErr.message);
        }
      }

      Alert.alert(
        'Success',
        editEvent 
          ? 'Event Proposal updated successfully!' 
          : 'Event Proposal submitted successfully! It is now pending approval.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      console.error(e);
      Alert.alert('Error', editEvent ? 'Failed to update proposal.' : 'Failed to submit proposal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.surface} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>{editEvent ? 'Edit Proposal' : 'New Event Proposal'}</Text>
      </View>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        <View style={s.infoBanner}>
          <Feather name="info" size={20} color={colors.brand} style={{ marginTop: 2 }} />
          <Text style={s.infoTxt}>
            Submit your event details below. The system will automatically check for venue and date conflicts.
          </Text>
        </View>

        {conflictError && (
          <View style={s.errorBanner}>
            <Feather name="alert-triangle" size={20} color={colors.error} style={{ marginTop: 2 }} />
            <Text style={s.errorTxt}>{conflictError}</Text>
          </View>
        )}

        <View style={s.form}>
          {leaderOrgs.length > 0 && (
            <>
              <Text style={s.label}>Organization</Text>
              <View style={[s.input, { paddingVertical: 0, paddingHorizontal: 0, overflow: 'hidden' }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 8, gap: 8 }}>
                  {leaderOrgs.map(org => (
                    <TouchableOpacity
                      key={org.id}
                      style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: selectedOrgId === org.id ? colors.brand : isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6' }}
                      onPress={() => setSelectedOrgId(org.id)}
                    >
                      <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 13, color: selectedOrgId === org.id ? '#FFF' : colors.text }}>
                        {org.acronym || org.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </>
          )}

          <Text style={s.label}>Event Title</Text>
          <TextInput
            style={s.input}
            placeholder="e.g. Annual IT Symposium"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={(t) => { setTitle(t); setConflictError(null); }}
          />

          <Text style={s.label}>Date</Text>
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
              minimumDate={new Date()}
              onValueChange={async (event, selectedDate) => {
                setShowPicker(Platform.OS === 'ios');
                if (selectedDate) {
                  setDateObj(selectedDate);
                  const ds = selectedDate.toISOString().split('T')[0];
                  setDateStr(ds);
                  setConflictError(null);
                  setDateWarning(null);
                  try {
                    const { conflict, conflictData } = await eventAPI.checkEventConflict(ds, '');
                    if (conflict && conflictData && conflictData.length > 0) {
                      const names = conflictData.map(e => `• ${e.title}`).join('\n');
                      setDateWarning(`⚠️ Events already scheduled on this date:\n${names}`);
                    }
                  } catch (_) {}
                }
              }}
              onDismiss={() => setShowPicker(false)}
            />
          )}

          {dateWarning && (
            <View style={[s.errorBanner, { marginTop: -12, marginBottom: 20, backgroundColor: isDark ? 'rgba(245,158,11,0.1)' : '#FEF3C7', borderColor: isDark ? 'rgba(245,158,11,0.3)' : '#FCD34D' }]}>
              <Feather name="alert-triangle" size={18} color={colors.warning} style={{ marginTop: 2 }} />
              <Text style={[s.errorTxt, { color: isDark ? '#FCD34D' : '#92400e' }]}>{dateWarning}</Text>
            </View>
          )}

          <Text style={s.label}>Venue</Text>
          <TextInput
            style={s.input}
            placeholder="e.g. Main Auditorium"
            placeholderTextColor={colors.textMuted}
            value={venue}
            onChangeText={(t) => { setVenue(t); setConflictError(null); }}
          />

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Start Time</Text>
              <TouchableOpacity 
                style={[s.input, { justifyContent: 'center' }]} 
                onPress={() => setShowTimeStartPicker(true)}
                activeOpacity={0.8}
              >
                <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: timeStart ? colors.text : colors.textMuted }}>
                  {timeStart ? timeStartObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select Time'}
                </Text>
              </TouchableOpacity>
              {showTimeStartPicker && (
                <DateTimePicker
                  value={timeStartObj}
                  mode="time"
                  display="default"
                  themeVariant={isDark ? "dark" : "light"}
                  onValueChange={(event, selectedDate) => {
                    setShowTimeStartPicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      setTimeStartObj(selectedDate);
                      setTimeStart(`${selectedDate.getHours().toString().padStart(2, '0')}:${selectedDate.getMinutes().toString().padStart(2, '0')}:00`);
                    }
                  }}
                />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>End Time</Text>
              <TouchableOpacity 
                style={[s.input, { justifyContent: 'center' }]} 
                onPress={() => setShowTimeEndPicker(true)}
                activeOpacity={0.8}
              >
                <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: timeEnd ? colors.text : colors.textMuted }}>
                  {timeEnd ? timeEndObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select Time'}
                </Text>
              </TouchableOpacity>
              {showTimeEndPicker && (
                <DateTimePicker
                  value={timeEndObj}
                  mode="time"
                  display="default"
                  themeVariant={isDark ? "dark" : "light"}
                  onValueChange={(event, selectedDate) => {
                    setShowTimeEndPicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      setTimeEndObj(selectedDate);
                      setTimeEnd(`${selectedDate.getHours().toString().padStart(2, '0')}:${selectedDate.getMinutes().toString().padStart(2, '0')}:00`);
                    }
                  }}
                />
              )}
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Est. Budget (PHP)</Text>
              <TextInput
                style={s.input}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={budget}
                onChangeText={setBudget}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Expected Attendees</Text>
              <TextInput
                style={s.input}
                placeholder="e.g. 150"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={attendees}
                onChangeText={setAttendees}
              />
            </View>
          </View>

          <Text style={s.label}>Description</Text>
          <TextInput
            style={[s.input, s.textArea]}
            placeholder="Describe the event goals and activities..."
            placeholderTextColor={colors.textMuted}
            value={desc}
            onChangeText={setDesc}
            multiline
            textAlignVertical="top"
          />

          <Text style={s.label}>Proposal Documents (Required)</Text>
          <View style={[s.checklistCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F9FAFB', borderColor: colors.border }]}>
            <Text style={s.checklistTitle}>Please merge the following into one PDF file (or a ZIP archive) and attach:</Text>
            <View style={s.checklistItem}><Feather name="check" size={14} color={colors.success} /><Text style={s.checklistTxt}>Letter Request</Text></View>
            <View style={s.checklistItem}><Feather name="check" size={14} color={colors.success} /><Text style={s.checklistTxt}>Activity Plan</Text></View>
            <View style={s.checklistItem}><Feather name="check" size={14} color={colors.success} /><Text style={s.checklistTxt}>Program Flow</Text></View>
            <View style={s.checklistItem}><Feather name="check" size={14} color={colors.success} /><Text style={s.checklistTxt}>Risk Assessment (if required by OSAS)</Text></View>
            <View style={s.checklistItem}><Feather name="check" size={14} color={colors.success} /><Text style={s.checklistTxt}>Budget Proposal</Text></View>
          </View>
          
          <TouchableOpacity 
            style={[s.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }]} 
            onPress={pickDocument}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <Feather name={attachment ? 'file-text' : 'upload-cloud'} size={18} color={attachment ? colors.brand : colors.textMuted} />
              <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: attachment ? colors.text : colors.textMuted, flex: 1 }} numberOfLines={1}>
                {attachment ? attachment.name : 'Upload Proposal Document'}
              </Text>
            </View>
            {attachment && (
              <TouchableOpacity onPress={() => setAttachment(null)} style={{ padding: 4 }}>
                <Feather name="x-circle" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[s.submitBtn, loading && s.submitBtnDisabled]} 
            onPress={handleSubmit} 
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={s.submitTxt}>{editEvent ? 'Update Proposal' : 'Submit Proposal'}</Text>
                <Feather name={editEvent ? "save" : "send"} size={18} color="#FFF" />
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
  
  errorBanner: { flexDirection: 'row', backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#FEE2E2', padding: 16, borderRadius: 12, marginBottom: 20, gap: 12, borderWidth: 1, borderColor: isDark ? 'rgba(239,68,68,0.3)' : '#FECACA' },
  errorTxt: { flex: 1, fontFamily: 'Poppins_500Medium', fontSize: 13, color: colors.error, lineHeight: 20 },
  
  form: { backgroundColor: colors.surface, padding: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  label: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: colors.text, marginBottom: 8 },
  input: {
    fontFamily: 'Poppins_400Regular', fontSize: 14, color: colors.text,
    backgroundColor: colors.background, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    marginBottom: 20, borderWidth: 1, borderColor: colors.border
  },
  textArea: { height: 120, paddingTop: 14 },
  
  submitBtn: {
    flexDirection: 'row', backgroundColor: colors.brand, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10,
    shadowColor: colors.brandDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitTxt: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: '#FFF' },
  checklistCard: { borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1 },
  checklistTitle:{ fontFamily: 'Poppins_500Medium', fontSize: 12, color: colors.text, marginBottom: 8 },
  checklistItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  checklistTxt:  { fontFamily: 'Poppins_400Regular', fontSize: 12, color: colors.textMuted },
});
