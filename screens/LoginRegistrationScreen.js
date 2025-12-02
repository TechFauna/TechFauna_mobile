import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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

// Função para gerar código único da empresa
const generateCompanyCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const LoginRegistrationScreen = ({ navigation, onLoginSuccess }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [userType, setUserType] = useState('owner'); // 'owner' ou 'employee'
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    const trimmedName = name.trim();
    const trimmedCompanyName = companyName.trim();
    const trimmedCompanyCode = companyCode.trim().toUpperCase();

    if (!trimmedEmail || !trimmedPassword) {
      Alert.alert('Dados incompletos', 'Preencha email e senha para continuar.');
      return;
    }

    if (!isLoginMode && !trimmedName) {
      Alert.alert('Dados incompletos', 'Informe seu nome para concluir o cadastro.');
      return;
    }

    if (!isLoginMode && userType === 'owner' && !trimmedCompanyName) {
      Alert.alert('Dados incompletos', 'Informe o nome da sua empresa.');
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
        let organizationId = null;

        // Se for funcionário e informou código, busca a empresa pelo código
        if (userType === 'employee' && trimmedCompanyCode) {
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('id, name')
            .eq('code', trimmedCompanyCode)
            .single();

          if (orgError || !orgData) {
            throw new Error('Código de empresa inválido. Verifique com o administrador.');
          }

          organizationId = orgData.id;
        }

        // Cria o usuário
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: trimmedPassword,
          options: {
            data: {
              name: trimmedName,
              user_type: userType,
              organization_id: organizationId,
            },
          },
        });

        if (error) {
          throw new Error(error.message || 'Falha no cadastro. Tente novamente.');
        }

        // Se for dono, cria a empresa
        if (userType === 'owner' && data.user) {
          const newCode = generateCompanyCode();

          const { data: newOrg, error: createOrgError } = await supabase
            .from('organizations')
            .insert([{
              name: trimmedCompanyName,
              code: newCode,
              owner_id: data.user.id,
            }])
            .select()
            .single();

          if (createOrgError) {
            throw new Error('Erro ao criar empresa. Tente novamente.');
          }

          // Atualiza o profile do usuário com o organization_id
          await supabase
            .from('profiles')
            .update({
              organization_id: newOrg.id,
              user_role: 'owner'
            })
            .eq('id', data.user.id);

          // Atualiza os metadados do usuário
          await supabase.auth.updateUser({
            data: { organization_id: newOrg.id }
          });

          Alert.alert(
            'Cadastro realizado!',
            `Sua empresa "${trimmedCompanyName}" foi criada.\n\nCódigo para convidar funcionários: ${newCode}\n\nVerifique seu email e faça login para continuar.`
          );
        } else {
          // Se for funcionário, atualiza o profile
          if (data.user) {
            await supabase
              .from('profiles')
              .update({
                organization_id: organizationId,
                user_role: 'employee'
              })
              .eq('id', data.user.id);
          }

          Alert.alert(
            'Cadastro realizado',
            'Sua conta foi vinculada à empresa. Verifique seu email e faça login para continuar.'
          );
        }

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
    setCompanyName('');
    setCompanyCode('');
    setUserType('owner');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={FONT_STYLES.title}>{isLoginMode ? 'Bem-vindo!' : 'Criar Conta'}</Text>
        <Text style={styles.subtitle}>
          {isLoginMode ? 'Faca login para continuar.' : 'Preencha os campos para se registrar.'}
        </Text>

        <View style={styles.formContainer}>
          {!isLoginMode && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Nome completo"
                placeholderTextColor={COLORS.gray}
                value={name}
                onChangeText={setName}
              />

              {/* Seleção de tipo de usuário */}
              <Text style={styles.sectionLabel}>Você é:</Text>
              <View style={styles.userTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.userTypeButton,
                    userType === 'owner' && styles.userTypeButtonActive,
                  ]}
                  onPress={() => setUserType('owner')}
                >
                  <MaterialCommunityIcons
                    name="shield-crown"
                    size={24}
                    color={userType === 'owner' ? '#FFF' : COLORS.cactusGreen}
                  />
                  <Text
                    style={[
                      styles.userTypeText,
                      userType === 'owner' && styles.userTypeTextActive,
                    ]}
                  >
                    Dono
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.userTypeButton,
                    userType === 'employee' && styles.userTypeButtonActive,
                  ]}
                  onPress={() => setUserType('employee')}
                >
                  <MaterialCommunityIcons
                    name="account-group"
                    size={24}
                    color={userType === 'employee' ? '#FFF' : COLORS.cactusGreen}
                  />
                  <Text
                    style={[
                      styles.userTypeText,
                      userType === 'employee' && styles.userTypeTextActive,
                    ]}
                  >
                    Funcionário
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Campo condicional baseado no tipo */}
              {userType === 'owner' && (
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Nome da sua empresa"
                    placeholderTextColor={COLORS.gray}
                    value={companyName}
                    onChangeText={(text) => setCompanyName(text)}
                    autoCorrect={false}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>
              )}
              {userType === 'employee' && (
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Código da empresa (opcional)"
                    placeholderTextColor={COLORS.gray}
                    value={companyCode}
                    onChangeText={(text) => setCompanyCode(text)}
                    autoCapitalize="characters"
                    maxLength={6}
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                </View>
              )}
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
    </KeyboardAvoidingView>
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
  sectionLabel: {
    ...FONT_STYLES.text,
    color: COLORS.darkGray,
    fontWeight: '600',
    marginBottom: 10,
  },
  userTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 15,
  },
  userTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.cactusGreen,
    backgroundColor: 'white',
  },
  userTypeButtonActive: {
    backgroundColor: COLORS.cactusGreen,
    borderColor: COLORS.cactusGreen,
  },
  userTypeText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.cactusGreen,
  },
  userTypeTextActive: {
    color: 'white',
  },
  inputWrapper: {
    zIndex: 1,
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
