import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '@/theme/colors';
import { ItemsScreen } from '@/screens/ItemsScreen';
import { AddItemScreen } from '@/screens/AddItemScreen';
import { SuggestionsScreen } from '@/screens/SuggestionsScreen';
import { SpacesScreen } from '@/screens/SpacesScreen';
import { ShoppingScreen } from '@/screens/ShoppingScreen';
import { LabelsScreen } from '@/screens/LabelsScreen';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { loadPreferences } from '@/storage/preferencesStorage';
import type { ItemsStackParamList, SpacesStackParamList } from './types';

const Tabs = createBottomTabNavigator();
const ItemsStack = createNativeStackNavigator<ItemsStackParamList>();
const SpacesStack = createNativeStackNavigator<SpacesStackParamList>();

function ItemsStackNav() {
  return (
    <ItemsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
      }}
    >
      <ItemsStack.Screen name="ItemsList" component={ItemsScreen} options={{ title: '物品' }} />
      <ItemsStack.Screen name="AddItem" component={AddItemScreen} options={{ title: '新增物品' }} />
    </ItemsStack.Navigator>
  );
}

function SpacesStackNav() {
  return (
    <SpacesStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
      }}
    >
      <SpacesStack.Screen name="SpacesList" component={SpacesScreen} options={{ title: '空間' }} />
      <SpacesStack.Screen name="Labels" component={LabelsScreen} options={{ title: '列印標籤' }} />
    </SpacesStack.Navigator>
  );
}

function tabIcon(emoji: string) {
  return ({ focused }: { focused: boolean }) => (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.55 }}>{emoji}</Text>
  );
}

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 6,
          paddingTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="ItemsTab"
        component={ItemsStackNav}
        options={{ title: '物品', headerShown: false, tabBarIcon: tabIcon('📦') }}
      />
      <Tabs.Screen
        name="Suggestions"
        component={SuggestionsScreen}
        options={{ title: '建議', tabBarIcon: tabIcon('💡') }}
      />
      <Tabs.Screen
        name="SpacesTab"
        component={SpacesStackNav}
        options={{ title: '空間', headerShown: false, tabBarIcon: tabIcon('🗄️') }}
      />
      <Tabs.Screen
        name="Shopping"
        component={ShoppingScreen}
        options={{ title: '購物', tabBarIcon: tabIcon('🛒') }}
      />
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  const refresh = useCallback(async () => {
    const prefs = await loadPreferences();
    setOnboarded(prefs.onboarded);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (onboarded === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!onboarded) {
    return <OnboardingScreen onDone={refresh} />;
  }

  return (
    <NavigationContainer>
      <MainTabs />
    </NavigationContainer>
  );
}
