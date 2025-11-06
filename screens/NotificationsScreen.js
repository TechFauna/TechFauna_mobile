import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLORS = {
  background: '#F7F9FC',
  surface: '#FFFFFF',
  primary: '#5A8B63',
  text: '#2F3542',
  textMuted: '#77838F',
  border: '#E3E9F3',
  success: '#27AE60',
  warning: '#F39C12',
};

// Configurar como as notificações devem ser tratadas quando o app está em primeiro plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const NotificationsScreen = ({ navigation }) => {
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [settings, setSettings] = useState({
    taskReminders: true,
    dailySummary: true,
    urgentAlerts: true,
    feedingTime: false,
    cleaningTime: false,
    morningReminder: true,
    afternoonReminder: false,
  });

  useEffect(() => {
    checkPermissionStatus();
    loadSettings();
  }, []);

  const checkPermissionStatus = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status);
    setNotificationsEnabled(status === 'granted');
  };

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('notificationSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    }
  };

  const requestPermission = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          'Permissão Negada',
          'Você precisa permitir notificações nas configurações do dispositivo para receber lembretes.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Abrir Configurações', onPress: () => Notifications.openSettingsAsync() },
          ]
        );
        setPermissionStatus(finalStatus);
        setNotificationsEnabled(false);
        return false;
      }

      setPermissionStatus(finalStatus);
      setNotificationsEnabled(true);
      
      Alert.alert(
        'Notificações Ativadas! 🔔',
        'Você receberá lembretes sobre suas tarefas e atividades.'
      );

      // Agendar uma notificação de teste
      await scheduleTestNotification();
      
      return true;
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      Alert.alert('Erro', 'Não foi possível solicitar permissão para notificações.');
      return false;
    }
  };

  const scheduleTestNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'TechFauna 🦁',
        body: 'Notificações ativadas com sucesso! Você receberá lembretes importantes.',
        data: { type: 'test' },
      },
      trigger: { seconds: 2 },
    });
  };

  const toggleMainSwitch = async (value) => {
    if (value) {
      const granted = await requestPermission();
      if (!granted) return;
    } else {
      setNotificationsEnabled(false);
      Alert.alert(
        'Notificações Desativadas',
        'Você não receberá mais lembretes. Você pode reativar a qualquer momento.'
      );
    }
  };

  const toggleSetting = (key) => {
    if (!notificationsEnabled) {
      Alert.alert(
        'Ative as Notificações',
        'Primeiro você precisa ativar as notificações principais.'
      );
      return;
    }

    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);
  };

  const SettingRow = ({ icon, title, description, settingKey, iconColor }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <MaterialCommunityIcons 
          name={icon} 
          size={24} 
          color={iconColor || COLORS.primary} 
          style={styles.settingIcon}
        />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {description && <Text style={styles.settingDescription}>{description}</Text>}
        </View>
      </View>
      <Switch
        value={settings[settingKey]}
        onValueChange={() => toggleSetting(settingKey)}
        trackColor={{ false: COLORS.border, true: COLORS.primary }}
        thumbColor={settings[settingKey] ? COLORS.surface : '#f4f3f4'}
        disabled={!notificationsEnabled}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificações e Lembretes</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Seção de Permissão */}
        <View style={styles.card}>
          <View style={styles.permissionHeader}>
            <MaterialCommunityIcons 
              name={notificationsEnabled ? "bell-ring" : "bell-off"} 
              size={48} 
              color={notificationsEnabled ? COLORS.success : COLORS.textMuted} 
            />
            <Text style={styles.permissionTitle}>
              {notificationsEnabled ? 'Notificações Ativadas' : 'Ativar Notificações'}
            </Text>
            <Text style={styles.permissionDescription}>
              {notificationsEnabled 
                ? 'Você receberá lembretes sobre tarefas e atividades importantes.'
                : 'Receba lembretes sobre suas tarefas diárias, horários de alimentação e alertas urgentes.'}
            </Text>
          </View>

          <View style={styles.mainSwitchRow}>
            <Text style={styles.mainSwitchLabel}>Permitir Notificações</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleMainSwitch}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={notificationsEnabled ? COLORS.surface : '#f4f3f4'}
            />
          </View>

          {permissionStatus === 'denied' && (
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => Notifications.openSettingsAsync()}
            >
              <MaterialCommunityIcons name="cog" size={20} color={COLORS.primary} />
              <Text style={styles.settingsButtonText}>Abrir Configurações do Sistema</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Seção de Lembretes de Tarefas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lembretes de Tarefas</Text>
          <View style={styles.card}>
            <SettingRow
              icon="clipboard-check-outline"
              title="Lembretes de Tarefas"
              description="Receba notificações sobre tarefas pendentes"
              settingKey="taskReminders"
            />
            <View style={styles.divider} />
            <SettingRow
              icon="chart-line"
              title="Resumo Diário"
              description="Resumo das tarefas do dia às 8h"
              settingKey="dailySummary"
            />
            <View style={styles.divider} />
            <SettingRow
              icon="alert-circle"
              title="Alertas Urgentes"
              description="Notificações de tarefas prioritárias"
              settingKey="urgentAlerts"
              iconColor={COLORS.warning}
            />
          </View>
        </View>

        {/* Seção de Horários Específicos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Horários Específicos</Text>
          <View style={styles.card}>
            <SettingRow
              icon="food-apple"
              title="Horário de Alimentação"
              description="Lembrete para alimentar os animais"
              settingKey="feedingTime"
            />
            <View style={styles.divider} />
            <SettingRow
              icon="broom"
              title="Horário de Limpeza"
              description="Lembrete para limpeza dos recintos"
              settingKey="cleaningTime"
            />
          </View>
        </View>

        {/* Seção de Lembretes Diários */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lembretes Diários</Text>
          <View style={styles.card}>
            <SettingRow
              icon="weather-sunset-up"
              title="Lembrete Matinal"
              description="Resumo das atividades às 7h"
              settingKey="morningReminder"
            />
            <View style={styles.divider} />
            <SettingRow
              icon="weather-sunset-down"
              title="Lembrete Vespertino"
              description="Verificação de tarefas às 15h"
              settingKey="afternoonReminder"
            />
          </View>
        </View>

        {/* Informações Adicionais */}
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="information" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            As notificações ajudam você a manter suas tarefas em dia e não perder nenhuma atividade importante.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  permissionHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 8,
  },
  permissionDescription: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  mainSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  mainSwitchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    gap: 8,
  },
  settingsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    paddingLeft: 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
});

export default NotificationsScreen;

