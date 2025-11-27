import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, FlatList, RefreshControl, SafeAreaView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { listAnimals } from '../utils/zooService';

const COLORS = {
  background: '#F7F9FC', surface: '#FFFFFF', primary: '#5A8B63',
  text: '#2F3542', textMuted: '#77838F', border: '#E3E9F3',
  success: '#27AE60', warning: '#F39C12', error: '#E74C3C',
};

const AnimalsListScreen = ({ navigation }) => {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnimals = useCallback(async () => {
    try {
      const data = await listAnimals();
      setAnimals(data || []);
    } catch (error) {
      console.error('Erro ao carregar animais:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchAnimals(); }, [fetchAnimals]));
  const onRefresh = () => { setRefreshing(true); fetchAnimals(); };

  const getStatusColor = (status) => ({ ativo: COLORS.success, tratamento: COLORS.warning, inativo: COLORS.error }[status] || COLORS.textMuted);
  const getStatusLabel = (status) => ({ ativo: 'Ativo', tratamento: 'Em Tratamento', inativo: 'Inativo' }[status] || status);
  const getSexLabel = (sex) => ({ M: 'Macho', F: 'Fêmea', macho: 'Macho', femea: 'Fêmea', fêmea: 'Fêmea' }[sex] || sex || 'N/I');

  const renderAnimal = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('AnimalDetail', { animal: item })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="paw" size={28} color={COLORS.primary} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.name || 'Sem nome'}</Text>
          {item.species?.common_name && (
            <Text style={styles.cardSubtitle}>{item.species.common_name}</Text>
          )}
          <View style={styles.tagsRow}>
            {item.identifier && <Text style={styles.tagText}>ID: {item.identifier}</Text>}
            <Text style={styles.tagText}>{getSexLabel(item.sex)}</Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textMuted} />
        </View>
      </View>
      {item.current_enclosure?.name && (
        <View style={styles.cardFooter}>
          <MaterialCommunityIcons name="home-group" size={16} color={COLORS.textMuted} />
          <Text style={styles.footerText}>{item.current_enclosure.name}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Carregando animais...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={animals}
        renderItem={renderAnimal}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="paw-off" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>Nenhum animal cadastrado</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: COLORS.textMuted },
  listContent: { padding: 16 },
  card: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { width: 50, height: 50, borderRadius: 12, backgroundColor: COLORS.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '600', color: COLORS.text },
  cardSubtitle: { fontSize: 14, color: COLORS.textMuted, marginTop: 2 },
  tagsRow: { flexDirection: 'row', marginTop: 4, gap: 8 },
  tagText: { fontSize: 12, color: COLORS.textMuted },
  cardRight: { alignItems: 'flex-end' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  footerText: { fontSize: 13, color: COLORS.textMuted, marginLeft: 6 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, color: COLORS.textMuted, marginTop: 16 },
});

export default AnimalsListScreen;

