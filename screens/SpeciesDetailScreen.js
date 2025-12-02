import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View, TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { listAnimals, listTasks } from '../utils/zooService';

const COLORS = {
  background: '#F7F9FC', surface: '#FFFFFF', primary: '#5A8B63',
  text: '#2F3542', textMuted: '#77838F', border: '#E3E9F3',
  warning: '#F39C12', success: '#27AE60', error: '#E74C3C',
};

const SpeciesDetailScreen = ({ route, navigation }) => {
  const { species } = route.params;
  const [animals, setAnimals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [animalsData, tasksData] = await Promise.all([listAnimals(), listTasks({})]);
      setAnimals((animalsData || []).filter(a => a.species_id === species.id));
      setTasks((tasksData || []).filter(t => t.species_id === species.id));
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [species.id]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const getConservationLabel = (status) => {
    const labels = { 'LC': 'Pouco Preocupante', 'NT': 'Quase Ameaçada', 'VU': 'Vulnerável', 'EN': 'Em Perigo', 'CR': 'Criticamente em Perigo', 'EW': 'Extinta na Natureza', 'EX': 'Extinta' };
    return labels[status] || status;
  };
  const getConservationColor = (status) => {
    const colors = { 'LC': COLORS.success, 'NT': COLORS.warning, 'VU': '#E67E22', 'EN': COLORS.error, 'CR': '#C0392B' };
    return colors[status] || COLORS.textMuted;
  };
  const getStatusColor = (s) => ({ ativo: COLORS.success, tratamento: COLORS.warning, inativo: COLORS.error }[s] || COLORS.textMuted);

  if (loading) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}>
        <View style={styles.header}>
          <View style={styles.headerIcon}><MaterialCommunityIcons name="paw" size={40} color={COLORS.primary} /></View>
          <Text style={styles.headerTitle}>{species.common_name}</Text>
          {species.scientific_name && <Text style={styles.headerSubtitle}>{species.scientific_name}</Text>}
          {species.conservation_status && (
            <View style={[styles.statusBadge, { backgroundColor: getConservationColor(species.conservation_status) + '20' }]}>
              <Text style={[styles.statusText, { color: getConservationColor(species.conservation_status) }]}>{getConservationLabel(species.conservation_status)}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Classificação</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}><Text style={styles.infoLabel}>Classe</Text><Text style={styles.infoValue}>{species.class || 'N/I'}</Text></View>
            <View style={styles.infoItem}><Text style={styles.infoLabel}>Ordem</Text><Text style={styles.infoValue}>{species.order || 'N/I'}</Text></View>
            <View style={styles.infoItem}><Text style={styles.infoLabel}>Família</Text><Text style={styles.infoValue}>{species.family || 'N/I'}</Text></View>
            <View style={styles.infoItem}><Text style={styles.infoLabel}>Gênero</Text><Text style={styles.infoValue}>{species.genus || 'N/I'}</Text></View>
          </View>
          {species.description && <Text style={styles.description}>{species.description}</Text>}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}><MaterialCommunityIcons name="paw" size={22} color={COLORS.primary} /><Text style={styles.sectionTitle}>Animais ({animals.length})</Text></View>
          {animals.length === 0 ? <Text style={styles.emptyText}>Nenhum animal desta espécie</Text> : animals.slice(0, 5).map((animal) => (
            <TouchableOpacity key={animal.id} style={styles.animalCard} onPress={() => navigation.navigate('AnimalDetail', { animal })}>
              <View style={styles.animalInfo}>
                <Text style={styles.animalName}>{animal.name || 'Sem nome'}</Text>
                <Text style={styles.animalId}>ID: {animal.identifier || 'N/I'}</Text>
              </View>
              <View style={[styles.animalStatus, { backgroundColor: getStatusColor(animal.status) + '20' }]}>
                <Text style={[styles.animalStatusText, { color: getStatusColor(animal.status) }]}>{animal.status}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}><MaterialCommunityIcons name="clipboard-list" size={22} color={COLORS.primary} /><Text style={styles.sectionTitle}>Tarefas ({tasks.length})</Text></View>
          {tasks.length === 0 ? <Text style={styles.emptyText}>Nenhuma tarefa para esta espécie</Text> : tasks.slice(0, 5).map((t) => (
            <View key={t.id} style={styles.taskCard}><Text style={styles.taskTitle}>{t.title}</Text></View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: COLORS.textMuted },
  scrollContent: { padding: 16 },
  header: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16 },
  headerIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary + '15', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  headerSubtitle: { fontSize: 16, color: COLORS.textMuted, marginTop: 4, fontStyle: 'italic' },
  statusBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 12 },
  statusText: { fontSize: 14, fontWeight: '600' },
  section: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginLeft: 8 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  infoItem: { width: '50%', marginBottom: 12 },
  infoLabel: { fontSize: 12, color: COLORS.textMuted },
  infoValue: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginTop: 2 },
  description: { fontSize: 14, color: COLORS.text, marginTop: 12, lineHeight: 20 },
  emptyText: { fontSize: 14, color: COLORS.textMuted, fontStyle: 'italic', textAlign: 'center', paddingVertical: 16 },
  animalCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 10, padding: 12, marginBottom: 8 },
  animalInfo: { flex: 1 },
  animalName: { fontSize: 15, fontWeight: '500', color: COLORS.text },
  animalId: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  animalStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  animalStatusText: { fontSize: 12, fontWeight: '600' },
  taskCard: { backgroundColor: COLORS.background, borderRadius: 10, padding: 12, marginBottom: 8 },
  taskTitle: { fontSize: 15, fontWeight: '500', color: COLORS.text },
});

export default SpeciesDetailScreen;

