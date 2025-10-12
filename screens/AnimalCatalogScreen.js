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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  createAnimal,
  createArea,
  createEnclosure,
  createSpecies,
  deleteAnimal,
  deleteArea,
  deleteEnclosure,
  deleteSpecies,
  listAnimalHistory,
  listAnimals,
  listAreas,
  listEnclosures,
  listSpecies,
  moveAnimal,
  updateAnimal,
  updateArea,
  updateEnclosure,
  updateSpecies,
} from '../utils/zooService';

const TABS = [
  { key: 'overview', label: 'Visao Geral' },
  { key: 'species', label: 'Especies' },
  { key: 'animals', label: 'Animais' },
  { key: 'history', label: 'Historico' },
];

const COLORS = {
  background: '#F7F9FC',
  surface: '#FFFFFF',
  primary: '#5A8B63',
  primaryMuted: '#BFD6C5',
  text: '#2F3542',
  textMuted: '#77838F',
  danger: '#E74C3C',
  border: '#E3E9F3',
};

const initialFormState = {
  visible: false,
  type: null,
  data: null,
};

const initialMoveState = {
  visible: false,
  animal: null,
};

const SectionTitle = ({ icon, title, actionLabel, onActionPress }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionHeaderLeft}>
      {icon ? (
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={COLORS.primary}
          style={styles.sectionIcon}
        />
      ) : null}
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {onActionPress ? (
      <TouchableOpacity style={styles.sectionAction} onPress={onActionPress}>
        <MaterialCommunityIcons name="plus-circle-outline" size={18} color={COLORS.primary} />
        <Text style={styles.sectionActionLabel}>{actionLabel}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

const ChipSelector = ({ options, value, onChange }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
    {options.map((option) => {
      const isSelected = value === option.value;
      return (
        <TouchableOpacity
          key={option.value}
          style={[styles.chip, isSelected && styles.chipActive]}
          onPress={() => onChange(option.value)}
        >
          <Text style={[styles.chipLabel, isSelected && styles.chipLabelActive]}>{option.label}</Text>
        </TouchableOpacity>
      );
    })}
  </ScrollView>
);

const FormModal = ({ formState, setFormState, areas, enclosures, species, onRefresh }) => {
  const [submitting, setSubmitting] = useState(false);
  const [selectedArea, setSelectedArea] = useState(formState?.data?.area_id || null);
  const [selectedSpecies, setSelectedSpecies] = useState(formState?.data?.species_id || null);
  const [selectedEnclosure, setSelectedEnclosure] = useState(
    formState?.data?.current_enclosure_id || formState?.data?.enclosure_id || null
  );

  const [formValues, setFormValues] = useState(() => {
    const data = formState?.data || {};
    switch (formState?.type) {
      case 'area':
        return {
          name: data.name || '',
          description: data.description || '',
        };
      case 'enclosure':
        return {
          name: data.name || '',
          code: data.code || '',
          environment_type: data.environment_type || '',
          capacity: data.capacity ? String(data.capacity) : '',
          notes: data.notes || '',
          status: data.status || 'ativo',
        };
      case 'species':
        return {
          common_name: data.common_name || '',
          scientific_name: data.scientific_name || '',
          conservation_status: data.conservation_status || '',
          diet: data.diet || '',
          description: data.description || '',
        };
      case 'animal':
        return {
          name: data.name || '',
          identifier: data.identifier || '',
          sex: data.sex || '',
          birthdate: data.birthdate || '',
          arrival_date: data.arrival_date || '',
          status: data.status || 'ativo',
          notes: data.notes || '',
        };
      default:
        return {};
    }
  });

  const close = () => setFormState(initialFormState);

  const handleChange = (field, value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      switch (formState.type) {
        case 'area': {
          const payload = {
            name: formValues.name.trim(),
            description: formValues.description.trim() || null,
          };

          if (!payload.name) {
            Alert.alert('Campo obrigatA≥rio', 'Informe o nome da A°rea.');
            return;
          }

          if (formState.data?.id) {
            await updateArea(formState.data.id, payload);
          } else {
            await createArea(payload);
          }
          break;
        }
        case 'enclosure': {
          if (!selectedArea) {
            Alert.alert('Selecione uma A°rea', 'Escolha em qual A°rea ficarA° o recinto.');
            return;
          }

          const payload = {
            area_id: selectedArea,
            name: formValues.name.trim(),
            code: formValues.code.trim(),
            environment_type: formValues.environment_type.trim() || null,
            capacity: formValues.capacity ? Number(formValues.capacity) : null,
            notes: formValues.notes.trim() || null,
            status: formValues.status || 'ativo',
          };

          if (!payload.name) {
            Alert.alert('Campo obrigatA≥rio', 'Informe o nome do recinto.');
            return;
          }

          if (formState.data?.id) {
            await updateEnclosure(formState.data.id, payload);
          } else {
            await createEnclosure(payload);
          }
          break;
        }
        case 'species': {
          const payload = {
            common_name: formValues.common_name.trim(),
            scientific_name: formValues.scientific_name?.trim() || null,
            conservation_status: formValues.conservation_status.trim() || null,
            diet: formValues.diet.trim() || null,
            description: formValues.description.trim() || null,
          };

          if (!payload.common_name) {
            Alert.alert('Campo obrigatA≥rio', 'Informe o nome comum da espA©cie.');
            return;
          }

          if (formState.data?.id) {
            await updateSpecies(formState.data.id, payload);
          } else {
            await createSpecies(payload);
          }
          break;
        }
        case 'animal': {
          if (!selectedSpecies) {
            Alert.alert('Selecione a espA©cie', 'Escolha a espA©cie do animal.');
            return;
          }

          if (!selectedEnclosure) {
            Alert.alert('Selecione o recinto', 'Escolha o recinto atual do animal.');
            return;
          }

          const payload = {
            species_id: selectedSpecies,
            current_enclosure_id: selectedEnclosure,
            name: formValues.name.trim(),
            identifier: formValues.identifier.trim() || null,
            sex: formValues.sex.trim() || null,
            birthdate: formValues.birthdate || null,
            arrival_date: formValues.arrival_date || null,
            status: formValues.status || 'ativo',
            notes: formValues.notes.trim() || null,
          };

          if (!payload.name) {
            Alert.alert('Campo obrigatA≥rio', 'Informe o nome do animal.');
            return;
          }

          if (formState.data?.id) {
            await updateAnimal(formState.data.id, payload);
          } else {
            await createAnimal(payload);
          }
          break;
        }
        default:
          break;
      }

      close();
      onRefresh?.();
    } catch (error) {
      Alert.alert('Algo deu errado', error?.message || 'NA£o foi possA≠vel concluir a aAßA£o.');
    } finally {
      setSubmitting(false);
    }
  };

  const speciesOptions = species.map((specie) => ({
    label: specie.common_name,
    value: specie.id,
  }));

  const areaOptions = areas.map((area) => ({
    label: area.name,
    value: area.id,
  }));

  const enclosureOptions = enclosures.map((enclosure) => ({
    label: enclosure.name,
    value: enclosure.id,
  }));

  return (
    <Modal
      visible={formState.visible}
      animationType="slide"
      transparent
      onRequestClose={close}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {formState.data?.id ? 'Editar' : 'Novo'}{' '}
              {formState.type === 'area'
                ? 'AÅrea'
                : formState.type === 'enclosure'
                ? 'Recinto'
                : formState.type === 'species'
                ? 'EspA©cie'
                : 'Animal'}
            </Text>
            <TouchableOpacity onPress={close}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {formState.type === 'area' && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Nome da A°rea"
                  value={formValues.name}
                  onChangeText={(text) => handleChange('name', text)}
                />
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="DescriAßA£o"
                  value={formValues.description}
                  onChangeText={(text) => handleChange('description', text)}
                  multiline
                />
              </>
            )}

            {formState.type === 'enclosure' && (
              <>
                <Text style={styles.inputLabel}>AÅrea</Text>
                <ChipSelector
                  options={areaOptions}
                  value={selectedArea}
                  onChange={setSelectedArea}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Nome do recinto"
                  value={formValues.name}
                  onChangeText={(text) => handleChange('name', text)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="CA≥digo/Identificador"
                  value={formValues.code}
                  onChangeText={(text) => handleChange('code', text)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Tipo de ambiente (ex: aquA°tico, savana)"
                  value={formValues.environment_type}
                  onChangeText={(text) => handleChange('environment_type', text)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Capacidade (nA∫mero)"
                  value={formValues.capacity}
                  onChangeText={(text) => handleChange('capacity', text)}
                  keyboardType="number-pad"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Status (ativo, manutenAßA£o...)"
                  value={formValues.status}
                  onChangeText={(text) => handleChange('status', text)}
                />
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="AnotaAßAµes"
                  value={formValues.notes}
                  onChangeText={(text) => handleChange('notes', text)}
                  multiline
                />
              </>
            )}

            {formState.type === 'species' && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Nome comum"
                  value={formValues.common_name}
                  onChangeText={(text) => handleChange('common_name', text)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Nome cientA≠fico"
                  value={formValues.scientific_name}
                  onChangeText={(text) => handleChange('scientific_name', text)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Status de conservaAßA£o"
                  value={formValues.conservation_status}
                  onChangeText={(text) => handleChange('conservation_status', text)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Dieta"
                  value={formValues.diet}
                  onChangeText={(text) => handleChange('diet', text)}
                />
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="DescriAßA£o / observaAßAµes"
                  value={formValues.description}
                  onChangeText={(text) => handleChange('description', text)}
                  multiline
                />
              </>
            )}

            {formState.type === 'animal' && (
              <>
                <Text style={styles.inputLabel}>EspA©cie</Text>
                <ChipSelector
                  options={speciesOptions}
                  value={selectedSpecies}
                  onChange={setSelectedSpecies}
                />

                <Text style={styles.inputLabel}>Recinto atual</Text>
                <ChipSelector
                  options={enclosureOptions}
                  value={selectedEnclosure}
                  onChange={setSelectedEnclosure}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Nome do animal"
                  value={formValues.name}
                  onChangeText={(text) => handleChange('name', text)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Identificador (tag, chip...)"
                  value={formValues.identifier}
                  onChangeText={(text) => handleChange('identifier', text)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Sexo"
                  value={formValues.sex}
                  onChangeText={(text) => handleChange('sex', text)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Data de nascimento (AAAA-MM-DD)"
                  value={formValues.birthdate}
                  onChangeText={(text) => handleChange('birthdate', text)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Data de chegada (AAAA-MM-DD)"
                  value={formValues.arrival_date}
                  onChangeText={(text) => handleChange('arrival_date', text)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Status (ativo, quarentena...)"
                  value={formValues.status}
                  onChangeText={(text) => handleChange('status', text)}
                />
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="ObservaAßAµes"
                  value={formValues.notes}
                  onChangeText={(text) => handleChange('notes', text)}
                  multiline
                />
              </>
            )}
          </ScrollView>

          <TouchableOpacity
            style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryButtonLabel}>
                {formState.data?.id ? 'Salvar alteraAßAµes' : 'Cadastrar'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const MoveAnimalModal = ({ moveState, setMoveState, enclosures, onRefresh }) => {
  const [selectedEnclosure, setSelectedEnclosure] = useState(
    moveState?.animal?.current_enclosure_id || null
  );
  const [notes, setNotes] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);

  const close = () => setMoveState(initialMoveState);

  const enclosureOptions = enclosures.map((enclosure) => ({
    label: enclosure.name,
    value: enclosure.id,
  }));

  const handleConfirm = async () => {
    if (!selectedEnclosure) {
      Alert.alert('Selecione o recinto', 'Escolha o recinto de destino para concluir.');
      return;
    }

    if (!moveState.animal?.id) {
      Alert.alert('Animal invA°lido', 'NA£o foi possA≠vel identificar o animal.');
      return;
    }

    if (isSubmitting) return;

    try {
      setSubmitting(true);
      await moveAnimal({
        animalId: moveState.animal.id,
        destinationEnclosureId: selectedEnclosure,
        notes,
      });

      close();
      onRefresh?.();
    } catch (error) {
      Alert.alert('MovimentaAßA£o nA£o concluA≠da', error?.message || 'Tente novamente mais tarde.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={moveState.visible}
      animationType="slide"
      transparent
      onRequestClose={close}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Mover {moveState.animal?.name || 'animal'}
            </Text>
            <TouchableOpacity onPress={close}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>Selecione o novo recinto</Text>
          <ChipSelector options={enclosureOptions} value={selectedEnclosure} onChange={setSelectedEnclosure} />

          <TextInput
            style={[styles.input, styles.multilineInput, styles.modalInputSpacing]}
            placeholder="ObservaAßAµes (opcional)"
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <TouchableOpacity
            style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
            onPress={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryButtonLabel}>Confirmar movimentaAßA£o</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const AnimalCatalogScreen = () => {
  const [areas, setAreas] = useState([]);
  const [enclosures, setEnclosures] = useState([]);
  const [species, setSpecies] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [formState, setFormState] = useState(initialFormState);
  const [moveState, setMoveState] = useState(initialMoveState);

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const [areasData, enclosuresData, speciesData, animalsData, historyData] = await Promise.all([
        listAreas(),
        listEnclosures(),
        listSpecies(),
        listAnimals(),
        listAnimalHistory(),
      ]);

      setAreas(areasData || []);
      setEnclosures(enclosuresData || []);
      setSpecies(speciesData || []);
      setAnimals(animalsData || []);
      setHistory(historyData || []);
    } catch (error) {
      Alert.alert('Falha ao carregar dados', error?.message || 'Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCatalog();
    }, [fetchCatalog])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchCatalog();
    } finally {
      setRefreshing(false);
    }
  }, [fetchCatalog]);

  const handleDelete = useCallback(
    (type, entity) => {
      const displayName = entity?.name || entity?.common_name || entity?.identifier || 'registro';
      Alert.alert(
        'Confirmar remoAßA£o',
        `Deseja remover ${displayName}? Essa aAßA£o nA£o poderA° ser desfeita.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Remover',
            style: 'destructive',
            onPress: async () => {
              try {
                switch (type) {
                  case 'area':
                    await deleteArea(entity.id);
                    break;
                  case 'enclosure':
                    await deleteEnclosure(entity.id);
                    break;
                  case 'species':
                    await deleteSpecies(entity.id);
                    break;
                  case 'animal':
                    await deleteAnimal(entity.id);
                    break;
                  default:
                    break;
                }
                fetchCatalog();
              } catch (error) {
                Alert.alert('NA£o foi possA≠vel remover', error?.message || 'Tente novamente.');
              }
            },
          },
        ]
      );
    },
    [fetchCatalog]
  );

  const groupedEnclosuresByArea = useMemo(() => {
    const map = areas.reduce((acc, area) => {
      acc[area.id] = { area, enclosures: [] };
      return acc;
    }, {});

    enclosures.forEach((enclosure) => {
      if (!map[enclosure.area_id]) {
        map[enclosure.area_id] = {
          area: { id: enclosure.area_id, name: 'Sem A°rea definida' },
          enclosures: [],
        };
      }
      map[enclosure.area_id].enclosures.push(enclosure);
    });

    return Object.values(map);
  }, [areas, enclosures]);

  const animalsWithMeta = useMemo(
    () =>
      animals.map((animal) => {
        const speciesData = species.find((specie) => specie.id === animal.species_id);
        const enclosureData = enclosures.find(
          (enclosure) => enclosure.id === animal.current_enclosure_id
        );

        return {
          ...animal,
          speciesData,
          enclosureData,
        };
      }),
    [animals, species, enclosures]
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderLabel}>Carregando catA°logo...</Text>
        </View>
      );
    }

    if (activeTab === 'overview') {
      return (
        <View>
          {groupedEnclosuresByArea.map(({ area, enclosures: areaEnclosures }) => (
            <View key={area.id || area.name} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{area.name}</Text>
                <View style={styles.inlineActions}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() =>
                      setFormState({
                        visible: true,
                        type: 'area',
                        data: area,
                      })
                    }
                  >
                    <MaterialCommunityIcons name="pencil-outline" size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleDelete('area', area)}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.cardSubtitle}>
                {area.description || 'Nenhum detalhe cadastrado para esta A°rea.'}
              </Text>

              <View style={styles.divider} />

              {areaEnclosures.length === 0 ? (
                <Text style={styles.emptyMessage}>Nenhum recinto cadastrado nesta A°rea.</Text>
              ) : (
                areaEnclosures.map((enclosure) => (
                  <View key={enclosure.id} style={styles.enclosureRow}>
                    <View style={styles.enclosureInfo}>
                      <Text style={styles.enclosureName}>{enclosure.name}</Text>
                      <Text style={styles.enclosureMeta}>
                        CA≥digo {enclosure.code || 'aÄì'} A∑ Capacidade{' '}
                        {enclosure.capacity ? `${enclosure.capacity} animais` : 'indefinida'}
                      </Text>
                      {enclosure.environment_type ? (
                        <Text style={styles.enclosureMeta}>{enclosure.environment_type}</Text>
                      ) : null}
                    </View>
                    <View style={styles.inlineActions}>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() =>
                          setFormState({
                            visible: true,
                            type: 'enclosure',
                            data: enclosure,
                          })
                        }
                      >
                        <MaterialCommunityIcons
                          name="pencil-outline"
                          size={18}
                          color={COLORS.primary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => handleDelete('enclosure', enclosure)}
                      >
                        <MaterialCommunityIcons
                          name="trash-can-outline"
                          size={18}
                          color={COLORS.danger}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() =>
                  setFormState({
                    visible: true,
                    type: 'enclosure',
                    data: { area_id: area.id },
                  })
                }
              >
                <MaterialCommunityIcons name="plus-circle-outline" size={18} color={COLORS.primary} />
                <Text style={styles.secondaryButtonLabel}>Adicionar recinto</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      );
    }

    if (activeTab === 'species') {
      return (
        <View>
          <SectionTitle
            icon="paw"
            title="EspA©cies cadastradas"
            actionLabel="Nova espA©cie"
            onActionPress={() => setFormState({ visible: true, type: 'species', data: null })}
          />
          {species.length === 0 ? (
            <Text style={styles.emptyMessage}>Nenhuma espA©cie cadastrada.</Text>
          ) : (
            species.map((specie) => (
              <View key={specie.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{specie.common_name}</Text>
                  <View style={styles.inlineActions}>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() =>
                        setFormState({
                          visible: true,
                          type: 'species',
                          data: specie,
                        })
                      }
                    >
                      <MaterialCommunityIcons
                        name="pencil-outline"
                        size={18}
                        color={COLORS.primary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => handleDelete('species', specie)}
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
                  {specie.scientific_name || 'Nome cientA≠fico nA£o informado.'}
                </Text>
                <View style={styles.metaRow}>
                  {specie.conservation_status ? (
                    <Text style={styles.metaPill}>Status: {specie.conservation_status}</Text>
                  ) : null}
                  {specie.diet ? <Text style={styles.metaPill}>Dieta: {specie.diet}</Text> : null}
                </View>
                {specie.description ? (
                  <Text style={styles.descriptionText}>{specie.description}</Text>
                ) : null}
              </View>
            ))
          )}
        </View>
      );
    }

    if (activeTab === 'animals') {
      return (
        <View>
          <SectionTitle
            icon="elephant"
            title="Animais"
            actionLabel="Novo animal"
            onActionPress={() => setFormState({ visible: true, type: 'animal', data: null })}
          />
          {animalsWithMeta.length === 0 ? (
            <Text style={styles.emptyMessage}>Nenhum animal cadastrado ainda.</Text>
          ) : (
            animalsWithMeta.map((animal) => (
              <View key={animal.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{animal.name}</Text>
                  <View style={styles.inlineActions}>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() =>
                        setFormState({
                          visible: true,
                          type: 'animal',
                          data: animal,
                        })
                      }
                    >
                      <MaterialCommunityIcons
                        name="pencil-outline"
                        size={18}
                        color={COLORS.primary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => handleDelete('animal', animal)}
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
                  {animal.speciesData?.common_name || 'EspA©cie nA£o informada'}
                </Text>
                <View style={styles.metaRow}>
                  {animal.identifier ? (
                    <Text style={styles.metaPill}>ID: {animal.identifier}</Text>
                  ) : null}
                  <Text style={styles.metaPill}>
                    Recinto: {animal.enclosureData?.name || 'Sem recinto'}
                  </Text>
                  {animal.status ? (
                    <Text style={styles.metaPill}>Status: {animal.status}</Text>
                  ) : null}
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() =>
                      setMoveState({
                        visible: true,
                        animal,
                      })
                    }
                  >
                    <MaterialCommunityIcons
                      name="swap-horizontal"
                      size={18}
                      color={COLORS.primary}
                    />
                    <Text style={styles.secondaryButtonLabel}>Mover de recinto</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      );
    }

    if (activeTab === 'history') {
      return (
        <View>
          <SectionTitle icon="history" title="HistA≥rico de movimentaAßAµes" />
          {history.length === 0 ? (
            <Text style={styles.emptyMessage}>Nenhuma movimentaAßA£o registrada.</Text>
          ) : (
            history.map((entry) => (
              <View key={entry.id} style={styles.card}>
                <Text style={styles.cardTitle}>{entry.animal?.name || 'Animal'}</Text>
                <Text style={styles.cardSubtitle}>
                  {entry.from_enclosure?.name || 'Sem recinto'} aÜí{' '}
                  {entry.to_enclosure?.name || 'Sem recinto'}
                </Text>
                <Text style={styles.historyDate}>
                  {entry.moved_at ? new Date(entry.moved_at).toLocaleString('pt-BR') : 'Sem data'}
                </Text>
                {entry.notes ? <Text style={styles.descriptionText}>{entry.notes}</Text> : null}
              </View>
            ))
          )}
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>CatA°logo de Animais & Recintos</Text>
        <Text style={styles.subtitle}>
          Gerencie A°reas, recintos, espA©cies e acompanhe movimentaAßAµes em um sA≥ lugar.
        </Text>
      </View>

      <ChipSelector
        options={TABS.map((tab) => ({ label: tab.label, value: tab.key }))}
        value={activeTab}
        onChange={setActiveTab}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {renderContent()}
      </ScrollView>

      <FormModal
        formState={formState}
        setFormState={setFormState}
        areas={areas}
        enclosures={enclosures}
        species={species}
        onRefresh={fetchCatalog}
      />

      <MoveAnimalModal
        moveState={moveState}
        setMoveState={setMoveState}
        enclosures={enclosures}
        onRefresh={fetchCatalog}
      />

      {activeTab === 'overview' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setFormState({ visible: true, type: 'area', data: null })}
        >
          <MaterialCommunityIcons name="plus" size={28} color="#FFF" />
        </TouchableOpacity>
      )}

      {activeTab === 'species' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setFormState({ visible: true, type: 'species', data: null })}
        >
          <MaterialCommunityIcons name="plus" size={28} color="#FFF" />
        </TouchableOpacity>
      )}

      {activeTab === 'animals' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setFormState({ visible: true, type: 'animal', data: null })}
        >
          <MaterialCommunityIcons name="plus" size={28} color="#FFF" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIcon: {
    marginRight: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E9F3EC',
    borderRadius: 16,
  },
  sectionActionLabel: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  chipRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#EFF3F8',
    borderRadius: 20,
    marginRight: 10,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
  },
  chipLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  chipLabelActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loaderLabel: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inlineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  cardSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  metaPill: {
    backgroundColor: '#EFF3F8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  descriptionText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  enclosureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  enclosureInfo: {
    flex: 1,
    paddingRight: 12,
  },
  enclosureName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  enclosureMeta: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#EAF3ED',
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  secondaryButtonLabel: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  emptyMessage: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: 32,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 16,
    gap: 12,
  },
  historyDate: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 20,
    maxHeight: '90%',
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
  modalInputSpacing: {
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 6,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  iconButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: '#F2F5F9',
    marginLeft: 6,
  },
});

export default AnimalCatalogScreen;

