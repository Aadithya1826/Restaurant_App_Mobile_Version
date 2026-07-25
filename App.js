import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/LoginScreen';
import CashierDashboard from './src/screens/CashierDashboard';
import AdminDashboard from './src/screens/AdminDashboard';
import ManagerDashboard from './src/screens/ManagerDashboard';
import { ActivityIndicator, View } from 'react-native';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const getInitialRoute = () => {
    if (!isAuthenticated) return 'Onboarding';
    if (user?.role === 'SUPER_ADMIN' || user?.role === 'PLATFORM_ADMIN') return 'AdminDashboard';
    if (user?.role === 'CASHIER') return 'CashierDashboard';
    return 'ManagerDashboard';
  };

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={getInitialRoute()}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
          <Stack.Screen name="ManagerDashboard" component={ManagerDashboard} />
          <Stack.Screen name="CashierDashboard" component={CashierDashboard} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
