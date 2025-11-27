import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { completeTask, listTasks, reopenTask } from '../utils/zooService';

const COLORS = {
  background: '#F7F9FC',
  surface: '#FFFFFF',
  primary: '#5A8B63',
  text: '#2F3542',
  textMuted: '#77838F',
  border: '#E3E9F3',
  danger: '#E74C3C',
};

const PRIORITY_COLORS = {
  baixa: '#BDE8C1',
  media: '#F7D98B',
  alta: '#F2A29B',
};

const initialCompletionModal = {
  visible: false,
  task: null,
};

const CompleteTaskModal = ({ state, setState, onComplete }) => {
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setNotes('');
    setPhotoUri(null);
    setState(initialCompletionModal);
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissao negada', 'Autorize acesso a camera para capturar uma foto.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.5,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets?.length) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (saving) return;

    try {
      setSaving(true);
      await onComplete({
        taskId: state.task?.id,
        notes,
        photoUri,
      });
      reset();
    } catch (error) {
      Alert.alert('Nao foi possivel concluir', error?.message || 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={state.visible} animationType="slide" transparent onRequestClose={reset}>
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Concluir {state.task?.title || 'tarefa'}
            </Text>
            <TouchableOpacity onPress={reset}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
          >
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Notas da conclusao (opcional)"
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            <TouchableOpacity style={styles.photoPicker} onPress={pickPhoto}>
              <MaterialCommunityIcons name="camera" size={22} color={COLORS.primary} />
              <Text style={styles.photoPickerLabel}>
                {photoUri ? 'Foto anexada (substituir)' : 'Adicionar foto opcional'}
              </Text>
            </TouchableOpacity>

            {photoUri ? <Image source={{ uri: photoUri }} style={styles.previewImage} /> : null}
          </ScrollView>

          <TouchableOpacity
            style={[styles.primaryButton, saving && styles.primaryButtonDisabled]}
            onPress={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryButtonLabel}>Marcar como concluida</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const ChecklistScreen = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completionModal, setCompletionModal] = useState(initialCompletionModal);

  const pendingTasks = useMemo(
    () => tasks.filter((task) => task.status !== 'completed'),
    [tasks]
  );

  const completedTasks = useMemo(
    () => tasks.filter((task) => task.status === 'completed'),
    [tasks]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listTasks({ assignedTo: user?.id });
      setTasks(data || []);
    } catch (error) {
      Alert.alert('Falha ao carregar tarefas', error?.message || 'Verifique sua conexao.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  }, [fetchData]);

  const handleTaskComplete = useCallback((task) => {
    setCompletionModal({ visible: true, task });
  }, []);

  const handleCompletionSubmit = useCallback(
    async ({ taskId, notes, photoUri }) => {
      if (!taskId) return;

      await completeTask({
        taskId,
        completedBy: user?.id,
        notes,
        photoUri,
      });

      await fetchData();
    },
    [fetchData, user?.id]
  );

  const handleTaskReopen = useCallback(
    async (task) => {
      try {
        await reopenTask(task.id);
        await fetchData();
      } catch (error) {
        Alert.alert('Nao foi possivel reabrir', error?.message || 'Tente novamente.');
      }
    },
    [fetchData]
  );

  const renderTaskCard = useCallback(
    (task, isCompleted) => {
      const priorityColor = PRIORITY_COLORS[task.priority] || '#D7E6DA';
      const dueDate = task.due_at
        ? new Date(task.due_at).toLocaleDateString('pt-BR')
        : 'Sem prazo';

      return (
        <View key={task.id} style={styles.taskCard}>
          <View style={styles.taskHeaderRow}>
            <View style={styles.taskTitleRow}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
                <Text style={styles.priorityBadgeLabel}>
                  {(task.priority || 'media').toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {task.description ? (
            <Text style={styles.descriptionText}>{task.description}</Text>
          ) : null}

          <Text style={styles.taskMeta}>Prazo: {dueDate}</Text>
          {task.enclosure?.name ? (
            <Text style={styles.taskMeta}>Recinto: {task.enclosure.name}</Text>
          ) : null}
          {task.species?.common_name ? (
            <Text style={styles.taskMeta}>Especie: {task.species.common_name}</Text>
          ) : null}
          {task.template?.title ? (
            <Text style={styles.taskMeta}>Checklist sugerido: {task.template.title}</Text>
          ) : null}

          {task.prerequisites?.length ? (
            <View style={styles.chipRow}>
              {task.prerequisites.map((item) => (
                <View key={item.id} style={styles.prereqChip}>
                  <MaterialCommunityIcons
                    name="arrow-right-circle"
                    size={14}
                    color={COLORS.primary}
                  />
                  <Text style={styles.prereqChipLabel}>
                    {item.dependency?.title || 'Tarefa dependente'}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.taskActionsRow}>
            {isCompleted ? (
              <TouchableOpacity
                style={styles.smallButtonSecondary}
                onPress={() => handleTaskReopen(task)}
              >
                <MaterialCommunityIcons name="history" size={16} color={COLORS.primary} />
                <Text style={styles.smallButtonSecondaryLabel}>Reabrir</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.smallButtonPrimary}
                onPress={() => handleTaskComplete(task)}
              >
                <MaterialCommunityIcons name="check-circle-outline" size={16} color="#FFF" />
                <Text style={styles.smallButtonPrimaryLabel}>Concluir</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    },
    [handleTaskComplete, handleTaskReopen]
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderLabel}>Carregando tarefas...</Text>
        </View>
      );
    }

    return (
      <View style={styles.sectionContainer}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Em andamento</Text>
          </View>
          {pendingTasks.length === 0 ? (
            <Text style={styles.emptyMessage}>
              Nenhuma tarefa pendente. Aguarde atribuicoes do administrador.
            </Text>
          ) : (
            pendingTasks.map((task) => renderTaskCard(task, false))
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Concluidas recentemente</Text>
          </View>
          {completedTasks.length === 0 ? (
            <Text style={styles.emptyMessage}>Nenhuma tarefa concluida ainda.</Text>
          ) : (
            completedTasks.map((task) => renderTaskCard(task, true))
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Checklist operacional</Text>
          <Text style={styles.subtitle}>
            As tarefas aparecem aqui quando cadastradas na plataforma web. Conclua-as com notas e
            fotos, se necessario.
          </Text>
        </View>

        {renderContent()}
      </ScrollView>

      <CompleteTaskModal
        state={completionModal}
        setState={setCompletionModal}
        onComplete={handleCompletionSubmit}
      />
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
    paddingBottom: 32,
    gap: 24,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
  },
  sectionContainer: {
    gap: 20,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 18,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  taskCard: {
    borderWidth: 1,
    borderColor: '#E6ECEF',
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  taskHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityBadgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
    textTransform: 'uppercase',
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.text,
  },
  taskMeta: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  prereqChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF5F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  prereqChipLabel: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  taskActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 4,
  },
  smallButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  smallButtonPrimaryLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  smallButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EAF3ED',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  smallButtonSecondaryLabel: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyMessage: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loaderLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalContent: {
    gap: 16,
    paddingBottom: 12,
  },
  input: {
    backgroundColor: '#F0F4F8',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  photoPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  photoPickerLabel: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 14,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonLabel: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '700',
  },
});

export default ChecklistScreen;
