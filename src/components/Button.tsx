import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';
import { SharedStyles } from '../theme/styles';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  small?: boolean;
}

export default function Button({ title, onPress, variant = 'primary', loading, disabled, icon, style, textStyle, small }: Props) {
  const isDisabled = disabled || loading;
  const sizeStyles = small ? { paddingVertical: 6, paddingHorizontal: 14 } : {};

  if (variant === 'primary') {
    return (
      <TouchableOpacity onPress={onPress} disabled={isDisabled} activeOpacity={0.8}>
        <LinearGradient
          colors={['#6366f1', '#8b5cf6', '#06b6d4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[SharedStyles.btnPrimary, sizeStyles, { opacity: isDisabled ? 0.6 : 1 }, style]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              {icon}
              <Text style={[SharedStyles.btnPrimaryText, small && { fontSize: 13 }, textStyle]}>{title}</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'danger') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[SharedStyles.btnDanger, sizeStyles, { opacity: isDisabled ? 0.6 : 1 }, style]}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            {icon}
            <Text style={[SharedStyles.btnDangerText, small && { fontSize: 13 }, textStyle]}>{title}</Text>
          </>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[SharedStyles.btnSecondary, sizeStyles, { opacity: isDisabled ? 0.6 : 1 }, style]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={Colors.textPrimary} />
      ) : (
        <>
          {icon}
          <Text style={[SharedStyles.btnSecondaryText, small && { fontSize: 13 }, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
