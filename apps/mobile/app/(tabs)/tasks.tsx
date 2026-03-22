import { getMyTasks } from "@madhuban/api";
import type { Task } from "@madhuban/types";
import { colors, radii, space } from "@madhuban/theme";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function TasksScreen() {
  const [tab, setTab] = useState<"active" | "completed">("active");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getMyTasks();
      setTasks(list);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = tasks.filter((t) => {
    const s = String(t.status ?? "").toUpperCase();
    if (tab === "completed") return s === "COMPLETED";
    return s !== "COMPLETED";
  });

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Tasks</Text>
        <View style={styles.tabs}>
          <Pressable
            onPress={() => setTab("active")}
            style={[styles.tab, tab === "active" && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === "active" && styles.tabTextActive]}>
              Active
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTab("completed")}
            style={[styles.tab, tab === "completed" && styles.tabActive]}
          >
            <Text
              style={[styles.tabText, tab === "completed" && styles.tabTextActive]}
            >
              Completed
            </Text>
          </Pressable>
        </View>
      </View>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {filtered.length === 0 ? (
            <Text style={styles.empty}>No tasks in this tab.</Text>
          ) : (
            filtered.map((t) => (
              <View key={String(t._id ?? t.id)} style={styles.row}>
                <Text style={styles.rowTitle}>{t.title}</Text>
                <Text style={styles.rowMeta}>{String(t.status ?? "")}</Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.md,
    backgroundColor: colors.surfaceElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 22, fontWeight: "800", color: colors.text },
  tabs: { flexDirection: "row", gap: space.sm, marginTop: space.md },
  tab: {
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { color: colors.text, fontWeight: "700", fontSize: 13 },
  tabTextActive: { color: "#fff" },
  list: { padding: space.md, gap: space.sm, paddingBottom: space.xl },
  row: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  rowMeta: { marginTop: 6, color: colors.textMuted, fontSize: 12 },
  empty: { color: colors.textMuted, textAlign: "center", marginTop: space.lg },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
});
