import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { listTasks, listChecklists } from '../utils/zooService';

const COLORS = {
  background: '#F7F9FC', surface: '#FFFFFF', primary: '#5A8B63',
  text: '#2F3542', textMuted: '#77838F', border: '#E3E9F3',
  warning: '#F39C12', success: '#27AE60', error: '#E74C3C',
};

const EnclosureDetailScreen = ({ route }) => {
  const { enclosure } = route.params;
  const [tasks, setTasks] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [tasksData, checklistsData] = await Promise.all([listTasks({}), listChecklists({})]);
      setTasks((tasksData || []).filter(t => t.enclosure_id === enclosure.id));
      setChecklists((checklistsData || []).filter(c => c.enclosure_id === enclosure.id));
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [enclosure.id]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const getStatusColor = (s) => ({ completed: COLORS.success, pending: COLORS.warning, blocked: COLORS.error }[s] || COLORS.textMuted);
  const getStatusLabel = (s) => ({ completed: 'Concluída', pending: 'Pendente', blocked: 'Bloqueada' }[s] || s);
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

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
          <View style={styles.headerIcon}><MaterialCommunityIcons name="home-group" size={40} color={COLORS.primary} /></View>
          <Text style={styles.headerTitle}>{enclosure.name}</Text>
          {enclosure.area?.name && <View style={styles.areaTag}><MaterialCommunityIcons name="map-marker" size={14} color={COLORS.primary} /><Text style={styles.areaText}>{enclosure.area.name}</Text></View>}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}><MaterialCommunityIcons name="clipboard-list" size={22} color={COLORS.primary} /><Text style={styles.sectionTitle}>Tarefas ({tasks.length})</Text></View>
          {tasks.length === 0 ? <Text style={styles.emptyText}>Nenhuma tarefa para este recinto</Text> : tasks.map((task) => (
            <View key={task.id} style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) + '20' }]}><Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>{getStatusLabel(task.status)}</Text></View>
              </View>
              {task.description && <Text style={styles.taskDescription}>{task.description}</Text>}
              {task.due_at && <Text style={styles.taskDate}>Prazo: {formatDate(task.due_at)}</Text>}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}><MaterialCommunityIcons name="clipboard-check" size={22} color={COLORS.primary} /><Text style={styles.sectionTitle}>Histórico ({checklists.length})</Text></View>
          {checklists.length === 0 ? <Text style={styles.emptyText}>Nenhum checklist realizado</Text> : checklists.map((c) => (
            <View key={c.id} style={styles.checklistCard}>
              <View style={styles.checklistHeader}><MaterialCommunityIcons name="check-circle" size={20} color={COLORS.success} /><Text style={styles.checklistTitle}>{c.template?.title || 'Checklist'}</Text></View>
              <Text style={styles.checklistDate}>Realizado em: {formatDate(c.performed_at)}</Text>
              {c.performer?.email && <Text style={styles.checklistPerformer}>Por: {c.performer.email}</Text>}
              {c.notes && <Text style={styles.checklistNotes}>Obs: {c.notes}</Text>}
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
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  headerCode: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
  areaTag: { flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: COLORS.primary + '10', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  areaText: { fontSize: 14, color: COLORS.primary, marginLeft: 4 },
  section: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginLeft: 8 },
  emptyText: { fontSize: 14, color: COLORS.textMuted, fontStyle: 'italic', textAlign: 'center', paddingVertical: 20 },
  taskCard: { backgroundColor: COLORS.background, borderRadius: 12, padding: 14, marginBottom: 10 },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  taskDescription: { fontSize: 14, color: COLORS.textMuted, marginTop: 8 },
  taskDate: { fontSize: 13, color: COLORS.textMuted, marginTop: 8 },
  checklistCard: { backgroundColor: COLORS.background, borderRadius: 12, padding: 14, marginBottom: 10 },
  checklistHeader: { flexDirection: 'row', alignItems: 'center' },
  checklistTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginLeft: 8 },
  checklistDate: { fontSize: 13, color: COLORS.textMuted, marginTop: 8 },
  checklistPerformer: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  checklistNotes: { fontSize: 13, color: COLORS.text, marginTop: 8, fontStyle: 'italic' },
});

export default EnclosureDetailScreen;