import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { listEnclosures, listAnimals } from '../utils/zooService';
import { generateTechFaunaQRCode } from '../utils/qrCodeHandler';

const COLORS = {
  background: '#F7F9FC',
  surface: '#FFFFFF',
  primary: '#5A8B63',
  text: '#2F3542',
  textMuted: '#77838F',
  border: '#E3E9F3',
  success: '#27AE60',
};

const QRCodeGeneratorScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('enclosures'); // 'enclosures' ou 'animals'
  const [enclosures, setEnclosures] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const qrRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [enclosuresData, animalsData] = await Promise.all([
        listEnclosures(),
        listAnimals(),
      ]);
      setEnclosures(enclosuresData || []);
      setAnimals(animalsData || []);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
    }
  };

  const generateQRData = (item) => {
    if (activeTab === 'enclosures') {
      return generateTechFaunaQRCode('viewEnclosure', {
        enclosureId: item.id,
        name: item.name,
      });
    } else {
      return generateTechFaunaQRCode('viewAnimal', {
        animalId: item.id,
        name: item.name,
      });
    }
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedItem(null);
  };

  const handleSaveQRCode = async () => {
    if (!qrRef.current || !selectedItem) return;

    setSaving(true);
    try {
      // Solicita permissão para acessar a galeria
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos de acesso à galeria para salvar a imagem.');
        setSaving(false);
        return;
      }

      // Gera a imagem do QR Code
      qrRef.current.toDataURL(async (dataURL) => {
        try {
          const prefix = activeTab === 'enclosures' ? 'Recinto' : 'Animal';
          const filename = `QRCode_${prefix}_${selectedItem.name.replace(/\s/g, '_')}_${Date.now()}.png`;
          const fileUri = FileSystem.cacheDirectory + filename;

          // Salva o arquivo usando a API legacy
          await FileSystem.writeAsStringAsync(fileUri, dataURL, {
            encoding: FileSystem.EncodingType.Base64,
          });

          // Salva na galeria
          const asset = await MediaLibrary.createAssetAsync(fileUri);
          await MediaLibrary.createAlbumAsync('TechFauna QR Codes', asset, false);

          const itemType = activeTab === 'enclosures' ? 'recinto' : 'animal';
          Alert.alert('Sucesso!', `QR Code do ${itemType} "${selectedItem.name}" salvo na galeria!`);
        } catch (error) {
          console.error('Erro ao salvar:', error);
          Alert.alert('Erro', 'Não foi possível salvar o QR Code.');
        } finally {
          setSaving(false);
        }
      });
    } catch (error) {
      console.error('Erro:', error);
      Alert.alert('Erro', 'Não foi possível salvar o QR Code.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Carregando dados...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentList = activeTab === 'enclosures' ? enclosures : animals;
  const itemLabel = activeTab === 'enclosures' ? 'recinto' : 'animal';
  const itemIcon = activeTab === 'enclosures' ? 'home-group' : 'paw';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Gerar QR Code</Text>
        <Text style={styles.subtitle}>Selecione um {itemLabel} para gerar o QR Code</Text>

        {/* Abas */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'enclosures' && styles.tabActive]}
            onPress={() => handleTabChange('enclosures')}
          >
            <MaterialCommunityIcons
              name="home-group"
              size={20}
              color={activeTab === 'enclosures' ? COLORS.surface : COLORS.primary}
            />
            <Text style={[styles.tabText, activeTab === 'enclosures' && styles.tabTextActive]}>
              Recintos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'animals' && styles.tabActive]}
            onPress={() => handleTabChange('animals')}
          >
            <MaterialCommunityIcons
              name="paw"
              size={20}
              color={activeTab === 'animals' ? COLORS.surface : COLORS.primary}
            />
            <Text style={[styles.tabText, activeTab === 'animals' && styles.tabTextActive]}>
              Animais
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lista de Itens */}
        <View style={styles.enclosureList}>
          {currentList.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.enclosureCard,
                selectedItem?.id === item.id && styles.enclosureCardSelected,
              ]}
              onPress={() => handleSelectItem(item)}
            >
              <MaterialCommunityIcons
                name={itemIcon}
                size={24}
                color={selectedItem?.id === item.id ? COLORS.surface : COLORS.primary}
              />
              <View style={styles.enclosureInfo}>
                <Text
                  style={[
                    styles.enclosureName,
                    selectedItem?.id === item.id && styles.enclosureNameSelected,
                  ]}
                >
                  {item.name}
                </Text>
                {activeTab === 'enclosures' && item.environment_type && (
                  <Text
                    style={[
                      styles.enclosureType,
                      selectedItem?.id === item.id && styles.enclosureTypeSelected,
                    ]}
                  >
                    {item.environment_type}
                  </Text>
                )}
                {activeTab === 'animals' && item.species?.common_name && (
                  <Text
                    style={[
                      styles.enclosureType,
                      selectedItem?.id === item.id && styles.enclosureTypeSelected,
                    ]}
                  >
                    {item.species.common_name}
                  </Text>
                )}
              </View>
              {selectedItem?.id === item.id && (
                <MaterialCommunityIcons name="check-circle" size={24} color={COLORS.surface} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* QR Code Gerado */}
        {selectedItem && (
          <View style={styles.qrContainer}>
            <Text style={styles.qrTitle}>QR Code: {selectedItem.name}</Text>

            <View style={styles.qrCodeWrapper}>
              <QRCode
                value={generateQRData(selectedItem)}
                size={200}
                color={COLORS.text}
                backgroundColor={COLORS.surface}
                getRef={(ref) => (qrRef.current = ref)}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSaveQRCode}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={COLORS.surface} />
              ) : (
                <>
                  <MaterialCommunityIcons name="download" size={22} color={COLORS.surface} />
                  <Text style={styles.saveButtonText}>Salvar na Galeria</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="information" size={18} color={COLORS.primary} />
              <Text style={styles.infoText}>
                Ao escanear este QR Code, o app abrirá automaticamente a página do {itemLabel} "{selectedItem.name}".
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  tabTextActive: {
    color: COLORS.surface,
  },
  enclosureList: {
    marginBottom: 24,
  },
  enclosureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  enclosureCardSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  enclosureInfo: {
    flex: 1,
    marginLeft: 12,
  },
  enclosureName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  enclosureNameSelected: {
    color: COLORS.surface,
  },
  enclosureType: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  enclosureTypeSelected: {
    color: COLORS.surface + 'CC',
  },
  qrContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 20,
  },
  qrCodeWrapper: {
    padding: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    marginBottom: 16,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.primary + '10',
    borderRadius: 12,
    padding: 14,
    width: '100%',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.primary,
    marginLeft: 10,
    lineHeight: 18,
  },
});

export default QRCodeGeneratorScreen;

