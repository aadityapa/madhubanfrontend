import { Feather } from "@expo/vector-icons";
import { colors, font } from "@madhuban/theme";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MadhubanLogo from "../../assets/madhubanlogo2.svg";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function SplashScreen() {
  const glow = useRef(new Animated.Value(0.7)).current;
  const logoFloat = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0.7,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(logoFloat, {
          toValue: -8,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoFloat, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    Animated.timing(contentFade, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    glowLoop.start();
    floatLoop.start();

    const timeout = setTimeout(() => {
      router.replace("/(auth)/login");
    }, 2200);

    return () => {
      clearTimeout(timeout);
      glowLoop.stop();
      floatLoop.stop();
    };
  }, [contentFade, glow, logoFloat]);

  return (
    <AnimatedPressable
      style={[styles.root, { opacity: contentFade }]}
      onPress={() => router.replace("/(auth)/login")}
    >
      <View style={styles.background}>
        <View style={[styles.tower, styles.towerLeft]} />
        <View style={[styles.tower, styles.towerCenter]} />
        <View style={[styles.tower, styles.towerRight]} />
        <View style={[styles.tower, styles.towerEdge]} />
        <View style={styles.overlayTop} />
        <View style={styles.overlayBottom} />
      </View>

      <Animated.View
        style={[
          styles.hero,
          {
            transform: [{ translateY: logoFloat }],
          },
        ]}
      >
        <View style={styles.logoWrap}>
          <MadhubanLogo width="100%" height="100%" />
        </View>
        <Text style={styles.brand}>MADHUBAN</Text>
      </Animated.View>

      <View style={styles.metaWrap}>
        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Feather name="home" size={12} color="#87A3EB" />
          <View style={styles.divider} />
        </View>
        <Text style={styles.facilities}>FACILITIES</Text>
        <Text style={styles.portal}>MANAGEMENT PORTAL</Text>
      </View>

      <Animated.View style={[styles.glowWrap, { opacity: glow, transform: [{ scaleX: glow }] }]}>
        <View style={styles.glowCore} />
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#10234A",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#142A59",
  },
  tower: {
    position: "absolute",
    backgroundColor: "rgba(6, 14, 34, 0.36)",
    borderRadius: 12,
  },
  towerLeft: {
    left: -18,
    bottom: 210,
    width: 132,
    height: 420,
    transform: [{ rotate: "7deg" }],
  },
  towerCenter: {
    left: 104,
    bottom: 158,
    width: 102,
    height: 320,
    backgroundColor: "rgba(11, 20, 46, 0.38)",
    transform: [{ rotate: "-10deg" }],
  },
  towerRight: {
    right: -26,
    bottom: 168,
    width: 144,
    height: 460,
    backgroundColor: "rgba(8, 18, 42, 0.3)",
    transform: [{ rotate: "8deg" }],
  },
  towerEdge: {
    right: 68,
    top: 34,
    width: 118,
    height: 220,
    backgroundColor: "rgba(18, 31, 72, 0.34)",
    transform: [{ rotate: "28deg" }],
  },
  overlayTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  overlayBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 280,
    backgroundColor: "rgba(7, 16, 38, 0.28)",
  },
  hero: {
    alignItems: "center",
    marginTop: -40,
  },
  logoWrap: {
    width: 156,
    height: 156,
  },
  brand: {
    marginTop: 8,
    color: "#D33A2D",
    fontFamily: font.family.medium,
    fontSize: 26,
    letterSpacing: 2.1,
  },
  metaWrap: {
    position: "absolute",
    bottom: 118,
    alignItems: "center",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: "rgba(135, 163, 235, 0.55)",
  },
  facilities: {
    color: "#FFFFFF",
    fontFamily: font.family.bold,
    fontSize: 18,
    letterSpacing: 3.4,
  },
  portal: {
    marginTop: 8,
    color: "#B4C2E6",
    fontFamily: font.family.medium,
    fontSize: 11,
    letterSpacing: 3,
  },
  glowWrap: {
    position: "absolute",
    bottom: 58,
    width: 132,
    alignItems: "center",
  },
  glowCore: {
    width: 118,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.authBlue,
    shadowColor: colors.authBlue,
    shadowOpacity: 0.9,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
});
