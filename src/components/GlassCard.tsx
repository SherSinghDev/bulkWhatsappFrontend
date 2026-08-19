import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SharedStyles } from '../theme/styles';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
}

export default function GlassCard({ children, style, noPadding }: Props) {
  return (
    <View style={[SharedStyles.glassCard, !noPadding && styles.defaultPadding, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  defaultPadding: {
    padding: 20,
  },
});
