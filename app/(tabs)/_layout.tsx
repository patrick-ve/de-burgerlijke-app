import React from 'react';
import { Tabs } from 'expo-router';
import {
  BookOpen,
  ShoppingCart,
  CheckSquare,
} from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray[400],
        tabBarStyle: {
          borderTopColor: Colors.gray[200],
          backgroundColor: Colors.background,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Recipes',
          tabBarIcon: ({ color }) => (
            <BookOpen size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="groceries"
        options={{
          title: 'Groceries',
          tabBarIcon: ({ color }) => (
            <ShoppingCart size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="todos"
        options={{
          title: 'To-dos',
          tabBarIcon: ({ color }) => (
            <CheckSquare size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
