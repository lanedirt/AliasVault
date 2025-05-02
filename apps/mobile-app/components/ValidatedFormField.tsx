import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View, TextInput, TextInputProps, StyleSheet, TouchableOpacity, TouchableHighlight } from 'react-native';
import { ThemedText } from './ThemedText';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import { useColors } from '@/hooks/useColorScheme';
import { MaterialIcons } from '@expo/vector-icons';

interface FormFieldButton {
  icon: string;
  onPress: () => void;
}

export interface ValidatedFormFieldRef {
  focus: () => void;
  selectAll: () => void;
}

interface ValidatedFormFieldProps<T extends FieldValues> extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  label: string;
  name: Path<T>;
  control: Control<T>;
  required?: boolean;
  buttons?: FormFieldButton[];
}

export const ValidatedFormField = forwardRef<ValidatedFormFieldRef, ValidatedFormFieldProps<any>>(({
  label,
  name,
  control,
  required,
  buttons,
  ...props
}, ref) => {
  const colors = useColors();
  const inputRef = React.useRef<TextInput>(null);
  const currentValue = useRef<string>('');

  useImperativeHandle(ref, () => ({
    focus: () => {
      console.log(inputRef.current);
      inputRef.current?.focus();
    },
    selectAll: () => {
      inputRef.current?.setSelection(0, currentValue.current.length);
    }
  }));

  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    inputGroup: {
      marginBottom: 6,
    },
    inputLabel: {
      fontSize: 12,
      marginBottom: 4,
      color: colors.textMuted,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.accentBorder,
      borderRadius: 4,
      backgroundColor: colors.background,
    },
    input: {
      flex: 1,
      padding: 10,
      fontSize: 16,
      color: colors.text,
    },
    inputError: {
      borderColor: 'red',
    },
    errorText: {
      color: 'red',
      fontSize: 12,
      marginTop: 4,
    },
    requiredIndicator: {
      color: 'red',
      marginLeft: 4,
    },
    button: {
      padding: 10,
      borderLeftWidth: 1,
      borderLeftColor: colors.accentBorder,
    },
  });

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        currentValue.current = value as string;
        return (
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>{label} {required && <ThemedText style={styles.requiredIndicator}>*</ThemedText>}</ThemedText>
            <View style={[styles.inputContainer, error ? styles.inputError : null]}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={value as string}
              placeholderTextColor={colors.textMuted}
              onChangeText={onChange}
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect={false}
              {...props}
            />
            {buttons?.map((button, index) => (
              <TouchableHighlight
                key={index}
                style={styles.button}
                onPress={button.onPress}
                underlayColor={colors.accentBackground}
              >
                <MaterialIcons name={button.icon as any} size={20} color={colors.primary} />
              </TouchableHighlight>
            ))}
          </View>
          {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
        </View>
      )}}
    />
  );
});