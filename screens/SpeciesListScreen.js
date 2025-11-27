import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, FlatList, RefreshControl, SafeAreaView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { listSpecies } from '../utils/zooService';

const COLORS = {
  background: '#F7F9FC', surface: '#FFFFFF', primary: '#5A8B63',
  text: '#2F3542', textMuted: '#77838F', border: '#E3E9F3',
};

const SpeciesListScreen = ({ navigation }) => {
  const [species, setSpecies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSpecies = useCallback(async () => {
    try {
      const data = await listSpecies();
      setSpecies(data || []);
    } catch (error) {
      console.error('Erro ao carregar espécies:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchSpecies(); }, [fetchSpecies]));
  const onRefresh = () => { setRefreshing(true); fetchSpecies(); };

  const getConservationColor = (status) => {
    const colors = { 'LC': '#27AE60', 'NT': '#F39C12', 'VU': '#E67E22', 'EN': '#E74C3C', 'CR': '#C0392B', 'EW': '#8E44AD', 'EX': '#2C3E50' };
    return colors[status] || COLORS.textMuted;
  };

  const renderSpecies = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('SpeciesDetail', { species: item })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="paw" size={28} color={COLORS.primary} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.common_name || 'Sem nome'}</Text>
          {item.scientific_name && (
            <Text style={styles.cardSubtitle}>{item.scientific_name}</Text>
          )}
          <View style={styles.tagsRow}>
            {item.class && <Text style={styles.tagText}>{item.class}</Text>}
            {item.order && <Text style={styles.tagText}>{item.order}</Text>}
          </View>
        </View>
        <View style={styles.cardRight}>
          {item.conservation_status && (
            <View style={[styles.statusBadge, { backgroundColor: getConservationColor(item.conservation_status) + '20' }]}>
              <Text style={[styles.statusText, { color: getConservationColor(item.conservation_status) }]}>
                {item.conservation_status}
              </Text>
            </View>
          )}
          <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textMuted} />
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Carregando espécies...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={species}
        renderItem={renderSpecies}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="paw-off" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>Nenhuma espécie cadastrada</Text>
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
  cardSubtitle: { fontSize: 14, color: COLORS.textMuted, marginTop: 2, fontStyle: 'italic' },
  tagsRow: { flexDirection: 'row', marginTop: 4, gap: 8 },
  tagText: { fontSize: 12, color: COLORS.textMuted },
  cardRight: { alignItems: 'flex-end' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, color: COLORS.textMuted, marginTop: 16 },
});

export default SpeciesListScreen;

