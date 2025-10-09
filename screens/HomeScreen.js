import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';

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

  const handleScanQR = () => {
    navigation.navigate('QR Code');
  };

  const handleViewAnimals = () => {
    console.log('Navegar para a tela de Ver Animais');
  };

  return (
    // O componente SafeAreaView garante que o conteúdo não invada áreas do sistema
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollViewContainer}>
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
            <TouchableOpacity style={styles.actionButton} onPress={handleScanQR}>
              <Text style={styles.actionButtonText}>Escanear QR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleViewAnimals}>
              <Text style={styles.actionButtonText}>Ver Animais</Text>
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
    backgroundColor: COLORS.iceWhite,
  },
  scrollViewContainer: {
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
  },
});

export default HomeScreen;
