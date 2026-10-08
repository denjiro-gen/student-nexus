import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, ActivityIndicator, Platform, Easing, TouchableOpacity } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { authAPI } from './src/services/api';
import { Feather } from '@expo/vector-icons';

import { useFonts } from 'expo-font';
import * as Updates from 'expo-updates';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Poppins_400Regular  from '@expo-google-fonts/poppins/400Regular/Poppins_400Regular.ttf';
import Poppins_500Medium   from '@expo-google-fonts/poppins/500Medium/Poppins_500Medium.ttf';
import Poppins_600SemiBold from '@expo-google-fonts/poppins/600SemiBold/Poppins_600SemiBold.ttf';
import Poppins_700Bold     from '@expo-google-fonts/poppins/700Bold/Poppins_700Bold.ttf';
import Poppins_800ExtraBold from '@expo-google-fonts/poppins/800ExtraBold/Poppins_800ExtraBold.ttf';

import WelcomeScreen   from './src/screens/WelcomeScreen';
import LoginScreen     from './src/screens/LoginScreen';
import SignupScreen    from './src/screens/SignupScreen';
import HomeScreen      from './src/screens/HomeScreen';
import EventsScreen    from './src/screens/EventsScreen';
import ProfileScreen   from './src/screens/ProfileScreen';
import OrganizationsScreen from './src/screens/OrganizationsScreen';
import OrganizationDetailsScreen from './src/screens/OrganizationDetailsScreen';
import PortfolioScreen from './src/screens/PortfolioScreen';
import MessagesScreen  from './src/screens/MessagesScreen';
import ComplianceScreen from './src/screens/ComplianceScreen';
import EventDetailsScreen from './src/screens/EventDetailsScreen';
import CreateEventScreen from './src/screens/CreateEventScreen';
import UploadAchievementScreen from './src/screens/UploadAchievementScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import RepositoryScreen from './src/screens/RepositoryScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import UpdatePopup from './src/components/UpdatePopup';
import CustomTabBar from './src/components/CustomTabBar';

const GREEN = '#03632B';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

const curvedSlideTransition = {
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 420,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1), 
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 360,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      },
    },
  },
  cardStyleInterpolator: ({ current, next, layouts }) => {
    const progress = current.progress;
    const screenWidth = layouts.screen.width;

    
    const translateX = progress.interpolate({
      inputRange:  [0, 1],
      outputRange: [screenWidth * 0.35, 0],   
    });
    const scale = progress.interpolate({
      inputRange:  [0, 1],
      outputRange: [0.92, 1],                  
    });
    const opacity = progress.interpolate({
      inputRange:  [0, 0.3, 1],
      outputRange: [0,  1,   1],
    });
    const borderRadius = progress.interpolate({
      inputRange:  [0, 0.6, 1],
      outputRange: [28, 12,  0],               
    });

    
    let outTranslateX = 0;
    let outScale = 1;
    let outOpacity = 1;
    if (next) {
      outTranslateX = next.progress.interpolate({
        inputRange:  [0, 1],
        outputRange: [0, -screenWidth * 0.12],
      });
      outScale = next.progress.interpolate({
        inputRange:  [0, 1],
        outputRange: [1, 0.94],
      });
      outOpacity = next.progress.interpolate({
        inputRange:  [0, 1],
        outputRange: [1, 0.6],
      });
    }

    return {
      cardStyle: {
        transform: [
          { translateX: next ? outTranslateX : translateX },
          { scale:      next ? outScale      : scale },
        ],
        opacity: next ? outOpacity : opacity,
        borderRadius,
        overflow: 'hidden',
      },
    };
  },
};

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Events"
        component={EventsScreen}
        options={{
          tabBarLabel: 'Events',
          tabBarIcon: ({ color, size }) => <Feather name="layout" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarLabel: 'Calendar',
          tabBarIcon: ({ color, size }) => <Feather name="calendar" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: ({ color, size }) => <Feather name="message-circle" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Compliance"
        component={ComplianceScreen}
        options={{
          tabBarLabel: 'Compliance',
          tabBarIcon: ({ color, size }) => <Feather name="check-square" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        ...curvedSlideTransition,
        cardStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login"   component={LoginScreen}   />
      <Stack.Screen name="Signup"  component={SignupScreen}  />
    </Stack.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        ...curvedSlideTransition,
        cardStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="OrganizationDetails" component={OrganizationDetailsScreen} />
      <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
      <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
      <Stack.Screen name="UploadAchievement" component={UploadAchievementScreen} />
      <Stack.Screen name="Portfolio" component={PortfolioScreen} />
      <Stack.Screen name="Repository" component={RepositoryScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="CalendarFull" component={CalendarScreen} />
    </Stack.Navigator>
  );
}





function RootNavigator() {
  const { user, loading, userProfile } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={GREEN} />
        <Text style={styles.loadingTxt}>Loading…</Text>
      </View>
    );
  }

  if (!user) return <NavigationContainer><AuthNavigator /></NavigationContainer>;

  // Check if account is verified/active
  if (userProfile && userProfile.is_active === false) {
    return (
      <View style={[styles.loading, { padding: 40 }]}>
        <Feather name="clock" size={48} color={GREEN} style={{ marginBottom: 16 }} />
        <Text style={[styles.loadingTxt, { fontSize: 18, fontFamily: 'Poppins_700Bold', color: '#111827', textAlign: 'center' }]}>
          Account Pending
        </Text>
        <Text style={[styles.loadingTxt, { textAlign: 'center', marginTop: 8, marginBottom: 24, lineHeight: 22 }]}>
          Your account has been created and is waiting for OSAS Admin approval. You will receive an email once approved.
        </Text>
        <TouchableOpacity 
          style={{ backgroundColor: '#F3F4F6', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 }}
          onPress={() => authAPI.signOut()}
        >
          <Text style={{ fontFamily: 'Poppins_600SemiBold', color: '#4B5563' }}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isFaculty = false; // Faculty Request feature removed

  return (
    <NavigationContainer>
      <MainStack />
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'Poppins_400Regular':   Poppins_400Regular,
    'Poppins_500Medium':    Poppins_500Medium,
    'Poppins_600SemiBold':  Poppins_600SemiBold,
    'Poppins_700Bold':      Poppins_700Bold,
    'Poppins_800ExtraBold': Poppins_800ExtraBold,
  });

  React.useEffect(() => {
    async function onFetchUpdateAsync() {
      try {
        console.log(`[OTA Update] Current Update ID: ${Updates.updateId || 'Embedded'}`);
        console.log(`[OTA Update] Runtime Version: ${Updates.runtimeVersion}`);
        
        const lastCheckStr = await AsyncStorage.getItem('@last_update_check');
        const now = Date.now();
        
        // Prevent update loop: only check once every 3 minutes max
        if (lastCheckStr && now - parseInt(lastCheckStr) < 3 * 60 * 1000) {
          console.log('[OTA Update] Skipped check to prevent update loops.');
          return;
        }

        const update = await Updates.checkForUpdateAsync();
        console.log(`[OTA Update] Update available: ${update.isAvailable}`);

        if (update.isAvailable) {
          console.log('[OTA Update] Downloading update...');
          await Updates.fetchUpdateAsync();
          console.log('[OTA Update] Download complete. Reloading app...');
          
          await AsyncStorage.setItem('@last_update_check', now.toString());
          await Updates.reloadAsync();
        }
      } catch (error) {
        console.log(`[OTA Update Error] Failed to fetch or apply update: ${error}`);
      }
    }

    if (!__DEV__) {
      onFetchUpdateAsync();
    }
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={GREEN} />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <RootNavigator />
        <UpdatePopup />
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF',
  },
  loadingTxt: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14, color: '#6B7280', marginTop: 12,
  },
});
