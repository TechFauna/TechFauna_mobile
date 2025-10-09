import { Alert } from 'react-native';
import { supabase } from '../config/supabaseClient';

/**
 * Manipula os dados escaneados do QR Code
 * @param {string} data - Dados do QR Code escaneado
 * @param {string} type - Tipo do código (qr, pdf417, etc.)
 * @param {function} navigation - Objeto de navegação do React Navigation
 */
export const handleQRCodeData = async (data, type, navigation) => {
  try {
    // Tenta fazer parse dos dados como JSON
    let qrData;
    try {
      qrData = JSON.parse(data);
    } catch (e) {
      // Se não for JSON, trata como string simples
      qrData = { rawData: data };
    }

    // Verifica se é um QR Code específico do TechFauna
    if (qrData.app === 'TechFauna') {
      return await handleTechFaunaQRCode(qrData, navigation);
    }

    // Verifica se é uma URL
    if (data.startsWith('http://') || data.startsWith('https://')) {
      return await handleURLQRCode(data, navigation);
    }

    // Verifica se é um código de animal/espécie
    if (qrData.animalId || qrData.speciesId) {
      return await handleAnimalQRCode(qrData, navigation);
    }

    // Para outros tipos de QR Code, mostra os dados básicos
    return showGenericQRCodeData(data, type);

  } catch (error) {
    console.error('Erro ao processar QR Code:', error);
    Alert.alert(
      'Erro',
      'Não foi possível processar o código QR. Tente novamente.',
      [{ text: 'OK' }]
    );
  }
};

/**
 * Manipula QR Codes específicos do TechFauna
 */
const handleTechFaunaQRCode = async (qrData, navigation) => {
  const { action, data: actionData } = qrData;

  switch (action) {
    case 'viewAnimal':
      return await navigateToAnimal(actionData.animalId, navigation);
    
    case 'addToChecklist':
      return await addToChecklist(actionData.speciesId, actionData.location);
    
    case 'shareLocation':
      return await handleLocationShare(actionData.coordinates, navigation);
    
    default:
      Alert.alert(
        'QR Code TechFauna',
        `Ação não reconhecida: ${action}`,
        [{ text: 'OK' }]
      );
  }
};

/**
 * Manipula QR Codes que contêm URLs
 */
const handleURLQRCode = async (url, navigation) => {
  Alert.alert(
    'URL Detectada',
    `Deseja abrir o link?\n${url}`,
    [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Abrir', 
        onPress: () => {
          // Aqui você pode usar Linking.openURL(url) para abrir o link
          console.log('Abrindo URL:', url);
        }
      }
    ]
  );
};

/**
 * Manipula QR Codes de animais/espécies
 */
const handleAnimalQRCode = async (qrData, navigation) => {
  const { animalId, speciesId, name } = qrData;

  if (animalId) {
    return await navigateToAnimal(animalId, navigation);
  }

  if (speciesId) {
    Alert.alert(
      'Espécie Encontrada',
      `Espécie: ${name || 'Desconhecida'}\nDeseja adicionar à sua checklist?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Adicionar', 
          onPress: () => addToChecklist(speciesId)
        }
      ]
    );
  }
};

/**
 * Navega para a tela de detalhes do animal
 */
const navigateToAnimal = async (animalId, navigation) => {
  try {
    // Busca dados do animal no Supabase
    const { data: animal, error } = await supabase
      .from('animals')
      .select('*')
      .eq('id', animalId)
      .single();

    if (error) throw error;

    if (animal) {
      // Navega para a tela de detalhes do animal
      navigation.navigate('AnimalDetails', { animal });
    } else {
      Alert.alert('Erro', 'Animal não encontrado.');
    }
  } catch (error) {
    console.error('Erro ao buscar animal:', error);
    Alert.alert('Erro', 'Não foi possível carregar os dados do animal.');
  }
};

/**
 * Adiciona espécie à checklist do usuário
 */
const addToChecklist = async (speciesId, location = null) => {
  try {
    // Aqui você implementaria a lógica para adicionar à checklist
    // Por exemplo, salvar no Supabase
    const { error } = await supabase
      .from('user_checklist')
      .insert([
        {
          species_id: speciesId,
          user_id: 'current_user_id', // Substituir pelo ID do usuário atual
          location: location,
          scanned_at: new Date().toISOString()
        }
      ]);

    if (error) throw error;

    Alert.alert(
      'Sucesso!',
      'Espécie adicionada à sua checklist.',
      [{ text: 'OK' }]
    );
  } catch (error) {
    console.error('Erro ao adicionar à checklist:', error);
    Alert.alert('Erro', 'Não foi possível adicionar à checklist.');
  }
};

/**
 * Manipula compartilhamento de localização
 */
const handleLocationShare = async (coordinates, navigation) => {
  const { latitude, longitude } = coordinates;
  
  Alert.alert(
    'Localização Compartilhada',
    `Lat: ${latitude}\nLng: ${longitude}\nDeseja visualizar no mapa?`,
    [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Ver Mapa', 
        onPress: () => {
          navigation.navigate('Map', { 
            initialRegion: {
              latitude,
              longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01
            }
          });
        }
      }
    ]
  );
};

/**
 * Mostra dados genéricos do QR Code
 */
const showGenericQRCodeData = (data, type) => {
  Alert.alert(
    'QR Code Escaneado',
    `Tipo: ${type}\nDados: ${data}`,
    [{ text: 'OK' }]
  );
};

/**
 * Gera um QR Code para compartilhar dados do TechFauna
 */
export const generateTechFaunaQRCode = (action, data) => {
  const qrData = {
    app: 'TechFauna',
    version: '1.0.0',
    action,
    data,
    timestamp: new Date().toISOString()
  };

  return JSON.stringify(qrData);
};

// Exemplos de uso:
// generateTechFaunaQRCode('viewAnimal', { animalId: '123' })
// generateTechFaunaQRCode('addToChecklist', { speciesId: '456', location: 'Parque Nacional' })
// generateTechFaunaQRCode('shareLocation', { coordinates: { latitude: -3.7319, longitude: -38.5267 } })
