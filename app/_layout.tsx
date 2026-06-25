import React, { useCallback } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  Fraunces_400Regular,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_400Regular_Italic,
} from "@expo-google-fonts/fraunces";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import {
  PlayfairDisplay_500Medium,
  PlayfairDisplay_600SemiBold,
} from "@expo-google-fonts/playfair-display";
import {
  CormorantGaramond_500Medium,
  CormorantGaramond_600SemiBold,
} from "@expo-google-fonts/cormorant-garamond";
import {
  DancingScript_500Medium,
  DancingScript_700Bold,
} from "@expo-google-fonts/dancing-script";
import { Caveat_400Regular, Caveat_600SemiBold } from "@expo-google-fonts/caveat";
import { SpecialElite_400Regular } from "@expo-google-fonts/special-elite";
import { ThemeProvider, useTheme } from "@/lib/ThemeProvider";
import { AuthProvider } from "@/lib/AuthProvider";

SplashScreen.preventAutoHideAsync();

function ThemedStack() {
  const t = useTheme();
  return (
    <>
      <StatusBar style={t.name === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: t.paper },
          animation: "fade",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="pair" />
        <Stack.Screen name="board" />
        <Stack.Screen name="card/[id]" options={{ animation: "slide_from_right" }} />
        <Stack.Screen
          name="add"
          options={{ presentation: "modal", animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="settings"
          options={{ presentation: "modal", animation: "slide_from_bottom" }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Fraunces_400Regular_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_600SemiBold,
    CormorantGaramond_500Medium,
    CormorantGaramond_600SemiBold,
    DancingScript_500Medium,
    DancingScript_700Bold,
    Caveat_400Regular,
    Caveat_600SemiBold,
    SpecialElite_400Regular,
  });

  const onLayout = useCallback(async () => {
    if (loaded) await SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }} onLayout={onLayout}>
        <ThemeProvider>
          <AuthProvider>
            <ThemedStack />
          </AuthProvider>
        </ThemeProvider>
      </View>
    </SafeAreaProvider>
  );
}
