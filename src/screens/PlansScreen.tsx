import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import api from '../lib/api';
import GlassCard from '../components/GlassCard';
import InputField from '../components/InputField';
import Button from '../components/Button';
import Badge from '../components/Badge';
import ModalWrapper from '../components/ModalWrapper';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { Colors } from '../theme/colors';

interface Plan {
  _id: string;
  name: string;
  code: string;
  description: string;
  price: number;
  maxContacts: number;
  maxMessagesPerMonth: number;
  maxCampaignsPerMonth: number;
  features: string[];
  isActive: boolean;
}

export default function PlansScreen() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    price: '0',
    maxContacts: '500',
    maxMessagesPerMonth: '1000',
    maxCampaignsPerMonth: '10',
    features: '',
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const res = await api.get('/plans');
      setPlans(res.data.data);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load plans' });
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '',
      code: '',
      description: '',
      price: '29',
      maxContacts: '2000',
      maxMessagesPerMonth: '10000',
      maxCampaignsPerMonth: '50',
      features: 'Template sync, CSV import, Analytics',
      isActive: true,
    });
    setShowModal(true);
  };

  const openEdit = (p: Plan) => {
    setEditing(p);
    setForm({
      name: p.name,
      code: p.code,
      description: p.description || '',
      price: String(p.price),
      maxContacts: String(p.maxContacts),
      maxMessagesPerMonth: String(p.maxMessagesPerMonth),
      maxCampaignsPerMonth: String(p.maxCampaignsPerMonth),
      features: (p.features || []).join(', '),
      isActive: p.isActive,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.code) {
      Toast.show({ type: 'error', text1: 'Name and code are required' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        code: form.code,
        description: form.description,
        price: parseFloat(form.price) || 0,
        maxContacts: parseInt(form.maxContacts) || 0,
        maxMessagesPerMonth: parseInt(form.maxMessagesPerMonth) || 0,
        maxCampaignsPerMonth: parseInt(form.maxCampaignsPerMonth) || 0,
        features: form.features
          .split(',')
          .map((f) => f.trim())
          .filter(Boolean),
        isActive: form.isActive,
      };

      if (editing) {
        await api.put(`/plans/${editing._id}`, payload);
        Toast.show({ type: 'success', text1: 'Plan updated' });
      } else {
        await api.post('/plans', payload);
        Toast.show({ type: 'success', text1: 'Plan created' });
      }
      setShowModal(false);
      loadPlans();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || 'Failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Plan', `Delete ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/plans/${id}`);
            Toast.show({ type: 'success', text1: 'Plan deleted' });
            loadPlans();
          } catch (err: any) {
            Toast.show({ type: 'error', text1: err.response?.data?.message || 'Delete failed' });
          }
        },
      },
    ]);
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Subscription Plans</Text>
          <Text style={styles.subtitle}>Define manual SaaS tiers, contact allowances, and monthly message limits</Text>
        </View>
        <Button title="New Plan" small onPress={openCreate} icon={<Ionicons name="add" size={14} color="#fff" />} />
      </View>

      <FlatList
        data={plans}
        keyExtractor={(p) => p._id}
        renderItem={({ item: p }) => (
          <GlassCard style={{ marginBottom: 14 }}>
            <View style={styles.planHeader}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.planName}>{p.name}</Text>
                  <Badge text={p.code.toUpperCase()} variant="primary" />
                  <Badge text={p.isActive ? 'Active' : 'Disabled'} variant={p.isActive ? 'success' : 'danger'} />
                </View>
                {p.description ? <Text style={styles.planDesc}>{p.description}</Text> : null}
              </View>
              <Text style={styles.planPrice}>${p.price}<Text style={{ fontSize: 12, color: Colors.textSecondary }}>/mo</Text></Text>
            </View>

            <View style={styles.limitsGrid}>
              <View style={styles.limitItem}>
                <Text style={styles.limitLabel}>Contacts</Text>
                <Text style={styles.limitValue}>{p.maxContacts === 0 ? 'Unlimited' : p.maxContacts.toLocaleString()}</Text>
              </View>
              <View style={styles.limitItem}>
                <Text style={styles.limitLabel}>Messages/Mo</Text>
                <Text style={[styles.limitValue, { color: Colors.primaryLight }]}>
                  {p.maxMessagesPerMonth === 0 ? 'Unlimited' : p.maxMessagesPerMonth.toLocaleString()}
                </Text>
              </View>
              <View style={styles.limitItem}>
                <Text style={styles.limitLabel}>Campaigns/Mo</Text>
                <Text style={[styles.limitValue, { color: Colors.accent }]}>
                  {p.maxCampaignsPerMonth === 0 ? 'Unlimited' : p.maxCampaignsPerMonth.toLocaleString()}
                </Text>
              </View>
            </View>

            {p.features && p.features.length > 0 && (
              <View style={styles.featuresList}>
                {p.features.map((f, i) => (
                  <View key={i} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.cardActions}>
              <Button title="Edit Plan" variant="secondary" small onPress={() => openEdit(p)} icon={<Ionicons name="pencil" size={12} color={Colors.textPrimary} />} />
              <Button title="Delete" variant="danger" small onPress={() => handleDelete(p._id, p.name)} icon={<Ionicons name="trash-outline" size={12} color="#fff" />} />
            </View>
          </GlassCard>
        )}
        ListEmptyComponent={<EmptyState icon="pricetags-outline" title="No plans defined yet" />}
      />

      {/* Plan Create/Edit Modal */}
      <ModalWrapper visible={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Plan' : 'Create New Plan'}>
        <View style={{ gap: 14 }}>
          <InputField label="Plan Name *" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholder="Pro Plan" />
          <InputField label="Plan Code (Unique key) *" value={form.code} onChangeText={(v) => setForm({ ...form, code: v })} placeholder="pro" autoCapitalize="none" />
          <InputField label="Description" value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} placeholder="Features for growing businesses" />
          <InputField label="Monthly Price ($)" value={form.price} onChangeText={(v) => setForm({ ...form, price: v })} keyboardType="numeric" />

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <InputField label="Max Contacts (0 = Unltd)" value={form.maxContacts} onChangeText={(v) => setForm({ ...form, maxContacts: v })} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <InputField label="Max Msgs/Mo (0 = Unltd)" value={form.maxMessagesPerMonth} onChangeText={(v) => setForm({ ...form, maxMessagesPerMonth: v })} keyboardType="numeric" />
            </View>
          </View>
          <InputField label="Max Campaigns/Mo (0 = Unltd)" value={form.maxCampaignsPerMonth} onChangeText={(v) => setForm({ ...form, maxCampaignsPerMonth: v })} keyboardType="numeric" />
          <InputField label="Features (Comma separated)" value={form.features} onChangeText={(v) => setForm({ ...form, features: v })} placeholder="Unlimited templates, 24/7 support" />

          <TouchableOpacity onPress={() => setForm({ ...form, isActive: !form.isActive })} style={styles.checkRow}>
            <View style={[styles.checkbox, form.isActive && styles.checkboxChecked]}>
              {form.isActive && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={{ fontSize: 14, color: Colors.textPrimary }}>Plan is Active & Selectable</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.modalActions}>
          <Button title="Cancel" variant="secondary" onPress={() => setShowModal(false)} />
          <Button title={saving ? 'Saving...' : 'Save Plan'} onPress={handleSave} loading={saving} />
        </View>
      </ModalWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  planHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  planName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  planDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  planPrice: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  limitsGrid: { flexDirection: 'row', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  limitItem: { flex: 1, alignItems: 'center' },
  limitLabel: { fontSize: 11, color: Colors.textSecondary },
  limitValue: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginTop: 2 },
  featuresList: { gap: 6, marginBottom: 12 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureText: { fontSize: 12, color: Colors.textSecondary },
  cardActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 4 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  modalActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 20 },
});
