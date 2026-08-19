import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'primary';

interface Props {
  text: string;
  variant?: BadgeVariant;
  style?: any;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  success: Colors.badgeSuccess,
  warning: Colors.badgeWarning,
  danger: Colors.badgeDanger,
  info: Colors.badgeInfo,
  primary: Colors.badgePrimary,
};

export default function Badge({ text, variant = 'info', style }: Props) {
  const colors = variantColors[variant] || variantColors.info;
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, style]}>
      <Text style={[styles.text, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

export function getStatusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    completed: 'success',
    running: 'info',
    pending: 'warning',
    scheduled: 'primary',
    failed: 'danger',
    draft: 'warning',
    cancelled: 'danger',
    paused: 'warning',
    sent: 'info',
    delivered: 'success',
    read: 'success',
    queued: 'warning',
    approved: 'success',
    rejected: 'danger',
    local: 'info',
    disabled: 'danger',
    active: 'success',
    inactive: 'danger',
  };
  return map[status] || 'info';
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
