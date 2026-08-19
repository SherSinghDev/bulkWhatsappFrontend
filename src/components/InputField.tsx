import React, { useState } from 'react';
import { TextInput, TextInputProps, StyleSheet, View, Text } from 'react-native';
import { Colors } from '../theme/colors';
import { SharedStyles } from '../theme/styles';

interface Props extends TextInputProps {
  label?: string;
  icon?: React.ReactNode;
}

export default function InputField({ label, icon, style, ...props }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View>
      {label && <Text style={SharedStyles.inputLabel}>{label}</Text>}
      <View style={{ position: 'relative' }}>
        {icon && <View style={styles.iconWrapper}>{icon}</View>}
        <TextInput
          {...props}
          style={[
            SharedStyles.inputField,
            focused && SharedStyles.inputFieldFocused,
            icon ? { paddingLeft: 42 } : {},
            style,
          ]}
          placeholderTextColor={Colors.textSecondary}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    position: 'absolute',
    left: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
});
