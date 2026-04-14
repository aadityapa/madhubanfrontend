import { Feather, Ionicons } from "@expo/vector-icons";
import { font, radii } from "@madhuban/theme";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RefreshableScrollView } from "../../components/RefreshableScrollView";
import { useAuth } from "../../context/AuthContext";

const STATS = [
  { label: "Zones", value: "4" },
  { label: "Makers", value: "12" },
  { label: "Daily Avg", value: "145" },
] as const;

const TIMELINE = [
  {
    time: "08:00 AM",
    title: "Shift Started",
    detail: "Checked in at AMTP Baner via GPS.",
    tone: "green" as const,
  },
  {
    time: "09:30 AM",
    title: "First Round Complete",
    detail: "Approved 24 tasks in Washrooms & Lobby.",
    tone: "blue" as const,
  },
  {
    time: "11:15 AM",
    title: "Escalation Logged",
    detail: "Sent back VIP Lounge due to missing supplies.",
    tone: "orange" as const,
  },
  {
    time: "05:00 PM",
    title: "Shift End",
    detail: "Pending checkout.",
    tone: "gray" as const,
  },
] as const;

type AccountRow = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  meta?: string;
};

const ACCOUNT_ROWS: AccountRow[] = [
  {
    icon: "business-outline",
    label: "Property",
    value: "Amar Madhuban Tech Park",
  },
  {
    icon: "person-outline",
    label: "Reporting To",
    value: "Priya Sharma · Asset Manager",
  },
  {
    icon: "phone-portrait-outline",
    label: "App Version",
    value: "Madhuban FM v2.4",
    meta: "v2.4.0",
  },
];

export function SupervisorProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, clearSession } = useAuth();
  const name = user?.name ?? "Rahul Tupe";
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "RT";

  async function logout() {
    await clearSession();
    router.replace("/(auth)/login");
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View style={[styles.hero, { paddingTop: insets.top + 10 }]}>
        <View style={styles.heroActionRow}>
          <View />
          <View style={styles.notifyButton}>
            <Ionicons name="notifications-outline" size={18} color="#EFF4FF" />
          </View>
        </View>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <Text style={styles.name}>{name}</Text>
        <Text style={styles.subtitle}>Quality Checker · AMTP Baner</Text>

        <View style={styles.badgesRow}>
          <View style={[styles.badge, styles.badgeShift]}>
            <Text style={styles.badgeText}>Day Shift</Text>
          </View>
          <View style={[styles.badge, styles.badgeActive]}>
            <Text style={styles.badgeText}>Active</Text>
          </View>
          <View style={[styles.badge, styles.badgeRole]}>
            <Text style={styles.badgeText}>Checker</Text>
          </View>
        </View>
      </View>

      <RefreshableScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onRefresh={async () => {}}
      >
        <View style={styles.statsRow}>
          {STATS.map((item) => (
            <View key={item.label} style={styles.statCard}>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Feather name="activity" size={14} color="#7B8AA4" />
            <Text style={styles.cardTitle}>Shift Timeline</Text>
          </View>

          <View style={styles.timelineList}>
            {TIMELINE.map((item, index) => (
              <View key={item.time} style={styles.timelineRow}>
                <View style={styles.timelineRail}>
                  <View
                    style={[
                      styles.timelineDot,
                      item.tone === "green"
                        ? styles.timelineDotGreen
                        : item.tone === "blue"
                          ? styles.timelineDotBlue
                          : item.tone === "orange"
                            ? styles.timelineDotOrange
                            : styles.timelineDotGray,
                    ]}
                  />
                  {index !== TIMELINE.length - 1 ? <View style={styles.timelineLine} /> : null}
                </View>

                <View style={styles.timelineBody}>
                  <Text style={styles.timelineTime}>{item.time}</Text>
                  <Text style={styles.timelineTitle}>{item.title}</Text>
                  <Text style={styles.timelineDetail}>{item.detail}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Feather name="user" size={14} color="#7B8AA4" />
            <Text style={styles.cardTitle}>Account</Text>
          </View>

          <View style={styles.accountList}>
            {ACCOUNT_ROWS.map((item, index) => (
              <View
                key={item.label}
                style={[
                  styles.accountRow,
                  index !== ACCOUNT_ROWS.length - 1 && styles.accountRowBorder,
                ]}
              >
                <View style={styles.accountIconWrap}>
                  <Ionicons name={item.icon} size={17} color="#8392A9" />
                </View>
                <View style={styles.accountTextWrap}>
                  <Text style={styles.accountLabel}>{item.label}</Text>
                  <Text style={styles.accountValue}>{item.value}</Text>
                </View>
                <Text style={styles.accountMeta}>{item.meta ?? ">"}</Text>
              </View>
            ))}
          </View>
        </View>

        <Pressable style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={18} color="#FF3131" />
          <Text style={styles.logoutButtonText}>Secure Logout</Text>
        </Pressable>
      </RefreshableScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#EEF1F5",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 18,
    paddingBottom: 28,
    flexGrow: 1,
  },
  hero: {
    backgroundColor: "#1E2B42",
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    paddingHorizontal: 20,
    paddingBottom: 26,
    alignItems: "center",
    shadowColor: "rgba(15, 23, 40, 0.34)",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 1,
    shadowRadius: 26,
    elevation: 12,
  },
  heroActionRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  notifyButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  avatar: {
    marginTop: 6,
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "#FF9C14",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(255, 156, 20, 0.35)",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 8,
  },
  avatarText: {
    color: "#FFFFFF",
    fontFamily: font.family.black,
    fontSize: 26,
  },
  name: {
    marginTop: 16,
    color: "#FFFFFF",
    fontFamily: font.family.black,
    fontSize: 17,
    lineHeight: 22,
  },
  subtitle: {
    marginTop: 6,
    color: "#9FB0CA",
    fontFamily: font.family.medium,
    fontSize: 11,
    lineHeight: 14,
  },
  badgesRow: {
    marginTop: 14,
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    height: 24,
    paddingHorizontal: 12,
    borderRadius: 12,
    justifyContent: "center",
  },
  badgeShift: {
    backgroundColor: "#715A1E",
  },
  badgeActive: {
    backgroundColor: "#154F42",
  },
  badgeRole: {
    backgroundColor: "#224579",
  },
  badgeText: {
    color: "#FFFFFF",
    fontFamily: font.family.bold,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  statsRow: {
    paddingHorizontal: 14,
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7ECF4",
    paddingVertical: 18,
    alignItems: "center",
    gap: 6,
  },
  statValue: {
    color: "#1F2A3D",
    fontFamily: font.family.black,
    fontSize: 15.5,
  },
  statLabel: {
    color: "#8B98AD",
    fontFamily: font.family.bold,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  card: {
    marginTop: 14,
    marginHorizontal: 14,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7ECF4",
    padding: 18,
    gap: 16,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    color: "#6E7F98",
    fontFamily: font.family.bold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  timelineList: {
    gap: 12,
  },
  timelineRow: {
    flexDirection: "row",
    gap: 12,
  },
  timelineRail: {
    width: 20,
    alignItems: "center",
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: radii.full,
  },
  timelineDotGreen: {
    backgroundColor: "#24C789",
  },
  timelineDotBlue: {
    backgroundColor: "#5A8CFF",
  },
  timelineDotOrange: {
    backgroundColor: "#FF9C14",
  },
  timelineDotGray: {
    backgroundColor: "#D9E1EE",
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
    backgroundColor: "#E8EDF5",
  },
  timelineBody: {
    flex: 1,
    paddingBottom: 8,
  },
  timelineTime: {
    color: "#A2AFC2",
    fontFamily: font.family.medium,
    fontSize: 10,
  },
  timelineTitle: {
    marginTop: 2,
    color: "#1F2A3D",
    fontFamily: font.family.bold,
    fontSize: 15,
  },
  timelineDetail: {
    marginTop: 4,
    color: "#7E8DA4",
    fontFamily: font.family.medium,
    fontSize: 12,
    lineHeight: 17,
  },
  accountList: {
    gap: 4,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  accountRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
  },
  accountIconWrap: {
    width: 28,
    alignItems: "center",
  },
  accountTextWrap: {
    flex: 1,
    gap: 2,
  },
  accountLabel: {
    color: "#1F2A3D",
    fontFamily: font.family.bold,
    fontSize: 14,
  },
  accountValue: {
    color: "#7E8DA4",
    fontFamily: font.family.medium,
    fontSize: 12,
    lineHeight: 17,
  },
  accountMeta: {
    color: "#A4B0C3",
    fontFamily: font.family.bold,
    fontSize: 12,
  },
  logoutButton: {
    marginTop: 14,
    marginHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 18,
    backgroundColor: "#FFF1F1",
    borderWidth: 1,
    borderColor: "#FFD7D7",
    paddingVertical: 16,
  },
  logoutButtonText: {
    color: "#FF3131",
    fontFamily: font.family.black,
    fontSize: 17,
  },
});
