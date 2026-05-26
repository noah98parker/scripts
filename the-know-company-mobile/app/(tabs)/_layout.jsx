import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet } from 'react-native';
import { colors, shadow } from '../../constants/theme';

function TabIcon({ name, color, size }) {
  return <Ionicons name={name} size={size} color={color} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray400,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 0,
          ...shadow.lg,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="map" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="garages"
        options={{
          title: 'Garages',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="car" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="tow"
        options={{
          title: 'Tow Info',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="warning" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="laws"
        options={{
          title: 'Laws',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="book" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="person" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
