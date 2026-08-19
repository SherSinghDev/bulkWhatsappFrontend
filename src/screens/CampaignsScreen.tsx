import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import api from '../lib/api';
import GlassCard from '../components/GlassCard';
import InputField from '../components/InputField';
import Button from '../components/Button';
import Badge, { getStatusVariant } from '../components/Badge';
import ModalWrapper from '../components/ModalWrapper';
import DateTimePickerModal from '../components/DateTimePickerModal';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { Colors } from '../theme/colors';

interface Campaign {
  _id: string;
  name: string;
  status: string;
  template: any;
  totalMessages: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  readCount: number;
  scheduledAt: string;
  createdAt: string;
}

export default function CampaignsScreen() {
  const navigation = useNavigation<any>();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [recipientMode, setRecipientMode] = useState<'groups' | 'contacts'>('groups');
  const [contactSearch, setContactSearch] = useState('');
  
  const [form, setForm] = useState({
    name: '',
    template: '',
    groups: [] as string[],
    contacts: [] as string[],
    scheduledAt: '',
    delayMin: '1000',
    delayMax: '3000',
    variableMapping: {} as Record<string, string>,
  });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [c, t, g, ct] = await Promise.all([
        api.get('/campaigns'),
        api.get('/templates'),
        api.get('/contacts/groups'),
        api.get('/contacts?limit=200'),
      ]);
      setCampaigns(c.data.data);
      setTemplates(t.data.data);
      setGroups(g.data.data);
      setContacts(ct.data.data);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load' });
    } finally {
      setLoading(false);
    }
  };

  const selectedTemplateObj = templates.find((t) => t._id === form.template);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.template) {
      Toast.show({ type: 'error', text1: 'Name and template are required' });
      return;
    }
    if (form.groups.length === 0 && form.contacts.length === 0) {
      Toast.show({ type: 'error', text1: 'Please select at least one contact group or specific contact' });
      return;
    }
    try {
      const payload: any = {
        name: form.name,
        template: form.template,
        groups: form.groups,
        contacts: form.contacts,
        variableMapping: form.variableMapping,
        delayMin: parseInt(form.delayMin) || 1000,
        delayMax: parseInt(form.delayMax) || 3000,
      };
      if (!form.scheduledAt.trim()) {
        delete payload.scheduledAt;
      } else {
        const parsedDate = new Date(form.scheduledAt);
        if (isNaN(parsedDate.getTime())) {
          Toast.show({ type: 'error', text1: 'Invalid schedule date format' });
          return;
        }
        payload.scheduledAt = parsedDate.toISOString();
      }

      await api.post('/campaigns', payload);
      Toast.show({ type: 'success', text1: payload.scheduledAt ? 'Campaign scheduled successfully' : 'Campaign created' });
      setShowCreate(false);
      setForm({
        name: '',
        template: '',
        groups: [],
        contacts: [],
        scheduledAt: '',
        delayMin: '1000',
        delayMax: '3000',
        variableMapping: {},
      });
      loadAll();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || 'Error creating campaign' });
    }
  };

  const handleAction = async (id: string, action: string) => {
    try {
      await api.post(`/campaigns/${id}/${action}`);
      Toast.show({ type: 'success', text1: `Campaign ${action}ed` });
      loadAll();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || 'Error' });
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Campaign', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/campaigns/${id}`);
            Toast.show({ type: 'success', text1: 'Deleted' });
            loadAll();
          } catch {
            Toast.show({ type: 'error', text1: 'Failed' });
          }
        },
      },
    ]);
  };

  const progressPct = (c: Campaign) => (c.totalMessages > 0 ? Math.round((c.sentCount / c.totalMessages) * 100) : 0);

  const toggleGroup = (gid: string) => {
    setForm((f) => ({
      ...f,
      groups: f.groups.includes(gid) ? f.groups.filter((id) => id !== gid) : [...f.groups, gid],
    }));
  };

  const toggleContact = (cid: string) => {
    setForm((f) => ({
      ...f,
      contacts: f.contacts.includes(cid) ? f.contacts.filter((id) => id !== cid) : [...f.contacts, cid],
    }));
  };

  const selectAllContacts = () => {
    if (form.contacts.length === contacts.length) {
      setForm((f) => ({ ...f, contacts: [] }));
    } else {
      setForm((f) => ({ ...f, contacts: contacts.map((c) => c._id) }));
    }
  };

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
      c.phone.includes(contactSearch)
  );

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Campaigns</Text>
            <Text style={styles.subtitle}>Create and manage bulk messaging campaigns</Text>
          </View>
          <Button title="New Campaign" small onPress={() => setShowCreate(true)} icon={<Ionicons name="add" size={14} color="#fff" />} />
        </View>

        {campaigns.length === 0 ? (
          <GlassCard>
            <EmptyState icon="megaphone-outline" title="No campaigns yet" />
          </GlassCard>
        ) : (
          campaigns.map((c) => (
            <GlassCard key={c._id} style={{ marginBottom: 12 }}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.campaignName}>{c.name}</Text>
                    <Badge text={c.status} variant={getStatusVariant(c.status)} />
                  </View>
                  <Text style={styles.templateName}>Template: {c.template?.name || '—'}</Text>
                  {c.scheduledAt && (
                    <View style={styles.scheduleRow}>
                      <Ionicons name="time-outline" size={14} color={Colors.accent} />
                      <Text style={styles.scheduleText}>Scheduled: {new Date(c.scheduledAt).toLocaleString()}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Action buttons */}
              <View style={styles.actionsRow}>
                {['draft', 'scheduled', 'paused'].includes(c.status) && (
                  <Button title="Start" small onPress={() => handleAction(c._id, 'start')} icon={<Ionicons name="play" size={12} color="#fff" />} />
                )}
                {c.status === 'running' && (
                  <Button title="Pause" variant="secondary" small onPress={() => handleAction(c._id, 'pause')} icon={<Ionicons name="pause" size={12} color={Colors.textPrimary} />} />
                )}
                {['running', 'scheduled'].includes(c.status) && (
                  <Button title="Cancel" variant="danger" small onPress={() => handleAction(c._id, 'cancel')} icon={<Ionicons name="close" size={12} color="#fff" />} />
                )}
                {c.failedCount > 0 && (
                  <Button title={`Retry (${c.failedCount})`} variant="secondary" small onPress={() => handleAction(c._id, 'retry')} icon={<Ionicons name="refresh" size={12} color={Colors.textPrimary} />} />
                )}
                <TouchableOpacity onPress={() => navigation.navigate('CampaignDetail', { id: c._id })} style={styles.iconBtn}>
                  <Ionicons name="eye-outline" size={18} color={Colors.primaryLight} />
                </TouchableOpacity>
                {!['running'].includes(c.status) && (
                  <TouchableOpacity onPress={() => handleDelete(c._id)}>
                    <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Stats bar */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Total</Text>
                  <Text style={styles.statValue}>{c.totalMessages}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Sent</Text>
                  <Text style={[styles.statValue, { color: '#8b5cf6' }]}>{c.sentCount}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Delivered</Text>
                  <Text style={[styles.statValue, { color: '#10b981' }]}>{c.deliveredCount}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Read</Text>
                  <Text style={[styles.statValue, { color: '#f59e0b' }]}>{c.readCount}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Failed</Text>
                  <Text style={[styles.statValue, { color: '#ef4444' }]}>{c.failedCount}</Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progressPct(c)}%` }]} />
              </View>
              <Text style={styles.progressText}>{progressPct(c)}% complete</Text>
            </GlassCard>
          ))
        )}
      </ScrollView>

      {/* Comprehensive Create Campaign Modal */}
      <ModalWrapper visible={showCreate} onClose={() => setShowCreate(false)} title="New WhatsApp Campaign">
        <View style={{ gap: 16 }}>
          {/* 1. Campaign Name */}
          <InputField
            label="Campaign Name *"
            value={form.name}
            onChangeText={(v) => setForm({ ...form, name: v })}
            placeholder="e.g. Summer Festival 2026 Promo"
          />

          {/* 2. Template Picker */}
          <View>
            <Text style={styles.fieldLabel}>Select Message Template *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
              {templates.map((t) => (
                <TouchableOpacity
                  key={t._id}
                  onPress={() => setForm({ ...form, template: t._id })}
                  style={[styles.selectChip, form.template === t._id && styles.selectChipActive]}
                >
                  <Text style={[styles.selectChipText, form.template === t._id && { color: Colors.primaryLight, fontWeight: '700' }]}>
                    {t.name}
                  </Text>
                  <Text style={styles.chipSub}>({t.category})</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {templates.length === 0 && (
              <Text style={{ fontSize: 12, color: Colors.danger, marginTop: 4 }}>
                No templates found. Please create or sync a template first.
              </Text>
            )}
          </View>

          {/* 3. Dynamic Variables Mapping (If template contains variables) */}
          {selectedTemplateObj?.variables && selectedTemplateObj.variables.length > 0 && (
            <View style={styles.varBox}>
              <Text style={[styles.fieldLabel, { color: Colors.accent, marginBottom: 8 }]}>
                Dynamic Variable Values:
              </Text>
              {selectedTemplateObj.variables.map((v: string) => (
                <View key={v} style={{ marginBottom: 8 }}>
                  <InputField
                    label={`Value for {{${v}}}`}
                    value={form.variableMapping[v] || ''}
                    onChangeText={(val) =>
                      setForm({
                        ...form,
                        variableMapping: { ...form.variableMapping, [v]: val },
                      })
                    }
                    placeholder={`e.g. 20% OFF or fallback for ${v}`}
                  />
                </View>
              ))}
            </View>
          )}

          {/* 4. Target Recipients Mode (Groups vs Individual Contacts) */}
          <View>
            <Text style={styles.fieldLabel}>Target Audience *</Text>
            <View style={styles.modeToggleRow}>
              <TouchableOpacity
                onPress={() => setRecipientMode('groups')}
                style={[styles.modeToggleBtn, recipientMode === 'groups' && styles.modeToggleBtnActive]}
              >
                <Ionicons
                  name="people-outline"
                  size={15}
                  color={recipientMode === 'groups' ? Colors.primaryLight : Colors.textSecondary}
                />
                <Text style={[styles.modeToggleText, recipientMode === 'groups' && styles.modeToggleTextActive]}>
                  By Groups ({form.groups.length} selected)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setRecipientMode('contacts')}
                style={[styles.modeToggleBtn, recipientMode === 'contacts' && styles.modeToggleBtnActive]}
              >
                <Ionicons
                  name="person-outline"
                  size={15}
                  color={recipientMode === 'contacts' ? Colors.primaryLight : Colors.textSecondary}
                />
                <Text style={[styles.modeToggleText, recipientMode === 'contacts' && styles.modeToggleTextActive]}>
                  Select Contacts ({form.contacts.length} selected)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Groups Picker */}
            {recipientMode === 'groups' ? (
              <View style={styles.groupGrid}>
                {groups.map((g) => (
                  <TouchableOpacity
                    key={g._id}
                    onPress={() => toggleGroup(g._id)}
                    style={[styles.selectChip, form.groups.includes(g._id) && styles.selectChipActive]}
                  >
                    <View style={[styles.groupColorDot, { backgroundColor: g.color || Colors.primary }]} />
                    <Text style={[styles.selectChipText, form.groups.includes(g._id) && { color: Colors.primaryLight, fontWeight: '600' }]}>
                      {g.name} ({g.contactCount || 0})
                    </Text>
                  </TouchableOpacity>
                ))}
                {groups.length === 0 && (
                  <Text style={{ fontSize: 13, color: Colors.textSecondary }}>No groups created yet. Switch to Individual Contacts.</Text>
                )}
              </View>
            ) : (
              /* Specific Contacts Picker */
              <View style={styles.contactsPickerBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <View style={{ flex: 1 }}>
                    <InputField
                      value={contactSearch}
                      onChangeText={setContactSearch}
                      placeholder="Search contacts..."
                      icon={<Ionicons name="search" size={14} color={Colors.textSecondary} />}
                    />
                  </View>
                  <Button
                    title={form.contacts.length === contacts.length ? 'Deselect All' : 'Select All'}
                    variant="secondary"
                    small
                    onPress={selectAllContacts}
                  />
                </View>
                <ScrollView style={styles.contactsScrollList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  {filteredContacts.map((c) => {
                    const isChecked = form.contacts.includes(c._id);
                    return (
                      <TouchableOpacity
                        key={c._id}
                        onPress={() => toggleContact(c._id)}
                        style={[styles.contactPickerItem, isChecked && styles.contactPickerItemActive]}
                      >
                        <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                          {isChecked && <Ionicons name="checkmark" size={12} color="#fff" />}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.contactItemName}>{c.name}</Text>
                          <Text style={styles.contactItemPhone}>{c.phone}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                  {filteredContacts.length === 0 && (
                    <Text style={{ fontSize: 12, color: Colors.textSecondary, textAlign: 'center', padding: 16 }}>
                      No contacts match search
                    </Text>
                  )}
                </ScrollView>
              </View>
            )}
          </View>

          {/* 5. Sending Rate & Throttle Controls */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <InputField
                label="Min Delay (ms)"
                value={form.delayMin}
                onChangeText={(v) => setForm({ ...form, delayMin: v })}
                keyboardType="numeric"
                placeholder="1000"
              />
            </View>
            <View style={{ flex: 1 }}>
              <InputField
                label="Max Delay (ms)"
                value={form.delayMax}
                onChangeText={(v) => setForm({ ...form, delayMax: v })}
                keyboardType="numeric"
                placeholder="3000"
              />
            </View>
          </View>

          {/* 6. Schedule Date & Time */}
          <View>
            <Text style={styles.fieldLabel}>Schedule Date & Time (Optional)</Text>
            <TouchableOpacity style={styles.datePickerTrigger} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={18} color={form.scheduledAt ? Colors.accent : Colors.textSecondary} />
              <Text
                style={[
                  styles.datePickerTriggerText,
                  form.scheduledAt ? { color: Colors.textPrimary, fontWeight: '600' } : { color: Colors.textSecondary },
                ]}
              >
                {form.scheduledAt
                  ? new Date(form.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                  : 'Tap to send immediately or schedule for later'}
              </Text>
              {form.scheduledAt ? (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    setForm({ ...form, scheduledAt: '' });
                  }}
                >
                  <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              ) : (
                <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Modal Submit Actions */}
        <View style={styles.modalActions}>
          <Button title="Cancel" variant="secondary" onPress={() => setShowCreate(false)} />
          <Button
            title={form.scheduledAt ? 'Schedule Campaign' : 'Create Campaign'}
            onPress={handleCreate}
            icon={<Ionicons name={form.scheduledAt ? 'calendar' : 'send'} size={16} color="#fff" />}
          />
        </View>
      </ModalWrapper>

      <DateTimePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        initialDate={form.scheduledAt ? new Date(form.scheduledAt) : undefined}
        onSelect={(date) => setForm({ ...form, scheduledAt: date.toISOString() })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  content: { padding: 16 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textSecondary },
  cardHeader: { marginBottom: 10 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  campaignName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  templateName: { fontSize: 13, color: Colors.textSecondary },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  scheduleText: { fontSize: 12, color: Colors.accent },
  actionsRow: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 },
  iconBtn: { padding: 4 },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 11, color: Colors.textSecondary },
  statValue: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  progressTrack: { height: 6, backgroundColor: Colors.bgDark, borderRadius: 3, overflow: 'hidden', marginTop: 12 },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: Colors.primary },
  progressText: { fontSize: 11, color: Colors.textSecondary, textAlign: 'right', marginTop: 4 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  selectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.bgDark,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 6,
    marginBottom: 6,
  },
  selectChipActive: { backgroundColor: 'rgba(99,102,241,0.18)', borderColor: Colors.primary },
  selectChipText: { fontSize: 13, color: Colors.textSecondary },
  chipSub: { fontSize: 11, color: Colors.textSecondary, marginLeft: 4 },
  groupColorDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  groupGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  modeToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  modeToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.bgDark,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeToggleBtnActive: {
    backgroundColor: 'rgba(99,102,241,0.12)',
    borderColor: Colors.primary,
  },
  modeToggleText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  modeToggleTextActive: {
    color: Colors.primaryLight,
    fontWeight: '700',
  },
  contactsPickerBox: {
    backgroundColor: Colors.bgDark,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contactsScrollList: {
    maxHeight: 140,
  },
  contactPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  contactPickerItemActive: {
    backgroundColor: 'rgba(99,102,241,0.12)',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  contactItemName: { fontSize: 13, color: Colors.textPrimary, fontWeight: '500' },
  contactItemPhone: { fontSize: 11, color: Colors.textSecondary, fontFamily: 'monospace' },
  varBox: {
    backgroundColor: 'rgba(6, 182, 212, 0.05)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.2)',
  },
  datePickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgDark,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  datePickerTriggerText: { flex: 1, fontSize: 13 },
  modalActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 20 },
});
