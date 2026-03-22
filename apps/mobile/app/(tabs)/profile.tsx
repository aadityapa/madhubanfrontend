import { colors, radii, space } from "@madhuban/theme";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "../../src/components/Button";
import { useAuth } from "../../src/context/AuthContext";

export default function ProfileScreen() {
  const { user, clearSession } = useAuth();

  async function logout() {
    await clearSession();
    router.replace("/(auth)/login");
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.avatar}>{(user?.name ?? "?").slice(0, 2).toUpperCase()}</Text>
        <Text style={styles.name}>{user?.name ?? "User"}</Text>
        <Text style={styles.meta}>{user?.email ?? user?.mobile ?? ""}</Text>
        <Text style={styles.meta}>Role: {String(user?.role ?? "—")}</Text>
      </View>
      <View style={styles.section}>
        <Button title="Log out" variant="danger" onPress={logout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    padding: space.xl,
    backgroundColor: colors.surfaceElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: space.xs,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    color: "#fff",
    textAlign: "center",
    lineHeight: 64,
    fontSize: 20,
    fontWeight: "900",
    overflow: "hidden",
  },
  name: { fontSize: 20, fontWeight: "800", color: colors.text, marginTop: space.sm },
  meta: { color: colors.textMuted, fontSize: 13 },
  section: { padding: space.lg },
});
