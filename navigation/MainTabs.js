import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import HomeStack from './HomeStack';
import ChecklistScreen from '../screens/ChecklistScreen';
import QRCodeScreen from '../screens/QRCodeScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const COLORS = {
  cactusGreen: '#5A8B63',
  darkGray: '#4B4B4B',
};

const TAB_ICONS = {
  Home: 'home-variant',
  Checklist: 'clipboard-check-outline',
  'QR Code': 'qrcode-scan',
  Perfil: 'account-circle-outline',
};

export default function MainTabs({ onLogout }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.cactusGreen,
        tabBarInactiveTintColor: COLORS.darkGray,
        tabBarStyle: { height: 60, paddingBottom: 5 },
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons
            name={TAB_ICONS[route.name] || 'help-circle-outline'}
            color={color}
            size={size}
          />
        ),
        tabBarLabelStyle: { fontSize: 12, fontWeight: 'bold' },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen name="Checklist" component={ChecklistScreen} />
      <Tab.Screen name="QR Code" component={QRCodeScreen} />
      <Tab.Screen name="Perfil" options={{ title: 'Perfil' }}>
        {(props) => <ProfileScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
