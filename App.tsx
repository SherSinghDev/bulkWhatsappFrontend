import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform } from 'react-native';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import { useAuthStore } from './src/store/authStore';
import { AuthStack, AppStack } from './src/navigation/AppNavigator';
import LoadingSpinner from './src/components/LoadingSpinner';
import { Colors } from './src/theme/colors';

const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: Colors.success,
        backgroundColor: Colors.bgCard,
        borderColor: Colors.border,
        borderWidth: 1,
        borderRadius: 12,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 14, fontWeight: '600', color: Colors.textPrimary }}
      text2Style={{ fontSize: 12, color: Colors.textSecondary }}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: Colors.danger,
        backgroundColor: Colors.bgCard,
        borderColor: Colors.border,
        borderWidth: 1,
        borderRadius: 12,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 14, fontWeight: '600', color: Colors.textPrimary }}
      text2Style={{ fontSize: 12, color: Colors.textSecondary }}
    />
  ),
};

export default function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();

    // Inject global scrollbar styles for Web browser runtime
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'saas-custom-scrollbar';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          /* Custom sleek scrollbar matching dark purple/cyan theme */
          * {
            scrollbar-width: thin;
            scrollbar-color: rgba(99, 102, 241, 0.4) #0f172a;
          }
          ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          ::-webkit-scrollbar-track {
            background: #0f172a;
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #6366f1, #8b5cf6);
            border-radius: 4px;
            border: 1px solid rgba(15, 23, 42, 0.6);
          }
          ::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, #818cf8, #a855f7);
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.bgDark }}>
      <NavigationContainer
        theme={{
          dark: true,
          colors: {
            primary: Colors.primary,
            background: Colors.bgDark,
            card: Colors.bgCard,
            text: Colors.textPrimary,
            border: Colors.border,
            notification: Colors.primary,
          },
          fonts: {
            regular: { fontFamily: 'System', fontWeight: '400' as const },
            medium: { fontFamily: 'System', fontWeight: '500' as const },
            bold: { fontFamily: 'System', fontWeight: '700' as const },
            heavy: { fontFamily: 'System', fontWeight: '800' as const },
          },
        }}
      >
        {isAuthenticated ? <AppStack /> : <AuthStack />}
      </NavigationContainer>
      <StatusBar style="light" />
      <Toast config={toastConfig} />
    </GestureHandlerRootView>
  );
}
