import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View, TextInput, TextInputProps, StyleSheet, TouchableHighlight } from 'react-native';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed/ThemedText';
import { useColors } from '@/hooks/useColorScheme';

type FormFieldButton = {
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
}

export type ValidatedFormFieldRef = {
  focus: () => void;
  selectAll: () => void;
}

type ValidatedFormFieldProps<T extends FieldValues> = Omit<TextInputProps, 'value' | 'onChangeText'> & {
  label: string;
  name: Path<T>;
  control: Control<T>;
  required?: boolean;
  buttons?: FormFieldButton[];
}

/**
 * Validated form field component.
 */
const ValidatedFormFieldComponent = forwardRef<ValidatedFormFieldRef, ValidatedFormFieldProps<FieldValues>>(({
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
    /**
     * Focus the input.
     */
    focus: (): void => {
      inputRef.current?.focus();
    },
    /**
     * Select all the text in the input.
     */
    selectAll: (): void => {
      inputRef.current?.setSelection(0, currentValue.current.length);
    }
  }));

  const colorRed = 'red';

  const styles = StyleSheet.create({
    button: {
      borderLeftColor: colors.accentBorder,
      borderLeftWidth: 1,
      padding: 10,
    },
    errorText: {
      color: colorRed,
      fontSize: 12,
      marginTop: 4,
    },
    input: {
      color: colors.text,
      flex: 1,
      fontSize: 16,
      padding: 10,
    },
    inputContainer: {
      alignItems: 'center',
      backgroundColor: colors.background,
      borderColor: colors.accentBorder,
      borderRadius: 6,
      borderWidth: 1,
      flexDirection: 'row',
    },
    inputError: {
      borderColor: colorRed,
    },
    inputGroup: {
      marginBottom: 6,
    },
    inputLabel: {
      color: colors.textMuted,
      fontSize: 12,
      marginBottom: 4,
    },
    requiredIndicator: {
      color: colorRed,
      marginLeft: 4,
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
                  <MaterialIcons name={button.icon} size={20} color={colors.primary} />
                </TouchableHighlight>
              ))}
            </View>
            {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
          </View>
        )
      }}
    />
  );
});

ValidatedFormFieldComponent.displayName = 'ValidatedFormField';

export const ValidatedFormField = ValidatedFormFieldComponent as <T extends FieldValues>(props: ValidatedFormFieldProps<T> & { ref?: React.Ref<ValidatedFormFieldRef> }) => JSX.Element;