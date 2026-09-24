import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#091428' },
          headerTintColor: '#f8fafc',
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: '#091428' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'RRCE ERP Mobile' }} />
        <Stack.Screen name="login" options={{ title: 'Institutional Login' }} />
        <Stack.Screen name="faculty/roll-call" options={{ title: 'Rapid Roll-Call' }} />
        <Stack.Screen name="student/dashboard" options={{ title: 'Student Dashboard' }} />
      </Stack>
    </SafeAreaProvider>
  );
}

