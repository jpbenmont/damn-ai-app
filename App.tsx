import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  useFonts,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
  Outfit_900Black,
} from '@expo-google-fonts/outfit';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';

import { AppProvider, useApp } from './src/context/AppContext';
import { COLORS } from './src/theme/colors';
import { initNotifications } from './src/services/notifications';
import { reminderService } from './src/services/reminderService';
import { shoppingLocationService } from './src/services/shoppingLocationService';

// Screens
import { SplashScreen } from './src/screens/SplashScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { FamilyScreen } from './src/screens/FamilyScreen';
import { RemindersScreen } from './src/screens/RemindersScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';

// Components & Modals
import { LiquidDockNav } from './src/components/LiquidDockNav';
import { LockInModal } from './src/modals/LockInModal';
import { FinishTodayModal } from './src/modals/FinishTodayModal';
import { RoutineEditorModal } from './src/modals/RoutineEditorModal';
import { AIChatModal } from './src/modals/AIChatModal';
import { MemberProfileModal } from './src/modals/MemberProfileModal';

const MainNavigator: React.FC = () => {
  const { screen, state } = useApp();

  if (screen === 'splash') {
    return <SplashScreen />;
  }

  if (screen === 'auth') {
    return <AuthScreen />;
  }

  if (screen === 'onboarding') {
    return <OnboardingScreen />;
  }

  const renderActiveTab = () => {
    switch (state.activeTab) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'reminders':
      case 'checklist':
      case 'workout':
      case 'supplements':
        return <RemindersScreen />;
      case 'family':
      case 'squad':
        return <FamilyScreen />;
      case 'analytics':
        return <AnalyticsScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <View style={styles.appContainer}>
      {renderActiveTab()}

      {/* Floating Bottom Capsule Dock */}
      <LiquidDockNav />

      {/* Global Modals */}
      <LockInModal />
      <FinishTodayModal />
      <RoutineEditorModal />
      <AIChatModal />
      <MemberProfileModal />
    </View>
  );
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    Outfit_900Black,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    initNotifications();
    reminderService.init();
    shoppingLocationService.init();
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" backgroundColor={COLORS.bgMain} />
        <AppProvider>
          <MainNavigator />
        </AppProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgMain,
  },
  appContainer: {
    flex: 1,
    backgroundColor: COLORS.bgMain,
    position: 'relative',
    width: '100%',
  },
});
