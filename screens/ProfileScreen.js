import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import * as Clipboard from 'expo-clipboard';
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
const EditProfileModal = ({ visible, onClose, user, onSave, organizationName, userRole }) => {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Sincroniza os valores quando o modal abre ou os dados mudam
  useEffect(() => {
    if (visible) {
      setName(user?.user_metadata?.name || user?.user_metadata?.full_name || '');
      setCompany(user?.user_metadata?.company || organizationName || '');
      setRole(user?.user_metadata?.role || userRole || '');
    }
  }, [visible, user, organizationName, userRole]);

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

// Componente do Modal de Código da Empresa (para funcionários)
const CompanyCodeModal = ({ visible, onClose, user, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('code'); // 'code' ou 'invites'
  const [companyCode, setCompanyCode] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [processingInviteId, setProcessingInviteId] = useState(null);

  // Busca convites pendentes quando o modal abre ou troca para a aba de convites
  useEffect(() => {
    if (visible && activeTab === 'invites' && user?.email) {
      fetchPendingInvites();
    }
  }, [visible, activeTab, user?.email]);

  const fetchPendingInvites = async () => {
    setLoadingInvites(true);
    try {
      const { data, error } = await supabase
        .from('company_invites')
        .select(`
          id,
          cargo,
          status,
          created_at,
          company_owner_id
        `)
        .eq('invited_email', user?.email)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Busca os nomes das empresas para cada convite
      const invitesWithOrgNames = await Promise.all(
        (data || []).map(async (invite) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', invite.company_owner_id)
            .single();

          if (profile?.organization_id) {
            const { data: org } = await supabase
              .from('organizations')
              .select('id, name')
              .eq('id', profile.organization_id)
              .single();
            return { ...invite, organization: org };
          }
          return { ...invite, organization: null };
        })
      );

      setPendingInvites(invitesWithOrgNames.filter(inv => inv.organization));
    } catch (error) {
      console.error('Erro ao buscar convites:', error);
    } finally {
      setLoadingInvites(false);
    }
  };

  const handleAcceptInvite = async (invite) => {
    if (!invite.organization?.id) return;

    setProcessingInviteId(invite.id);
    try {
      // Atualiza o status do convite para aceito
      const { error: inviteError } = await supabase
        .from('company_invites')
        .update({
          status: 'accepted',
          invited_user_id: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', invite.id);

      if (inviteError) throw inviteError;

      // Atualiza o profile do usuário com o organization_id
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          organization_id: invite.organization.id,
          user_role: 'employee'
        })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      // Atualiza os metadados do usuário
      await supabase.auth.updateUser({
        data: { organization_id: invite.organization.id }
      });

      Alert.alert('Sucesso', `Você agora faz parte da empresa "${invite.organization.name}".`);
      onSuccess(invite.organization.name);
      onClose();
    } catch (error) {
      Alert.alert('Erro', error?.message || 'Não foi possível aceitar o convite.');
    } finally {
      setProcessingInviteId(null);
    }
  };

  const handleRejectInvite = async (invite) => {
    setProcessingInviteId(invite.id);
    try {
      const { error } = await supabase
        .from('company_invites')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', invite.id);

      if (error) throw error;

      // Remove o convite da lista local
      setPendingInvites(prev => prev.filter(inv => inv.id !== invite.id));
      Alert.alert('Convite recusado', 'O convite foi recusado.');
    } catch (error) {
      Alert.alert('Erro', error?.message || 'Não foi possível recusar o convite.');
    } finally {
      setProcessingInviteId(null);
    }
  };

  const handleLinkCompany = async () => {
    const trimmedCode = companyCode.trim().toUpperCase();
    if (!trimmedCode) {
      Alert.alert('Campo obrigatório', 'Por favor, informe o código da empresa.');
      return;
    }

    setIsLinking(true);
    try {
      // Busca a organização pelo código
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('code', trimmedCode)
        .single();

      if (orgError || !orgData) {
        throw new Error('Código de empresa inválido. Verifique com o administrador.');
      }

      // Atualiza o profile do usuário com o organization_id
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ organization_id: orgData.id })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      // Atualiza os metadados do usuário
      await supabase.auth.updateUser({
        data: { organization_id: orgData.id }
      });

      Alert.alert('Sucesso', `Você foi vinculado à empresa "${orgData.name}".`);
      onSuccess(orgData.name);
      setCompanyCode('');
      onClose();
    } catch (error) {
      Alert.alert('Erro', error?.message || 'Não foi possível vincular à empresa.');
    } finally {
      setIsLinking(false);
    }
  };

  const renderInviteCard = (invite) => (
    <View key={invite.id} style={styles.inviteCard}>
      <View style={styles.inviteInfo}>
        <Text style={styles.inviteCompanyName}>{invite.organization?.name}</Text>
        {invite.cargo && (
          <Text style={styles.inviteCargo}>Cargo: {invite.cargo}</Text>
        )}
        <Text style={styles.inviteDate}>
          Enviado em: {new Date(invite.created_at).toLocaleDateString('pt-BR')}
        </Text>
      </View>
      <View style={styles.inviteActions}>
        <TouchableOpacity
          style={[styles.inviteButton, styles.acceptButton]}
          onPress={() => handleAcceptInvite(invite)}
          disabled={processingInviteId === invite.id}
        >
          {processingInviteId === invite.id ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <MaterialCommunityIcons name="check" size={20} color="#FFF" />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.inviteButton, styles.rejectButton]}
          onPress={() => handleRejectInvite(invite)}
          disabled={processingInviteId === invite.id}
        >
          <MaterialCommunityIcons name="close" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Vincular Empresa</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Abas */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'code' && styles.tabActive]}
              onPress={() => setActiveTab('code')}
            >
              <MaterialCommunityIcons
                name="key-variant"
                size={18}
                color={activeTab === 'code' ? COLORS.primary : COLORS.textMuted}
              />
              <Text style={[styles.tabText, activeTab === 'code' && styles.tabTextActive]}>
                Código
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'invites' && styles.tabActive]}
              onPress={() => setActiveTab('invites')}
            >
              <MaterialCommunityIcons
                name="email-outline"
                size={18}
                color={activeTab === 'invites' ? COLORS.primary : COLORS.textMuted}
              />
              <Text style={[styles.tabText, activeTab === 'invites' && styles.tabTextActive]}>
                Convites
              </Text>
              {pendingInvites.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingInvites.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.tabContent}>
            {activeTab === 'code' ? (
              <>
                <Text style={styles.companyCodeDescription}>
                  Insira o código fornecido pelo administrador da sua empresa para se vincular.
                </Text>

                <Text style={styles.inputLabel}>Código da Empresa</Text>
                <TextInput
                  style={[styles.input, styles.companyCodeInput]}
                  placeholder="Ex: ABC123"
                  placeholderTextColor={COLORS.textMuted}
                  value={companyCode}
                  onChangeText={(text) => setCompanyCode(text.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={10}
                />

                <TouchableOpacity
                  style={[styles.primaryButton, isLinking && styles.primaryButtonDisabled]}
                  onPress={handleLinkCompany}
                  disabled={isLinking}
                >
                  {isLinking ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.primaryButtonLabel}>Vincular</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.companyCodeDescription}>
                  Convites pendentes enviados para seu email.
                </Text>

                {loadingInvites ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color={COLORS.primary} size="large" />
                    <Text style={styles.loadingText}>Carregando convites...</Text>
                  </View>
                ) : pendingInvites.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons name="email-off-outline" size={48} color={COLORS.textMuted} />
                    <Text style={styles.emptyText}>Nenhum convite pendente</Text>
                    <Text style={styles.emptyHint}>
                      Peça ao administrador da empresa para enviar um convite para {user?.email}
                    </Text>
                  </View>
                ) : (
                  pendingInvites.map(renderInviteCard)
                )}
              </>
            )}
          </ScrollView>
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
  const [isCompanyCodeModalVisible, setIsCompanyCodeModalVisible] = useState(false);
  const [organizationName, setOrganizationName] = useState('');
  const [organizationCode, setOrganizationCode] = useState('');
  const [showCode, setShowCode] = useState(false);

  const userName =
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')?.[0] ||
    'Colaborador';

  const role = user?.user_metadata?.role || 'Colaborador';
  const userType = user?.user_metadata?.user_type || 'employee'; // Padrão é funcionário

  const fetchProfileData = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksData, checklistsData] = await Promise.all([
        listTasks({ assignedTo: user?.id }),
        listChecklists({ performedBy: user?.id }),
      ]);

      setTasks(tasksData || []);
      setChecklists(checklistsData || []);

      // Busca o nome e código da organização do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user?.id)
        .single();

      if (profile?.organization_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('name, code')
          .eq('id', profile.organization_id)
          .single();

        setOrganizationName(org?.name || '');
        setOrganizationCode(org?.code || '');
      }
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
          {organizationName ? (
            <Text style={styles.companyName}>{organizationName}</Text>
          ) : null}
          <Text style={styles.userMeta}>{role}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* CARD DE PONTOS E BONIFICAÇÕES (apenas para funcionários) */}
        {userType !== 'owner' && (
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
        )}

        {/* CARD DE EMPRESA (apenas para funcionários - não donos) */}
        {userType !== 'owner' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Empresa</Text>

            {organizationName ? (
              <View style={styles.companyInfoContainer}>
                <View style={styles.companyIconContainer}>
                  <MaterialCommunityIcons name="domain" size={32} color={COLORS.primary} />
                </View>
                <View style={styles.companyInfoText}>
                  <Text style={styles.companyLinkedLabel}>Vinculado à:</Text>
                  <Text style={styles.companyLinkedName}>{organizationName}</Text>
                </View>
              </View>
            ) : (
              <>
                <View style={styles.companyInfoContainer}>
                  <View style={[styles.companyIconContainer, { backgroundColor: '#FFF5E6' }]}>
                    <MaterialCommunityIcons name="domain-off" size={32} color="#F5A623" />
                  </View>
                  <View style={styles.companyInfoText}>
                    <Text style={styles.companyNotLinkedLabel}>Sem empresa vinculada</Text>
                    <Text style={styles.companyNotLinkedHint}>Adicione um código ou aceite um convite</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() => setIsCompanyCodeModalVisible(true)}
                >
                  <MaterialCommunityIcons
                    name="link-plus"
                    size={22}
                    color={COLORS.primary}
                  />
                  <Text style={styles.actionLabel}>Vincular à empresa</Text>
                  <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textMuted} />
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* CARD DE CÓDIGO DA EMPRESA (apenas para donos) */}
        {userType === 'owner' && organizationCode && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Código da Empresa</Text>

            <View style={styles.companyCodeCard}>
              <View style={styles.companyCodeHeader}>
                <View style={[styles.companyIconContainer, { backgroundColor: '#E8F5E9' }]}>
                  <MaterialCommunityIcons name="key-variant" size={28} color={COLORS.primary} />
                </View>
                <View style={styles.companyCodeInfo}>
                  <Text style={styles.companyCodeLabel}>Compartilhe este código com seus funcionários:</Text>
                </View>
              </View>

              <View style={styles.codeContainer}>
                <Text style={styles.codeText}>
                  {showCode ? organizationCode : '••••••••'}
                </Text>
                <TouchableOpacity
                  style={styles.codeToggleButton}
                  onPress={() => setShowCode(!showCode)}
                >
                  <MaterialCommunityIcons
                    name={showCode ? 'eye-off' : 'eye'}
                    size={22}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.codeActions}>
                <TouchableOpacity
                  style={styles.copyCodeButton}
                  onPress={async () => {
                    // Copia o código para a área de transferência
                    await Clipboard.setStringAsync(organizationCode);
                    Alert.alert('Copiado!', 'Código copiado para a área de transferência.');
                  }}
                >
                  <MaterialCommunityIcons name="content-copy" size={18} color={COLORS.surface} />
                  <Text style={styles.copyCodeButtonText}>Copiar Código</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.codeHint}>
                Os funcionários podem usar este código na tela de perfil para se vincular à sua empresa.
              </Text>
            </View>
          </View>
        )}

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

      {/* Renderiza o Modal de Edição */}
      <EditProfileModal
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        user={user}
        onSave={handleUpdateUserInContext} // Atualiza o usuário no contexto
        organizationName={organizationName}
        userRole={role}
      />

      {/* Renderiza o Modal de Código da Empresa */}
      <CompanyCodeModal
        visible={isCompanyCodeModalVisible}
        onClose={() => setIsCompanyCodeModalVisible(false)}
        user={user}
        onSuccess={(newOrgName) => setOrganizationName(newOrgName)}
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
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 4,
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
  // --- Estilos do Card de Empresa ---
  companyInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F6F2',
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  companyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#E1EDE4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyInfoText: {
    flex: 1,
  },
  companyLinkedLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  companyLinkedName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  companyNotLinkedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F5A623',
  },
  companyNotLinkedHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  // --- Estilos do Modal de Código da Empresa ---
  companyCodeDescription: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginBottom: 16,
  },
  companyCodeInput: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 2,
  },
  // --- Estilos das Abas ---
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F6FA',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabActive: {
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  tabContent: {
    maxHeight: 350,
  },
  badge: {
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  // --- Estilos dos Cards de Convite ---
  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F6F2',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  inviteInfo: {
    flex: 1,
  },
  inviteCompanyName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  inviteCargo: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
    marginBottom: 2,
  },
  inviteDate: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  inviteActions: {
    flexDirection: 'row',
    gap: 8,
  },
  inviteButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: COLORS.primary,
  },
  rejectButton: {
    backgroundColor: COLORS.danger,
  },
  // --- Estilos de Loading e Empty States ---
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 8,
  },
  emptyHint: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  // --- Estilos do Card de Código da Empresa (Owner) ---
  companyCodeCard: {
    marginTop: 8,
  },
  companyCodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  companyCodeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  companyCodeLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F4F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  codeText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 4,
    flex: 1,
    textAlign: 'center',
  },
  codeToggleButton: {
    padding: 8,
  },
  codeActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  copyCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  copyCodeButtonText: {
    color: COLORS.surface,
    fontSize: 15,
    fontWeight: '600',
  },
  codeHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
});

export default ProfileScreen;