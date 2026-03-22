import { colors, radii, space } from "@madhuban/theme";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const RANGES = ["Day", "Week", "Month", "Year"] as const;

export default function ReportsScreen() {
  const [range, setRange] = useState<(typeof RANGES)[number]>("Week");

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Reports</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.rangeRow}>
            {RANGES.map((r) => (
              <Pressable
                key={r}
                onPress={() => setRange(r)}
                style={[styles.chip, range === r && styles.chipActive]}
              >
                <Text style={[styles.chipText, range === r && styles.chipTextActive]}>
                  {r}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.card}>
          <Text style={styles.metric}>75%</Text>
          <Text style={styles.caption}>Sample completion ({range})</Text>
        </View>
        <Text style={styles.note}>
          Connect supervisor/manager analytics endpoints when you are ready; the layout
          matches the shared “Reports” pattern from design.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  hero: {
    backgroundColor: colors.primary,
    paddingTop: space.lg,
    paddingBottom: space.md,
    paddingHorizontal: space.lg,
    borderBottomLeftRadius: radii.lg,
    borderBottomRightRadius: radii.lg,
  },
  heroTitle: { color: "#fff", fontSize: 22, fontWeight: "800", marginBottom: space.md },
  rangeRow: { flexDirection: "row", gap: space.sm, paddingBottom: space.sm },
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radii.full,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  chipActive: { backgroundColor: "#fff" },
  chipText: { color: "rgba(255,255,255,0.9)", fontWeight: "700", fontSize: 13 },
  chipTextActive: { color: colors.primary },
  body: { padding: space.md, gap: space.md, paddingBottom: space.xl },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    padding: space.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  metric: { fontSize: 44, fontWeight: "900", color: colors.text },
  caption: { marginTop: space.sm, color: colors.textMuted, fontSize: 13 },
  note: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
});
