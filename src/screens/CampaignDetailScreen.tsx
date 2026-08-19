import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useRoute, useNavigation } from '@react-navigation/native';
import api from '../lib/api';
import StatCard from '../components/StatCard';
import Badge, { getStatusVariant } from '../components/Badge';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { Colors } from '../theme/colors';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function CampaignDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const id = route.params?.id;
  const [campaign, setCampaign] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async (page = 1) => {
    try {
      const [c, l] = await Promise.all([
        api.get(`/campaigns/${id}`),
        api.get(`/campaigns/${id}/logs`, { params: { page, limit: 50, status: statusFilter } }),
      ]);
      setCampaign(c.data.data);
      setLogs(l.data.data);
      setPagination(l.data.pagination);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load' });
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = async () => {
    try {
      const res = await api.get(`/reports/campaigns/${id}/export`, { responseType: 'blob' });
      const fileUri = (FileSystem as any).documentDirectory ? (FileSystem as any).documentDirectory + `campaign_${id}.csv` : `campaign_${id}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, res.data, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(fileUri);
      Toast.show({ type: 'success', text1: 'Exported' });
    } catch {
      Toast.show({ type: 'error', text1: 'Export failed' });
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!campaign)
    return (
      <View style={styles.container}>
        <Text style={{ color: Colors.textSecondary, textAlign: 'center', padding: 40 }}>Campaign not found</Text>
      </View>
    );

  const statCards = [
    { label: 'Total', value: campaign.totalMessages, color: '#6366f1', bg: Colors.statPrimary, icon: 'layers-outline' as const },
    { label: 'Sent', value: campaign.sentCount, color: '#8b5cf6', bg: Colors.statPurple, icon: 'paper-plane-outline' as const },
    { label: 'Delivered', value: campaign.deliveredCount, color: '#10b981', bg: Colors.statGreen, icon: 'checkmark-circle-outline' as const },
    { label: 'Read', value: campaign.readCount, color: '#f59e0b', bg: Colors.statYellow, icon: 'eye-outline' as const },
    { label: 'Failed', value: campaign.failedCount, color: '#ef4444', bg: Colors.statRed, icon: 'close-circle-outline' as const },
  ];

  const filters = ['', 'queued', 'sent', 'delivered', 'read', 'failed'];

  return (
    <View style={styles.container}>
      <FlatList
        data={logs}
        keyExtractor={(l) => l._id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={18} color={Colors.textPrimary} />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{campaign.name}</Text>
                <Text style={styles.subtitle}>Template: {campaign.template?.name || '—'}</Text>
              </View>
              <Button title="Export" variant="secondary" small onPress={exportCSV} icon={<Ionicons name="download-outline" size={14} color={Colors.textPrimary} />} />
            </View>

            <View style={styles.statsGrid}>
              {statCards.map((s, i) => (
                <StatCard key={i} label={s.label} value={s.value} icon={s.icon} color={s.color} bgColor={s.bg} />
              ))}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {filters.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setStatusFilter(s)}
                  style={[styles.filterChip, statusFilter === s && styles.filterChipActive]}
                >
                  <Text style={[styles.filterText, statusFilter === s && styles.filterTextActive]}>{s || 'All'}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        }
        renderItem={({ item: l }) => (
          <View style={styles.logRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.logName}>{l.contact?.name || '—'}</Text>
              <Text style={styles.logPhone}>{l.phone}</Text>
            </View>
            <Badge text={l.status} variant={getStatusVariant(l.status)} />
            <Text style={styles.logDate}>{l.sentAt ? new Date(l.sentAt).toLocaleTimeString() : '—'}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>No logs found</Text>
          </View>
        }
        ListFooterComponent={
          pagination.totalPages > 1 ? (
            <View style={styles.paginationRow}>
              <Button title="Previous" variant="secondary" small disabled={pagination.page <= 1} onPress={() => loadData(pagination.page - 1)} />
              <Text style={styles.pageText}>
                {pagination.page}/{pagination.totalPages}
              </Text>
              <Button title="Next" variant="secondary" small disabled={pagination.page >= pagination.totalPages} onPress={() => loadData(pagination.page + 1)} />
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  content: { padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.bgHover, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textSecondary },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  filterChip: { paddingVertical: 4, paddingHorizontal: 14, borderRadius: 8, backgroundColor: Colors.bgHover, borderWidth: 1, borderColor: Colors.border, marginRight: 6 },
  filterChipActive: { backgroundColor: Colors.primary },
  filterText: { fontSize: 12, color: Colors.textSecondary, textTransform: 'capitalize' },
  filterTextActive: { color: '#fff' },
  logRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(51,65,85,0.5)', gap: 10, backgroundColor: 'rgba(30,41,59,0.9)' },
  logName: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  logPhone: { fontSize: 13, color: Colors.textSecondary, fontFamily: 'monospace' },
  logDate: { fontSize: 12, color: Colors.textSecondary, width: 70, textAlign: 'right' },
  emptyRow: { padding: 40, alignItems: 'center' },
  emptyText: { color: Colors.textSecondary },
  paginationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16 },
  pageText: { fontSize: 13, color: Colors.textSecondary },
});
