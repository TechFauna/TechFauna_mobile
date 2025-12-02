import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { listAnimalHistory, listTasks, listChecklists } from '../utils/zooService';

const COLORS = {
  background: '#F7F9FC', surface: '#FFFFFF', primary: '#5A8B63',
  text: '#2F3542', textMuted: '#77838F', border: '#E3E9F3',
  warning: '#F39C12', success: '#27AE60', error: '#E74C3C',
};

const AnimalDetailScreen = ({ route }) => {
  const { animal } = route.params;
  const [history, setHistory] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [historyData, tasksData, checklistsData] = await Promise.all([
        listAnimalHistory(), listTasks({}), listChecklists({})
      ]);
      setHistory((historyData || []).filter(h => h.animal_id === animal.id));
      setTasks((tasksData || []).filter(t => t.species_id === animal.species_id));
      setChecklists((checklistsData || []).filter(c => c.species_id === animal.species_id));
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [animal.id, animal.species_id]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const getStatusColor = (s) => ({ ativo: COLORS.success, tratamento: COLORS.warning, inativo: COLORS.error, completed: COLORS.success, pending: COLORS.warning }[s] || COLORS.textMuted);
  const getStatusLabel = (s) => ({ ativo: 'Ativo', tratamento: 'Em Tratamento', inativo: 'Inativo', completed: 'Concluída', pending: 'Pendente' }[s] || s);
  const getSexLabel = (sex) => ({ M: 'Macho', F: 'Fêmea', macho: 'Macho', femea: 'Fêmea', fêmea: 'Fêmea' }[sex] || sex || 'Não informado');
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/I';

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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}><MaterialCommunityIcons name="paw" size={40} color={COLORS.primary} /></View>
          <Text style={styles.headerTitle}>{animal.name || 'Sem nome'}</Text>
          {animal.species?.common_name && <Text style={styles.headerSubtitle}>{animal.species.common_name}</Text>}
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(animal.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(animal.status) }]}>{getStatusLabel(animal.status)}</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}><Text style={styles.infoLabel}>Identificador</Text><Text style={styles.infoValue}>{animal.identifier || 'N/I'}</Text></View>
            <View style={styles.infoItem}><Text style={styles.infoLabel}>Sexo</Text><Text style={styles.infoValue}>{getSexLabel(animal.sex)}</Text></View>
            <View style={styles.infoItem}><Text style={styles.infoLabel}>Nascimento</Text><Text style={styles.infoValue}>{formatDate(animal.birthdate)}</Text></View>
            <View style={styles.infoItem}><Text style={styles.infoLabel}>Chegada</Text><Text style={styles.infoValue}>{formatDate(animal.arrival_date)}</Text></View>
          </View>
          {animal.current_enclosure?.name && (
            <View style={styles.enclosureTag}>
              <MaterialCommunityIcons name="home-group" size={18} color={COLORS.primary} />
              <Text style={styles.enclosureText}>Recinto: {animal.current_enclosure.name}</Text>
            </View>
          )}
          {animal.notes && <Text style={styles.notes}>Obs: {animal.notes}</Text>}
        </View>

        {/* Histórico de Movimentações */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}><MaterialCommunityIcons name="history" size={22} color={COLORS.primary} /><Text style={styles.sectionTitle}>Movimentações ({history.length})</Text></View>
          {history.length === 0 ? <Text style={styles.emptyText}>Nenhuma movimentação registrada</Text> : history.slice(0, 5).map((h) => (
            <View key={h.id} style={styles.historyCard}>
              <Text style={styles.historyText}>{h.from_enclosure?.name || '?'} → {h.to_enclosure?.name || '?'}</Text>
              <Text style={styles.historyDate}>{formatDate(h.moved_at)}</Text>
              {h.reason && <Text style={styles.historyReason}>Motivo: {h.reason}</Text>}
            </View>
          ))}
        </View>

        {/* Tarefas Relacionadas */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}><MaterialCommunityIcons name="clipboard-list" size={22} color={COLORS.primary} /><Text style={styles.sectionTitle}>Tarefas ({tasks.length})</Text></View>
          {tasks.length === 0 ? <Text style={styles.emptyText}>Nenhuma tarefa relacionada</Text> : tasks.slice(0, 5).map((t) => (
            <View key={t.id} style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <Text style={styles.taskTitle}>{t.title}</Text>
                <View style={[styles.taskBadge, { backgroundColor: getStatusColor(t.status) + '20' }]}>
                  <Text style={[styles.taskBadgeText, { color: getStatusColor(t.status) }]}>{getStatusLabel(t.status)}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Checklists */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}><MaterialCommunityIcons name="clipboard-check" size={22} color={COLORS.primary} /><Text style={styles.sectionTitle}>Checklists ({checklists.length})</Text></View>
          {checklists.length === 0 ? <Text style={styles.emptyText}>Nenhum checklist realizado</Text> : checklists.slice(0, 5).map((c) => (
            <View key={c.id} style={styles.checklistCard}>
              <MaterialCommunityIcons name="check-circle" size={18} color={COLORS.success} />
              <Text style={styles.checklistText}>{c.template?.title || 'Checklist'} - {formatDate(c.performed_at)}</Text>
            </View>
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
  enclosureTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary + '10', padding: 12, borderRadius: 12, marginTop: 8 },
  enclosureText: { fontSize: 14, color: COLORS.primary, marginLeft: 8, fontWeight: '500' },
  notes: { fontSize: 14, color: COLORS.text, marginTop: 12, fontStyle: 'italic' },
  emptyText: { fontSize: 14, color: COLORS.textMuted, fontStyle: 'italic', textAlign: 'center', paddingVertical: 16 },
  historyCard: { backgroundColor: COLORS.background, borderRadius: 10, padding: 12, marginBottom: 8 },
  historyText: { fontSize: 15, fontWeight: '500', color: COLORS.text },
  historyDate: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  historyReason: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  taskCard: { backgroundColor: COLORS.background, borderRadius: 10, padding: 12, marginBottom: 8 },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskTitle: { fontSize: 15, fontWeight: '500', color: COLORS.text, flex: 1 },
  taskBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  taskBadgeText: { fontSize: 11, fontWeight: '600' },
  checklistCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 10, padding: 12, marginBottom: 8 },
  checklistText: { fontSize: 14, color: COLORS.text, marginLeft: 8 },
});

export default AnimalDetailScreen;

