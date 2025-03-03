import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { ErrorBoundary } from './error-boundary';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/colors';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) {
      console.error(error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <StatusBar style="dark" />
      <RootLayoutNav />
    </ErrorBoundary>
  );
}

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerShadowVisible: false,
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: {
          backgroundColor: Colors.background,
        },
        animation: 'slide_from_right',
        animationDuration: 300,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="recipe/[id]"
        options={{
          title: 'Recipe Details',
          presentation: 'card',
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
      <Stack.Screen
        name="grocery/[id]"
        options={{
          title: 'Grocery List',
          presentation: 'card',
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
      <Stack.Screen
        name="add-recipe"
        options={{
          title: 'Add Recipe',
          presentation: 'modal',
          animation: 'slide_from_bottom',
          animationDuration: 400,
        }}
      />
      <Stack.Screen
        name="add-grocery-list"
        options={{
          title: 'New Grocery List',
          presentation: 'modal',
          animation: 'slide_from_bottom',
          animationDuration: 400,
        }}
      />
      <Stack.Screen
        name="add-recipe-to-grocery"
        options={{
          title: 'Add Recipe to Grocery List',
          presentation: 'modal',
          animation: 'slide_from_bottom',
          animationDuration: 400,
        }}
      />
    </Stack>
  );
}
