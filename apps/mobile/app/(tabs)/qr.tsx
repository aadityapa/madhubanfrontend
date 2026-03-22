import { colors, radii, space } from "@madhuban/theme";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "../../src/components/Button";

export default function QrScreen() {
  const [last, setLast] = useState<string | null>(null);

  return (
    <View style={styles.root}>
      <View style={styles.panel}>
        <Text style={styles.title}>Scan QR</Text>
        <Text style={styles.sub}>
          This screen reserves the Staff / Guard check-in flow. Integrate
          `expo-camera` or a barcode scanner when you are ready.
        </Text>
        <View style={styles.preview}>
          <Text style={styles.previewText}>Camera preview placeholder</Text>
        </View>
        <Button
          title="Simulate successful scan"
          onPress={() => setLast("CHK-2026-03-21-001")}
        />
        {last ? (
          <Text style={styles.result}>
            Last code: <Text style={styles.mono}>{last}</Text>
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primary, padding: space.lg },
  panel: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    padding: space.lg,
    gap: space.md,
    justifyContent: "center",
  },
  title: { fontSize: 22, fontWeight: "900", color: colors.text },
  sub: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  preview: {
    height: 220,
    borderRadius: radii.md,
    backgroundColor: "#0b1220",
    alignItems: "center",
    justifyContent: "center",
  },
  previewText: { color: "rgba(255,255,255,0.65)", fontWeight: "700" },
  result: { color: colors.text, fontSize: 13 },
  mono: { fontFamily: "monospace", fontWeight: "800" },
});
