import { colors, radii, space } from "@madhuban/theme";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

export function DashboardPageLayout({
  greeting,
  subtitle,
  children,
}: {
  greeting: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <Text style={styles.greeting}>{greeting}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  hero: {
    backgroundColor: colors.primary,
    paddingHorizontal: space.lg,
    paddingVertical: space.xl,
    borderBottomLeftRadius: radii.lg,
    borderBottomRightRadius: radii.lg,
  },
  greeting: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    color: "rgba(255,255,255,0.85)",
    marginTop: space.sm,
    fontSize: 14,
  },
  body: {
    flex: 1,
    padding: space.md,
    gap: space.md,
  },
});
