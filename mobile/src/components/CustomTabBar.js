import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const GREEN = '#03632B';
const GREEN_LIGHT = 'rgba(3, 99, 43, 0.1)';

export default function CustomTabBar({ state, descriptors, navigation }) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [tabWidth, setTabWidth] = useState(0);

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: state.index,
      useNativeDriver: false,
      tension: 65,
      friction: 10,
    }).start();
  }, [state.index]);

  const onLayout = (e) => {
    const { width: w } = e.nativeEvent.layout;
    setTabWidth(w / state.routes.length);
  };

  const indicatorPosition = animatedValue.interpolate({
    inputRange: state.routes.map((_, i) => i),
    outputRange: state.routes.map((_, i) => i * tabWidth),
  });

  return (
    <View style={styles.container}>
      <View style={styles.tabBar} onLayout={onLayout}>
        
        {/* Animated Background Pill for Active Tab */}
        {tabWidth > 0 && (
          <Animated.View
            style={[
              styles.activeBackground,
              {
                width: tabWidth - 16,
                transform: [
                  { translateX: indicatorPosition },
                  { translateX: 8 } // 8px margin to center the pill
                ]
              }
            ]}
          />
        )}

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          // Get icon
          let iconName = 'circle';
          if (route.name === 'Home') iconName = 'home';
          if (route.name === 'Events') iconName = 'calendar';
          if (route.name === 'Messages') iconName = 'message-circle';
          if (route.name === 'Compliance') iconName = 'check-square';
          if (route.name === 'Profile') iconName = 'user';

          return (
            <TouchableOpacity
              key={index}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabButton}
              activeOpacity={0.8}
            >
              <TabIcon isFocused={isFocused} iconName={iconName} label={label} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const TabIcon = ({ isFocused, iconName, label }) => {
  const translateY = useRef(new Animated.Value(isFocused ? -3 : 0)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: isFocused ? -3 : 0,
      useNativeDriver: true,
      tension: 65,
      friction: 10,
    }).start();
  }, [isFocused]);

  return (
    <View style={styles.iconContainer}>
      <Animated.View style={{ transform: [{ translateY }] }}>
        <Feather 
          name={iconName} 
          size={22} 
          color={isFocused ? GREEN : '#9CA3AF'} 
        />
      </Animated.View>
      <Text style={[styles.label, { color: isFocused ? GREEN : '#9CA3AF' }]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 20,
    right: 20,
    height: 64,
    zIndex: 10,
    elevation: 10,
  },
  tabBar: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  activeBackground: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    backgroundColor: GREEN_LIGHT,
    borderRadius: 24,
    zIndex: 0,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  label: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 4,
  },
});
