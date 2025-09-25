import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';

const COLORS = {
  cactusGreen: '#5A8B63',
  iceWhite: '#F0F4F7',
  gray: '#A9A9A9',
  darkGray: '#4B4B4B',
};

const FONT_STYLES = {
  title: {
    fontFamily: 'Roboto',
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  text: {
    fontFamily: 'Roboto',
    fontSize: 16,
    color: COLORS.gray,
  },
};

const QRCodeScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [isFlashOn, setIsFlashOn] = useState(false);

  useEffect(() => {
    (async () => {
      // Solicita permissão da câmera ao montar a tela
      // const { status } = await Camera.requestCameraPermissionsAsync();
      // setHasPermission(status === 'granted');
      
      // Simulação da permissão para fins de demonstração
      setHasPermission(true); 
    })();
  }, []);

  const handleScan = () => {
    Alert.alert('Escanear', 'A função de escanear o QR Code seria ativada agora.');
  };

  const toggleFlash = () => {
    setIsFlashOn(prev => !prev);
    Alert.alert('Flash', `Flash ${isFlashOn ? 'Desligado' : 'Ligado'}`);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={FONT_STYLES.text}>Solicitando permissão de câmera...</Text>
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={FONT_STYLES.text}>Acesso à câmera negado. Por favor, habilite nas configurações.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={FONT_STYLES.title}>Escanear QR Code</Text>
      <View style={styles.cameraView}>
        <View style={styles.cameraPlaceholder} />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleScan}>
          <Text style={styles.buttonText}>Escanear</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={toggleFlash}>
          <Text style={styles.buttonText}>{isFlashOn ? 'Flash Off' : 'Flash On'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.iceWhite,
    padding: 20,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraView: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: COLORS.darkGray,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: COLORS.cactusGreen,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    ...FONT_STYLES.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default QRCodeScreen;