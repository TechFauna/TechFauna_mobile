import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import AnimalCatalogScreen from '../screens/AnimalCatalogScreen';
import MapScreen from '../screens/MapScreen';
import EnclosuresListScreen from '../screens/EnclosuresListScreen';
import EnclosureDetailScreen from '../screens/EnclosureDetailScreen';
import AnimalsListScreen from '../screens/AnimalsListScreen';
import AnimalDetailScreen from '../screens/AnimalDetailScreen';
import SpeciesListScreen from '../screens/SpeciesListScreen';
import SpeciesDetailScreen from '../screens/SpeciesDetailScreen';
import QRCodeGeneratorScreen from '../screens/QRCodeGeneratorScreen';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerShown: false,
};

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="HomeRoot" component={HomeScreen} />
      <Stack.Screen
        name="AnimalCatalog"
        component={AnimalCatalogScreen}
        options={{
          headerShown: true,
          headerTitle: 'Catálogo de Animais',
        }}
      />
      <Stack.Screen
        name="AnimalsList"
        component={AnimalsListScreen}
        options={{
          headerShown: true,
          headerTitle: 'Animais',
        }}
      />
      <Stack.Screen
        name="AnimalDetail"
        component={AnimalDetailScreen}
        options={({ route }) => ({
          headerShown: true,
          headerTitle: route.params?.animal?.name || 'Detalhes do Animal',
        })}
      />
      <Stack.Screen
        name="EnclosuresList"
        component={EnclosuresListScreen}
        options={{
          headerShown: true,
          headerTitle: 'Recintos',
        }}
      />
      <Stack.Screen
        name="EnclosureDetail"
        component={EnclosureDetailScreen}
        options={({ route }) => ({
          headerShown: true,
          headerTitle: route.params?.enclosure?.name || 'Detalhes do Recinto',
        })}
      />
      <Stack.Screen
        name="SpeciesList"
        component={SpeciesListScreen}
        options={{
          headerShown: true,
          headerTitle: 'Espécies',
        }}
      />
      <Stack.Screen
        name="SpeciesDetail"
        component={SpeciesDetailScreen}
        options={({ route }) => ({
          headerShown: true,
          headerTitle: route.params?.species?.common_name || 'Detalhes da Espécie',
        })}
      />
      <Stack.Screen
        name="Mapa"
        component={MapScreen}
        options={{
          headerShown: true,
          headerTitle: 'Mapa de Localização',
        }}
      />
      <Stack.Screen
        name="QRCodeGenerator"
        component={QRCodeGeneratorScreen}
        options={{
          headerShown: true,
          headerTitle: 'Gerar QR Code',
        }}
      />
    </Stack.Navigator>
  );
}
