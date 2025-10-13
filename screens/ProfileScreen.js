import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { listChecklists, listTasks } from '../utils/zooService';

const COLORS = {
  background: '#F7F9FC',
  surface: '#FFFFFF',
  primary: '#5A8B63',
  danger: '#E74C3C',
  border: '#E3E9F3',
  text: '#2F3542',
  textMuted: '#77838F',
};

const ProfileScreen = ({ navigation, onLogout }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(false);

  const userName =
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')?.[0] ||
    'Colaborador';

  const role = user?.user_metadata?.role || 'Equipe TechFauna';
  const company = user?.user_metadata?.company || 'TechFauna';

  const fetchProfileData = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksData, checklistsData] = await Promise.all([
        listTasks({ assignedTo: user?.id }),
        listChecklists({ performedBy: user?.id }),
      ]);

      setTasks(tasksData || []);
      setChecklists(checklistsData || []);
    } catch (error) {
      Alert.alert('Falha ao carregar dados', error?.message || 'Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [fetchProfileData])
  );

  const taskSummary = useMemo(() => {
    const pending = tasks.filter((task) => task.status !== 'completed').length;
    const completed = tasks.filter((task) => task.status === 'completed').length;
    return {
      total: tasks.length,
      pending,
      completed,
    };
  }, [tasks]);

  const checklistSummary = useMemo(() => {
    const lastExecution = checklists
      .sort((a, b) => new Date(b.performed_at) - new Date(a.performed_at))
      .at(0);

    return {
      total: checklists.length,
      last: lastExecution?.performed_at
        ? new Date(lastExecution.performed_at).toLocaleString('pt-BR')
        : 'Nunca executado',
    };
  }, [checklists]);

  const handleLogout = async () => {
    try {
      await onLogout?.();
    } catch (error) {
      Alert.alert('Erro ao sair', error?.message || 'Nao foi possivel finalizar a sessao.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userName?.[0]?.toUpperCase() || 'T'}</Text>
          </View>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userMeta}>{role}</Text>
          <Text style={styles.userMeta}>{company}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Minha produtividade</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Tarefas concluidas</Text>
              <Text style={styles.infoValue}>{taskSummary.completed}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Tarefas pendentes</Text>
              <Text style={styles.infoValue}>{taskSummary.pending}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Total atribuida</Text>
              <Text style={styles.infoValue}>{taskSummary.total}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.inlineButton}
            onPress={() => navigation.navigate('Checklist')}
          >
            <Text style={styles.inlineButtonText}>Abrir painel de tarefas</Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Checklists executados</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Total</Text>
              <Text style={styles.infoValue}>{checklistSummary.total}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Ultimo registro</Text>
              <Text style={styles.infoValueSmall}>{checklistSummary.last}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Preferencias rapidas</Text>
          <TouchableOpacity style={styles.actionRow}>
            <MaterialCommunityIcons name="shield-account" size={22} color={COLORS.primary} />
            <Text style={styles.actionLabel}>Gerenciar permissoes e papeis</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionRow}>
            <MaterialCommunityIcons name="bell-outline" size={22} color={COLORS.primary} />
            <Text style={styles.actionLabel}>Notificacoes e lembretes</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionRow}>
            <MaterialCommunityIcons name="account-edit" size={22} color={COLORS.primary} />
            <Text style={styles.actionLabel}>Editar dados pessoais</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={loading}>
          <MaterialCommunityIcons name="logout" size={22} color="#FFF" />
          <Text style={styles.logoutLabel}>{loading ? 'Saindo...' : 'Sair da conta'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: 20,
    paddingBottom: 100,
    gap: 20,
  },
  headerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E1EDE4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  userMeta: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 6,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
    gap: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoBox: {
    flex: 1,
    minWidth: 110,
    backgroundColor: '#F1F6F2',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
  },
  infoValueSmall: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  inlineButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#E9F3EC',
  },
  inlineButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  actionLabel: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.danger,
    paddingVertical: 16,
    borderRadius: 20,
    gap: 8,
  },
  logoutLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ProfileScreen;
