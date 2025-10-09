import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import supabase from '../config/supabaseClient';

const COLORS = {
  cactusGreen: '#5A8B63',
  iceWhite: '#F0F4F7',
  gray: '#A9A9A9',
  darkGray: '#4B4B4B',
};

const FONT_STYLES = {
  title: {
    fontFamily: 'Roboto',
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  text: {
    fontFamily: 'Roboto',
    fontSize: 16,
    color: COLORS.gray,
  },
};

const LoginRegistrationScreen = ({ navigation, onLoginSuccess }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    const trimmedName = name.trim();
    const trimmedCompany = company.trim();
    const trimmedRole = role.trim();

    if (!trimmedEmail || !trimmedPassword) {
      Alert.alert('Dados incompletos', 'Preencha email e senha para continuar.');
      return;
    }

    if (!isLoginMode && !trimmedName) {
      Alert.alert('Dados incompletos', 'Informe seu nome para concluir o cadastro.');
      return;
    }

    try {
      setLoading(true);
      if (isLoginMode) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: trimmedPassword,
        });

        if (error) {
          throw new Error(error.message || 'Falha na autenticacao. Tente novamente.');
        }

        Alert.alert('Sucesso!', 'Login realizado com sucesso. Redirecionando para a Home.');
        if (onLoginSuccess) {
          onLoginSuccess({ user: data.user, session: data.session });
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: trimmedPassword,
          options: {
            data: {
              name: trimmedName,
              company: trimmedCompany || undefined,
              role: trimmedRole || undefined,
            },
          },
        });

        if (error) {
          throw new Error(error.message || 'Falha no cadastro. Tente novamente.');
        }

        Alert.alert(
          'Cadastro realizado',
          'Sua conta foi criada. Verifique seu email e faca login para continuar.'
        );
        setIsLoginMode(true);
        setPassword('');
      }
    } catch (error) {
      Alert.alert(
        'Erro na Autenticacao',
        error?.message || 'Nao foi possivel completar a solicitacao.'
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setEmail('');
    setPassword('');
    setName('');
    setCompany('');
    setRole('');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={FONT_STYLES.title}>{isLoginMode ? 'Bem-vindo!' : 'Criar Conta'}</Text>
      <Text style={styles.subtitle}>
        {isLoginMode ? 'Faca login para continuar.' : 'Preencha os campos para se registrar.'}
      </Text>

      <View style={styles.formContainer}>
        {!isLoginMode && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Nome"
              placeholderTextColor={COLORS.gray}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Empresa"
              placeholderTextColor={COLORS.gray}
              value={company}
              onChangeText={setCompany}
            />
            <TextInput
              style={styles.input}
              placeholder="Funcao"
              placeholderTextColor={COLORS.gray}
              value={role}
              onChangeText={setRole}
            />
          </>
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={COLORS.gray}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor={COLORS.gray}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>{isLoginMode ? 'Entrar' : 'Registrar'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleMode} disabled={loading}>
          <Text style={styles.toggleText}>
            {isLoginMode ? 'Nao tem uma conta? Registre-se.' : 'Ja tem uma conta? Entrar.'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.iceWhite,
  },
  subtitle: {
    ...FONT_STYLES.text,
    marginBottom: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 350,
  },
  input: {
    height: 50,
    borderColor: COLORS.gray,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: 'white',
    ...FONT_STYLES.text,
  },
  button: {
    backgroundColor: COLORS.cactusGreen,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    ...FONT_STYLES.title,
    fontSize: 18,
  },
  toggleText: {
    ...FONT_STYLES.text,
    color: COLORS.cactusGreen,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default LoginRegistrationScreen;
