import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';

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

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState({
    name: 'Davi Viana',
    role: 'Engenheiro Ambiental',
    company: 'TechFauna',
    email: 'davi.viana@techfauna.com',
  });

  const handleEditProfile = () => {
    console.log('Navegar para a tela de Edição de Perfil');
  };

  const handleSettings = () => {
    console.log('Navegar para a tela de Configurações');
  };

  const handleLogout = () => {
    console.log('Realizar logout e navegar para a tela de Login');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.screenTitle}>Meu Perfil</Text>

      <View style={styles.card}>
        <View style={styles.profilePicPlaceholder}>
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userInfo}>{user.role}</Text>
        <Text style={styles.userInfo}>{user.company}</Text>
      </View>

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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.iceWhite,
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
  },
  actionsContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    backgroundColor: COLORS.cactusGreen,
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