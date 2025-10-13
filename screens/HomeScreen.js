import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
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
import {
  listAnimals,
  listEnclosures,
  listSpecies,
  listTasks,
} from '../utils/zooService';

const COLORS = {
  background: '#F7F9FC',
  surface: '#FFFFFF',
  primary: '#5A8B63',
  text: '#2F3542',
  textMuted: '#77838F',
  border: '#E3E9F3',
  warning: '#F39C12',
  success: '#27AE60',
};

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState({
    animals: 0,
    enclosures: 0,
    species: 0,
  });

  const displayName =
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')?.[0] ||
    'Equipe';

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [animalsData, enclosuresData, speciesData, tasksData] = await Promise.all([
        listAnimals(),
        listEnclosures(),
        listSpecies(),
        listTasks({ assignedTo: user?.id }),
      ]);

      setSummary({
        animals: animalsData?.length || 0,
        enclosures: enclosuresData?.length || 0,
        species: speciesData?.length || 0,
      });

      const sortedTasks = (tasksData || [])
        .filter((task) => task.status !== 'completed')
        .slice(0, 5);

      setTasks(sortedTasks);
    } catch (error) {
      Alert.alert('Erro ao carregar dados', error?.message || 'Verifique sua conexao.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [fetchDashboard])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchDashboard();
    } finally {
      setRefreshing(false);
    }
  }, [fetchDashboard]);

  const pendingTasksCount = tasks.filter((task) => task.status !== 'completed').length;

  const quickStats = useMemo(
    () => [
      {
        key: 'animals',
        label: 'Animais',
        value: summary.animals,
        icon: 'elephant',
      },
      {
        key: 'enclosures',
        label: 'Recintos',
        value: summary.enclosures,
        icon: 'home-group',
      },
      {
        key: 'species',
        label: 'Especies',
        value: summary.species,
        icon: 'leaf',
      },
    ],
    [summary]
  );

  const handleScanQR = () => {
    navigation.navigate('QR Code');
  };

  const handleViewAnimals = () => {
    navigation.navigate('AnimalCatalog');
  };

  const formatDateTime = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return {
      date: formatter.format(now),
      time: timeFormatter.format(now),
    };
  };

  const { date, time } = formatDateTime();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Ola, {displayName}</Text>
            <Text style={styles.subGreeting}>{date}</Text>
            <Text style={styles.subGreeting}>{time}</Text>
          </View>
          <MaterialCommunityIcons name="account-circle" size={48} color={COLORS.primary} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumo rapido</Text>
          <View style={styles.statsRow}>
            {quickStats.map((stat) => (
              <View key={stat.key} style={styles.statCard}>
                <MaterialCommunityIcons name={stat.icon} size={24} color={COLORS.primary} />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Minhas tarefas</Text>
          {loading ? (
            <View style={styles.loaderRow}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={styles.loaderText}>Atualizando tarefas...</Text>
            </View>
          ) : tasks.length === 0 ? (
            <Text style={styles.emptyMessage}>Nenhuma tarefa pendente. Excelente trabalho!</Text>
          ) : (
            tasks.map((task) => (
              <View key={task.id} style={styles.taskRow}>
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskMeta}>
                    {task.due_at
                      ? `Vence em ${new Date(task.due_at).toLocaleDateString('pt-BR')}`
                      : 'Sem prazo definido'}
                  </Text>
                  {task.enclosure?.name ? (
                    <Text style={styles.taskMeta}>Recinto: {task.enclosure.name}</Text>
                  ) : null}
                </View>
                <View
                  style={[
                    styles.taskStatusBadge,
                    task.status === 'pending' ? styles.taskStatusPending : styles.taskStatusBlocked,
                  ]}
                >
                  <Text style={styles.taskStatusText}>
                    {task.status === 'pending'
                      ? 'Pendente'
                      : task.status === 'blocked'
                      ? 'Bloqueada'
                      : task.status}
                  </Text>
                </View>
              </View>
            ))
          )}

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Checklist')}
          >
            <Text style={styles.secondaryButtonText}>
              Abrir painel completo ({pendingTasksCount} pendentes)
            </Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.cardTitle}>Acoes rapidas</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionButton} onPress={handleScanQR}>
              <MaterialCommunityIcons name="qrcode-scan" size={26} color="#FFF" />
              <Text style={styles.actionLabel}>Escanear QR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleViewAnimals}>
              <MaterialCommunityIcons name="paw" size={26} color="#FFF" />
              <Text style={styles.actionLabel}>Ver animais</Text>
            </TouchableOpacity>
          </View>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
  },
  subGreeting: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F0F6F1',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  emptyMessage: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: 20,
  },
  taskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  taskInfo: {
    flex: 1,
    paddingRight: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  taskMeta: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  taskStatusBadge: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  taskStatusPending: {
    backgroundColor: 'rgba(243, 156, 18, 0.15)',
  },
  taskStatusBlocked: {
    backgroundColor: 'rgba(192, 57, 43, 0.15)',
  },
  taskStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.warning,
  },
  secondaryButton: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#E9F3EC',
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  quickActions: {
    marginTop: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  actionLabel: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default HomeScreen;
