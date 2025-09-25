import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
// Importa o usuário de teste do arquivo que está no .gitignore
import { TEST_USER } from '../config/testCredentials'; 

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

  const handleAuth = () => {
    // Lógica SIMULADA para login ou registro aqui
    if (isLoginMode) {
      // --- Lógica de MOCK DE LOGIN ---
      if (email === TEST_USER.email && password === TEST_USER.password) {
          Alert.alert('Sucesso!', 'Login realizado com sucesso. Redirecionando para a Home.');
          if (onLoginSuccess) {
              onLoginSuccess();
          }
      } else {
          Alert.alert('Erro no Login', `Email ou senha inválidos. Use ${TEST_USER.email} e ${TEST_USER.password}.`);
      }
    } else {
      // Lógica de MOCK DE REGISTRO
      Alert.alert('Registro', `Registrando: ${name}, ${email}.`);
      setIsLoginMode(true);
      setEmail('');
      setPassword('');
      Alert.alert('Sucesso no Registro', 'Sua conta foi criada. Faça login para continuar.');
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
      <Text style={styles.subtitle}>{isLoginMode ? 'Faça login para continuar.' : 'Preencha os campos para se registrar.'}</Text>

      <View style={styles.formContainer}>
        {/* Campos do formulário de Registro */}
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
              placeholder="Função"
              placeholderTextColor={COLORS.gray}
              value={role}
              onChangeText={setRole}
            />
          </>
        )}

        {/* Campos comuns a ambos */}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={COLORS.gray}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor={COLORS.gray}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleAuth}>
          <Text style={styles.buttonText}>{isLoginMode ? 'Entrar' : 'Registrar'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleMode}>
          <Text style={styles.toggleText}>
            {isLoginMode ? 'Não tem uma conta? Registre-se.' : 'Já tem uma conta? Entrar.'}
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