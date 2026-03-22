import { router } from "expo-router";
import { useEffect } from "react";
import { ImageBackground, Pressable, StyleSheet } from "react-native";

export default function SplashScreen() {
  useEffect(() => {
    const t = setTimeout(() => {
      router.replace("/(auth)/login");
    }, 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <Pressable style={styles.root} onPress={() => router.replace("/(auth)/login")}>
      <ImageBackground
        source={require("../../assets/splashscreen.png")}
        resizeMode="cover"
        style={styles.image}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#152B59",
  },
  image: {
    flex: 1,
  },
});
