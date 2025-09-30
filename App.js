// App.js (O Roteador Principal)

import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthStack from './navigation/AuthStack';
import MainTabs from './navigation/MainTabs';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 1. LOGIN SUCESSO: Chamado da LoginRegistrationScreen
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };
  
  // 2. LOGOUT: Chamado da ProfileScreen
  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      {isLoggedIn ? (
        // Se logado: navegação principal (Abas)
        <MainTabs onLogout={handleLogout} />
      ) : (
        // Se não logado: navegação de autenticação (Stack de Login)
        <AuthStack onLoginSuccess={handleLoginSuccess} />
      )}
    </NavigationContainer>
  );
}