import { colors, typography } from "@madhuban/theme";
import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DismissKeyboardView } from "../components/DismissKeyboardView";
import MadhubanLogo from "../../assets/madhubanlogo2.svg";

export function AuthLayout({
  cardTitle,
  cardSubtitle,
  children,
  footer,
  cardContentStyle,
}: {
  cardTitle?: string;
  cardSubtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  cardContentStyle?: object;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 18 : 0}
      >
        <View style={styles.blurBlue} />
        <View style={styles.blurRed} />
        <DismissKeyboardView style={styles.safe}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            contentInsetAdjustmentBehavior="always"
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.brandWrap}>
              <View style={styles.logoWrap}>
                <MadhubanLogo width="100%" height="100%" />
              </View>
              <Text style={styles.headTitle}>Welcome Back</Text>
              <Text style={styles.headSub}>Secure access to your workspace.</Text>
            </View>

            <View style={styles.card}>
              {cardTitle ? <Text style={styles.cardTitle}>{cardTitle}</Text> : null}
              {cardSubtitle ? <Text style={styles.cardSub}>{cardSubtitle}</Text> : null}
              <View style={[styles.content, cardContentStyle]}>{children}</View>
              {footer ? <View style={styles.footer}>{footer}</View> : null}
            </View>

            <Text style={styles.version}>Make Properties v2.1.0</Text>
          </ScrollView>
        </DismissKeyboardView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  blurBlue: {
    position: "absolute",
    width: 260,
    height: 260,
    right: -50,
    top: -70,
    borderRadius: 9999,
    backgroundColor: colors.authBackgroundBlue,
  },
  blurRed: {
    position: "absolute",
    width: 300,
    height: 300,
    left: -80,
    bottom: -120,
    borderRadius: 9999,
    backgroundColor: colors.authBackgroundPeach,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 96,
  },
  brandWrap: {
    alignItems: "center",
    marginBottom: 24,
    paddingTop: 12,
  },
  logoWrap: {
    width: 156,
    height: 156,
  },
  headTitle: {
    ...typography.authHeroTitle,
    color: colors.text,
    marginTop: 18,
    textAlign: "center",
  },
  headSub: {
    ...typography.authHeroSubtitle,
    marginTop: 6,
    color: colors.textMuted,
    textAlign: "center",
  },
  card: {
    borderRadius: 28,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: "rgba(235,241,250,0.95)",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    shadowColor: "rgba(114, 138, 180, 0.18)",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 1,
    shadowRadius: 22,
    elevation: 5,
  },
  cardTitle: {
    ...typography.authCardTitle,
    color: colors.text,
    textAlign: "center",
  },
  cardSub: {
    ...typography.authCardSubtitle,
    marginTop: 8,
    color: colors.textMuted,
    textAlign: "center",
  },
  content: {
    marginTop: 18,
    gap: 16,
  },
  footer: {
    marginTop: 18,
  },
  version: {
    ...typography.authVersion,
    marginTop: "auto",
    paddingTop: 30,
    textAlign: "center",
    color: colors.authVersion,
    textTransform: "uppercase",
  },
});
