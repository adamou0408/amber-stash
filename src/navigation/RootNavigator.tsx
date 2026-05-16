import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { colors } from '@/theme/colors';
import { ItemsScreen } from '@/screens/ItemsScreen';
import { AddItemScreen } from '@/screens/AddItemScreen';
import { SuggestionsScreen } from '@/screens/SuggestionsScreen';
import { SpacesScreen } from '@/screens/SpacesScreen';
import { ShoppingScreen } from '@/screens/ShoppingScreen';
import { LabelsScreen } from '@/screens/LabelsScreen';
import type { ItemsStackParamList } from './types';

const Tabs = createBottomTabNavigator();
const ItemsStack = createNativeStackNavigator<ItemsStackParamList>();

function ItemsStackNav() {
  return (
    <ItemsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { color: colors.text },
      }}
    >
      <ItemsStack.Screen name="ItemsList" component={ItemsScreen} options={{ title: '物品' }} />
      <ItemsStack.Screen name="AddItem" component={AddItemScreen} options={{ title: '新增物品' }} />
    </ItemsStack.Navigator>
  );
}

function tabIcon(emoji: string) {
  return ({ focused }: { focused: boolean }) => (
    <Text style={{ fontSize: focused ? 22 : 18 }}>{emoji}</Text>
  );
}

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Tabs.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTitleStyle: { color: colors.text },
          tabBarActiveTintColor: colors.primary,
          tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        }}
      >
        <Tabs.Screen
          name="ItemsTab"
          component={ItemsStackNav}
          options={{ title: '物品', headerShown: false, tabBarIcon: tabIcon('📦') }}
        />
        <Tabs.Screen
          name="Spaces"
          component={SpacesScreen}
          options={{ title: '空間', tabBarIcon: tabIcon('🗄️') }}
        />
        <Tabs.Screen
          name="Labels"
          component={LabelsScreen}
          options={{ title: '標籤', tabBarIcon: tabIcon('🏷️') }}
        />
        <Tabs.Screen
          name="Suggestions"
          component={SuggestionsScreen}
          options={{ title: '建議', tabBarIcon: tabIcon('💡') }}
        />
        <Tabs.Screen
          name="Shopping"
          component={ShoppingScreen}
          options={{ title: '購物', tabBarIcon: tabIcon('🛒') }}
        />
      </Tabs.Navigator>
    </NavigationContainer>
  );
}
