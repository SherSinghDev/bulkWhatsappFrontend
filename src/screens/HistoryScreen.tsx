import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import api from '../lib/api';
import GlassCard from '../components/GlassCard';
import InputField from '../components/InputField';
import Badge, { getStatusVariant } from '../components/Badge';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { Colors } from '../theme/colors';

export default function HistoryScreen() {
  const [logs, setLogs] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async (page = 1) => {
    try {
      const res = await api.get('/reports/messages', { params: { page, limit: 50, search } });
      setLogs(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Message History</Text>
          <Text style={styles.subtitle}>All sent messages across your campaigns</Text>
        </View>
      </View>

      <View style={{ marginBottom: 12 }}>
        <InputField
          value={search}
          onChangeText={setSearch}
          placeholder="Search by phone..."
          onSubmitEditing={() => {
            setLoading(true);
            loadLogs(1);
          }}
          icon={<Ionicons name="search" size={18} color={Colors.textSecondary} />}
        />
      </View>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <GlassCard noPadding style={{ flex: 1 }}>
          <FlatList
            data={logs}
            keyExtractor={(l) => l._id}
            renderItem={({ item: l }) => (
              <View style={styles.logRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.logName}>{l.contact?.name || '—'}</Text>
                  <Text style={styles.logPhone}>{l.phone}</Text>
                  <Text style={styles.logCampaign}>{l.campaign?.name || '—'}</Text>
                </View>
                <View style={styles.rightCol}>
                  <Badge text={l.status} variant={getStatusVariant(l.status)} />
                  <Text style={styles.logDate}>{new Date(l.createdAt).toLocaleString()}</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={<EmptyState icon="time-outline" title="No message history" />}
            ListFooterComponent={
              pagination.totalPages > 1 ? (
                <View style={styles.paginationRow}>
                  <Button title="Previous" variant="secondary" small disabled={pagination.page <= 1} onPress={() => loadLogs(pagination.page - 1)} />
                  <Text style={styles.pageText}>
                    {pagination.page}/{pagination.totalPages}
                  </Text>
                  <Button title="Next" variant="secondary" small disabled={pagination.page >= pagination.totalPages} onPress={() => loadLogs(pagination.page + 1)} />
                </View>
              ) : null
            }
          />
        </GlassCard>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark, padding: 16 },
  header: { flexDirection: 'row', marginBottom: 12, flexWrap: 'wrap', gap: 12 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textSecondary },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51,65,85,0.5)',
    gap: 10,
  },
  logName: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  logPhone: { fontSize: 13, color: Colors.textSecondary, fontFamily: 'monospace', marginTop: 1 },
  logCampaign: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  rightCol: { alignItems: 'flex-end', gap: 4 },
  logDate: { fontSize: 11, color: Colors.textSecondary },
  paginationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16 },
  pageText: { fontSize: 13, color: Colors.textSecondary },
});
