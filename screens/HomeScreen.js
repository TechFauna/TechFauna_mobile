<<<<<<< Updated upstream
import React, { useCallback, useMemo, useState, useEffect } from 'react';
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
import * as Location from 'expo-location';
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
  warning: '#F39C12', // Cor para status pendente (laranja)
  success: '#27AE60',
  error: '#C0392B', // Cor para status bloqueado (vermelho escuro)
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
  // ESTADOS PARA LOCALIZAÇÃO
  const [locationText, setLocationText] = useState('Carregando localização...');
  const [currentCoords, setCurrentCoords] = useState(null); 

  const displayName =
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')?.[0] ||
    'Equipe';

  // --- LÓGICA DE LOCALIZAÇÃO ---
  const fetchLocation = useCallback(async () => {
    try {
      // 1. Solicitar Permissão
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationText('Permissão de localização negada.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation });
      
      let address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address && address.length > 0) {
        const primaryText = address[0].street ? `${address[0].street}, ${address[0].name}` : `${address[0].city}, ${address[0].region}`;
        setLocationText(primaryText || 'Localização desconhecida');
      } else {
        setLocationText('Endereço não encontrado.');
      }
    } catch (error) {
      console.error('Erro ao buscar localização:', error);
      setLocationText('Erro ao buscar localização.');
    }
  }, []);
  
  // FUNÇÃO PARA NAVEGAR PARA A TELA INTERNA DO MAPA, PASSANDO O ENDEREÇO
  const handleNavigateToMap = () => {
    navigation.navigate('Mapa', { initialAddress: locationText }); // ENVIA O ENDEREÇO
  };

  // --- FUNÇÕES EXISTENTES (DASHBOARD) ---
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
      fetchLocation(); // CHAMA A FUNÇÃO DE LOCALIZAÇÃO AO ENTRAR NA TELA
    }, [fetchDashboard, fetchLocation])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchDashboard();
      await fetchLocation(); // ATUALIZA A LOCALIZAÇÃO AO REFRESH
    } finally {
      setRefreshing(false);
    }
  }, [fetchDashboard, fetchLocation]);


  
  const pendingTasksCount = tasks.filter((task) => task.status !== 'completed').length;

  const quickStats = useMemo(
    () => [
      // ... (Quick Stats)
      {
        key: 'animals',
        label: 'Animais',
        value: summary.animals,
        icon: 'paw', // Trocado de 'elephant' para 'paw' (mais genérico)
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

        {/* CARTÃO DE LOCALIZAÇÃO (Navega internamente) */}
        <TouchableOpacity style={styles.locationCard} onPress={handleNavigateToMap}>
          <MaterialCommunityIcons name="map-marker" size={20} color={COLORS.primary} />
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationLabel}>Localização Atual (Clique)</Text>
            <Text style={styles.locationValue}>{locationText}</Text>
          </View>
          <MaterialCommunityIcons name="arrow-right" size={20} color={COLORS.primary} />
        </TouchableOpacity>


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
                  <Text 
                    style={[
                      styles.taskStatusText, 
                      task.status === 'blocked' && { color: COLORS.error }
                    ]}
                  >
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
=======
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';

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
  subtitle: {
    fontFamily: 'Roboto',
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  text: {
    fontFamily: 'Roboto',
    fontSize: 16,
    color: COLORS.gray,
  },
};

const HomeScreen = ({ navigation }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState({ temp: '25°C', condition: 'Parcialmente Nublado' });
  const [userName, setUserName] = useState('Usuário Teste');
  const [tasks, setTasks] = useState([
    { id: '1', text: 'Alimentar os macacos', completed: false },
    { id: '2', text: 'Limpar recinto das aves', completed: true },
    { id: '3', text: 'Verificar a hidratação dos leões', completed: false },
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const progress = tasks.filter(task => task.completed).length / tasks.length;
  
  const formatDate = (date) => {
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  };
  
  const formatTime = (date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const handleOpenCalendar = () => {
    console.log('Navegar para a tela do Calendário');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greetingText}>Olá, {userName}!</Text>
        <TouchableOpacity onPress={handleOpenCalendar}>
          <Text style={styles.dateText}>{formatDate(currentTime)}</Text>
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={FONT_STYLES.subtitle}>Localização e Clima</Text>
        <View style={styles.weatherInfo}>
          <Text style={FONT_STYLES.text}> Fortaleza, CE</Text>
          <Text style={FONT_STYLES.text}> {weather.temp} | {weather.condition}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={FONT_STYLES.subtitle}>Progresso Diário</Text>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>{Math.round(progress * 100)}% das tarefas concluídas</Text>
      </View>

      <View style={styles.card}>
        <Text style={FONT_STYLES.subtitle}>Tarefas do Dia</Text>
        {tasks.map(task => (
          <View key={task.id} style={styles.taskItem}>
            <View style={[styles.taskStatus, { backgroundColor: task.completed ? COLORS.cactusGreen : COLORS.gray }]} />
            <Text style={[FONT_STYLES.text, { textDecorationLine: task.completed ? 'line-through' : 'none' }]}>{task.text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.quickActions}>
        <Text style={FONT_STYLES.subtitle}>Ações Rápidas</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Escanear QR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Ver Animais</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
>>>>>>> Stashed changes
  );
};

const styles = StyleSheet.create({
<<<<<<< Updated upstream
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
  // ESTILO PARA O CARTÃO DE LOCALIZAÇÃO
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 15,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  locationTextContainer: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  locationValue: {
    fontSize: 14,
    color: COLORS.text,
    marginTop: 2,
  },
  // FIM DOS ESTILOS DE LOCALIZAÇÃO
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
=======
  container: {
    flex: 1,
    backgroundColor: COLORS.iceWhite,
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  greetingText: {
    ...FONT_STYLES.title,
    marginBottom: 5,
  },
  dateText: {
    ...FONT_STYLES.subtitle,
    color: COLORS.darkGray,
  },
  timeText: {
    ...FONT_STYLES.text,
    color: COLORS.gray,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    marginTop: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.cactusGreen,
    borderRadius: 5,
  },
  progressText: {
    ...FONT_STYLES.text,
    textAlign: 'right',
    marginTop: 5,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  taskStatus: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  quickActions: {
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: COLORS.cactusGreen,
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  actionButtonText: {
    color: 'white',
    ...FONT_STYLES.subtitle,
    fontSize: 16,
>>>>>>> Stashed changes
  },
});

export default HomeScreen;