import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { handleQRCodeData } from '../utils/qrCodeHandler';

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
  };

  const toggleFlash = () => {
    setIsFlashOn(prev => !prev);
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
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={toggleFlash}>
          <Text style={styles.buttonText}>{isFlashOn ? 'Flash Off' : 'Flash On'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.iceWhite,
    padding: 20,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    minWidth: 120,
  },
  buttonDisabled: {
    backgroundColor: COLORS.gray,
  },
  buttonText: {
    color: 'white',
    ...FONT_STYLES.text,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default QRCodeScreen;