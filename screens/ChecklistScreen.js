import React, { useState } from 'react';
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

const ChecklistScreen = () => {
  const [dailyTasks, setDailyTasks] = useState([
    { id: '1', text: 'Alimentar os macacos', completed: false },
    { id: '2', text: 'Limpar recinto das aves', completed: true },
    { id: '3', text: 'Verificar hidratação dos leões', completed: false },
  ]);

  const [totalTasks, setTotalTasks] = useState([
    { id: '1', text: 'Revisar trilha principal', completed: true },
    { id: '2', text: 'Verificar cerca do recinto dos tigres', completed: true },
    { id: '3', text: 'Instalar novas placas de sinalização', completed: false },
    { id: '4', text: 'Conferir sistema de irrigação', completed: false },
  ]);
  
  const dailyProgress = dailyTasks.filter(task => task.completed).length / dailyTasks.length;
  const totalProgress = totalTasks.filter(task => task.completed).length / totalTasks.length;

  const toggleTaskCompletion = (taskId, listType) => {
    if (listType === 'daily') {
      const updatedTasks = dailyTasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      );
      setDailyTasks(updatedTasks);
    } else if (listType === 'total') {
      const updatedTasks = totalTasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      );
      setTotalTasks(updatedTasks);
    }
  };

  const renderTaskItem = (task, listType) => (
    <TouchableOpacity
      key={task.id}
      style={styles.taskItem}
      onPress={() => toggleTaskCompletion(task.id, listType)}
    >
      <View style={[styles.checkbox, { backgroundColor: task.completed ? COLORS.cactusGreen : 'transparent', borderColor: task.completed ? COLORS.cactusGreen : COLORS.gray }]}>
      </View>
      <Text style={[styles.taskText, { textDecorationLine: task.completed ? 'line-through' : 'none' }]}>
        {task.text}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.screenTitle}>Checklist</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Progresso do Dia</Text>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${dailyProgress * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>{Math.round(dailyProgress * 100)}% concluído</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Progresso Total</Text>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${totalProgress * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>{Math.round(totalProgress * 100)}% concluído</Text>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Atividades Diárias</Text>
        {dailyTasks.map(task => renderTaskItem(task, 'daily'))}
      </View>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Atividades Futuras</Text>
        {totalTasks.map(task => renderTaskItem(task, 'total'))}
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.iceWhite,
    padding: 20,
  },
  screenTitle: {
    ...FONT_STYLES.title,
    marginBottom: 20,
    textAlign: 'center',
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
  cardTitle: {
    ...FONT_STYLES.subtitle,
    marginBottom: 10,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
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
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.gray,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskText: {
    ...FONT_STYLES.text,
    flex: 1,
  },
});

export default ChecklistScreen;