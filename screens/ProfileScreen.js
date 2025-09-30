import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
// Lembre-se: Para usar ícones aqui, instale 'react-native-vector-icons'
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const COLORS = {
  cactusGreen: '#5A8B63',
  iceWhite: '#F0F4F7',
  gray: '#A9A9A9',
  darkGray: '#4B4B4B',
  red: '#C0392B',
};

const FONT_STYLES = {
  title: {
    fontFamily: 'Roboto',
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  subtitle: {
    fontFamily: 'Roboto',
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  text: {
    fontFamily: 'Roboto',
    fontSize: 16,
    color: COLORS.gray,
  },
};

const ProfileScreen = ({ navigation, onLogout }) => {
  // Dados MOCKADOS do Usuário
  const [user, setUser] = useState({
    name: 'Davi Viana',
    role: 'Engenheiro Ambiental',
    company: 'TechFauna',
    email: 'davi.viana@techfauna.com',
  });

  // Novos Dados MOCKADOS de Pontuação e Nível
  const [userPoints, setUserPoints] = useState(1250);
  const [userLevel, setUserLevel] = useState('Nível 3 (Guardião)');
  const [rewards, setRewards] = useState([
      { id: 1, name: 'Cesta Básica', pointsRequired: 500 },
      { id: 2, name: 'Folga Remunerada', pointsRequired: 5000 },
      { id: 3, name: 'Bônus Salarial', pointsRequired: 10000 },
  ]);

  const handleEditProfile = () => {
    console.log('Navegar para a tela de Edição de Perfil');
  };

  const handleSettings = () => {
    console.log('Navegar para a tela de Configurações');
  };
  
  const handleOpenRewards = () => {
      console.log('Navegar para a tela de Resgate de Bonificações.');
      Alert.alert('Resgatar Recompensas', 'Esta ação levará à tela de resgate de bonificações.');
  };

  const handleLogout = () => {
    console.log('Realizando logout e voltando para a tela de Login...');
    if (onLogout) {
        onLogout();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollViewContainer}>
        <Text style={styles.screenTitle}>Meu Perfil</Text>

        {/* CARTÃO DE INFORMAÇÕES PESSOAIS */}
        <View style={styles.card}>
          <View style={styles.profilePicPlaceholder} />
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userInfo}>{user.role}</Text>
          <Text style={styles.userInfo}>{user.company}</Text>
        </View>

        {/* NOVO CARTÃO DE PONTUAÇÃO E BONIFICAÇÕES */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pontuação e Nível</Text>
          
          <View style={styles.pointsRow}>
              {/* Pontos */}
              <View style={styles.pointsColumn}>
                  <Text style={styles.pointsValue}>{userPoints.toLocaleString('pt-BR')}</Text>
                  <Text style={styles.pointsLabel}>Pontos Acumulados</Text>
              </View>
              {/* Nível */}
              <View style={styles.pointsColumn}>
                  <Text style={styles.pointsValueLevel}>{userLevel}</Text>
                  <Text style={styles.pointsLabel}>Nível Atual</Text>
              </View>
          </View>

          <Text style={styles.rewardsTitle}>Bonificações Disponíveis</Text>
          {rewards.map(reward => {
              const isAvailable = userPoints >= reward.pointsRequired;
              const color = isAvailable ? COLORS.cactusGreen : COLORS.gray;

              return (
                  <View key={reward.id} style={styles.rewardItem}>
                      <Text style={styles.rewardName}>{reward.name}</Text>
                      <Text style={[styles.rewardPoints, { color }]}>
                          {reward.pointsRequired} pts
                      </Text>
                  </View>
              );
          })}

          <TouchableOpacity style={styles.rewardButton} onPress={handleOpenRewards}>
              <Text style={styles.rewardButtonText}>Resgatar Bonificações</Text>
          </TouchableOpacity>
        </View>

        {/* CONTÊINER DE AÇÕES */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleEditProfile}>
            <Text style={styles.actionButtonText}>Editar Perfil</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleSettings}>
            <Text style={styles.actionButtonText}>Configurações</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={handleLogout}>
            <Text style={[styles.actionButtonText, styles.logoutButtonText]}>Sair</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.iceWhite,
  },
  scrollViewContainer: {
    padding: 20,
  },
  screenTitle: {
    ...FONT_STYLES.title,
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profilePicPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  userName: {
    ...FONT_STYLES.subtitle,
    color: COLORS.darkGray,
  },
  userInfo: {
    ...FONT_STYLES.text,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 2,
  },
  // NOVOS ESTILOS PARA PONTUAÇÃO
  cardTitle: {
    ...FONT_STYLES.subtitle,
    color: COLORS.darkGray,
    marginBottom: 15,
    alignSelf: 'flex-start',
  },
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  pointsColumn: {
    alignItems: 'center',
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.cactusGreen,
  },
  pointsValueLevel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  pointsLabel: {
    ...FONT_STYLES.text,
    fontSize: 12,
    color: COLORS.gray,
  },
  rewardsTitle: {
    ...FONT_STYLES.subtitle,
    color: COLORS.darkGray,
    marginTop: 10,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  rewardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.iceWhite,
    paddingHorizontal: 5,
  },
  rewardName: {
    ...FONT_STYLES.text,
    color: COLORS.darkGray,
    fontWeight: 'bold',
  },
  rewardPoints: {
    ...FONT_STYLES.text,
    fontWeight: 'bold',
  },
  rewardButton: {
    backgroundColor: COLORS.cactusGreen,
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  rewardButtonText: {
    color: 'white',
    ...FONT_STYLES.subtitle,
    fontSize: 16,
  },
  // FIM DOS NOVOS ESTILOS
  actionsContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  actionButtonText: {
    ...FONT_STYLES.text,
    marginLeft: 10,
    color: COLORS.darkGray,
  },
  logoutButton: {
    backgroundColor: COLORS.red, // Mudança para cor de destaque no Sair
    borderBottomWidth: 0,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
