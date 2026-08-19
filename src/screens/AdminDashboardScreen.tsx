import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import api from '../lib/api';
import StatCard from '../components/StatCard';
import GlassCard from '../components/GlassCard';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import { Colors } from '../theme/colors';

export default function AdminDashboardScreen() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadGlobalStats = async (isManual = false) => {
    try {
      const res = await api.get('/admin/dashboard');
      setStats(res.data.data);
    } catch {
      if (isManual) {
        Toast.show({ type: 'error', text1: 'Failed to load global platform stats' });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadGlobalStats();
    }, [])
  );

  if (loading) return <LoadingSpinner fullScreen />;

  const statCards = [
    { label: 'Total Tenants', value: stats?.totalUsers || 0, icon: 'people-outline' as const, color: Colors.primary, bg: Colors.statPrimary },
    { label: 'Active Tenants', value: stats?.activeUsers || 0, icon: 'shield-checkmark-outline' as const, color: Colors.success, bg: Colors.statGreen },
    { label: 'Total Contacts', value: stats?.totalContacts || 0, icon: 'book-outline' as const, color: Colors.accent, bg: Colors.statCyan },
    { label: 'Total Campaigns', value: stats?.totalCampaigns || 0, icon: 'megaphone-outline' as const, color: '#a855f7', bg: Colors.statPurple },
    { label: 'Messages Sent', value: stats?.totalSentMessages || 0, icon: 'paper-plane-outline' as const, color: '#f59e0b', bg: Colors.statYellow },
    { label: 'Active Plans', value: stats?.plansCount || 0, icon: 'pricetag-outline' as const, color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadGlobalStats(); }} tintColor={Colors.primary} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Super Admin Platform Overview</Text>
        <Text style={styles.subtitle}>Global metrics across all tenants, message traffic, and system operations</Text>
      </View>

      <View style={styles.statsGrid}>
        {statCards.map((s, i) => (
          <StatCard key={i} label={s.label} value={s.value} icon={s.icon} color={s.color} bgColor={s.bg} />
        ))}
      </View>

      {/* Global Message Traffic */}
      {stats?.globalDailyStats && stats.globalDailyStats.length > 0 && (
        <GlassCard style={{ marginBottom: 16 }}>
          <Text style={styles.sectionTitle}>Global Daily Volume (Last 7 Days)</Text>
          {stats.globalDailyStats.map((day: any, i: number) => (
            <View key={i} style={styles.barRow}>
              <Text style={styles.barLabel}>{day._id?.slice(5) || ''}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${Math.min(
                        100,
                        (day.total / Math.max(...stats.globalDailyStats.map((d: any) => d.total || 1))) * 100
                      )}%`,
                      backgroundColor: Colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barValue}>{day.total || 0}</Text>
            </View>
          ))}
        </GlassCard>
      )}

      {/* Recently Registered Tenants */}
      <GlassCard noPadding>
        <View style={{ padding: 20, paddingBottom: 10 }}>
          <Text style={styles.sectionTitle}>Recent Tenant Signups</Text>
        </View>
        {stats?.recentUsers && stats.recentUsers.length > 0 ? (
          stats.recentUsers.map((u: any) => (
            <View key={u._id} style={styles.userRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{u.name}</Text>
                <Text style={styles.userEmail}>{u.email}</Text>
                {u.companyName ? <Text style={styles.userCompany}>{u.companyName}</Text> : null}
              </View>
              <Badge text={u.plan?.name || 'No Plan'} variant="info" />
              <Badge text={u.isActive ? 'Active' : 'Disabled'} variant={u.isActive ? 'success' : 'danger'} />
            </View>
          ))
        ) : (
          <View style={{ padding: 20 }}>
            <Text style={{ color: Colors.textSecondary }}>No recent tenants</Text>
          </View>
        )}
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  content: { padding: 16 },
  header: { marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: 14 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  barLabel: { fontSize: 12, color: Colors.textSecondary, width: 45 },
  barTrack: { flex: 1, height: 8, backgroundColor: Colors.bgDark, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  barValue: { fontSize: 12, color: Colors.textSecondary, width: 35, textAlign: 'right' },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.5)',
    gap: 10,
  },
  userName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  userEmail: { fontSize: 12, color: Colors.textSecondary },
  userCompany: { fontSize: 11, color: Colors.accent, marginTop: 1 },
});
