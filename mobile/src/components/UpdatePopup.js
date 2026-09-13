import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';

// Increment this version string whenever you release a new update
const CURRENT_APP_VERSION = '1.0.1';

// Update these features to tell users what's new in this release
const RELEASE_NOTES = [
  "New 'Org & Compliance' realtime status updates",
  "Fixed an issue where messages from Admin disappeared",
  "Added new 'What's New' update popup screen",
  "Improved UI for document uploads and feedback"
];

const G = '#03632B';

export default function UpdatePopup() {
  const [visible, setVisible] = useState(false);
  const scale = React.useRef(new Animated.Value(0.9)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkVersion();
  }, []);

  const checkVersion = async () => {
    try {
      const storedVersion = await AsyncStorage.getItem('@app_version');
      if (storedVersion !== CURRENT_APP_VERSION) {
        // App has updated! Show popup
        setVisible(true);
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true })
        ]).start();
      }
    } catch (e) {
      console.warn('Failed to check app version', e);
    }
  };

  const handleClose = async () => {
    Animated.parallel([
      Animated.timing(scale, { toValue: 0.9, duration: 200, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true })
    ]).start(async () => {
      setVisible(false);
      // Save the new version so it doesn't show again until the next update
      await AsyncStorage.setItem('@app_version', CURRENT_APP_VERSION);
    });
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible}>
      <View style={s.overlay}>
        <Animated.View style={[s.card, { opacity, transform: [{ scale }] }]}>
          
          <View style={s.header}>
            <View style={s.iconWrap}>
              <Feather name="gift" size={32} color={G} />
            </View>
            <Text style={s.title}>What's New!</Text>
            <Text style={s.subtitle}>Version {CURRENT_APP_VERSION} is here</Text>
          </View>

          <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
            {RELEASE_NOTES.map((note, idx) => (
              <View key={idx} style={s.noteRow}>
                <Feather name="check-circle" size={18} color={G} style={s.noteIcon} />
                <Text style={s.noteTxt}>{note}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={s.footer}>
            <TouchableOpacity style={s.btn} activeOpacity={0.8} onPress={handleClose}>
              <Text style={s.btnTxt}>Awesome, let's go!</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 9999,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#E8F5EE',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 24,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: '#6B7280',
  },
  body: {
    padding: 24,
    maxHeight: 250,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  noteIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  noteTxt: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  footer: {
    padding: 24,
    paddingTop: 0,
  },
  btn: {
    backgroundColor: G,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnTxt: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: '#fff',
  },
});
