import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import api from '../lib/api';
import GlassCard from '../components/GlassCard';
import InputField from '../components/InputField';
import Button from '../components/Button';
import Badge, { getStatusVariant } from '../components/Badge';
import ModalWrapper from '../components/ModalWrapper';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { Colors } from '../theme/colors';

interface Template {
  _id: string;
  name: string;
  body: string;
  category: string;
  metaTemplateName: string;
  language: string;
  variables: string[];
  mediaUrl: string;
  mediaType: string;
  footer: string;
  status?: string;
}

export default function TemplatesScreen() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [form, setForm] = useState({
    name: '',
    body: '',
    category: 'text',
    metaTemplateName: '',
    language: 'en_US',
    mediaUrl: '',
    footer: '',
    submitToMeta: false,
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const res = await api.get('/templates');
      setTemplates(res.data.data);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load templates' });
    } finally {
      setLoading(false);
    }
  };

  const syncTemplates = async () => {
    setSyncing(true);
    try {
      const res = await api.post('/templates/sync');
      Toast.show({ type: 'success', text1: res.data.message });
      loadTemplates();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || 'Sync failed' });
    } finally {
      setSyncing(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '',
      body: '',
      category: 'text',
      metaTemplateName: '',
      language: 'en_US',
      mediaUrl: '',
      footer: '',
      submitToMeta: false,
    });
    setShowModal(true);
  };

  const openEdit = (t: Template) => {
    setEditing(t);
    setForm({
      name: t.name,
      body: t.body,
      category: t.category,
      metaTemplateName: t.metaTemplateName,
      language: t.language,
      mediaUrl: t.mediaUrl,
      footer: t.footer,
      submitToMeta: false,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.body) {
      Toast.show({ type: 'error', text1: 'Name and body are required' });
      return;
    }
    try {
      if (editing) {
        await api.put(`/templates/${editing._id}`, form);
        Toast.show({ type: 'success', text1: 'Template updated' });
      } else {
        await api.post('/templates', form);
        Toast.show({
          type: 'success',
          text1: form.submitToMeta ? 'Template created and submitted to Meta' : 'Template created locally',
        });
      }
      setShowModal(false);
      loadTemplates();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || 'Error' });
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Template', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/templates/${id}`);
            Toast.show({ type: 'success', text1: 'Template deleted' });
            loadTemplates();
          } catch {
            Toast.show({ type: 'error', text1: 'Delete failed' });
          }
        },
      },
    ]);
  };

  const getPreviewText = (body: string) => {
    return body.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const samples: Record<string, string> = {
        name: 'John',
        phone: '919876543210',
        email: 'john@mail.com',
        date: '2026-08-20',
        time: '10:00 AM',
        amount: '₹2,500',
      };
      return samples[key] || `[${key}]`;
    });
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Message Templates</Text>
            <Text style={styles.subtitle}>Create and manage reusable message templates</Text>
          </View>
        </View>
        <View style={styles.btnRow}>
          <Button
            title={syncing ? 'Syncing...' : 'Sync Meta'}
            variant="secondary"
            small
            onPress={syncTemplates}
            disabled={syncing}
            icon={<Ionicons name="sync" size={14} color={Colors.textPrimary} />}
          />
          <Button title="New" small onPress={openCreate} icon={<Ionicons name="add" size={14} color="#fff" />} />
        </View>

        {templates.length === 0 ? (
          <GlassCard>
            <EmptyState icon="document-text-outline" title="No templates yet" />
          </GlassCard>
        ) : (
          templates.map((t) => (
            <GlassCard key={t._id} style={{ marginBottom: 12 }}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{t.name}</Text>
                  <View style={styles.badgesRow}>
                    <Badge text={t.category} variant={t.category === 'text' ? 'info' : t.category === 'image' ? 'success' : 'primary'} />
                    {t.status && <Badge text={t.status} variant={getStatusVariant(t.status)} />}
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    onPress={() => {
                      setPreviewTemplate(t);
                      setShowPreview(true);
                    }}
                  >
                    <Ionicons name="eye-outline" size={18} color={Colors.accent} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => openEdit(t)}>
                    <Ionicons name="pencil" size={18} color={Colors.primaryLight} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(t._id)}>
                    <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.bodyPreview} numberOfLines={2}>
                {t.body}
              </Text>
              {t.variables && t.variables.length > 0 && (
                <View style={styles.varsRow}>
                  {t.variables.map((v) => (
                    <View key={v} style={styles.varChip}>
                      <Text style={styles.varText}>{`{{${v}}}`}</Text>
                    </View>
                  ))}
                </View>
              )}
            </GlassCard>
          ))
        )}
      </ScrollView>

      {/* Create/Edit Modal */}
      <ModalWrapper visible={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Template' : 'New Template'}>
        <View style={{ gap: 14 }}>
          <InputField label="Template Name *" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholder="Welcome Message" />
          <View style={styles.rowGap}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Category</Text>
              <View style={styles.selectRow}>
                {['text', 'image', 'document', 'video', 'template'].map((c) => (
                  <TouchableOpacity key={c} onPress={() => setForm({ ...form, category: c })} style={[styles.selectOption, form.category === c && styles.selectOptionActive]}>
                    <Text style={[styles.selectText, form.category === c && { color: Colors.primaryLight }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
          <View style={styles.rowGap}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Language</Text>
              <View style={styles.selectRow}>
                {[
                  { code: 'en_US', label: 'English' },
                  { code: 'hi', label: 'Hindi' },
                  { code: 'es', label: 'Spanish' },
                ].map((l) => (
                  <TouchableOpacity key={l.code} onPress={() => setForm({ ...form, language: l.code })} style={[styles.selectOption, form.language === l.code && styles.selectOptionActive]}>
                    <Text style={[styles.selectText, form.language === l.code && { color: Colors.primaryLight }]}>{l.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
          {!editing && (
            <TouchableOpacity onPress={() => setForm({ ...form, submitToMeta: !form.submitToMeta })} style={styles.checkRow}>
              <View style={[styles.checkbox, form.submitToMeta && styles.checkboxChecked]}>
                {form.submitToMeta && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.textPrimary }}>Submit to Meta for Approval</Text>
            </TouchableOpacity>
          )}
          {form.category === 'template' && (
            <InputField label="Meta Template Name (Optional)" value={form.metaTemplateName} onChangeText={(v) => setForm({ ...form, metaTemplateName: v })} placeholder="hello_world" />
          )}
          {['image', 'document', 'video'].includes(form.category) && (
            <InputField label="Media URL" value={form.mediaUrl} onChangeText={(v) => setForm({ ...form, mediaUrl: v })} placeholder="https://..." />
          )}
          <InputField
            label="Message Body *"
            value={form.body}
            onChangeText={(v) => setForm({ ...form, body: v })}
            placeholder="Hi {{name}}, your appointment is confirmed for {{date}}."
            multiline
            numberOfLines={5}
            style={{ minHeight: 100, textAlignVertical: 'top' }}
          />
          <Text style={{ fontSize: 11, color: Colors.textSecondary }}>Use {'{{variable}}'} for dynamic content</Text>
          <InputField label="Footer (optional)" value={form.footer} onChangeText={(v) => setForm({ ...form, footer: v })} />

          {/* WhatsApp preview */}
          <View style={styles.previewContainer}>
            <Text style={styles.previewLabel}>PREVIEW</Text>
            <View style={styles.whatsappBubble}>
              <Text style={styles.whatsappText}>{getPreviewText(form.body) || 'Start typing...'}</Text>
            </View>
          </View>
        </View>
        <View style={styles.modalActions}>
          <Button title="Cancel" variant="secondary" onPress={() => setShowModal(false)} />
          <Button title="Save Template" onPress={handleSave} />
        </View>
      </ModalWrapper>

      {/* Preview Modal */}
      <ModalWrapper visible={showPreview} onClose={() => setShowPreview(false)} title={previewTemplate?.name || ''}>
        {previewTemplate && (
          <View>
            <View style={styles.previewContainer}>
              <View style={styles.whatsappBubble}>
                <Text style={styles.whatsappText}>{getPreviewText(previewTemplate.body)}</Text>
                {previewTemplate.footer && <Text style={styles.whatsappFooter}>{previewTemplate.footer}</Text>}
              </View>
            </View>
            {previewTemplate.variables && previewTemplate.variables.length > 0 && (
              <View style={{ marginTop: 16 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 }}>Variables:</Text>
                <View style={styles.varsRow}>
                  {previewTemplate.variables.map((v) => (
                    <Badge key={v} text={`{{${v}}}`} variant="primary" />
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </ModalWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  content: { padding: 16 },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textSecondary },
  btnRow: { flexDirection: 'row', gap: 8, marginBottom: 16, justifyContent: 'flex-end' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  badgesRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  cardActions: { flexDirection: 'row', gap: 10 },
  bodyPreview: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: 8 },
  varsRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  varChip: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 4, backgroundColor: 'rgba(99,102,241,0.1)' },
  varText: { fontSize: 11, color: Colors.primaryLight },
  fieldLabel: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary, marginBottom: 6 },
  rowGap: { flexDirection: 'row', gap: 12 },
  selectRow: { flexDirection: 'row', gap: 6 },
  selectOption: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8, backgroundColor: Colors.bgDark, borderWidth: 1, borderColor: Colors.border },
  selectOptionActive: { backgroundColor: 'rgba(99,102,241,0.15)', borderColor: Colors.primary },
  selectText: { fontSize: 13, color: Colors.textSecondary },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(99,102,241,0.05)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  previewContainer: { backgroundColor: Colors.bgDark, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border },
  previewLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  whatsappBubble: { backgroundColor: '#075e54', borderRadius: 12, borderTopLeftRadius: 12, borderBottomLeftRadius: 0, padding: 12, maxWidth: '85%' },
  whatsappText: { color: '#fff', fontSize: 14, lineHeight: 20 },
  whatsappFooter: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 6 },
  modalActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 20 },
});
