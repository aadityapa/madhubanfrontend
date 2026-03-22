import { getMyTasks } from "@madhuban/api";
import { colors, radii, space } from "@madhuban/theme";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { DashboardPageLayout } from "../../src/layouts/DashboardPageLayout";

export default function HomeScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const tasks = await getMyTasks();
      setCount(tasks.length);
    } catch {
      setCount(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const name = user?.name ?? user?.email ?? "there";

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <DashboardPageLayout
        greeting={`Hi, ${name}!`}
        subtitle="Here is a quick snapshot of your day."
      >
        {loading ? (
          <ActivityIndicator />
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Assigned tasks</Text>
            <Text style={styles.cardValue}>{count ?? "—"}</Text>
            <Text style={styles.cardHint}>
              Pulled from GET /api/staff/tasks when authenticated.
            </Text>
          </View>
        )}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Attendance</Text>
          <Text style={styles.cardValue}>—</Text>
          <Text style={styles.cardHint}>Wire check-in when backend is ready.</Text>
        </View>
      </DashboardPageLayout>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface },
  content: { paddingBottom: space.xl },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.lg,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.xs,
  },
  cardLabel: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
  cardValue: { color: colors.text, fontSize: 28, fontWeight: "800" },
  cardHint: { color: colors.textMuted, fontSize: 12, marginTop: space.xs },
});
