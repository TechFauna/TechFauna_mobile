import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const COLORS = {
  background: '#F7F9FC',
  primary: '#5A8B63',
  text: '#2F3542',
};

// RECEBE navigation e route como props
const MapScreen = ({ route }) => {
  // Extrai o endereço passado pela Home Screen, se existir
  const { initialAddress } = route.params || {}; 

  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchLocation = useCallback(async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão Negada', 'Para exibir o mapa, o aplicativo precisa de acesso à sua localização.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation });
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005, // Zoom de detalhe
        longitudeDelta: 0.005,
      });
    } catch (error) {
      console.error('Erro ao buscar localização para o mapa:', error);
      Alert.alert('Erro', 'Não foi possível carregar sua localização.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Carregando Mapa...</Text>
      </View>
    );
  }

  if (!currentLocation) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="map-marker-off" size={48} color={COLORS.text} />
        <Text style={styles.loadingText}>Localização indisponível. Verifique as permissões.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="map-marker" size={20} color={COLORS.primary} />
        <Text style={styles.headerText}>
          {/* Exibe o endereço enviado ou um texto padrão */}
          {initialAddress || 'Mapa de Localização'}
        </Text>
      </View>
      <MapView
        style={styles.map}
        initialRegion={currentLocation}
        showsUserLocation={true}
        followsUserLocation={true}
        provider="google"
      >
        <Marker
          coordinate={currentLocation}
          title={"Sua Posição Atual"}
          pinColor={COLORS.primary}
        />
      </MapView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E3E9F3',
  },
  headerText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flexShrink: 1,
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  }
});

export default MapScreen;