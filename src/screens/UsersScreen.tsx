import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import StatCard from '../components/StatCard';
import GlassCard from '../components/GlassCard';
import InputField from '../components/InputField';
import Button from '../components/Button';
import Badge, { getStatusVariant } from '../components/Badge';
import ModalWrapper from '../components/ModalWrapper';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { Colors } from '../theme/colors';

interface Plan {
  _id: string;
  name: string;
  code: string;
}

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'user';
  companyName?: string;
  phone?: string;
  plan?: Plan | null;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  stats?: {
    contactsCount: number;
    groupsCount: number;
    templatesCount: number;
    campaignsCount: number;
    sentMessagesCount: number;
  };
}

export default function UsersScreen() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // User Activity Inspector State
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  const [userActivity, setUserActivity] = useState<any>(null);
  const [activityTab, setActivityTab] = useState<'campaigns' | 'contacts' | 'templates' | 'groups' | 'logs'>('campaigns');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as string,
    companyName: '',
    phone: '',
    plan: '' as string,
    isActive: true,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;
      const [uRes, pRes] = await Promise.all([api.get('/users', { params }), api.get('/plans')]);
      setUsers(uRes.data.data);
      setPlans(pRes.data.data);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || 'Failed to fetch users' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, roleFilter]);

  const viewUserActivity = async (u: UserItem) => {
    setSelectedUser(u);
    setIsActivityOpen(true);
    setActivityLoading(true);
    setActivityTab('campaigns');
    try {
      const res = await api.get(`/users/${u._id}/activity`);
      setUserActivity(res.data.data);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || 'Failed to load user activity' });
    } finally {
      setActivityLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      Toast.show({ type: 'error', text1: 'Fill all required fields' });
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/users', formData);
      Toast.show({ type: 'success', text1: 'Tenant user created' });
      setIsCreateOpen(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'user',
        companyName: '',
        phone: '',
        plan: '',
        isActive: true,
      });
      fetchUsers();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || 'Failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (u: UserItem) => {
    setSelectedUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      companyName: u.companyName || '',
      phone: u.phone || '',
      plan: u.plan?._id || '',
      isActive: u.isActive,
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        companyName: formData.companyName,
        phone: formData.phone,
        plan: formData.plan || null,
        isActive: formData.isActive,
      };
      if (formData.password) payload.password = formData.password;
      await api.put(`/users/${selectedUser._id}`, payload);
      Toast.show({ type: 'success', text1: 'User updated' });
      setIsEditOpen(false);
      fetchUsers();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || 'Failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (u: UserItem) => {
    Alert.alert('Delete User', `Delete tenant ${u.name} (${u.email}) and all their campaigns/contacts?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/users/${u._id}`);
            Toast.show({ type: 'success', text1: 'User deleted' });
            fetchUsers();
          } catch (err: any) {
            Toast.show({ type: 'error', text1: err.response?.data?.message || 'Failed' });
          }
        },
      },
    ]);
  };

  const totalUsers = users.length;
  const superAdminCount = users.filter((u) => u.role === 'super_admin').length;
  const activeCount = users.filter((u) => u.isActive).length;

  const roleLabel = (r: string) => (r === 'super_admin' ? 'Super Admin' : r === 'admin' ? 'Admin' : 'Tenant User');
  const roleVariant = (r: string) => (r === 'super_admin' ? ('primary' as const) : r === 'admin' ? ('info' as const) : ('warning' as const));

  const renderUser = ({ item: u }: { item: UserItem }) => (
    <View style={styles.userRow}>
      <View style={[styles.avatar, u.role === 'super_admin' && styles.avatarSuper]}>
        <Text style={styles.avatarText}>{u.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.userName}>{u.name}</Text>
          <Badge text={roleLabel(u.role)} variant={roleVariant(u.role)} />
          <Badge text={u.isActive ? 'Active' : 'Inactive'} variant={u.isActive ? 'success' : 'danger'} />
        </View>
        <Text style={styles.userEmail}>{u.email}</Text>
        <View style={styles.metricsChipRow}>
          <Text style={styles.metricChipText}>Contacts: {u.stats?.contactsCount || 0}</Text>
          <Text style={styles.metricDot}>•</Text>
          <Text style={styles.metricChipText}>Campaigns: {u.stats?.campaignsCount || 0}</Text>
          <Text style={styles.metricDot}>•</Text>
          <Text style={styles.metricChipText}>Templates: {u.stats?.templatesCount || 0}</Text>
          <Text style={styles.metricDot}>•</Text>
          <Text style={[styles.metricChipText, { color: '#a855f7' }]}>Msgs Sent: {u.stats?.sentMessagesCount || 0}</Text>
        </View>
      </View>

      <View style={styles.actionsCol}>
        <TouchableOpacity
          style={styles.activityBtn}
          onPress={() => viewUserActivity(u)}
        >
          <Ionicons name="stats-chart" size={15} color={Colors.accent} />
          <Text style={styles.activityBtnText}>Activity</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => openEditModal(u)} style={styles.actionIconBtn}>
          <Ionicons name="pencil" size={16} color={Colors.primaryLight} />
        </TouchableOpacity>

        {currentUser?.id !== u._id && (
          <TouchableOpacity onPress={() => handleDelete(u)} style={styles.actionIconBtn}>
            <Ionicons name="trash-outline" size={16} color={Colors.danger} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(u) => u._id}
        contentContainerStyle={styles.content}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          fetchUsers();
        }}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Tenant Users & Activity</Text>
                <Text style={styles.subtitle}>Super Admin oversight of tenant accounts, campaigns, templates, and contact metrics.</Text>
              </View>
              <Button
                title="Create User"
                small
                onPress={() => {
                  setFormData({
                    name: '',
                    email: '',
                    password: '',
                    role: 'user',
                    companyName: '',
                    phone: '',
                    plan: plans[0]?._id || '',
                    isActive: true,
                  });
                  setIsCreateOpen(true);
                }}
                icon={<Ionicons name="person-add" size={14} color="#fff" />}
              />
            </View>

            <View style={styles.statsGrid}>
              <StatCard label="Total Tenants" value={totalUsers} icon="people-outline" color={Colors.primary} bgColor={Colors.statPrimary} />
              <StatCard label="Super Admins" value={superAdminCount} icon="shield-checkmark-outline" color="#a855f7" bgColor="rgba(139,92,246,0.15)" />
              <StatCard label="Active Accounts" value={activeCount} icon="checkmark-circle-outline" color={Colors.success} bgColor={Colors.statGreen} />
            </View>

            <GlassCard style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <InputField
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search tenants by name, email, company..."
                    onSubmitEditing={fetchUsers}
                    icon={<Ionicons name="search" size={18} color={Colors.textSecondary} />}
                  />
                </View>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                {[
                  { val: '', label: 'All Roles' },
                  { val: 'super_admin', label: 'Super Admin' },
                  { val: 'admin', label: 'Admin' },
                  { val: 'user', label: 'Tenant User' },
                ].map((r) => (
                  <TouchableOpacity
                    key={r.val}
                    onPress={() => setRoleFilter(r.val)}
                    style={[styles.filterChip, roleFilter === r.val && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterText, roleFilter === r.val && styles.filterTextActive]}>{r.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </GlassCard>
          </>
        }
        renderItem={renderUser}
        ListEmptyComponent={
          loading ? (
            <LoadingSpinner />
          ) : (
            <GlassCard>
              <EmptyState icon="people-outline" title="No users found" subtitle="Try clearing search filters or create a new user." />
            </GlassCard>
          )
        }
      />

      {/* User Activity Inspector Modal */}
      <ModalWrapper
        visible={isActivityOpen}
        onClose={() => setIsActivityOpen(false)}
        title={`Tenant Activity: ${selectedUser?.name || ''}`}
      >
        {activityLoading ? (
          <LoadingSpinner />
        ) : userActivity ? (
          <View style={{ gap: 16 }}>
            {/* User Overview Box */}
            <View style={styles.activitySummaryBox}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={styles.actTitle}>{userActivity.user.name}</Text>
                  <Text style={styles.actSubtitle}>{userActivity.user.email} • {userActivity.user.companyName || 'No Company'}</Text>
                </View>
                <Badge text={userActivity.user.plan?.name || 'Standard'} variant="primary" />
              </View>

              {/* Stats Counters */}
              <View style={styles.actCountersGrid}>
                <View style={styles.actCounterItem}>
                  <Text style={styles.actCounterVal}>{userActivity.summary.totalContacts}</Text>
                  <Text style={styles.actCounterLbl}>Contacts</Text>
                </View>
                <View style={styles.actCounterItem}>
                  <Text style={styles.actCounterVal}>{userActivity.summary.totalGroups}</Text>
                  <Text style={styles.actCounterLbl}>Groups</Text>
                </View>
                <View style={styles.actCounterItem}>
                  <Text style={styles.actCounterVal}>{userActivity.summary.totalTemplates}</Text>
                  <Text style={styles.actCounterLbl}>Templates</Text>
                </View>
                <View style={styles.actCounterItem}>
                  <Text style={styles.actCounterVal}>{userActivity.summary.totalCampaigns}</Text>
                  <Text style={styles.actCounterLbl}>Campaigns</Text>
                </View>
                <View style={styles.actCounterItem}>
                  <Text style={[styles.actCounterVal, { color: '#10b981' }]}>{userActivity.summary.deliveredCount}</Text>
                  <Text style={styles.actCounterLbl}>Delivered</Text>
                </View>
              </View>
            </View>

            {/* Navigation Tabs Inside Inspector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
              {[
                { id: 'campaigns', label: `Campaigns (${userActivity.campaigns?.length || 0})` },
                { id: 'contacts', label: `Contacts (${userActivity.contacts?.length || 0})` },
                { id: 'templates', label: `Templates (${userActivity.templates?.length || 0})` },
                { id: 'groups', label: `Groups (${userActivity.groups?.length || 0})` },
                { id: 'logs', label: `Logs (${userActivity.recentLogs?.length || 0})` },
              ].map((t) => (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => setActivityTab(t.id as any)}
                  style={[styles.actTab, activityTab === t.id && styles.actTabActive]}
                >
                  <Text style={[styles.actTabText, activityTab === t.id && styles.actTabTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Tab Contents */}
            <View style={styles.actContentBox}>
              {activityTab === 'campaigns' && (
                <ScrollView style={{ maxHeight: 280 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  {userActivity.campaigns?.map((c: any) => (
                    <View key={c._id} style={styles.actItemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.actItemName}>{c.name}</Text>
                        <Text style={styles.actItemSub}>Template: {c.template?.name || '—'} • Total: {c.totalMessages}</Text>
                      </View>
                      <Badge text={c.status} variant={getStatusVariant(c.status)} />
                    </View>
                  ))}
                  {userActivity.campaigns?.length === 0 && (
                    <Text style={styles.actEmptyText}>No campaigns created by this user.</Text>
                  )}
                </ScrollView>
              )}

              {activityTab === 'contacts' && (
                <ScrollView style={{ maxHeight: 280 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  {userActivity.contacts?.map((ct: any) => (
                    <View key={ct._id} style={styles.actItemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.actItemName}>{ct.name}</Text>
                        <Text style={styles.actItemSub}>{ct.phone} • {ct.email || 'No email'}</Text>
                      </View>
                      {ct.groups && ct.groups.length > 0 && (
                        <Badge text={ct.groups[0]?.name || 'Group'} variant="info" />
                      )}
                    </View>
                  ))}
                  {userActivity.contacts?.length === 0 && (
                    <Text style={styles.actEmptyText}>No contacts added by this user.</Text>
                  )}
                </ScrollView>
              )}

              {activityTab === 'templates' && (
                <ScrollView style={{ maxHeight: 280 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  {userActivity.templates?.map((tmpl: any) => (
                    <View key={tmpl._id} style={styles.actItemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.actItemName}>{tmpl.name}</Text>
                        <Text style={styles.actItemSub} numberOfLines={2}>{tmpl.body}</Text>
                      </View>
                      <Badge text={tmpl.category} variant="primary" />
                    </View>
                  ))}
                  {userActivity.templates?.length === 0 && (
                    <Text style={styles.actEmptyText}>No templates created by this user.</Text>
                  )}
                </ScrollView>
              )}

              {activityTab === 'groups' && (
                <ScrollView style={{ maxHeight: 280 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  {userActivity.groups?.map((g: any) => (
                    <View key={g._id} style={styles.actItemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.actItemName}>{g.name}</Text>
                        <Text style={styles.actItemSub}>{g.description || 'No description'}</Text>
                      </View>
                      <Badge text={`${g.contactCount} Contacts`} variant="info" />
                    </View>
                  ))}
                  {userActivity.groups?.length === 0 && (
                    <Text style={styles.actEmptyText}>No groups created by this user.</Text>
                  )}
                </ScrollView>
              )}

              {activityTab === 'logs' && (
                <ScrollView style={{ maxHeight: 280 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  {userActivity.recentLogs?.map((l: any) => (
                    <View key={l._id} style={styles.actItemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.actItemName}>{l.phone}</Text>
                        <Text style={styles.actItemSub}>Campaign: {l.campaign?.name || '—'}</Text>
                      </View>
                      <Badge text={l.status} variant={getStatusVariant(l.status)} />
                    </View>
                  ))}
                  {userActivity.recentLogs?.length === 0 && (
                    <Text style={styles.actEmptyText}>No message logs found for this user.</Text>
                  )}
                </ScrollView>
              )}
            </View>

            <Button
              title="Close Activity View"
              variant="secondary"
              onPress={() => setIsActivityOpen(false)}
              style={{ alignSelf: 'flex-end' }}
            />
          </View>
        ) : null}
      </ModalWrapper>

      {/* Create User Modal */}
      <ModalWrapper visible={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Tenant Account">
        <View style={{ gap: 14 }}>
          <InputField label="Full Name *" value={formData.name} onChangeText={(v) => setFormData({ ...formData, name: v })} placeholder="John Doe" />
          <InputField label="Email Address *" value={formData.email} onChangeText={(v) => setFormData({ ...formData, email: v })} placeholder="user@company.com" keyboardType="email-address" />
          <InputField label="Password *" value={formData.password} onChangeText={(v) => setFormData({ ...formData, password: v })} placeholder="At least 6 characters" secureTextEntry />
          <InputField label="Company Name" value={formData.companyName} onChangeText={(v) => setFormData({ ...formData, companyName: v })} placeholder="Acme Inc." />
          <InputField label="Phone" value={formData.phone} onChangeText={(v) => setFormData({ ...formData, phone: v })} placeholder="+919876543210" keyboardType="phone-pad" />

          <View>
            <Text style={styles.fieldLabel}>Role</Text>
            <View style={styles.roleRow}>
              {['user', 'admin', 'super_admin'].map((r) => (
                <TouchableOpacity key={r} onPress={() => setFormData({ ...formData, role: r })} style={[styles.roleChip, formData.role === r && styles.roleChipActive]}>
                  <Text style={[styles.roleChipText, formData.role === r && { color: Colors.primaryLight }]}>{roleLabel(r)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View>
            <Text style={styles.fieldLabel}>Subscription Plan</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {plans.map((p) => (
                <TouchableOpacity key={p._id} onPress={() => setFormData({ ...formData, plan: p._id })} style={[styles.roleChip, formData.plan === p._id && styles.roleChipActive]}>
                  <Text style={[styles.roleChipText, formData.plan === p._id && { color: Colors.primaryLight }]}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
        <View style={styles.modalActions}>
          <Button title="Cancel" variant="secondary" onPress={() => setIsCreateOpen(false)} />
          <Button title={submitting ? 'Creating...' : 'Create Account'} onPress={handleCreate} loading={submitting} />
        </View>
      </ModalWrapper>

      {/* Edit User Modal */}
      <ModalWrapper visible={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Edit: ${selectedUser?.name || ''}`}>
        <View style={{ gap: 14 }}>
          <InputField label="Full Name" value={formData.name} onChangeText={(v) => setFormData({ ...formData, name: v })} />
          <InputField label="Email Address" value={formData.email} onChangeText={(v) => setFormData({ ...formData, email: v })} keyboardType="email-address" />
          <InputField label="Company Name" value={formData.companyName} onChangeText={(v) => setFormData({ ...formData, companyName: v })} />
          <InputField label="Phone" value={formData.phone} onChangeText={(v) => setFormData({ ...formData, phone: v })} keyboardType="phone-pad" />
          <InputField label="New Password (leave blank to keep)" value={formData.password} onChangeText={(v) => setFormData({ ...formData, password: v })} secureTextEntry placeholder="Change password if needed" />

          <View>
            <Text style={styles.fieldLabel}>Role</Text>
            <View style={styles.roleRow}>
              {['user', 'admin', 'super_admin'].map((r) => (
                <TouchableOpacity key={r} onPress={() => setFormData({ ...formData, role: r })} style={[styles.roleChip, formData.role === r && styles.roleChipActive]}>
                  <Text style={[styles.roleChipText, formData.role === r && { color: Colors.primaryLight }]}>{roleLabel(r)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View>
            <Text style={styles.fieldLabel}>Subscription Plan</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {plans.map((p) => (
                <TouchableOpacity key={p._id} onPress={() => setFormData({ ...formData, plan: p._id })} style={[styles.roleChip, formData.plan === p._id && styles.roleChipActive]}>
                  <Text style={[styles.roleChipText, formData.plan === p._id && { color: Colors.primaryLight }]}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <TouchableOpacity onPress={() => setFormData({ ...formData, isActive: !formData.isActive })} style={styles.checkRow}>
            <View style={[styles.checkbox, formData.isActive && styles.checkboxChecked]}>
              {formData.isActive && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={{ fontSize: 14, color: Colors.textPrimary }}>Account Active & Allowed to Send</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.modalActions}>
          <Button title="Cancel" variant="secondary" onPress={() => setIsEditOpen(false)} />
          <Button title={submitting ? 'Saving...' : 'Save Changes'} onPress={handleUpdate} loading={submitting} />
        </View>
      </ModalWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  content: { padding: 16 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  filterChip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8, backgroundColor: Colors.bgDark, borderWidth: 1, borderColor: Colors.border, marginRight: 6 },
  filterChipActive: { backgroundColor: 'rgba(99,102,241,0.15)', borderColor: Colors.primary },
  filterText: { fontSize: 13, color: Colors.textSecondary },
  filterTextActive: { color: Colors.primaryLight },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51,65,85,0.5)',
    backgroundColor: 'rgba(30,41,59,0.9)',
  },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bgHover, alignItems: 'center', justifyContent: 'center' },
  avatarSuper: { backgroundColor: Colors.primary },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  userName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  userEmail: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  metricsChipRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  metricChipText: { fontSize: 11, color: Colors.textSecondary },
  metricDot: { fontSize: 10, color: Colors.border },
  actionsCol: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  activityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  activityBtnText: { fontSize: 12, fontWeight: '600', color: Colors.accent },
  actionIconBtn: { padding: 4 },
  fieldLabel: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary, marginBottom: 6 },
  roleRow: { flexDirection: 'row', gap: 6 },
  roleChip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8, backgroundColor: Colors.bgDark, borderWidth: 1, borderColor: Colors.border, marginRight: 6 },
  roleChipActive: { backgroundColor: 'rgba(99,102,241,0.15)', borderColor: Colors.primary },
  roleChipText: { fontSize: 13, color: Colors.textSecondary },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  modalActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 20 },

  // Activity Inspector Modal Styles
  activitySummaryBox: {
    backgroundColor: Colors.bgDark,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  actSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  actCountersGrid: { flexDirection: 'row', gap: 8, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  actCounterItem: { flex: 1, alignItems: 'center' },
  actCounterVal: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  actCounterLbl: { fontSize: 10, color: Colors.textSecondary, marginTop: 2 },
  actTab: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: Colors.bgDark,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 6,
  },
  actTabActive: { backgroundColor: 'rgba(99,102,241,0.18)', borderColor: Colors.primary },
  actTabText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  actTabTextActive: { color: Colors.primaryLight, fontWeight: '700' },
  actContentBox: {
    backgroundColor: Colors.bgDark,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 120,
  },
  actItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51,65,85,0.4)',
    gap: 8,
  },
  actItemName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  actItemSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  actEmptyText: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center', padding: 20 },
});
