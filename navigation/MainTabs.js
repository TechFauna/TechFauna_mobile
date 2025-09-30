import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import ChecklistScreen from '../screens/ChecklistScreen';
import QRCodeScreen from '../screens/QRCodeScreen';
import ProfileScreen from '../screens/ProfileScreen';
// Para usar ícones, você deve instalar: npx expo install react-native-vector-icons
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const Tab = createBottomTabNavigator();
const COLORS = { cactusGreen: '#5A8B63', darkGray: '#4B4B4B' };

export default function MainTabs({ onLogout }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.cactusGreen,
        tabBarInactiveTintColor: COLORS.darkGray,
        tabBarStyle: { height: 60, paddingBottom: 5 },
        // Lógica para ícones (substituir o texto por ícones visuais)
        tabBarIcon: ({ color, size }) => {
            // Se Icon não estiver instalado, apenas retornamos nulo ou texto
            // return <Icon name={getIconName(route.name)} color={color} size={size} />;
            return null; // Retorna null enquanto os ícones não são implementados/instalados
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: 'bold' }
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Checklist" component={ChecklistScreen} />
      <Tab.Screen name="QR Code" component={QRCodeScreen} />
      {/* A tela de Perfil precisa da função onLogout */}
      <Tab.Screen name="Perfil" options={{ title: 'Perfil' }}> 
        {props => <ProfileScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// Função auxiliar para determinar o ícone baseado no nome da rota
// const getIconName = (routeName) => {
//   switch (routeName) {
//     case 'Home': return 'home';
//     case 'Checklist': return 'check-circle';
//     case 'QR Code': return 'qrcode-scan';
//     case 'Perfil': return 'account';
//     default: return 'help-circle';
//   }
// };
