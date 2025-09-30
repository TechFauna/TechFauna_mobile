import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
// Note: Para a funcionalidade de "Enviar Foto" real, seria necessário
// importar e usar uma biblioteca de câmera/galeria (Ex: expo-image-picker).

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
  
  const dailyCompletedCount = dailyTasks.filter(task => task.completed).length;
  const dailyProgress = dailyCompletedCount / dailyTasks.length;
  const totalProgress = totalTasks.filter(task => task.completed).length / totalTasks.length;

  const checkCompletionBonus = (updatedTasks) => {
    const isOneHundredPercent = updatedTasks.every(task => task.completed);
    if (isOneHundredPercent) {
      // Regra 3: Bonificação por pontos (Lógica a ser desenvolvida)
      Alert.alert('Parabéns!', '100% das tarefas diárias concluídas! Você ganhou [X] pontos!');
      console.log('BONUS CONCEDIDO: 100% de progresso diário.');
    }
  };

  const toggleTaskCompletion = (taskId, listType) => {
    if (listType === 'daily') {
      // Simulação da exigência de foto
      if (!dailyTasks.find(t => t.id === taskId)?.completed) {
          Alert.alert(
              'Comprovação Necessária', 
              'Para concluir esta tarefa, uma foto de comprovação será enviada à gerência.', 
              [
                  { text: 'Cancelar', style: 'cancel' },
                  { 
                      text: 'Tirar Foto & Concluir', 
                      onPress: () => {
                          // Simulação da captura da foto
                          console.log(`Foto capturada para a tarefa: ${taskId}`);

                          const updatedTasks = dailyTasks.map(task =>
                              task.id === taskId ? { ...task, completed: !task.completed } : task
                          );
                          setDailyTasks(updatedTasks);
                          checkCompletionBonus(updatedTasks);
                      }
                  }
              ]
          );
      } else {
          // Permite desmarcar sem precisar de foto
          const updatedTasks = dailyTasks.map(task =>
              task.id === taskId ? { ...task, completed: !task.completed } : task
          );
          setDailyTasks(updatedTasks);
      }
    } else if (listType === 'total') {
        // Regra 2: Tarefas futuras são apenas visíveis/bloqueadas (apenas gerência pode alterar)
        if (!totalTasks.find(t => t.id === taskId)?.completed) {
            Alert.alert('Acesso Restrito', 'Esta atividade é futura e só pode ser alterada pela gerência.');
        } else {
             // Permite desmarcar para demonstração, mas na prática seria bloqueado
             Alert.alert('Permissão Negada', 'Você não tem permissão para alterar o status desta tarefa futura.');
        }
    }
  };

  const renderTaskItem = (task, listType) => (
    <TouchableOpacity
      key={task.id}
      style={styles.taskItem}
      // Apenas tarefas diárias podem ser clicadas para conclusão
      onPress={() => toggleTaskCompletion(task.id, listType)}
      // Reduz a opacidade de tarefas futuras para indicar que estão bloqueadas
      activeOpacity={listType === 'total' ? 1.0 : 0.2}
    >
      <View style={[styles.checkbox, { backgroundColor: task.completed ? COLORS.cactusGreen : 'transparent', borderColor: task.completed ? COLORS.cactusGreen : COLORS.gray }]} />
      <Text style={[styles.taskText, { textDecorationLine: task.completed ? 'line-through' : 'none' }]}>
        {task.text}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollViewContainer}>
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
          <Text style={styles.cardTitle}>Atividades Diárias (Requer Foto)</Text>
          {dailyTasks.map(task => renderTaskItem(task, 'daily'))}
        </View>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Atividades Futuras (Apenas Visualização)</Text>
          {totalTasks.map(task => renderTaskItem(task, 'total'))}
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
