import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { listEnclosures } from '../utils/zooService';

const COLORS = {
  background: '#F7F9FC',
  surface: '#FFFFFF',
  primary: '#5A8B63',
  text: '#2F3542',
  textMuted: '#77838F',
  border: '#E3E9F3',
};

const EnclosuresListScreen = ({ navigation }) => {
  const [enclosures, setEnclosures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEnclosures = useCallback(async () => {
    try {
      const data = await listEnclosures();
      setEnclosures(data || []);
    } catch (error) {
      console.error('Erro ao carregar recintos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchEnclosures();
    }, [fetchEnclosures])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchEnclosures();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ativo': return '#27AE60';
      case 'manutencao': return '#F39C12';
      case 'inativo': return '#E74C3C';
      default: return COLORS.textMuted;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'ativo': return 'Ativo';
      case 'manutencao': return 'Em Manutenção';
      case 'inativo': return 'Inativo';
      default: return status;
    }
  };

  const renderEnclosure = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('EnclosureDetail', { enclosure: item })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="home-group" size={28} color={COLORS.primary} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          {item.area?.name && (
            <Text style={styles.cardSubtitle}>
              <MaterialCommunityIcons name="map-marker" size={14} color={COLORS.textMuted} />
              {' '}{item.area.name}
            </Text>
          )}
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
      {item.environment_type && (
        <View style={styles.cardFooter}>
          <MaterialCommunityIcons name="tree" size={16} color={COLORS.textMuted} />
          <Text style={styles.footerText}>{item.environment_type}</Text>
          {item.capacity && (
            <>
              <MaterialCommunityIcons name="account-group" size={16} color={COLORS.textMuted} style={{ marginLeft: 12 }} />
              <Text style={styles.footerText}>Capacidade: {item.capacity}</Text>
            </>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Carregando recintos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={enclosures}
        renderItem={renderEnclosure}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="home-off-outline" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>Nenhum recinto cadastrado</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textMuted,
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  cardCode: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginTop: 16,
  },
});

export default EnclosuresListScreen;

