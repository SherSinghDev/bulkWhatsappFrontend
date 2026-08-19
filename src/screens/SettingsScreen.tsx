import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import GlassCard from '../components/GlassCard';
import InputField from '../components/InputField';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { Colors } from '../theme/colors';

export default function SettingsScreen() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('whatsapp');
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', companyName: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name,
        email: user.email,
        companyName: user.companyName || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      const res = await api.get('/whatsapp-config');
      setSettings(res.data.data);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load WhatsApp configuration' });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await api.put('/whatsapp-config', settings);
      Toast.show({ type: 'success', text1: 'WhatsApp settings saved' });
      loadSettings();
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = async () => {
    setSaving(true);
    try {
      await api.put('/auth/profile', profileForm);
      Toast.show({ type: 'success', text1: 'Profile updated' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || 'Error' });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      Toast.show({ type: 'error', text1: 'Please fill all password fields' });
      return;
    }
    setSaving(true);
    try {
      await api.put('/auth/password', passwordForm);
      Toast.show({ type: 'success', text1: 'Password changed' });
      setPasswordForm({ currentPassword: '', newPassword: '' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || 'Error' });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'whatsapp', label: 'WhatsApp API', icon: 'key-outline' as const },
    { id: 'business', label: 'Business', icon: 'business-outline' as const },
    { id: 'rate', label: 'Rate Limits', icon: 'shield-checkmark-outline' as const },
    { id: 'profile', label: 'Account', icon: 'person-outline' as const },
  ];

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Settings & Configuration</Text>
        <Text style={styles.subtitle}>Manage your Meta Cloud API connection, business details, and account credentials</Text>
      </View>

      {/* Tab Buttons */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.id}
            onPress={() => setActiveTab(t.id)}
            style={[styles.tabBtn, activeTab === t.id && styles.tabBtnActive]}
          >
            <Ionicons name={t.icon} size={18} color={activeTab === t.id ? Colors.primaryLight : Colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === t.id && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* WhatsApp API Tab */}
      {activeTab === 'whatsapp' && (
        <GlassCard>
          <Text style={styles.sectionTitle}>WhatsApp Cloud API</Text>
          <Text style={styles.sectionSubtitle}>Configure your dedicated Meta Developer credentials for sending bulk messages</Text>
          <View style={{ gap: 16, marginTop: 16 }}>
            <InputField
              label="System User Access Token"
              value={settings.whatsappAccessToken || ''}
              onChangeText={(v) => setSettings({ ...settings, whatsappAccessToken: v })}
              placeholder="EAAxxxxxxx"
              secureTextEntry
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <InputField
                  label="Phone Number ID"
                  value={settings.whatsappPhoneNumberId || ''}
                  onChangeText={(v) => setSettings({ ...settings, whatsappPhoneNumberId: v })}
                  placeholder="1234567890"
                />
              </View>
              <View style={{ flex: 1 }}>
                <InputField
                  label="Business Account ID"
                  value={settings.whatsappBusinessAccountId || ''}
                  onChangeText={(v) => setSettings({ ...settings, whatsappBusinessAccountId: v })}
                  placeholder="1234567890"
                />
              </View>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={18} color={Colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: Colors.textPrimary, fontWeight: '600' }}>Your Webhook Verify Token:</Text>
                <Text style={{ fontSize: 12, color: Colors.accent, fontFamily: 'monospace', marginTop: 2 }}>
                  {settings.webhookVerifyToken || 'saas_wh_token'}
                </Text>
              </View>
            </View>

            <Button
              title={saving ? 'Saving...' : 'Save API Configuration'}
              onPress={saveSettings}
              loading={saving}
              icon={<Ionicons name="save-outline" size={18} color="#fff" />}
              style={{ alignSelf: 'flex-start' }}
            />
          </View>
        </GlassCard>
      )}

      {/* Business Tab */}
      {activeTab === 'business' && (
        <GlassCard>
          <Text style={styles.sectionTitle}>Business Details</Text>
          <Text style={styles.sectionSubtitle}>Information used in messaging templates and reports</Text>
          <View style={{ gap: 16, marginTop: 16 }}>
            <InputField label="Business Name" value={settings.businessName || ''} onChangeText={(v) => setSettings({ ...settings, businessName: v })} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <InputField label="Contact Phone" value={settings.businessPhone || ''} onChangeText={(v) => setSettings({ ...settings, businessPhone: v })} keyboardType="phone-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <InputField label="Contact Email" value={settings.businessEmail || ''} onChangeText={(v) => setSettings({ ...settings, businessEmail: v })} keyboardType="email-address" />
              </View>
            </View>
            <InputField label="Website URL" value={settings.businessWebsite || ''} onChangeText={(v) => setSettings({ ...settings, businessWebsite: v })} placeholder="https://example.com" />
            <InputField label="Default Country Code" value={settings.defaultCountryCode || ''} onChangeText={(v) => setSettings({ ...settings, defaultCountryCode: v })} placeholder="+91" />
            <Button title={saving ? 'Saving...' : 'Update Business Details'} onPress={saveSettings} loading={saving} icon={<Ionicons name="save-outline" size={18} color="#fff" />} style={{ alignSelf: 'flex-start' }} />
          </View>
        </GlassCard>
      )}

      {/* Rate Limits Tab */}
      {activeTab === 'rate' && (
        <GlassCard>
          <Text style={styles.sectionTitle}>Campaign Rate Control</Text>
          <Text style={styles.sectionSubtitle}>Controls sending speed to maintain number health and avoid Meta restrictions</Text>
          <View style={{ gap: 16, marginTop: 16 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <InputField label="Min Delay (ms)" value={String(settings.messageDelayMin || 1000)} onChangeText={(v) => setSettings({ ...settings, messageDelayMin: parseInt(v) || 0 })} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <InputField label="Max Delay (ms)" value={String(settings.messageDelayMax || 3000)} onChangeText={(v) => setSettings({ ...settings, messageDelayMax: parseInt(v) || 0 })} keyboardType="numeric" />
              </View>
            </View>
            <InputField label="Max Messages Per Second" value={String(settings.messagesPerSecond || 10)} onChangeText={(v) => setSettings({ ...settings, messagesPerSecond: parseInt(v) || 0 })} keyboardType="numeric" />
            <Button title={saving ? 'Saving...' : 'Save Rate Limits'} onPress={saveSettings} loading={saving} icon={<Ionicons name="save-outline" size={18} color="#fff" />} style={{ alignSelf: 'flex-start' }} />
          </View>
        </GlassCard>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <>
          <GlassCard style={{ marginBottom: 16 }}>
            <Text style={styles.sectionTitle}>Account Profile</Text>
            <Text style={styles.sectionSubtitle}>Manage your profile details and preferences</Text>
            <View style={{ gap: 16, marginTop: 16 }}>
              <InputField label="Name" value={profileForm.name} onChangeText={(v) => setProfileForm({ ...profileForm, name: v })} />
              <InputField label="Email" value={profileForm.email} onChangeText={(v) => setProfileForm({ ...profileForm, email: v })} keyboardType="email-address" />
              <InputField label="Company Name" value={profileForm.companyName} onChangeText={(v) => setProfileForm({ ...profileForm, companyName: v })} />
              <InputField label="Phone Number" value={profileForm.phone} onChangeText={(v) => setProfileForm({ ...profileForm, phone: v })} keyboardType="phone-pad" />
              <Button title="Update Profile" onPress={updateProfile} loading={saving} style={{ alignSelf: 'flex-start' }} />
            </View>
          </GlassCard>

          <View style={styles.securityCard}>
            <Text style={[styles.sectionTitle, { color: '#f87171' }]}>Security & Password</Text>
            <Text style={styles.sectionSubtitle}>Change your account password regularly</Text>
            <View style={{ gap: 16, marginTop: 16 }}>
              <InputField label="Current Password" value={passwordForm.currentPassword} onChangeText={(v) => setPasswordForm({ ...passwordForm, currentPassword: v })} secureTextEntry />
              <InputField label="New Password" value={passwordForm.newPassword} onChangeText={(v) => setPasswordForm({ ...passwordForm, newPassword: v })} secureTextEntry />
              <Button title="Change Password" variant="danger" onPress={changePassword} loading={saving} style={{ alignSelf: 'flex-start' }} />
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  content: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginRight: 8,
    backgroundColor: 'transparent',
  },
  tabBtnActive: { backgroundColor: 'rgba(99,102,241,0.12)' },
  tabText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  tabTextActive: { color: Colors.primaryLight, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: Colors.textSecondary },
  infoBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.2)',
    alignItems: 'center',
  },
  securityCard: {
    padding: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
});
