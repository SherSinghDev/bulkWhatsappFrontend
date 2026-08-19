import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import api from '../lib/api';
import GlassCard from '../components/GlassCard';
import Badge, { getStatusVariant } from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { Colors } from '../theme/colors';

export default function ReportsScreen() {
  const navigation = useNavigation<any>();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const res = await api.get('/campaigns?limit=100');
      setCampaigns(res.data.data);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load' });
    } finally {
      setLoading(false);
    }
  };

  const deliveryRate = (c: any) => (c.totalMessages > 0 ? Math.round((c.deliveredCount / c.totalMessages) * 100) : 0);

  const renderCampaign = ({ item: c }: { item: any }) => {
    const rate = deliveryRate(c);
    const barColor = rate > 70 ? '#10b981' : rate > 40 ? '#f59e0b' : '#ef4444';

    return (
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.campaignName}>{c.name}</Text>
          <View style={styles.metaRow}>
            <Badge text={c.status} variant={getStatusVariant(c.status)} />
            <Text style={styles.dateText}>{new Date(c.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>
        <View style={styles.statsCol}>
          <View style={styles.statRow}>
            <Text style={styles.statText}>Sent: {c.sentCount}</Text>
            <Text style={[styles.statText, { color: '#10b981' }]}>Del: {c.deliveredCount}</Text>
            <Text style={[styles.statText, { color: '#ef4444' }]}>Fail: {c.failedCount}</Text>
          </View>
          <View style={styles.rateRow}>
            <View style={styles.rateTrack}>
              <View style={[styles.rateFill, { width: `${rate}%`, backgroundColor: barColor }]} />
            </View>
            <Text style={[styles.rateText, { color: barColor }]}>{rate}%</Text>
          </View>
        </View>
        <View style={styles.actionsCol}>
          <TouchableOpacity onPress={() => navigation.navigate('CampaignDetail', { id: c._id })}>
            <Ionicons name="eye-outline" size={18} color={Colors.primaryLight} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Campaign Reports</Text>
        <Text style={styles.subtitle}>View delivery analytics and export campaign data</Text>
      </View>

      {campaigns.length === 0 ? (
        <GlassCard>
          <EmptyState icon="analytics-outline" title="No reports available" />
        </GlassCard>
      ) : (
        <GlassCard noPadding style={{ flex: 1 }}>
          <FlatList data={campaigns} keyExtractor={(c) => c._id} renderItem={renderCampaign} />
        </GlassCard>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark, padding: 16 },
  header: { marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textSecondary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51,65,85,0.5)',
    gap: 10,
  },
  campaignName: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateText: { fontSize: 12, color: Colors.textSecondary },
  statsCol: { width: 150 },
  statRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  statText: { fontSize: 11, color: Colors.textSecondary },
  rateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rateTrack: { flex: 1, height: 4, backgroundColor: Colors.bgDark, borderRadius: 2, overflow: 'hidden' },
  rateFill: { height: '100%', borderRadius: 2 },
  rateText: { fontSize: 12, fontWeight: '600', width: 35, textAlign: 'right' },
  actionsCol: { gap: 8 },
});
