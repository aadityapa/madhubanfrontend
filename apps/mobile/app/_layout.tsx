import { configureApiBaseUrl } from "@madhuban/api";
import {
  Montserrat_500Medium,
  Montserrat_700Bold,
  Montserrat_900Black,
  useFonts,
} from "@expo-google-fonts/montserrat";
import { ThemeProvider } from "@madhuban/theme";
import * as ExpoSplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import { useEffect } from "react";

const apiBase =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "") ??
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
  "https://madhuban360-backend.onrender.com";
configureApiBaseUrl(apiBase);
import { AuthProvider } from "../src/context/AuthContext";
import { SafeAreaProvider } from "react-native-safe-area-context";

void ExpoSplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Montserrat_500Medium,
    Montserrat_700Bold,
    Montserrat_900Black,
  });

  useEffect(() => {
    if (fontsLoaded) {
      void ExpoSplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
