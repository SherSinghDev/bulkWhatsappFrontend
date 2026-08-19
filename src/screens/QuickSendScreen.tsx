import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import api from '../lib/api';
import InputField from '../components/InputField';
import Button from '../components/Button';
import GlassCard from '../components/GlassCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { Colors } from '../theme/colors';
import { useNavigation } from '@react-navigation/native';

export default function QuickSendScreen() {
  const navigation = useNavigation<any>();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageType, setMessageType] = useState<'template' | 'custom'>('template');
  const [form, setForm] = useState({
    templateId: '',
    messageBody: '',
    numbers: '',
    delayMin: '1000',
    delayMax: '3000',
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const res = await api.get('/templates');
      const filtered = res.data.data.filter((t: any) => t.category !== 'template' || t.status === 'approved');
      setTemplates(filtered);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load templates' });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (messageType === 'template' && !form.templateId) return Toast.show({ type: 'error', text1: 'Please select a template' });
    if (messageType === 'custom' && !form.messageBody.trim()) return Toast.show({ type: 'error', text1: 'Please enter your custom message' });
    if (!form.numbers.trim()) return Toast.show({ type: 'error', text1: 'Please enter at least one number' });

    setSending(true);
    try {
      const payload = {
        ...form,
        templateId: messageType === 'template' ? form.templateId : '',
        messageBody: messageType === 'custom' ? form.messageBody : '',
        delayMin: parseInt(form.delayMin) || 1000,
        delayMax: parseInt(form.delayMax) || 3000,
      };
      const res = await api.post('/campaigns/quick-send', payload);
      Toast.show({ type: 'success', text1: res.data.message });
      navigation.navigate('CampaignDetail', { id: res.data.data.campaignId });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || 'Failed to start quick send' });
    } finally {
      setSending(false);
    }
  };

  const numberCount = form.numbers.split(/[\n,]/).filter((n) => n.trim()).length;

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ionicons name="flash" size={22} color={Colors.primary} />
          <Text style={styles.title}>Quick Bulk Send</Text>
        </View>
        <Text style={styles.subtitle}>Send messages instantly to a list of numbers without saving them as contacts.</Text>
      </View>

      <GlassCard>
        {/* Message Type Toggle */}
        <View style={styles.toggle}>
          <TouchableOpacity
            onPress={() => setMessageType('template')}
            style={[styles.toggleBtn, messageType === 'template' && styles.toggleBtnActive]}
          >
            <Text style={[styles.toggleText, messageType === 'template' && styles.toggleTextActive]}>Use Template</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMessageType('custom')}
            style={[styles.toggleBtn, messageType === 'custom' && styles.toggleBtnActive]}
          >
            <Text style={[styles.toggleText, messageType === 'custom' && styles.toggleTextActive]}>Custom Message</Text>
          </TouchableOpacity>
        </View>

        {/* Template Selection or Custom Input */}
        {messageType === 'template' ? (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.label}>Select Template</Text>
            <View style={styles.templateGrid}>
              {templates.map((t) => (
                <TouchableOpacity
                  key={t._id}
                  onPress={() => setForm({ ...form, templateId: t._id })}
                  style={[styles.templateCard, form.templateId === t._id && styles.templateCardActive]}
                >
                  <Text style={styles.templateName}>{t.name}</Text>
                  <Text style={styles.templateMeta}>{t.category} • {t.language}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {templates.length === 0 && (
              <Text style={{ fontSize: 13, color: Colors.danger, marginTop: 8 }}>No approved templates found. Sync from Meta first.</Text>
            )}
          </View>
        ) : (
          <View style={{ marginTop: 20 }}>
            <InputField
              label="Message Content"
              value={form.messageBody}
              onChangeText={(v) => setForm({ ...form, messageBody: v })}
              placeholder="Type your custom message here..."
              multiline
              numberOfLines={5}
              style={{ minHeight: 100, textAlignVertical: 'top' }}
            />
            <View style={styles.warningBox}>
              <Ionicons name="information-circle-outline" size={16} color="#f87171" style={{ marginTop: 2 }} />
              <Text style={styles.warningText}>
                <Text style={{ fontWeight: '700' }}>Important: </Text>
                Custom messages can only be sent to users who have messaged you in the last 24 hours. For cold outreach, use an Approved Template.
              </Text>
            </View>
          </View>
        )}

        {/* Numbers Input */}
        <View style={{ marginTop: 20 }}>
          <View style={styles.numbersHeader}>
            <Text style={styles.label}>Phone Numbers</Text>
            <Text style={styles.numberCount}>{numberCount} numbers detected</Text>
          </View>
          <InputField
            value={form.numbers}
            onChangeText={(v) => setForm({ ...form, numbers: v })}
            placeholder={"Paste numbers here (one per line or comma separated)...\n919876543210\n918877665544"}
            multiline
            numberOfLines={8}
            style={{ minHeight: 160, textAlignVertical: 'top', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 14 }}
          />
          <View style={styles.hintRow}>
            <Ionicons name="information-circle-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.hintText}>Numbers will be automatically cleaned and duplicates removed.</Text>
          </View>
        </View>

        {/* Delay Settings */}
        <View style={styles.delayRow}>
          <View style={{ flex: 1 }}>
            <InputField
              label="Min Delay (ms)"
              value={form.delayMin}
              onChangeText={(v) => setForm({ ...form, delayMin: v })}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <InputField
              label="Max Delay (ms)"
              value={form.delayMax}
              onChangeText={(v) => setForm({ ...form, delayMax: v })}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Send Button */}
        <Button
          title={sending ? 'Processing Queue...' : `Send to ${numberCount} Numbers Now`}
          onPress={handleSend}
          loading={sending}
          disabled={sending || numberCount === 0}
          icon={!sending ? <Ionicons name="paper-plane" size={20} color="#fff" /> : undefined}
          style={{ marginTop: 24 }}
        />
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  content: { padding: 16 },
  header: { marginBottom: 24 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  toggle: {
    flexDirection: 'row',
    backgroundColor: Colors.bgDark,
    padding: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  toggleBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  toggleBtnActive: {
    backgroundColor: Colors.bgCard,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  toggleText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  toggleTextActive: { color: Colors.primaryLight },
  label: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  templateGrid: { gap: 10 },
  templateCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  templateCardActive: {
    backgroundColor: 'rgba(99,102,241,0.1)',
    borderColor: Colors.primary,
  },
  templateName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  templateMeta: { fontSize: 11, color: Colors.textSecondary, marginTop: 4 },
  warningBox: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.1)',
  },
  warningText: { flex: 1, fontSize: 12, color: '#fca5a5', lineHeight: 18 },
  numbersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  numberCount: { fontSize: 12, color: Colors.primaryLight, fontWeight: '600' },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  hintText: { fontSize: 11, color: Colors.textSecondary },
  delayRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
  },
});
