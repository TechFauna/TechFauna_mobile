# Funcionalidade de QR Code - TechFauna

## Visão Geral

A tela de QR Code permite aos usuários escanear códigos QR usando a câmera do dispositivo. A implementação inclui:

- Solicitação automática de permissão de câmera
- Interface visual com área de escaneamento
- Controle de flash
- Feedback visual quando um código é escaneado

## Funcionalidades Implementadas

### 1. Permissões de Câmera
- Solicita permissão automaticamente ao abrir a tela
- Mostra mensagens apropriadas para diferentes estados de permissão
- Trata casos de permissão negada

### 2. Escaneamento de QR Code
- Suporte para códigos QR e PDF417
- Área visual de escaneamento destacada
- Pausa automática após escaneamento bem-sucedido
- Opção para escanear novamente

### 3. Controles da Câmera
- Botão para ligar/desligar flash
- Interface responsiva e intuitiva

## Dependências Adicionadas

```json
{
  "expo-camera": "^17.0.8",
  "expo-barcode-scanner": "^13.0.1"
}
```

## Permissões Configuradas

### iOS (app.json)
```json
"ios": {
  "infoPlist": {
    "NSCameraUsageDescription": "Este aplicativo precisa acessar a câmera para escanear códigos QR."
  }
}
```

### Android (app.json)
```json
"android": {
  "permissions": ["CAMERA"]
}
```

## Como Usar

1. **Navegue para a tela de QR Code**
   - A permissão de câmera será solicitada automaticamente

2. **Escaneie um código**
   - Aponte a câmera para o código QR
   - O código será detectado automaticamente
   - Um alerta mostrará os dados escaneados

3. **Controles disponíveis**
   - **Flash On/Off**: Liga ou desliga o flash da câmera
   - **Escanear Novamente**: Permite escanear outro código após um escaneamento bem-sucedido

## Estados da Interface

### Carregando Permissão
- Mostra: "Solicitando permissão de câmera..."

### Permissão Negada
- Mostra: "Acesso à câmera negado. Por favor, habilite nas configurações."

### Pronto para Escanear
- Mostra a interface da câmera com área de escaneamento
- Botão: "Escaneando..."
- Botão: "Flash On/Off"

### Código Escaneado
- Mostra alerta com dados do código
- Botão muda para: "Escanear Novamente"

## Tipos de Código Suportados

- QR Code
- PDF417

## Testando a Funcionalidade

Execute os testes unitários:
```bash
npm test QRCodeScreen.test.js
```

## Próximos Passos

1. **Integração com Backend**
   - Enviar dados escaneados para o servidor
   - Validar códigos QR específicos do aplicativo

2. **Melhorias na UX**
   - Adicionar som de confirmação
   - Animações de escaneamento
   - Histórico de códigos escaneados

3. **Funcionalidades Avançadas**
   - Geração de códigos QR
   - Compartilhamento de códigos
   - Escaneamento de múltiplos códigos
