# 🚀 Instruções de Instalação - TechFauna Mobile

## ✅ **SIM, outras pessoas conseguirão rodar o app!**

O projeto está configurado corretamente com todas as dependências no `package.json` e `package-lock.json`. Siga as instruções abaixo:

---

## 📋 **Pré-requisitos (Dependências do Sistema)**

### 1. **Node.js** (Versão 18 ou superior)
- **Download**: https://nodejs.org/
- **Versão testada**: v22.20.0
- **Verificar instalação**: `node --version`

### 2. **npm** (Gerenciador de pacotes)
- **Vem junto com Node.js**
- **Versão testada**: 11.3.0
- **Verificar instalação**: `npm --version`

### 3. **Expo CLI** (Para desenvolvimento React Native)
```bash
npm install -g @expo/cli
```

### 4. **Git** (Para clonar o repositório)
- **Download**: https://git-scm.com/

---

## 📱 **Para Testar no Dispositivo Móvel**

### **Android:**
- **Expo Go** (Play Store): https://play.google.com/store/apps/details?id=host.exp.exponent

### **iOS:**
- **Expo Go** (App Store): https://apps.apple.com/app/expo-go/id982107779

---

## 🛠️ **Instalação do Projeto**

### 1. **Clone o repositório**
```bash
git clone [URL_DO_SEU_REPOSITORIO]
cd TechFauna_mobile
```

### 2. **Instale as dependências**
```bash
npm install
```

### 3. **Inicie o projeto**
```bash
npm start
# ou
npx expo start
```

### 4. **Execute no dispositivo**
- **Escaneie o QR Code** que aparece no terminal com o app Expo Go
- **Ou pressione 'a'** para Android emulator
- **Ou pressione 'i'** para iOS simulator

---

## 📦 **Dependências do Projeto (Já incluídas no package.json)**

### **Principais:**
- `expo@^54.0.13` - Framework principal
- `react@19.1.0` - Biblioteca React
- `react-native@0.81.4` - Framework mobile

### **Navegação:**
- `@react-navigation/native@^7.1.17`
- `@react-navigation/bottom-tabs@^7.4.7`
- `@react-navigation/native-stack@^7.3.26`
- `react-native-screens@~4.16.0`
- `react-native-safe-area-context@~5.6.0`

### **QR Code (Recém implementado):**
- `expo-camera@^17.0.8` - Acesso à câmera
- `expo-barcode-scanner@^13.0.1` - Scanner de códigos

### **Backend:**
- `@supabase/supabase-js@^2.45.4` - Cliente Supabase

### **Armazenamento:**
- `@react-native-async-storage/async-storage@^2.2.0`

### **Outros:**
- `expo-status-bar@~3.0.8`

---

## ⚠️ **Possíveis Problemas e Soluções**

### **1. Erro de permissão de câmera**
- **Solução**: Permita acesso à câmera quando solicitado
- **Configurado em**: `app.json` (iOS e Android)

### **2. Dependências desatualizadas**
```bash
npx expo install --check
```

### **3. Cache do Metro Bundler**
```bash
npx expo start --clear
```

### **4. Problemas com node_modules**
```bash
rm -rf node_modules
npm install
```

---

## 🔧 **Comandos Úteis**

```bash
# Iniciar projeto
npm start

# Iniciar para Android
npm run android

# Iniciar para iOS  
npm run ios

# Iniciar para Web
npm run web

# Verificar dependências
npx expo doctor

# Limpar cache
npx expo start --clear
```

---

## 📱 **Testando a Funcionalidade de QR Code**

1. **Abra o app no dispositivo**
2. **Navegue para a aba "QR Code"**
3. **Permita acesso à câmera**
4. **Aponte para qualquer QR Code para testar**

---

## 🌐 **Configuração do Backend (Supabase)**

O projeto já está configurado com as credenciais do Supabase no `app.json`. 
**Nota**: Em produção, essas credenciais devem ser movidas para variáveis de ambiente.

---

## 📞 **Suporte**

Se encontrar problemas:
1. Verifique se todas as dependências estão instaladas
2. Certifique-se de que o Node.js está na versão correta
3. Tente limpar o cache: `npx expo start --clear`
4. Reinstale as dependências: `rm -rf node_modules && npm install`

---

## ✅ **Checklist de Verificação**

- [ ] Node.js instalado (v18+)
- [ ] npm funcionando
- [ ] Expo CLI instalado globalmente
- [ ] Expo Go instalado no dispositivo móvel
- [ ] Repositório clonado
- [ ] `npm install` executado com sucesso
- [ ] `npm start` funcionando
- [ ] QR Code escaneado e app carregado no dispositivo
- [ ] Funcionalidade de QR Code testada
