import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import AnimalCatalogScreen from '../screens/AnimalCatalogScreen';
import MapScreen from '../screens/MapScreen';

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
        name="Mapa"
        component={MapScreen}
        options={{
          headerShown: true,
          headerTitle: 'Mapa de Localização',
        }}
      />
    </Stack.Navigator>
  );
}
