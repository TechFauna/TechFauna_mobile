import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthStack from './navigation/AuthStack';
import MainTabs from './navigation/MainTabs';
import supabase from './config/supabaseClient';
import { AuthProvider } from './context/AuthContext';

const LOADER_STYLE = {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#F0F4F7',
};

export default function App() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const {
          data: { session: storedSession },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (storedSession) {
          setSession(storedSession);
          setUser(storedSession.user);
        }
      } catch (error) {
        console.warn('Falha ao recuperar sessao existente:', error?.message);
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    };

    bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!isMounted) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLoginSuccess = ({ user: loggedUser, session: loggedSession }) => {
    setUser(loggedUser);
    setSession(loggedSession);
  };

  const handleLogout = async () => {
    try {
      // Primeiro limpa o estado local
      setUser(null);
      setSession(null);

      // Faz signOut no Supabase
      await supabase.auth.signOut();

      // Limpa manualmente as chaves de autenticação do AsyncStorage
      // para garantir que não há dados residuais
      const keys = await AsyncStorage.getAllKeys();
      const authKeys = keys.filter(key =>
        key.includes('supabase') ||
        key.includes('sb-') ||
        key.includes('auth')
      );
      if (authKeys.length > 0) {
        await AsyncStorage.multiRemove(authKeys);
      }
    } catch (error) {
      console.warn('Erro ao realizar logout:', error?.message);
      // Mesmo com erro, garante que o estado local está limpo
      setUser(null);
      setSession(null);
    }
  };

  const authContextValue = useMemo(
    () => ({
      user,
      session,
      setUser,
      setSession,
    }),
    [user, session]
  );

  if (isBootstrapping) {
    return (
      <View style={LOADER_STYLE}>
        <ActivityIndicator size="large" color="#5A8B63" />
      </View>
    );
  }

  const isLoggedIn = Boolean(user && session);

  return (
    <AuthProvider value={authContextValue}>
      <NavigationContainer>
        <StatusBar style="auto" />
        {isLoggedIn ? (
          <MainTabs onLogout={handleLogout} />
        ) : (
          <AuthStack onLoginSuccess={handleLoginSuccess} />
        )}
      </NavigationContainer>
    </AuthProvider>
  );
}
