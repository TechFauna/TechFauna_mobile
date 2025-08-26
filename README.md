# TechFauna Mobile 🐾

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![Plataforma](https://img.shields.io/badge/plataforma-Mobile-blue)
![Prazo](https://img.shields.io/badge/prazo-Nov/2025-red)

## 📖 Sobre o Projeto

O **TechFauna Mobile** é um aplicativo projetado para facilitar a gestão e a interação de visitantes em um parque, zoológico ou reserva ambiental. A plataforma oferecerá uma experiência interativa e informativa, permitindo que os usuários acessem dados sobre animais, localizem recintos e acompanhem informações relevantes em tempo real.

Este projeto está em desenvolvimento ativo, com o objetivo de finalizar a versão inicial até o final de novembro de 2025.

---

## ✨ Funcionalidades Planejadas

-   🗺️ **Mapa Interativo:** Visualização da localização atual do usuário e dos recintos no painel principal.
-   📊 **Dashboard de Dados:** Gráficos e informações sobre a quantidade e tipos de animais cadastrados.
-   📱 **Leitor de QR Code:** Acesso rápido a informações detalhadas sobre um recinto ou animal específico através da leitura de um QR Code.
-   🐘 **API de Informações:** Consulta a uma API externa para exibir dados, curiosidades e status sobre cada animal.
-   👤 **Perfil de Usuário:** Área de perfil para o usuário com design intuitivo.
-   🏠 **Tela Inicial Dinâmica:** Apresentação de informações, imagens e textos relevantes na home do aplicativo.

---

## 💻 Tech Stack (Pilha de Tecnologias)

-   **Frontend:** React Native
-   **Backend & Banco de Dados:** Firebase (Firestore, Authentication, Storage)
-   **Navegação:** React Navigation
-   **Mapas:** Google Maps API / OpenStreetMap
-   **Leitor de QR Code:** Expo Barcode Scanner / React Native Camera

---

## 🚀 Roadmap de Desenvolvimento (Agosto - Novembro 2025)

O desenvolvimento será dividido em 3 sprints principais para garantir a entrega contínua e organizada das funcionalidades.

### Sprint 1: Estrutura e Interface (Final de Agosto - Setembro)
*Foco em construir a base visual do aplicativo e implementar as funcionalidades estáticas.*

-   [x] **UI Fix:** Ajustar a posição do "nome" dentro do ícone da foto no Perfil de usuário.
-   [ ] **Conteúdo Home:** Adicionar as informações iniciais, textos e imagens na tela `Home`.
-   [ ] **Estrutura Dashboard:** Criar a estrutura visual do dashboard de animais na tela `home-user` (sem dados dinâmicos).
-   [ ] **Setup de Navegação:** Configurar as rotas principais do aplicativo (Home, Perfil, Mapa, etc.).

### Sprint 2: Funcionalidades Interativas (Outubro)
*Foco em dar vida ao aplicativo com a integração de APIs e funcionalidades de hardware.*

-   [ ] **Implementar Leitor de QR Code:** Adicionar a função de scanner para ler códigos nos recintos.
-   [ ] **API de Animais:** Conectar o leitor de QR Code a uma API para buscar e exibir as informações do animal correspondente.
-   [ ] **Integração do Mapa:** Adicionar a API de mapa no painel `home-user` para exibir a localização do usuário e dos pontos de interesse.
-   [ ] **Refinamento da UI:** Melhorar a experiência do usuário com base nas funcionalidades implementadas.

### Sprint 3: Dados e Finalização (Novembro)
*Foco em conectar o aplicativo ao banco de dados, refinar a lógica de negócios e preparar para a entrega.*

-   [ ] **Dashboard Dinâmico:** Conectar o dashboard da `home-user` ao Firebase para exibir a quantidade de animais em tempo real.
-   [ ] **Testes e Depuração:** Realizar testes completos em todas as funcionalidades para identificar e corrigir bugs.
-   [ ] **Otimização de Performance:** Analisar e melhorar o desempenho geral do aplicativo.
-   [ ] **Build de Lançamento:** Gerar os arquivos de instalação (`.apk` / `.ipa`) e finalizar a documentação.

---

## ⚙️ Como Executar o Projeto Localmente

Siga os passos abaixo para configurar o ambiente de desenvolvimento.

**1. Pré-requisitos:**
* [Node.js](https://nodejs.org/) (versão LTS)
* [Yarn](https://yarnpkg.com/) ou [NPM](https://www.npmjs.com/)
* [React Native CLI](https://reactnative.dev/docs/environment-setup) ou [Expo CLI](https://docs.expo.dev/)
* Android Studio / Xcode para emuladores.

**2. Clone o repositório:**
```bash
git clone [https://github.com/seu-usuario/techfauna-mobile.git](https://github.com/seu-usuario/techfauna-mobile.git)
cd techfauna-mobile