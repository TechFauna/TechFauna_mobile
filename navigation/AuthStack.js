import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginRegistrationScreen from '../screens/LoginRegistrationScreen';

const Stack = createNativeStackNavigator();

export default function AuthStack({ onLoginSuccess }) {
  // A tela LoginRegistrationScreen gerencia internamente a transição entre Login e Registro.
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AuthRoot">
        {props => <LoginRegistrationScreen {...props} onLoginSuccess={onLoginSuccess} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
