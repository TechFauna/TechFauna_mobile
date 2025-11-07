import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal, // Importado
  TextInput, // Importado
  ActivityIndicator, // Importado
  Linking, // Importado
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { listChecklists, listTasks } from '../utils/zooService';
import supabase from '../config/supabaseClient'; // Importado para atualização do perfil

const COLORS = {
  background: '#F7F9FC',
  surface: '#FFFFFF',
  primary: '#5A8B63',
  danger: '#E74C3C',
  border: '#E3E9F3',
  text: '#2F3542',
  textMuted: '#77838F',
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
};

// Componente do Modal de Edição
const EditProfileModal = ({ visible, onClose, user, onSave }) => {
  const [name, setName] = useState(user?.user_metadata?.name || user?.user_metadata?.full_name || '');
  const [company, setCompany] = useState(user?.user_metadata?.company || '');
  const [role, setRole] = useState(user?.user_metadata?.role || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Campo obrigatório', 'Por favor, informe seu nome.');
      return;
    }

    setIsUpdating(true);
    try {
      // Atualiza os metadados do usuário no Supabase
      const { data, error } = await supabase.auth.updateUser({
        data: {
          name: name.trim(),
          company: company.trim() || null,
          role: role.trim() || null,
        },
      });

      if (error) throw error;

      Alert.alert('Sucesso', 'Seu perfil foi atualizado.');
      onSave(data.user); // Passa o usuário atualizado de volta
      onClose();
    } catch (error) {
      Alert.alert('Erro ao atualizar', error?.message || 'Não foi possível salvar as alterações.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editar Perfil</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView>
            <Text style={styles.inputLabel}>Nome Completo</Text>
            <TextInput
              style={styles.input}
              placeholder="Seu nome"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.inputLabel}>Empresa</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome da empresa (opcional)"
              value={company}
              onChangeText={setCompany}
            />

            <Text style={styles.inputLabel}>Função</Text>
            <TextInput
              style={styles.input}
              placeholder="Sua função (opcional)"
              value={role}
              onChangeText={setRole}
            />
          </ScrollView>

          <TouchableOpacity
            style={[styles.primaryButton, isUpdating && styles.primaryButtonDisabled]}
            onPress={handleSave}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryButtonLabel}>Salvar Alterações</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Componente da Tela de Perfil Principal
const ProfileScreen = ({ navigation, onLogout }) => {
  // Use o setUser do AuthContext para atualizar os dados do usuário na UI
  const { user, setUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const userName =
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')?.[0] ||
    'Colaborador';

  const role = user?.user_metadata?.role || 'Equipe TechFauna';
  const company = user?.user_metadata?.company || 'TechFauna';

  const fetchProfileData = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksData, checklistsData] = await Promise.all([
        listTasks({ assignedTo: user?.id }),
        listChecklists({ performedBy: user?.id }),
      ]);

      setTasks(tasksData || []);
      setChecklists(checklistsData || []);
    } catch (error) {
      Alert.alert('Falha ao carregar dados', error?.message || 'Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [fetchProfileData])
  );

  const taskSummary = useMemo(() => {
    const completed = tasks.filter((task) => task.status === 'completed').length;
    return {
      completed,
    };
  }, [tasks]);

  const checklistSummary = useMemo(() => {
    return {
      total: checklists.length,
    };
  }, [checklists]);

  // LÓGICA DE PONTOS E BONIFICAÇÕES
  const rewardTier = useMemo(() => {
    const totalPoints = taskSummary.completed + checklistSummary.total;
    let tier = {
      level: 'Bronze',
      color: COLORS.bronze,
      bonuses: ['Emblema inicial'],
    };

    if (totalPoints > 30) {
      tier = {
        level: 'Ouro',
        color: COLORS.gold,
        bonuses: [
          'Emblema Ouro',
          '15% Desconto na loja de brindes',
          'Acesso prioritário ao suporte',
        ],
      };
    } else if (totalPoints > 10) {
      tier = {
        level: 'Prata',
        color: COLORS.silver,
        bonuses: ['Emblema Prata', '5% Desconto na loja de brindes'],
      };
    }

    return { ...tier, totalPoints };
  }, [taskSummary.completed, checklistSummary.total]);

  // AÇÃO DE CONTATO AO SUPORTE
  const handleSupportContact = async () => {
    const email = 'suporte@techfauna.com.br';
    const subject = 'Suporte Aplicativo TechFauna';
    const url = `mailto:${email}?subject=${subject}`;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Erro', 'Não foi possível abrir o aplicativo de e-mail.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um problema ao tentar contatar o suporte.');
    }
  };

  const handleLogout = async () => {
    try {
      await onLogout?.();
    } catch (error) {
      Alert.alert('Erro ao sair', error?.message || 'Nao foi possivel finalizar a sessao.');
    }
  };

  const handleUpdateUserInContext = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerCard}>
          <View style={[styles.avatar, { borderColor: rewardTier.color }]}>
            <Text style={styles.avatarText}>{userName?.[0]?.toUpperCase() || 'T'}</Text>
          </View>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userMeta}>{role}</Text>
          <Text style={styles.userMeta}>{company}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* CARD DE PONTOS E BONIFICAÇÕES */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pontos e Bonificações</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Pontos Totais</Text>
              <Text style={styles.infoValue}>{rewardTier.totalPoints}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Nível Atual</Text>
              <View style={styles.levelRow}>
                <MaterialCommunityIcons name="shield-star" size={20} color={rewardTier.color} />
                <Text style={[styles.infoValue, { fontSize: 20, color: rewardTier.color }]}>
                  {rewardTier.level}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.bonusTitle}>Bonificações Ativas:</Text>
          {rewardTier.bonuses.map((bonus, index) => (
            <View key={index} style={styles.bonusRow}>
              <MaterialCommunityIcons name="check-decagram" size={18} color={COLORS.primary} />
              <Text style={styles.bonusText}>{bonus}</Text>
            </View>
          ))}
        </View>

        {/* CARD DE PREFERÊNCIAS (COM SUPORTE E EDIÇÃO) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Preferências e Suporte</Text>
          
          {/* Ação de Editar Perfil */}
          <TouchableOpacity 
            style={styles.actionRow}
            onPress={() => setIsEditModalVisible(true)} // Abre o modal
          >
            <MaterialCommunityIcons name="account-edit" size={22} color={COLORS.primary} />
            <Text style={styles.actionLabel}>Editar dados pessoais</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Ação de Suporte */}
          <TouchableOpacity 
            style={styles.actionRow}
            onPress={handleSupportContact} // Chama a função de e-mail
          >
            <MaterialCommunityIcons name="email-fast-outline" size={22} color={COLORS.primary} />
            <Text style={styles.actionLabel}>Contatar Suporte</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('Notifications')}
          >
            <MaterialCommunityIcons name="bell-outline" size={22} color={COLORS.primary} />
            <Text style={styles.actionLabel}>Notificações e lembretes</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={loading}>
          <MaterialCommunityIcons name="logout" size={22} color="#FFF" />
          <Text style={styles.logoutLabel}>{loading ? 'Saindo...' : 'Sair da conta'}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Renderiza o Modal */}
      <EditProfileModal
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        user={user}
        onSave={handleUpdateUserInContext} // Atualiza o usuário no contexto
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: 20,
    paddingBottom: 100,
    gap: 20,
  },
  headerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E1EDE4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 3, // Borda para o nível
    borderColor: COLORS.bronze, // Cor padrão
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  userMeta: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 6,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
    gap: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoBox: {
    flex: 1,
    minWidth: 120,
    backgroundColor: '#F1F6F2',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bonusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 8,
  },
  bonusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bonusText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  actionLabel: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.danger,
    paddingVertical: 16,
    borderRadius: 20,
    gap: 8,
  },
  logoutLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  // --- Estilos do Modal ---
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F3F6FA',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 12,
  },
  primaryButton: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ProfileScreen;