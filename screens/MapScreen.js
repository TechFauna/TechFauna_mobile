import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
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

  const generateMapHTML = () => {
    if (!currentLocation) return '';

    const { latitude, longitude } = currentLocation;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; }
          html, body { width: 100%; height: 100%; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto; }
          #map { width: 100%; height: 100%; }
        </style>
      </head>
      <body>
        <iframe
          id="map"
          src="https://www.google.com/maps/embed/v1/place?key=AIzaSyCR1mjiLNeQv5J5o43ewT99c7PkHEqXg0w&q=${latitude},${longitude}&zoom=15"
          style="border:0; width:100%; height:100%;"
          allowfullscreen=""
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade">
        </iframe>
      </body>
      </html>
    `;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="map-marker" size={20} color={COLORS.primary} />
        <Text style={styles.headerText}>
          {initialAddress || 'Mapa de Localização'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Carregando Mapa...</Text>
        </View>
      ) : !currentLocation ? (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="map-marker-off" size={48} color={COLORS.text} />
          <Text style={styles.loadingText}>Localização indisponível. Verifique as permissões.</Text>
        </View>
      ) : (
        <View style={styles.mapWrapper}>
          <WebView
            style={styles.map}
            source={{ html: generateMapHTML() }}
            scrollEnabled={true}
            scalesPageToFit={true}
          />

          {initialAddress && (
            <View style={styles.addressOverlay}>
              <MaterialCommunityIcons name="home-map-marker" size={18} color={COLORS.primary} />
              <Text style={styles.addressOverlayText}>{initialAddress}</Text>
            </View>
          )}
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E3E9F3',
    zIndex: 10,
  },
  headerText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flexShrink: 1,
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  addressOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 15,
    right: 15,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  addressOverlayText: {
    fontSize: 13,
    color: COLORS.text,
    marginLeft: 10,
    flex: 1,
    fontWeight: '500',
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