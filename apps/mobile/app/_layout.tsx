import { configureApiBaseUrl } from "@madhuban/api";
import {
  Montserrat_500Medium,
  Montserrat_700Bold,
  Montserrat_900Black,
  useFonts,
} from "@expo-google-fonts/montserrat";
import { ThemeProvider } from "@madhuban/theme";
import Constants from "expo-constants";
import * as ExpoSplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import { useEffect } from "react";

const apiBaseFromExpo =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined)?.replace(/\/+$/, "") ?? null;
const apiBaseFromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? null;

configureApiBaseUrl(apiBaseFromExpo ?? apiBaseFromEnv);
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
