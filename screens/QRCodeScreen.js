import React, { useState, useEffect } from 'react';
<<<<<<< Updated upstream
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { handleQRCodeData } from '../utils/qrCodeHandler';
=======
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);

    // Usa o handler personalizado para processar os dados
    handleQRCodeData(data, type, navigation);

    // Adiciona opção para escanear novamente
    setTimeout(() => {
      Alert.alert(
        'QR Code Processado',
        'Deseja escanear outro código?',
        [
          {
            text: 'Sim',
            onPress: () => setScanned(false),
          },
          {
            text: 'Não',
            style: 'cancel',
          },
        ]
      );
    }, 1000); // Delay para permitir que outros alertas sejam mostrados primeiro
=======

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
>>>>>>> Stashed changes
  };

  const toggleFlash = () => {
    setIsFlashOn(prev => !prev);
<<<<<<< Updated upstream
=======
    Alert.alert('Flash', `Flash ${isFlashOn ? 'Desligado' : 'Ligado'}`);
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    <View style={styles.container}>
      <Text style={FONT_STYLES.title}>Escanear QR Code</Text>

      <View style={styles.cameraView}>
        <CameraView
          style={styles.camera}
          facing="back"
          flash={isFlashOn ? 'on' : 'off'}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'pdf417'],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        >
          <View style={styles.overlay}>
            <View style={styles.scanArea} />
          </View>
        </CameraView>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, scanned && styles.buttonDisabled]}
          onPress={() => setScanned(false)}
          disabled={!scanned}
        >
          <Text style={styles.buttonText}>
            {scanned ? 'Escanear Novamente' : 'Escaneando...'}
          </Text>
=======
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={FONT_STYLES.title}>Escanear QR Code</Text>
      <View style={styles.cameraView}>
        <View style={styles.cameraPlaceholder} />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleScan}>
          <Text style={styles.buttonText}>Escanear</Text>
>>>>>>> Stashed changes
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={toggleFlash}>
          <Text style={styles.buttonText}>{isFlashOn ? 'Flash Off' : 'Flash On'}</Text>
        </TouchableOpacity>
      </View>
<<<<<<< Updated upstream
    </View>
=======
    </ScrollView>
>>>>>>> Stashed changes
  );
};

const styles = StyleSheet.create({
  container: {
<<<<<<< Updated upstream
    flex: 1,
=======
    flexGrow: 1,
>>>>>>> Stashed changes
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.iceWhite,
    padding: 20,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
<<<<<<< Updated upstream
    backgroundColor: COLORS.iceWhite,
    padding: 20,
  },
  cameraView: {
    width: '100%',
    height: 400,
    backgroundColor: COLORS.darkGray,
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 20,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: COLORS.cactusGreen,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
=======
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
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    minWidth: 120,
  },
  buttonDisabled: {
    backgroundColor: COLORS.gray,
=======
>>>>>>> Stashed changes
  },
  buttonText: {
    color: 'white',
    ...FONT_STYLES.text,
<<<<<<< Updated upstream
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
=======
    fontSize: 18,
    fontWeight: 'bold',
>>>>>>> Stashed changes
  },
});

export default QRCodeScreen;