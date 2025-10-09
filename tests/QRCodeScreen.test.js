import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import QRCodeScreen from '../screens/QRCodeScreen';
import { Camera } from 'expo-camera';

// Mock das dependências
jest.mock('expo-camera', () => ({
  Camera: {
    requestCameraPermissionsAsync: jest.fn(),
  },
  CameraView: ({ children, onBarcodeScanned }) => {
    // Simula um componente de câmera
    return children;
  },
}));

jest.spyOn(Alert, 'alert');

describe('QRCodeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve solicitar permissão de câmera ao montar', async () => {
    Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });
    
    render(<QRCodeScreen navigation={{}} />);
    
    await waitFor(() => {
      expect(Camera.requestCameraPermissionsAsync).toHaveBeenCalled();
    });
  });

  test('deve mostrar mensagem quando permissão é negada', async () => {
    Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'denied' });
    
    const { getByText } = render(<QRCodeScreen navigation={{}} />);
    
    await waitFor(() => {
      expect(getByText('Acesso à câmera negado. Por favor, habilite nas configurações.')).toBeTruthy();
    });
  });

  test('deve mostrar interface da câmera quando permissão é concedida', async () => {
    Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });
    
    const { getByText } = render(<QRCodeScreen navigation={{}} />);
    
    await waitFor(() => {
      expect(getByText('Escanear QR Code')).toBeTruthy();
      expect(getByText('Escaneando...')).toBeTruthy();
      expect(getByText('Flash On')).toBeTruthy();
    });
  });

  test('deve alternar o flash quando botão é pressionado', async () => {
    Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });
    
    const { getByText } = render(<QRCodeScreen navigation={{}} />);
    
    await waitFor(() => {
      const flashButton = getByText('Flash On');
      fireEvent.press(flashButton);
      expect(getByText('Flash Off')).toBeTruthy();
    });
  });
});
