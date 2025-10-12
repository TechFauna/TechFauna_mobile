import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import {
  completeTask,
  createChecklistExecution,
  createChecklistTemplate,
  createTask,
  deleteChecklistTemplate,
  deleteTask,
  listChecklistTemplates,
  listChecklists,
  listEnclosures,
  listSpecies,
  listTasks,
  reopenTask,
  updateChecklistTemplate,
  updateTask,
} from '../utils/zooService';

const COLORS = {
  background: '#F7F9FC',
  surface: '#FFFFFF',
  primary: '#5A8B63',
  text: '#2F3542',
  textMuted: '#77838F',
  border: '#E3E9F3',
  danger: '#E74C3C',
};

const TABS = [
  { key: 'tasks', label: 'Tarefas' },
  { key: 'templates', label: 'Templates' },
  { key: 'executions', label: 'Execucoes' },
];

const PRIORITY_OPTIONS = ['baixa', 'media', 'alta'];

const PRIORITY_COLORS = {
  baixa: '#BDE8C1',
  media: '#F7D98B',
  alta: '#F2A29B',
};

const initialTaskModal = {
  visible: false,
  task: null,
};

const initialTemplateModal = {
  visible: false,
  template: null,
};

const initialExecutionModal = {
  visible: false,
  template: null,
};

const initialCompletionModal = {
  visible: false,
  task: null,
};

const TagSelector = ({ items, selectedIds, onToggle }) => {
  return (
    <View style={styles.tagRow}>
      {items.map((item) => {
        const isActive = selectedIds.includes(item.value);
        return (
          <TouchableOpacity
            key={item.value}
            style={[styles.tagChip, isActive && styles.tagChipActive]}
            onPress={() => onToggle(item.value)}
          >
            <Text style={[styles.tagChipLabel, isActive && styles.tagChipLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const TaskFormModal = ({
  state,
  setState,
  currentUserId,
  templates,
  enclosures,
  species,
  tasks,
  onSubmit,
}) => {
  const editing = Boolean(state.task?.id);
  const [formValues, setFormValues] = useState(() => ({
    title: state.task?.title || '',
    description: state.task?.description || '',
    due_at: state.task?.due_at ? state.task.due_at.slice(0, 10) : '',
    priority: state.task?.priority || 'media',
    photo_required: Boolean(state.task?.photo_required),
    checklist_template_id: state.task?.checklist_template_id || null,
    enclosure_id: state.task?.enclosure_id || null,
    species_id: state.task?.species_id || null,
  }));

  const [selectedPrerequisites, setSelectedPrerequisites] = useState(() => {
    const prereq = state.task?.prerequisites || [];
    return prereq.map((item) => item.depends_on_task_id);
  });

  const [saving, setSaving] = useState(false);

  const reset = () => setState(initialTaskModal);

  const handleChange = (field, value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const togglePrerequisite = (taskId) => {
    setSelectedPrerequisites((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleSubmit = async () => {
    if (saving) return;

    if (!formValues.title.trim()) {
      Alert.alert('Campo obrigatorio', 'Defina um titulo para a tarefa.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: formValues.title.trim(),
        description: formValues.description.trim() || null,
        due_at: formValues.due_at ? new Date(formValues.due_at).toISOString() : null,
        priority: formValues.priority,
        photo_required: formValues.photo_required,
        checklist_template_id: formValues.checklist_template_id || null,
        enclosure_id: formValues.enclosure_id || null,
        species_id: formValues.species_id || null,
        assigned_to: state.task?.assigned_to || currentUserId,
        created_by: state.task?.created_by || currentUserId,
        status: state.task?.status || 'pending',
      };

      await onSubmit({
        payload,
        prerequisites: selectedPrerequisites,
        taskId: state.task?.id,
        existingTask: state.task,
      });

      reset();
    } catch (error) {
      Alert.alert('Nao foi possivel salvar', error?.message || 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const availableTasks = tasks.filter((task) => task.id !== state.task?.id);

  return (
    <Modal
      visible={state.visible}
      animationType="slide"
      transparent
      onRequestClose={reset}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editing ? 'Editar tarefa' : 'Nova tarefa'}</Text>
            <TouchableOpacity onPress={reset}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="Titulo"
              value={formValues.title}
              onChangeText={(text) => handleChange('title', text)}
            />
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Descricao"
              value={formValues.description || ''}
              onChangeText={(text) => handleChange('description', text)}
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="Prazo (AAAA-MM-DD)"
              value={formValues.due_at}
              onChangeText={(text) => handleChange('due_at', text)}
            />

            <Text style={styles.inputLabel}>Prioridade</Text>
            <View style={styles.tagRow}>
              {PRIORITY_OPTIONS.map((option) => {
                const isActive = formValues.priority === option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.tagChip, isActive && styles.tagChipActive]}
                    onPress={() => handleChange('priority', option)}
                  >
                    <Text style={[styles.tagChipLabel, isActive && styles.tagChipLabelActive]}>
                      {option.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => handleChange('photo_required', !formValues.photo_required)}
            >
              <View
                style={[
                  styles.checkbox,
                  formValues.photo_required && styles.checkboxChecked,
                ]}
              >
                {formValues.photo_required ? (
                  <MaterialCommunityIcons name="check" size={16} color="#FFF" />
                ) : null}
              </View>
              <Text style={styles.checkboxLabel}>Exigir foto ao concluir</Text>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Relacionar a template</Text>
            <TagSelector
              items={templates.map((template) => ({
                value: template.id,
                label: template.title,
              }))}
              selectedIds={formValues.checklist_template_id ? [formValues.checklist_template_id] : []}
              onToggle={(id) =>
                handleChange(
                  'checklist_template_id',
                  formValues.checklist_template_id === id ? null : id
                )
              }
            />

            <Text style={styles.inputLabel}>Recinto relacionado</Text>
            <TagSelector
              items={enclosures.map((enclosure) => ({
                value: enclosure.id,
                label: enclosure.name,
              }))}
              selectedIds={formValues.enclosure_id ? [formValues.enclosure_id] : []}
              onToggle={(id) =>
                handleChange('enclosure_id', formValues.enclosure_id === id ? null : id)
              }
            />

            <Text style={styles.inputLabel}>Especie relacionada</Text>
            <TagSelector
              items={species.map((item) => ({
                value: item.id,
                label: item.common_name,
              }))}
              selectedIds={formValues.species_id ? [formValues.species_id] : []}
              onToggle={(id) =>
                handleChange('species_id', formValues.species_id === id ? null : id)
              }
            />

            <Text style={styles.inputLabel}>Pre-requisitos</Text>
            {availableTasks.length === 0 ? (
              <Text style={styles.helperText}>Nenhuma outra tarefa disponivel.</Text>
            ) : (
              <TagSelector
                items={availableTasks.map((task) => ({
                  value: task.id,
                  label: task.title,
                }))}
                selectedIds={selectedPrerequisites}
                onToggle={togglePrerequisite}
              />
            )}
          </ScrollView>

          <TouchableOpacity
            style={[styles.primaryButton, saving && styles.primaryButtonDisabled]}
            onPress={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryButtonLabel}>
                {editing ? 'Salvar alteracoes' : 'Criar tarefa'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
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
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Concluir {state.task?.title || 'tarefa'}
            </Text>
            <TouchableOpacity onPress={reset}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Notas da conclusao"
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
      </View>
    </Modal>
  );
};

const TemplateFormModal = ({
  state,
  setState,
  species,
  enclosures,
  onSubmit,
}) => {
  const editing = Boolean(state.template?.id);

  const [formValues, setFormValues] = useState(() => ({
    title: state.template?.title || '',
    frequency: state.template?.frequency || 'daily',
    target_type: state.template?.target_type || 'enclosure',
    target_id: state.template?.target_id || null,
    instructions: state.template?.instructions || '',
  }));

  const [items, setItems] = useState(() =>
    state.template?.items?.length
      ? state.template.items.map((item) => ({
          id: item.id,
          description: item.description,
          requires_photo: item.requires_photo,
          instructions: item.instructions || '',
        }))
      : [
          {
            id: null,
            description: '',
            requires_photo: false,
            instructions: '',
          },
        ]
  );

  const initialItemIds = useMemo(
    () => new Set(state.template?.items?.map((item) => item.id).filter(Boolean) || []),
    [state.template]
  );

  const [saving, setSaving] = useState(false);

  const reset = () => setState(initialTemplateModal);

  const handleChange = (field, value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: null, description: '', requires_photo: false, instructions: '' },
    ]);
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async () => {
    if (saving) return;

    if (!formValues.title.trim()) {
      Alert.alert('Campo obrigatorio', 'Informe um titulo para o template.');
      return;
    }

    if (items.some((item) => !item.description.trim())) {
      Alert.alert('Itens incompletos', 'Defina a descricao de todos os itens.');
      return;
    }

    try {
      setSaving(true);

      const preparedItems = items.map((item, index) => ({
        id: item.id,
        description: item.description.trim(),
        requires_photo: item.requires_photo,
        instructions: item.instructions?.trim() || null,
        sort_order: index,
      }));

      const removedItemIds = editing
        ? Array.from(initialItemIds).filter(
            (itemId) => !preparedItems.some((item) => item.id === itemId)
          )
        : [];

      await onSubmit({
        templateId: state.template?.id,
        payload: {
          title: formValues.title.trim(),
          frequency: formValues.frequency,
          target_type: formValues.target_type,
          target_id: formValues.target_id || null,
          instructions: formValues.instructions.trim() || null,
        },
        items: preparedItems,
        removedItemIds,
      });

      reset();
    } catch (error) {
      Alert.alert('Nao foi possivel salvar', error?.message || 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const targetOptions =
    formValues.target_type === 'enclosure'
      ? enclosures.map((enclosure) => ({ value: enclosure.id, label: enclosure.name }))
      : species.map((item) => ({ value: item.id, label: item.common_name }));

  const frequencyOptions = [
    { value: 'daily', label: 'Diaria' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'monthly', label: 'Mensal' },
    { value: 'custom', label: 'Custom' },
  ];

  const targetTypeOptions = [
    { value: 'enclosure', label: 'Recinto' },
    { value: 'species', label: 'Especie' },
  ];

  return (
    <Modal visible={state.visible} animationType="slide" transparent onRequestClose={reset}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalLargeCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editing ? 'Editar template' : 'Novo template'}</Text>
            <TouchableOpacity onPress={reset}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="Titulo"
              value={formValues.title}
              onChangeText={(text) => handleChange('title', text)}
            />

            <Text style={styles.inputLabel}>Frequencia</Text>
            <TagSelector
              items={frequencyOptions}
              selectedIds={[formValues.frequency]}
              onToggle={(value) => handleChange('frequency', value)}
            />

            <Text style={styles.inputLabel}>Tipo de alvo</Text>
            <TagSelector
              items={targetTypeOptions}
              selectedIds={[formValues.target_type]}
              onToggle={(value) => {
                handleChange('target_type', value);
                handleChange('target_id', null);
              }}
            />

            <Text style={styles.inputLabel}>
              {formValues.target_type === 'enclosure'
                ? 'Selecione o recinto'
                : 'Selecione a especie'}
            </Text>
            <TagSelector
              items={targetOptions}
              selectedIds={formValues.target_id ? [formValues.target_id] : []}
              onToggle={(value) =>
                handleChange('target_id', formValues.target_id === value ? null : value)
              }
            />

            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Instrucoes gerais"
              value={formValues.instructions}
              onChangeText={(text) => handleChange('instructions', text)}
              multiline
            />

            <Text style={[styles.inputLabel, styles.sectionDivider]}>Itens do checklist</Text>
            {items.map((item, index) => (
              <View key={index} style={styles.templateItem}>
                <TextInput
                  style={styles.input}
                  placeholder={`Passo ${index + 1}`}
                  value={item.description}
                  onChangeText={(text) => handleItemChange(index, 'description', text)}
                />

                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() =>
                    handleItemChange(index, 'requires_photo', !item.requires_photo)
                  }
                >
                  <View
                    style={[
                      styles.checkbox,
                      item.requires_photo && styles.checkboxChecked,
                    ]}
                  >
                    {item.requires_photo ? (
                      <MaterialCommunityIcons name="check" size={16} color="#FFF" />
                    ) : null}
                  </View>
                  <Text style={styles.checkboxLabel}>Requer foto</Text>
                </TouchableOpacity>

                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="Observacoes do item"
                  value={item.instructions}
                  onChangeText={(text) => handleItemChange(index, 'instructions', text)}
                  multiline
                />

                {items.length > 1 ? (
                  <TouchableOpacity
                    style={styles.removeItemButton}
                    onPress={() => removeItem(index)}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color={COLORS.danger} />
                    <Text style={styles.removeItemLabel}>Remover item</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}

            <TouchableOpacity style={styles.secondaryButton} onPress={addItem}>
              <MaterialCommunityIcons name="plus-circle-outline" size={18} color={COLORS.primary} />
              <Text style={styles.secondaryButtonText}>Adicionar passo</Text>
            </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity
            style={[styles.primaryButton, saving && styles.primaryButtonDisabled]}
            onPress={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryButtonLabel}>
                {editing ? 'Salvar template' : 'Criar template'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const ChecklistExecutionModal = ({
  state,
  setState,
  species,
  enclosures,
  onSubmit,
}) => {
  const template = state.template;
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const [selectedTarget, setSelectedTarget] = useState(() => template?.target_id || null);

  const [items, setItems] = useState(() =>
    template?.items?.map((item) => ({
      template_item_id: item.id,
      status: 'completed',
      remarks: '',
      photoUri: null,
      description: item.description,
      requires_photo: item.requires_photo,
    })) || []
  );

  const reset = () => setState(initialExecutionModal);

  const updateItem = (index, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const pickPhotoForItem = async (index) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissao negada', 'Autorize a camera para capturar uma foto.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.4,
    });

    if (!result.canceled && result.assets?.length) {
      updateItem(index, 'photoUri', result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (saving) return;

    if (!template?.id) {
      Alert.alert('Template invalido', 'Selecione um template valido.');
      return;
    }

    if (
      template.target_type &&
      !selectedTarget
    ) {
      Alert.alert('Selecione o alvo', 'Informe o recinto ou especie para registrar o checklist.');
      return;
    }

    if (items.some((item) => item.requires_photo && !item.photoUri)) {
      Alert.alert(
        'Foto obrigatoria',
        'Alguns itens exigem foto. Anexe as imagens antes de enviar.'
      );
      return;
    }

    try {
      setSaving(true);
      await onSubmit({
        templateId: template.id,
        notes,
        items,
        target_type: template.target_type,
        target_id: selectedTarget,
      });
      reset();
    } catch (error) {
      Alert.alert('Nao foi possivel registrar', error?.message || 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const targetOptions =
    template?.target_type === 'enclosure'
      ? enclosures.map((enclosure) => ({ value: enclosure.id, label: enclosure.name }))
      : species.map((item) => ({ value: item.id, label: item.common_name }));

  return (
    <Modal visible={state.visible} animationType="slide" transparent onRequestClose={reset}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalLargeCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Executar {template?.title || 'checklist'}
            </Text>
            <TouchableOpacity onPress={reset}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.helperText}>
              Frequencia: {template?.frequency || 'sem frequencia definida'}
            </Text>

            {template?.target_type ? (
              <>
                <Text style={[styles.inputLabel, styles.sectionDivider]}>
                  {template.target_type === 'enclosure'
                    ? 'Selecione o recinto'
                    : 'Selecione a especie'}
                </Text>
                <TagSelector
                  items={targetOptions}
                  selectedIds={selectedTarget ? [selectedTarget] : []}
                  onToggle={(value) =>
                    setSelectedTarget(selectedTarget === value ? null : value)
                  }
                />
              </>
            ) : null}

            <Text style={[styles.inputLabel, styles.sectionDivider]}>Checklist</Text>
            {items.map((item, index) => (
              <View key={item.template_item_id} style={styles.executionItem}>
                <Text style={styles.executionItemTitle}>{item.description}</Text>

                <View style={styles.tagRow}>
                  {[
                    { value: 'completed', label: 'OK' },
                    { value: 'attention', label: 'Atencao' },
                  ].map((option) => {
                    const isActive = item.status === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[styles.tagChip, isActive && styles.tagChipActive]}
                        onPress={() => updateItem(index, 'status', option.value)}
                      >
                        <Text
                          style={[styles.tagChipLabel, isActive && styles.tagChipLabelActive]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="Observacoes"
                  value={item.remarks}
                  onChangeText={(text) => updateItem(index, 'remarks', text)}
                  multiline
                />

                <TouchableOpacity
                  style={styles.photoPicker}
                  onPress={() => pickPhotoForItem(index)}
                >
                  <MaterialCommunityIcons name="camera" size={22} color={COLORS.primary} />
                  <Text style={styles.photoPickerLabel}>
                    {item.photoUri ? 'Foto anexada (trocar)' : 'Adicionar foto'}
                  </Text>
                </TouchableOpacity>

                {item.photoUri ? (
                  <Image source={{ uri: item.photoUri }} style={styles.previewImage} />
                ) : null}
              </View>
            ))}

            <TextInput
              style={[styles.input, styles.multilineInput, styles.sectionDivider]}
              placeholder="Notas gerais do checklist"
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </ScrollView>

          <TouchableOpacity
            style={[styles.primaryButton, saving && styles.primaryButtonDisabled]}
            onPress={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryButtonLabel}>Registrar checklist</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const ChecklistScreen = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('tasks');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [species, setSpecies] = useState([]);
  const [enclosures, setEnclosures] = useState([]);
  const [taskModal, setTaskModal] = useState(initialTaskModal);
  const [completionModal, setCompletionModal] = useState(initialCompletionModal);
  const [templateModal, setTemplateModal] = useState(initialTemplateModal);
  const [executionModal, setExecutionModal] = useState(initialExecutionModal);

  const pendingTasks = useMemo(
    () => tasks.filter((task) => task.status !== 'completed'),
    [tasks]
  );

  const completedTasks = useMemo(
    () => tasks.filter((task) => task.status === 'completed'),
    [tasks]
  );

  const templateMap = useMemo(() => {
    const map = new Map();
    templates.forEach((template) => {
      map.set(template.id, template);
    });
    return map;
  }, [templates]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksData, templatesData, executionsData, speciesData, enclosuresData] =
        await Promise.all([
          listTasks({ assignedTo: user?.id }),
          listChecklistTemplates(),
          listChecklists({ performedBy: user?.id }),
          listSpecies(),
          listEnclosures(),
        ]);

      setTasks(tasksData || []);
      setTemplates(templatesData || []);
      setExecutions(executionsData || []);
      setSpecies(speciesData || []);
      setEnclosures(enclosuresData || []);
    } catch (error) {
      Alert.alert('Falha ao carregar dados', error?.message || 'Verifique sua conexao.');
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

  const handleTaskSubmit = useCallback(
    async ({ payload, prerequisites, taskId, existingTask }) => {
      if (!user?.id) {
        Alert.alert('Sessao invalida', 'Refaca login para continuar.');
        return;
      }

      const basePayload = {
        ...payload,
        assigned_to: payload.assigned_to || user.id,
        created_by: payload.created_by || user.id,
      };

      if (taskId) {
        const existingPrereq = existingTask?.prerequisites || [];
        const existingMap = new Map(
          existingPrereq.map((item) => [item.depends_on_task_id, item.id])
        );

        const prerequisitesPayload = prerequisites.map((dependsId) => ({
          id: existingMap.get(dependsId),
          depends_on_task_id: dependsId,
        }));

        const removedPrerequisiteIds = existingPrereq
          .filter((item) => !prerequisites.includes(item.depends_on_task_id))
          .map((item) => item.id);

        await updateTask(taskId, {
          ...basePayload,
          prerequisites: prerequisitesPayload,
          removedPrerequisiteIds,
        });
      } else {
        await createTask({
          ...basePayload,
          prerequisites,
        });
      }

      await fetchData();
    },
    [fetchData, user?.id]
  );

  const handleTaskDelete = useCallback(
    (task) => {
      Alert.alert(
        'Remover tarefa',
        `Deseja remover "${task.title}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Remover',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteTask(task.id);
                await fetchData();
              } catch (error) {
                Alert.alert('Nao foi possivel remover', error?.message || 'Tente novamente.');
              }
            },
          },
        ]
      );
    },
    [fetchData]
  );

  const handleTaskComplete = useCallback((task) => {
    setCompletionModal({ visible: true, task });
  }, []);

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

  const handleTemplateSubmit = useCallback(
    async ({ templateId, payload, items, removedItemIds }) => {
      if (templateId) {
        await updateChecklistTemplate(templateId, {
          ...payload,
          items,
          removedItemIds,
        });
      } else {
        await createChecklistTemplate({
          ...payload,
          items,
        });
      }

      await fetchData();
    },
    [fetchData]
  );

  const handleTemplateDelete = useCallback(
    (template) => {
      Alert.alert(
        'Remover template',
        `Deseja remover "${template.title}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Remover',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteChecklistTemplate(template.id);
                await fetchData();
              } catch (error) {
                Alert.alert('Nao foi possivel remover', error?.message || 'Tente novamente.');
              }
            },
          },
        ]
      );
    },
    [fetchData]
  );

  const handleChecklistSubmit = useCallback(
    async ({ templateId, notes, items, target_type, target_id }) => {
      await createChecklistExecution({
        templateId,
        performedBy: user?.id,
        enclosureId: target_type === 'enclosure' ? target_id : null,
        speciesId: target_type === 'species' ? target_id : null,
        notes,
        items: items.map((item) => ({
          template_item_id: item.template_item_id,
          status: item.status,
          remarks: item.remarks,
          photoUri: item.photoUri,
        })),
      });

      await fetchData();
    },
    [fetchData, user?.id]
  );

  const renderTaskCard = (task, isCompleted) => {
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
          <View style={styles.inlineActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setTaskModal({ visible: true, task })}
            >
              <MaterialCommunityIcons name="pencil-outline" size={18} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => handleTaskDelete(task)}>
              <MaterialCommunityIcons name="trash-can-outline" size={18} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        </View>

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
                <Text style={styles.prereqChipLabel}>{item.dependency?.title || 'Tarefa'}</Text>
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
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderLabel}>Carregando dados...</Text>
        </View>
      );
    }

    if (activeTab === 'tasks') {
      return (
        <View style={styles.sectionContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setTaskModal({ visible: true, task: null })}
          >
            <Text style={styles.primaryButtonLabel}>Nova tarefa</Text>
          </TouchableOpacity>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Em andamento</Text>
            </View>
            {pendingTasks.length === 0 ? (
              <Text style={styles.emptyMessage}>Nenhuma tarefa pendente no momento.</Text>
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
    }

    if (activeTab === 'templates') {
      return (
        <View style={styles.sectionContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setTemplateModal({ visible: true, template: null })}
          >
            <Text style={styles.primaryButtonLabel}>Novo template</Text>
          </TouchableOpacity>

          {templates.length === 0 ? (
            <View style={styles.placeholderCard}>
              <Text style={styles.placeholderText}>
                Nenhum template cadastrado. Crie o primeiro para padronizar rotinas.
              </Text>
            </View>
          ) : (
            templates.map((template) => {
              const targetName =
                template.target_type === 'enclosure'
                  ? enclosures.find((item) => item.id === template.target_id)?.name
                  : species.find((item) => item.id === template.target_id)?.common_name;

              return (
                <View key={template.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{template.title}</Text>
                    <View style={styles.inlineActions}>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => setTemplateModal({ visible: true, template })}
                      >
                        <MaterialCommunityIcons
                          name="pencil-outline"
                          size={18}
                          color={COLORS.primary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => handleTemplateDelete(template)}
                      >
                        <MaterialCommunityIcons
                          name="trash-can-outline"
                          size={18}
                          color={COLORS.danger}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.cardSubtitle}>
                    Frequencia: {template.frequency || 'custom'}
                  </Text>
                  {template.target_type ? (
                    <Text style={styles.cardSubtitle}>
                      Alvo: {template.target_type === 'enclosure' ? 'Recinto' : 'Especie'}{' '}
                      {targetName || ''}
                    </Text>
                  ) : null}
                  {template.instructions ? (
                    <Text style={styles.descriptionText}>{template.instructions}</Text>
                  ) : null}
                  <View style={styles.templateDivider} />
                  {template.items?.length ? (
                    template.items.map((item, index) => (
                      <View key={item.id || index} style={styles.templateItemRow}>
                        <View style={styles.templateBullet} />
                        <View style={styles.templateItemInfo}>
                          <Text style={styles.templateItemText}>{item.description}</Text>
                          <View style={styles.templateBadges}>
                            <Text style={styles.templateStepLabel}>Passo {index + 1}</Text>
                            {item.requires_photo ? (
                              <Text style={styles.templateBadge}>Foto obrigatoria</Text>
                            ) : null}
                          </View>
                          {item.instructions ? (
                            <Text style={styles.templateItemHint}>{item.instructions}</Text>
                          ) : null}
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.helperText}>Nenhum item cadastrado.</Text>
                  )}
                  <View style={styles.templateActions}>
                    <TouchableOpacity
                      style={styles.smallButtonPrimary}
                      onPress={() => setExecutionModal({ visible: true, template })}
                    >
                      <MaterialCommunityIcons name="clipboard-check" size={16} color="#FFF" />
                      <Text style={styles.smallButtonPrimaryLabel}>Executar agora</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      );
    }

    return (
      <View style={styles.sectionContainer}>
        {executions.length === 0 ? (
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderText}>
              Nenhuma execucao registrada. Execute um template para registrar um checklist.
            </Text>
          </View>
        ) : (
          executions.map((execution) => {
            const templateRef = templateMap.get(execution.template_id);
            const targetName =
              execution.enclosure_id
                ? enclosures.find((item) => item.id === execution.enclosure_id)?.name
                : execution.species_id
                ? species.find((item) => item.id === execution.species_id)?.common_name
                : null;

            return (
              <View key={execution.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>
                    {execution.template?.title || templateRef?.title || 'Checklist'}
                  </Text>
                </View>
                <Text style={styles.cardSubtitle}>
                  Realizado em{' '}
                  {execution.performed_at
                    ? new Date(execution.performed_at).toLocaleString('pt-BR')
                    : 'sem data'}
                </Text>
                {targetName ? (
                  <Text style={styles.cardSubtitle}>Alvo: {targetName}</Text>
                ) : null}
                {execution.notes ? (
                  <Text style={styles.descriptionText}>Notas: {execution.notes}</Text>
                ) : null}
                <View style={styles.templateDivider} />
                {execution.items?.length ? (
                  execution.items.map((item) => {
                    const templateItem =
                      templateRef?.items?.find((i) => i.id === item.template_item_id);
                    const statusOk = item.status === 'completed';
                    return (
                      <View key={item.id} style={styles.executionRow}>
                        <MaterialCommunityIcons
                          name={statusOk ? 'check-circle' : 'alert-circle'}
                          size={18}
                          color={statusOk ? COLORS.primary : COLORS.danger}
                        />
                        <View style={styles.executionInfo}>
                          <Text style={styles.executionItemText}>
                            {templateItem?.description || `Item ${item.template_item_id}`}
                          </Text>
                          <Text style={styles.executionItemMeta}>
                            {statusOk ? 'Concluido' : 'Atencao'}
                            {item.remarks ? ` - ${item.remarks}` : ''}
                          </Text>
                          {item.photo_url ? (
                            <Text style={styles.executionItemMeta}>Foto registrada</Text>
                          ) : null}
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.helperText}>Sem itens registrados.</Text>
                )}
              </View>
            );
          })
        )}
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
          <Text style={styles.title}>Tarefas e Checklists</Text>
          <Text style={styles.subtitle}>
            Centralize tarefas operacionais, templates e execucoes em um unico lugar.
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabRow}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabButtonLabel, isActive && styles.tabButtonLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {renderContent()}
      </ScrollView>

      <TaskFormModal
        state={taskModal}
        setState={setTaskModal}
        currentUserId={user?.id}
        templates={templates}
        enclosures={enclosures}
        species={species}
        tasks={tasks}
        onSubmit={handleTaskSubmit}
      />

      <CompleteTaskModal
        state={completionModal}
        setState={setCompletionModal}
        onComplete={handleCompletionSubmit}
      />

      <TemplateFormModal
        state={templateModal}
        setState={setTemplateModal}
        species={species}
        enclosures={enclosures}
        onSubmit={handleTemplateSubmit}
      />

      <ChecklistExecutionModal
        state={executionModal}
        setState={setExecutionModal}
        species={species}
        enclosures={enclosures}
        onSubmit={handleChecklistSubmit}
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
    paddingBottom: 120,
    gap: 20,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 6,
  },
  tabRow: {
    flexGrow: 0,
    marginBottom: 20,
  },
  tabButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#E6EEF0',
    marginRight: 12,
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
  },
  tabButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabButtonLabelActive: {
    color: '#FFFFFF',
  },
  sectionContainer: {
    gap: 18,
  },
  loaderContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loaderLabel: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  placeholderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  placeholderText: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
    gap: 16,
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
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  emptyMessage: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EAF3ED',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  iconButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: '#F0F4F6',
    marginLeft: 6,
  },
  inlineActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#E8EEF3',
  },
  tagChipActive: {
    backgroundColor: COLORS.primary,
  },
  tagChipLabel: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  tagChipLabelActive: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#F3F6FA',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 12,
  },
  multilineInput: {
    height: 90,
    textAlignVertical: 'top',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
  },
  checkboxLabel: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 20,
    maxHeight: '90%',
  },
  modalLargeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 20,
    maxHeight: '92%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalContent: {
    paddingBottom: 20,
  },
  sectionDivider: {
    marginTop: 16,
  },
  templateItem: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    gap: 8,
  },
  templateDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  templateItemRow: {
    flexDirection: 'row',
    gap: 12,
  },
  templateBullet: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginTop: 6,
  },
  templateItemInfo: {
    flex: 1,
    gap: 6,
  },
  templateItemText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
  },
  templateBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  templateStepLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  templateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E9F3EC',
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  templateItemHint: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  templateActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  removeItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  removeItemLabel: {
    fontSize: 13,
    color: COLORS.danger,
    fontWeight: '500',
  },
  photoPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#E8F0EC',
  },
  photoPickerLabel: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  previewImage: {
    width: '100%',
    height: 140,
    borderRadius: 16,
    marginTop: 12,
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
  executionItem: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  executionItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  executionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  executionInfo: {
    flex: 1,
    gap: 4,
  },
  executionItemText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  executionItemMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});

export default ChecklistScreen;


