import React, { useRef, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/color';

import ChatsScreen from '../screens/ChatsScreen';
import GroupsScreen from '../screens/GroupsScreen';
import GamesScreen from '../screens/GamesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

const TabButton = ({ item, onPress, accessibilityState }) => {
  const focused = accessibilityState.selected;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (focused) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.2,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [focused]);

  if (item.name === 'Games') {
    return (
      <TouchableOpacity onPress={onPress} style={styles.centerBtnWrapper} activeOpacity={0.8}>
        <Animated.View style={[styles.centerBtn, { transform: [{ scale: scaleAnim }] }]}>
          <Ionicons name="game-controller" size={28} color={colors.bg} />
        </Animated.View>
        <Text style={styles.centerLabel}>Games</Text>
      </TouchableOpacity>
    );
  }

  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', colors.neonGreen + '30'],
  });

  return (
    <TouchableOpacity onPress={onPress} style={styles.tabBtn} activeOpacity={0.7}>
      <Animated.View style={[styles.iconWrap, { backgroundColor: glowColor }]}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Ionicons
            name={focused ? item.activeIcon : item.icon}
            size={22}
            color={focused ? colors.neonGreen : colors.textSecondary}
          />
        </Animated.View>
      </Animated.View>
      <Text style={[styles.label, focused && styles.labelActive]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );
};

const tabs = [
  { name: 'Chats', icon: 'chatbubbles-outline', activeIcon: 'chatbubbles' },
  { name: 'Groups', icon: 'people-outline', activeIcon: 'people' },
  { name: 'Games', icon: 'game-controller-outline', activeIcon: 'game-controller' },
  { name: 'Profile', icon: 'person-outline', activeIcon: 'person' },
  { name: 'Settings', icon: 'settings-outline', activeIcon: 'settings' },
];

function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const item = tabs[index];
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

        return (
          <TabButton
            key={route.key}
            item={item}
            onPress={onPress}
            accessibilityState={{ selected: isFocused }}
          />
        );
      })}
    </View>
  );
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Chats" component={ChatsScreen} />
      <Tab.Screen name="Groups" component={GroupsScreen} />
      <Tab.Screen name="Games" component={GamesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#111111',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 70,
    alignItems: 'center',
    paddingBottom: 8,
    paddingHorizontal: 8,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  iconWrap: {
    padding: 6,
    borderRadius: 12,
    marginBottom: 2,
  },
  label: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  labelActive: {
    color: colors.neonGreen,
    fontWeight: '600',
  },
  centerBtnWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  centerBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.neonGreen,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.neonGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 8,
  },
  centerLabel: {
    fontSize: 10,
    color: colors.neonGreen,
    marginTop: 4,
    fontWeight: '600',
  },
});