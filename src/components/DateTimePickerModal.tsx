import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ModalWrapper from './ModalWrapper';
import Button from './Button';
import { Colors } from '../theme/colors';

interface DateTimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
  initialDate?: Date;
}

export default function DateTimePickerModal({ visible, onClose, onSelect, initialDate }: DateTimePickerModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date());

  useEffect(() => {
    if (visible) {
      const base = initialDate || new Date();
      if (base.getTime() <= Date.now()) {
        setSelectedDate(new Date(Date.now() + 10 * 60 * 1000));
      } else {
        setSelectedDate(base);
      }
    }
  }, [visible, initialDate]);

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const day = selectedDate.getDate();
  const hours = selectedDate.getHours();
  const minutes = selectedDate.getMinutes();

  const changeDateByDays = (delta: number) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + delta);
    setSelectedDate(next);
  };

  const setTime = (h: number, m: number) => {
    const next = new Date(selectedDate);
    next.setHours(h);
    next.setMinutes(m);
    setSelectedDate(next);
  };

  const handleConfirm = () => {
    onSelect(selectedDate);
    onClose();
  };

  const setQuickDate = (offsetHours: number) => {
    const next = new Date(Date.now() + offsetHours * 60 * 60 * 1000);
    setSelectedDate(next);
  };

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedTime = selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <ModalWrapper visible={visible} onClose={onClose} title="Select Schedule Date & Time">
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Quick Schedule Options</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsRow}>
          <TouchableOpacity style={styles.presetChip} onPress={() => setQuickDate(1)}>
            <Text style={styles.presetText}>In 1 Hour</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.presetChip} onPress={() => setQuickDate(3)}>
            <Text style={styles.presetText}>In 3 Hours</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.presetChip} onPress={() => setQuickDate(24)}>
            <Text style={styles.presetText}>Tomorrow Same Time</Text>
          </TouchableOpacity>
        </ScrollView>

        <Text style={styles.sectionTitle}>Date Selection</Text>
        <View style={styles.pickerBox}>
          <TouchableOpacity style={styles.arrowBtn} onPress={() => changeDateByDays(-1)}>
            <Ionicons name="chevron-back" size={20} color={Colors.primaryLight} />
          </TouchableOpacity>
          <View style={styles.dateDisplay}>
            <Ionicons name="calendar-outline" size={18} color={Colors.primaryLight} />
            <Text style={styles.dateDisplayText}>
              {monthNames[month]} {day}, {year} ({selectedDate.toLocaleDateString([], { weekday: 'short' })})
            </Text>
          </View>
          <TouchableOpacity style={styles.arrowBtn} onPress={() => changeDateByDays(1)}>
            <Ionicons name="chevron-forward" size={20} color={Colors.primaryLight} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Time Selection (Current: {formattedTime})</Text>
        <View style={styles.timeRow}>
          <View style={styles.timeCol}>
            <Text style={styles.subLabel}>Hour (0-23)</Text>
            <ScrollView style={styles.timeScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {Array.from({ length: 24 }).map((_, h) => (
                <TouchableOpacity
                  key={h}
                  style={[styles.timeItem, hours === h && styles.timeItemActive]}
                  onPress={() => setTime(h, minutes)}
                >
                  <Text style={[styles.timeItemText, hours === h && styles.timeItemTextActive]}>
                    {h.toString().padStart(2, '0')}:00
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.timeCol}>
            <Text style={styles.subLabel}>Minute (15-min intervals)</Text>
            <ScrollView style={styles.timeScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {[0, 15, 30, 45].map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.timeItem, Math.abs(minutes - m) < 8 && styles.timeItemActive]}
                  onPress={() => setTime(hours, m)}
                >
                  <Text style={[styles.timeItemText, Math.abs(minutes - m) < 8 && styles.timeItemTextActive]}>
                    :{m.toString().padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Ionicons name="time-outline" size={18} color={Colors.accent} />
          <Text style={styles.summaryText}>
            Scheduled for: {selectedDate.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
          </Text>
        </View>

        <View style={styles.actions}>
          <Button title="Cancel" variant="secondary" onPress={onClose} />
          <Button title="Set Date & Time" onPress={handleConfirm} />
        </View>
      </View>
    </ModalWrapper>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginTop: 4 },
  presetsRow: { flexDirection: 'row', marginBottom: 4 },
  presetChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.bgDark,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  presetText: { fontSize: 12, color: Colors.primaryLight, fontWeight: '500' },
  pickerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgDark,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  arrowBtn: { padding: 6, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.05)' },
  dateDisplay: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateDisplayText: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  timeRow: { flexDirection: 'row', gap: 12 },
  timeCol: { flex: 1 },
  subLabel: { fontSize: 11, color: Colors.textSecondary, marginBottom: 6 },
  timeScroll: { height: 120, backgroundColor: Colors.bgDark, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, padding: 4 },
  timeItem: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, alignItems: 'center', marginBottom: 2 },
  timeItemActive: { backgroundColor: Colors.primary },
  timeItemText: { fontSize: 13, color: Colors.textSecondary },
  timeItemTextActive: { color: '#ffffff', fontWeight: '700' },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginTop: 4,
  },
  summaryText: { fontSize: 13, color: Colors.accent, fontWeight: '500' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
});
