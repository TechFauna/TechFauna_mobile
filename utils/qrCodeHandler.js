import { Alert } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import supabase from '../config/supabaseClient';

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

    // Verifica se é um código de animal/espécie/RECINTO
    if (qrData.animalId || qrData.speciesId || qrData.enclosureId) {
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

    case 'viewEnclosure':
      return await navigateToEnclosure(actionData.enclosureId, actionData.name, navigation);

    case 'viewSpecies':
      return await navigateToSpecies(actionData.speciesId, actionData.name, navigation);

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
 * Manipula QR Codes de animais/espécies/recintos
 */
const handleAnimalQRCode = async (qrData, navigation) => {
  // Adicionada a extração de 'enclosureId'
  const { animalId, speciesId, enclosureId, name } = qrData;

  // 1. Prioridade: ID do Animal (lógica original)
  if (animalId) {
    return await navigateToAnimal(animalId, navigation);
  }

  // 2. Prioridade: ID do Recinto (NOVA LÓGICA)
  if (enclosureId) {
    return await navigateToEnclosure(enclosureId, name, navigation);
  }

  // 3. Prioridade: ID da Espécie (lógica original)
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
 * Navega para a tela de detalhes do animal (Função Original)
 */
const navigateToAnimal = async (animalId, navigation) => {
  try {
    // Busca dados do animal no Supabase
    const { data: animal, error } = await supabase
      .from('animals')
      .select('*, species:species_id(*), enclosure:current_enclosure_id(*)') // Query melhorada para incluir relações
      .eq('id', animalId)
      .single();

    if (error) throw error;

    if (animal) {
      // Navega para a tela de detalhes do animal
      // **Atenção**: O código original navegava para 'AnimalDetails'. 
      // Se sua tela for a 'AnimalCatalogScreen', ajuste aqui.
      // Vou manter 'AnimalDetails' como no original.
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
 * Busca recinto e navega para a tela de detalhes
 */
const navigateToEnclosure = async (enclosureId, enclosureName, navigation) => {
  try {
    // Busca o recinto no Supabase
    const { data: enclosure, error } = await supabase
      .from('enclosures')
      .select('*, area:area_id(name)')
      .eq('id', enclosureId)
      .single();

    if (error) throw error;

    if (enclosure) {
      // Navega para a tela de detalhes do recinto usando CommonActions
      navigation.dispatch(
        CommonActions.navigate({
          name: 'Home',
          params: {
            screen: 'EnclosureDetail',
            params: { enclosure }
          }
        })
      );
    } else {
      Alert.alert('Erro', 'Recinto não encontrado.');
    }
  } catch (error) {
    console.error('Erro ao buscar recinto:', error);
    Alert.alert('Erro', 'Não foi possível carregar os dados do recinto.');
  }
};

/**
 * Busca espécie e navega para a tela de detalhes
 */
const navigateToSpecies = async (speciesId, speciesName, navigation) => {
  try {
    const { data: species, error } = await supabase
      .from('species')
      .select('*')
      .eq('id', speciesId)
      .single();

    if (error) throw error;

    if (species) {
      navigation.dispatch(
        CommonActions.navigate({
          name: 'Home',
          params: {
            screen: 'SpeciesDetail',
            params: { species }
          }
        })
      );
    } else {
      Alert.alert('Erro', 'Espécie não encontrada.');
    }
  } catch (error) {
    console.error('Erro ao buscar espécie:', error);
    Alert.alert('Erro', 'Não foi possível carregar os dados da espécie.');
  }
};

/**
 * Adiciona espécie à checklist do usuário (Função Original)
 */
const addToChecklist = async (speciesId, location = null) => {
  try {
    // Aqui você implementaria a lógica para adicionar à checklist
    // Por exemplo, salvar no Supabase
    // **Atenção**: O código original usava uma tabela 'user_checklist'
    // e 'current_user_id' fixo.
    // Você deve buscar o user_id do useAuth() ou similar.
    const { error } = await supabase
      .from('user_checklist') // Verifique se esta tabela existe no seu DB
      .insert([
        {
          species_id: speciesId,
          user_id: supabase.auth.getUser()?.id, // Melhor forma de pegar o user
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
 * Manipula compartilhamento de localização (Função Original)
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
          // O código original navegava para 'Map'. Sua tela se chama 'MapScreen'.
          navigation.navigate('Mapa', { // Ajustado de 'Map' para 'Mapa'
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
 * Mostra dados genéricos do QR Code (Função Original)
 */
const showGenericQRCodeData = (data, type) => {
  Alert.alert(
    'QR Code Escaneado',
    `Tipo: ${type}\nDados: ${data}`,
    [{ text: 'OK' }]
  );
};

/**
 * Gera um QR Code para compartilhar dados do TechFauna (Função Original)
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
// generateTechFaunaQRCode('viewEnclosure', { enclosureId: 'recinto-456', name: 'Recinto das Aves' })
// generateTechFaunaQRCode('addToChecklist', { speciesId: '456', location: 'Parque Nacional' })
// generateTechFaunaQRCode('shareLocation', { coordinates: { latitude: -3.7319, longitude: -38.5267 } })