import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { listEnclosures, updateEnclosureLocation } from '../utils/zooService';

const COLORS = {
  background: '#F7F9FC',
  primary: '#5A8B63',
  text: '#2F3542',
  white: '#FFFFFF',
  border: '#E3E9F3',
  danger: '#E74C3C',
};

const GOOGLE_MAPS_API_KEY = 'AIzaSyCR1mjiLNeQv5J5o43ewT99c7PkHEqXg0w';

const MapScreen = ({ route }) => {
  const { initialAddress } = route.params || {};
  const webViewRef = useRef(null);

  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enclosures, setEnclosures] = useState([]);
  const [showEnclosureModal, setShowEnclosureModal] = useState(false);
  const [selectedEnclosure, setSelectedEnclosure] = useState(null);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [draggableMarkerPosition, setDraggableMarkerPosition] = useState(null);

  const fetchLocation = useCallback(async () => {
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
      });
    } catch (error) {
      console.error('Erro ao buscar localização para o mapa:', error);
      Alert.alert('Erro', 'Não foi possível carregar sua localização.');
    }
  }, []);

  const fetchEnclosures = useCallback(async () => {
    try {
      const data = await listEnclosures();
      setEnclosures(data || []);
    } catch (error) {
      console.error('Erro ao carregar recintos:', error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchLocation(), fetchEnclosures()]);
      setLoading(false);
    };
    init();
  }, [fetchLocation, fetchEnclosures]);

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'markerDragged') {
        setDraggableMarkerPosition({ latitude: data.lat, longitude: data.lng });
      }
    } catch (e) {
      console.error('Erro ao processar mensagem do WebView:', e);
    }
  };

  const handleSelectEnclosure = (enclosure) => {
    setSelectedEnclosure(enclosure);
    setShowEnclosureModal(false);
    setIsAddingLocation(true);
    setDraggableMarkerPosition(currentLocation);

    // Adiciona marcador arrastável no mapa
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        addDraggableMarker(${currentLocation.latitude}, ${currentLocation.longitude}, "${enclosure.name}");
        true;
      `);
    }
  };

  const handleUseCurrentLocation = async () => {
    if (!selectedEnclosure) return;

    try {
      await updateEnclosureLocation(selectedEnclosure.id, currentLocation.latitude, currentLocation.longitude);
      Alert.alert('Sucesso', `Localização do recinto "${selectedEnclosure.name}" atualizada com sua localização atual!`);
      await fetchEnclosures();
      cancelAddingLocation();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar a localização.');
    }
  };

  const handleSaveMarkerLocation = async () => {
    if (!selectedEnclosure || !draggableMarkerPosition) return;

    try {
      await updateEnclosureLocation(
        selectedEnclosure.id,
        draggableMarkerPosition.latitude,
        draggableMarkerPosition.longitude
      );
      Alert.alert('Sucesso', `Localização do recinto "${selectedEnclosure.name}" salva!`);
      await fetchEnclosures();
      cancelAddingLocation();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar a localização.');
    }
  };

  const cancelAddingLocation = () => {
    setIsAddingLocation(false);
    setSelectedEnclosure(null);
    setDraggableMarkerPosition(null);
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        removeDraggableMarker();
        true;
      `);
    }
  };

  const generateMapHTML = () => {
    if (!currentLocation) return '';
    const { latitude, longitude } = currentLocation;

    // Filtra recintos com localização
    const enclosuresWithLocation = enclosures.filter(e => e.latitude && e.longitude);
    const markersJSON = JSON.stringify(enclosuresWithLocation.map(e => ({
      id: e.id,
      name: e.name,
      lat: e.latitude,
      lng: e.longitude,
      area: e.area?.name || 'Sem área',
    })));

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { width: 100%; height: 100%; }
          #map { width: 100%; height: 100%; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          let map;
          let draggableMarker = null;
          let enclosureMarkers = [];

          function initMap() {
            map = new google.maps.Map(document.getElementById('map'), {
              center: { lat: ${latitude}, lng: ${longitude} },
              zoom: 16,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
            });

            // Marcador da localização atual do usuário
            new google.maps.Marker({
              position: { lat: ${latitude}, lng: ${longitude} },
              map: map,
              title: 'Você está aqui',
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#4285F4',
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 3,
              }
            });

            // Adiciona marcadores dos recintos
            const enclosures = ${markersJSON};
            enclosures.forEach(function(enc) {
              const marker = new google.maps.Marker({
                position: { lat: enc.lat, lng: enc.lng },
                map: map,
                title: enc.name,
                icon: {
                  url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                }
              });

              const infoWindow = new google.maps.InfoWindow({
                content: '<div style="padding:5px;"><strong>' + enc.name + '</strong><br/><small>' + enc.area + '</small></div>'
              });

              marker.addListener('click', function() {
                infoWindow.open(map, marker);
              });

              enclosureMarkers.push(marker);
            });
          }

          function addDraggableMarker(lat, lng, name) {
            removeDraggableMarker();

            draggableMarker = new google.maps.Marker({
              position: { lat: lat, lng: lng },
              map: map,
              title: name,
              draggable: true,
              icon: {
                url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
              },
              animation: google.maps.Animation.DROP,
            });

            map.panTo({ lat: lat, lng: lng });

            draggableMarker.addListener('dragend', function() {
              const pos = draggableMarker.getPosition();
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'markerDragged',
                lat: pos.lat(),
                lng: pos.lng()
              }));
            });
          }

          function removeDraggableMarker() {
            if (draggableMarker) {
              draggableMarker.setMap(null);
              draggableMarker = null;
            }
          }
        </script>
        <script async defer src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap"></script>
      </body>
      </html>
    `;
  };

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

  const enclosuresWithoutLocation = enclosures.filter(e => !e.latitude || !e.longitude);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="map-marker" size={20} color={COLORS.primary} />
        <Text style={styles.headerText}>
          {initialAddress || 'Mapa dos Recintos'}
        </Text>
      </View>

      <View style={styles.mapWrapper}>
        <WebView
          ref={webViewRef}
          style={styles.map}
          source={{ html: generateMapHTML() }}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />

        {/* Botão para adicionar localização */}
        {!isAddingLocation && (
          <TouchableOpacity
            style={styles.addLocationButton}
            onPress={() => setShowEnclosureModal(true)}
          >
            <MaterialCommunityIcons name="map-marker-plus" size={24} color={COLORS.white} />
            <Text style={styles.addLocationButtonText}>Adicionar Localização</Text>
          </TouchableOpacity>
        )}

        {/* Painel de controle quando está adicionando localização */}
        {isAddingLocation && selectedEnclosure && (
          <View style={styles.controlPanel}>
            <Text style={styles.controlPanelTitle}>
              Definir localização: {selectedEnclosure.name}
            </Text>
            <Text style={styles.controlPanelHint}>
              Arraste o pino vermelho ou use sua localização atual
            </Text>
            <View style={styles.controlPanelButtons}>
              <TouchableOpacity style={styles.gpsButton} onPress={handleUseCurrentLocation}>
                <MaterialCommunityIcons name="crosshairs-gps" size={20} color={COLORS.white} />
                <Text style={styles.buttonText}>Usar GPS</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveMarkerLocation}>
                <MaterialCommunityIcons name="check" size={20} color={COLORS.white} />
                <Text style={styles.buttonText}>Salvar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={cancelAddingLocation}>
                <MaterialCommunityIcons name="close" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Legenda */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4285F4' }]} />
            <Text style={styles.legendText}>Você</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#34A853' }]} />
            <Text style={styles.legendText}>Recintos</Text>
          </View>
        </View>
      </View>

      {/* Modal para selecionar recinto */}
      <Modal visible={showEnclosureModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione um Recinto</Text>
              <TouchableOpacity onPress={() => setShowEnclosureModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            {enclosuresWithoutLocation.length === 0 ? (
              <Text style={styles.emptyText}>Todos os recintos já possuem localização definida.</Text>
            ) : (
              <FlatList
                data={enclosuresWithoutLocation}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.enclosureItem}
                    onPress={() => handleSelectEnclosure(item)}
                  >
                    <MaterialCommunityIcons name="home-group" size={24} color={COLORS.primary} />
                    <View style={styles.enclosureInfo}>
                      <Text style={styles.enclosureName}>{item.name}</Text>
                      <Text style={styles.enclosureArea}>{item.area?.name || 'Sem área'}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.border} />
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
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
    borderBottomColor: COLORS.border,
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
  },
  addLocationButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  addLocationButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    marginLeft: 8,
  },
  controlPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 10,
  },
  controlPanelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 5,
  },
  controlPanelHint: {
    fontSize: 13,
    color: '#777',
    marginBottom: 15,
  },
  controlPanelButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  gpsButton: {
    flex: 1,
    backgroundColor: '#3498DB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
  legend: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  enclosureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  enclosureInfo: {
    flex: 1,
    marginLeft: 15,
  },
  enclosureName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  enclosureArea: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
  },
  emptyText: {
    padding: 30,
    textAlign: 'center',
    color: '#777',
    fontSize: 15,
  },
});

export default MapScreen;