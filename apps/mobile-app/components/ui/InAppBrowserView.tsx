import React from 'react';
import { TouchableOpacity, Text, ViewStyle, TextStyle } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import { useColors } from '@/hooks/useColorScheme';

type InAppBrowserViewProps = {
  url: string;
  title?: string;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/**
 * A component that opens URLs in a native Safari View Controller on iOS,
 * or the default browser on Android.
 */
export function InAppBrowserView({ url, title, onPress, style, textStyle }: InAppBrowserViewProps): React.ReactNode {
  const colors = useColors();

  /**
   * Handles the press event by opening the URL in a Safari View Controller.
   */
  const handlePress = async (): Promise<void> => {
    if (onPress) {
      onPress();
    }

    try {
      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        controlsColor: colors.primary,
        toolbarColor: colors.accentBackground,
        enableBarCollapsing: true,
        showInRecents: true,
      });
    } catch (error) {
      console.error('Error opening Safari View:', error);
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} style={style}>
      <Text style={textStyle}>
        {title ?? url}
      </Text>
    </TouchableOpacity>
  );
}
