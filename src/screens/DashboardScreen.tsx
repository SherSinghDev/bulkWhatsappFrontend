import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import StatCard from '../components/StatCard';
import GlassCard from '../components/GlassCard';
import Badge, { getStatusVariant } from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { Colors } from '../theme/colors';

interface Stats {
  totalContacts: number;
  totalCampaigns: number;
  sentMessages: number;
  deliveredMessages: number;
  failedMessages: number;
  readMessages: number;
  recentCampaigns: any[];
  dailyStats: any[];
}

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async (isManualRefresh = false) => {
    try {
      const res = await api.get('/reports/dashboard');
      setStats(res.data.data);
    } catch {
      if (isManualRefresh) {
        Toast.show({ type: 'error', text1: 'Failed to load dashboard' });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Automatically refresh runtime data every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  if (loading) return <LoadingSpinner fullScreen />;

  const statCards = [
    { label: 'Total Contacts', value: stats?.totalContacts || 0, icon: 'people-outline' as const, color: '#6366f1', bg: Colors.statPrimary },
    { label: 'Campaigns', value: stats?.totalCampaigns || 0, icon: 'megaphone-outline' as const, color: '#06b6d4', bg: Colors.statCyan },
    { label: 'Messages Sent', value: stats?.sentMessages || 0, icon: 'paper-plane-outline' as const, color: '#8b5cf6', bg: Colors.statPurple },
    { label: 'Delivered', value: stats?.deliveredMessages || 0, icon: 'checkmark-circle-outline' as const, color: '#10b981', bg: Colors.statGreen },
    { label: 'Read', value: stats?.readMessages || 0, icon: 'eye-outline' as const, color: '#f59e0b', bg: Colors.statYellow },
    { label: 'Failed', value: stats?.failedMessages || 0, icon: 'close-circle-outline' as const, color: '#ef4444', bg: Colors.statRed },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadStats(); }} tintColor={Colors.primary} />}
    >
      {/* Welcome Banner */}
      <GlassCard style={{ marginBottom: 16 }}>
        <View style={styles.welcomeRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeTitle}>Welcome, {user?.name} 👋</Text>
            <Text style={styles.welcomeSubtitle}>
              {user?.companyName ? `${user.companyName} • ` : ''}Plan: {user?.plan?.name || 'Standard Account'}
            </Text>
          </View>
          <Badge text={user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'admin' ? 'Admin' : 'User'} variant={user?.role === 'super_admin' ? 'primary' : 'info'} />
        </View>
      </GlassCard>

      {/* Stat Cards */}
      <View style={styles.statsGrid}>
        {statCards.map((s, i) => (
          <StatCard key={i} label={s.label} value={s.value} icon={s.icon} color={s.color} bgColor={s.bg} />
        ))}
      </View>

      {/* Daily Stats */}
      {stats?.dailyStats && stats.dailyStats.length > 0 && (
        <GlassCard style={{ marginBottom: 16 }}>
          <Text style={styles.sectionTitle}>Messages (Last 7 Days)</Text>
          {stats.dailyStats.map((day: any, i: number) => (
            <View key={i} style={styles.barRow}>
              <Text style={styles.barLabel}>{day._id?.slice(5) || ''}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${Math.min(100, (day.total / Math.max(...stats.dailyStats.map((d: any) => d.total || 1))) * 100)}%`, backgroundColor: Colors.primary }]} />
              </View>
              <Text style={styles.barValue}>{day.total || 0}</Text>
            </View>
          ))}
        </GlassCard>
      )}

      {/* Delivery Stats */}
      {stats?.dailyStats && stats.dailyStats.length > 0 && (
        <GlassCard style={{ marginBottom: 16 }}>
          <Text style={styles.sectionTitle}>Delivery Breakdown</Text>
          {stats.dailyStats.map((day: any, i: number) => (
            <View key={i} style={styles.deliveryRow}>
              <Text style={styles.barLabel}>{day._id?.slice(5) || ''}</Text>
              <View style={styles.deliveryBars}>
                <View style={styles.miniBarGroup}>
                  <View style={[styles.miniBar, { flex: day.delivered || 0, backgroundColor: '#10b981' }]} />
                  <View style={[styles.miniBar, { flex: day.failed || 0, backgroundColor: '#ef4444' }]} />
                  <View style={[styles.miniBar, { flex: day.read || 0, backgroundColor: '#f59e0b' }]} />
                  {(day.delivered || 0) + (day.failed || 0) + (day.read || 0) === 0 && <View style={[styles.miniBar, { flex: 1, backgroundColor: Colors.bgHover }]} />}
                </View>
              </View>
            </View>
          ))}
          <View style={styles.legend}>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#10b981' }]} /><Text style={styles.legendText}>Delivered</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} /><Text style={styles.legendText}>Failed</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} /><Text style={styles.legendText}>Read</Text></View>
          </View>
        </GlassCard>
      )}

      {/* Recent Campaigns */}
      <GlassCard noPadding>
        <View style={{ padding: 20, paddingBottom: 0 }}>
          <Text style={styles.sectionTitle}>Recent Campaigns</Text>
        </View>
        {stats?.recentCampaigns && stats.recentCampaigns.length > 0 ? (
          stats.recentCampaigns.map((c: any) => (
            <View key={c._id} style={styles.campaignRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.campaignName}>{c.name}</Text>
                <Text style={styles.campaignTemplate}>{c.template?.name || '—'}</Text>
              </View>
              <Badge text={c.status} variant={getStatusVariant(c.status)} />
              <View style={styles.campaignStats}>
                <Text style={{ color: Colors.textPrimary, fontSize: 13 }}>{c.sentCount}</Text>
                <Text style={{ color: '#10b981', fontSize: 13 }}>{c.deliveredCount}</Text>
                <Text style={{ color: '#ef4444', fontSize: 13 }}>{c.failedCount}</Text>
              </View>
            </View>
          ))
        ) : (
          <EmptyState icon="megaphone-outline" title="No campaigns yet" subtitle="Create your first campaign to see data here" />
        )}
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  content: { padding: 16 },
  welcomeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  welcomeTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  welcomeSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  barLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    width: 45,
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.bgDark,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barValue: {
    fontSize: 12,
    color: Colors.textSecondary,
    width: 35,
    textAlign: 'right',
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  deliveryBars: {
    flex: 1,
  },
  miniBarGroup: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  miniBar: {
    height: '100%',
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  campaignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.5)',
    gap: 10,
  },
  campaignName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  campaignTemplate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  campaignStats: {
    flexDirection: 'row',
    gap: 12,
  },
});
