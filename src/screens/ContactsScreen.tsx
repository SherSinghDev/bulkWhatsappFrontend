import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import Toast from 'react-native-toast-message';
import api from '../lib/api';
import GlassCard from '../components/GlassCard';
import InputField from '../components/InputField';
import Button from '../components/Button';
import ModalWrapper from '../components/ModalWrapper';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { Colors } from '../theme/colors';

interface Contact {
  _id: string;
  name: string;
  phone: string;
  email: string;
  tags: string[];
  groups: any[];
  notes: string;
  isActive: boolean;
}

interface Group {
  _id: string;
  name: string;
  color: string;
  contactCount: number;
}

export default function ContactsScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importGroupId, setImportGroupId] = useState('');
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', tags: '', notes: '', groups: [] as string[] });
  const [groupForm, setGroupForm] = useState({ name: '', description: '', color: '#6366f1' });

  const loadContacts = useCallback(
    async (page = 1) => {
      try {
        const res = await api.get('/contacts', { params: { page, limit: 20, search } });
        setContacts(res.data.data);
        setPagination(res.data.pagination);
      } catch {
        Toast.show({ type: 'error', text1: 'Failed to load contacts' });
      } finally {
        setLoading(false);
      }
    },
    [search]
  );

  const loadGroups = async () => {
    try {
      const res = await api.get('/contacts/groups');
      setGroups(res.data.data);
    } catch {}
  };

  useEffect(() => {
    loadContacts();
    loadGroups();
  }, [loadContacts]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', phone: '', email: '', tags: '', notes: '', groups: [] });
    setShowModal(true);
  };

  const openEdit = (c: Contact) => {
    setEditing(c);
    setForm({
      name: c.name,
      phone: c.phone,
      email: c.email,
      tags: c.tags.join(', '),
      notes: c.notes,
      groups: c.groups.map((g: any) => g._id || g),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.phone) {
      Toast.show({ type: 'error', text1: 'Name and phone required' });
      return;
    }
    try {
      const data = { ...form, tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean) };
      if (editing) {
        await api.put(`/contacts/${editing._id}`, data);
        Toast.show({ type: 'success', text1: 'Contact updated' });
      } else {
        await api.post('/contacts', data);
        Toast.show({ type: 'success', text1: 'Contact created' });
      }
      setShowModal(false);
      loadContacts(pagination.page);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || 'Error saving contact' });
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Contact', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/contacts/${id}`);
            Toast.show({ type: 'success', text1: 'Contact deleted' });
            loadContacts(pagination.page);
          } catch {
            Toast.show({ type: 'error', text1: 'Delete failed' });
          }
        },
      },
    ]);
  };

  const handleCreateGroup = async () => {
    if (!groupForm.name) {
      Toast.show({ type: 'error', text1: 'Group name required' });
      return;
    }
    try {
      await api.post('/contacts/groups', groupForm);
      Toast.show({ type: 'success', text1: 'Group created' });
      setShowGroupModal(false);
      setGroupForm({ name: '', description: '', color: '#6366f1' });
      loadGroups();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || 'Error' });
    }
  };

  const handleDeleteGroup = (id: string) => {
    Alert.alert('Delete Group', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/contacts/groups/${id}`);
            Toast.show({ type: 'success', text1: 'Group deleted' });
            loadGroups();
          } catch {
            Toast.show({ type: 'error', text1: 'Failed' });
          }
        },
      },
    ]);
  };

  const toggleGroup = (gid: string) => {
    setForm((f) => ({
      ...f,
      groups: f.groups.includes(gid) ? f.groups.filter((id) => id !== gid) : [...f.groups, gid],
    }));
  };

  const renderContact = ({ item: c }: { item: Contact }) => (
    <View style={styles.contactRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.contactName}>{c.name}</Text>
        <Text style={styles.contactPhone}>{c.phone}</Text>
        {c.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {c.tags.map((t) => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => openEdit(c)}>
          <Ionicons name="pencil" size={18} color={Colors.primaryLight} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(c._id)}>
          <Ionicons name="trash-outline" size={18} color={Colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <InputField
            value={search}
            onChangeText={setSearch}
            placeholder="Search contacts..."
            onSubmitEditing={() => loadContacts(1)}
            icon={<Ionicons name="search" size={18} color={Colors.textSecondary} />}
          />
        </View>
      </View>
      <View style={styles.btnRow}>
        <Button title="Groups" variant="secondary" small onPress={() => setShowGroupModal(true)} icon={<Ionicons name="people" size={14} color={Colors.textPrimary} />} />
        <Button title="Import" variant="secondary" small onPress={() => setShowImportModal(true)} icon={<Ionicons name="cloud-upload-outline" size={14} color={Colors.textPrimary} />} />
        <Button title="Add" onPress={openCreate} small icon={<Ionicons name="add" size={14} color="#fff" />} />
      </View>

      {groups.length > 0 && (
        <View style={styles.groupsRow}>
          {groups.map((g) => (
            <View key={g._id} style={styles.groupChip}>
              <View style={[styles.groupDot, { backgroundColor: g.color }]} />
              <Text style={styles.groupChipText}>
                {g.name} ({g.contactCount})
              </Text>
              <TouchableOpacity onPress={() => handleDeleteGroup(g._id)}>
                <Ionicons name="close" size={14} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <GlassCard noPadding style={{ flex: 1 }}>
          <FlatList
            data={contacts}
            keyExtractor={(c) => c._id}
            renderItem={renderContact}
            ListEmptyComponent={<EmptyState icon="people-outline" title="No contacts found" />}
            ListFooterComponent={
              pagination.totalPages > 1 ? (
                <View style={styles.paginationRow}>
                  <Button title="Previous" variant="secondary" small disabled={pagination.page <= 1} onPress={() => loadContacts(pagination.page - 1)} />
                  <Text style={styles.pageText}>
                    Page {pagination.page} of {pagination.totalPages}
                  </Text>
                  <Button title="Next" variant="secondary" small disabled={pagination.page >= pagination.totalPages} onPress={() => loadContacts(pagination.page + 1)} />
                </View>
              ) : null
            }
          />
        </GlassCard>
      )}

      {/* Create/Edit Modal */}
      <ModalWrapper visible={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Contact' : 'Add Contact'}>
        <View style={{ gap: 14 }}>
          <InputField label="Name *" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholder="John Doe" />
          <InputField label="Phone *" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} placeholder="919876543210" keyboardType="phone-pad" />
          <InputField label="Email" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} placeholder="john@example.com" keyboardType="email-address" />
          <InputField label="Tags (comma separated)" value={form.tags} onChangeText={(v) => setForm({ ...form, tags: v })} placeholder="vip, customer" />
          {groups.length > 0 && (
            <View>
              <Text style={styles.label}>Groups</Text>
              <View style={styles.groupCheckboxes}>
                {groups.map((g) => (
                  <TouchableOpacity key={g._id} onPress={() => toggleGroup(g._id)} style={[styles.groupCheckbox, form.groups.includes(g._id) && styles.groupCheckboxActive]}>
                    <Text style={{ fontSize: 13, color: Colors.textPrimary }}>{g.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          <InputField label="Notes" value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} multiline numberOfLines={2} style={{ minHeight: 60, textAlignVertical: 'top' }} />
        </View>
        <View style={styles.modalActions}>
          <Button title="Cancel" variant="secondary" onPress={() => setShowModal(false)} />
          <Button title="Save" onPress={handleSave} />
        </View>
      </ModalWrapper>

      {/* Group Modal */}
      <ModalWrapper visible={showGroupModal} onClose={() => setShowGroupModal(false)} title="Create Group">
        <View style={{ gap: 14 }}>
          <InputField label="Group Name *" value={groupForm.name} onChangeText={(v) => setGroupForm({ ...groupForm, name: v })} />
          <InputField label="Description" value={groupForm.description} onChangeText={(v) => setGroupForm({ ...groupForm, description: v })} />
          <View>
            <Text style={styles.label}>Group Color</Text>
            <View style={styles.colorPalette}>
              {['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444'].map((color) => (
                <TouchableOpacity key={color} onPress={() => setGroupForm({ ...groupForm, color })} style={[styles.colorOption, { backgroundColor: color }, groupForm.color === color && styles.colorOptionActive]} />
              ))}
            </View>
          </View>
        </View>
        <View style={styles.modalActions}>
          <Button title="Cancel" variant="secondary" onPress={() => setShowGroupModal(false)} />
          <Button title="Create" onPress={handleCreateGroup} />
        </View>
      </ModalWrapper>

      {/* Import Modal */}
      <ModalWrapper visible={showImportModal} onClose={() => setShowImportModal(false)} title="Import Contacts">
        <View style={{ gap: 14 }}>
          <Text style={{ fontSize: 13, color: Colors.textSecondary }}>Upload a CSV or Excel file containing columns: name, phone, email, tags</Text>
          <View>
            <Text style={styles.label}>Assign to Group (Optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity onPress={() => setImportGroupId('')} style={[styles.groupCheckbox, !importGroupId && styles.groupCheckboxActive]}>
                <Text style={{ fontSize: 13, color: Colors.textPrimary }}>None</Text>
              </TouchableOpacity>
              {groups.map((g) => (
                <TouchableOpacity key={g._id} onPress={() => setImportGroupId(g._id)} style={[styles.groupCheckbox, importGroupId === g._id && styles.groupCheckboxActive]}>
                  <Text style={{ fontSize: 13, color: Colors.textPrimary }}>{g.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
        <View style={styles.modalActions}>
          <Button title="Cancel" variant="secondary" onPress={() => setShowImportModal(false)} />
          <Button
            title="Pick CSV / Excel File"
            onPress={async () => {
              try {
                const res = await DocumentPicker.getDocumentAsync({ type: ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'] });
                if (!res.canceled && res.assets && res.assets[0]) {
                  const file = res.assets[0];
                  const formData = new FormData();
                  formData.append('file', { uri: file.uri, name: file.name, type: file.mimeType || 'application/octet-stream' } as any);
                  if (importGroupId) formData.append('groupId', importGroupId);
                  await api.post('/contacts/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                  Toast.show({ type: 'success', text1: 'Contacts imported successfully' });
                  setShowImportModal(false);
                  loadContacts();
                  loadGroups();
                }
              } catch (err: any) {
                Toast.show({ type: 'error', text1: err.response?.data?.message || 'Import failed' });
              }
            }}
          />
        </View>
      </ModalWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark, padding: 16 },
  headerRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  btnRow: { flexDirection: 'row', gap: 8, marginBottom: 12, justifyContent: 'flex-end' },
  label: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary, marginBottom: 6 },
  groupsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(99,102,241,0.08)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  groupDot: { width: 8, height: 8, borderRadius: 4 },
  groupChipText: { fontSize: 13, color: Colors.textPrimary },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51,65,85,0.5)',
  },
  contactName: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  contactPhone: { fontSize: 13, color: Colors.textSecondary, fontFamily: 'monospace', marginTop: 2 },
  tagsRow: { flexDirection: 'row', gap: 4, marginTop: 4, flexWrap: 'wrap' },
  tag: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 4, backgroundColor: 'rgba(99,102,241,0.1)' },
  tagText: { fontSize: 11, color: Colors.primaryLight },
  actions: { flexDirection: 'row', gap: 12 },
  paginationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16 },
  pageText: { fontSize: 13, color: Colors.textSecondary },
  groupCheckboxes: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  groupCheckbox: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.bgDark,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  groupCheckboxActive: { backgroundColor: 'rgba(99,102,241,0.15)', borderColor: Colors.primary },
  colorPalette: { flexDirection: 'row', gap: 8, marginTop: 6 },
  colorOption: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: 'transparent' },
  colorOptionActive: { borderColor: '#ffffff' },
  modalActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 20 },
});
