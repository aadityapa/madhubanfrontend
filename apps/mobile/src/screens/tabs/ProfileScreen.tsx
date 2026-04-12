import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { getCurrentUser } from "@madhuban/api";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { RefreshableScrollView } from "../../components/RefreshableScrollView";
import { useAuth } from "../../context/AuthContext";
import { RolePageLayout, formatRoleLabel } from "../../layouts/RolePageLayout";
import { styles } from "../../styles/screens/tabs/profile.styles";

const PROFILE_FACTS = [
  {
    icon: <Feather name="check" size={16} color="#162236" />,
    label: "Assigned Checker",
    value: "Rahul Tupe",
  },
  {
    icon: <Feather name="clipboard" size={16} color="#94A3B8" />,
    label: "Default Tasks / Day",
    value: "28 tasks",
  },
  {
    icon: <MaterialCommunityIcons name="cash-fast" size={16} color="#D8A548" />,
    label: "Attendance Incentive",
    value: "Eligible",
    valueTone: "success",
  },
] as const;

const FUNCTION_GROUPS = [
  {
    title: "Housekeeping",
    subtitle: "Primary Function",
    status: "Active",
    tone: "success",
    accent: "#FFC83D",
    icon: "folder" as const,
    tasks: [
      { text: "Washrooms (M/F) - Ground Floor", tone: "Critical", toneColor: "#F04438", icon: "droplet" },
      { text: "CEO Cabin - Floor 3", tone: "High", toneColor: "#FF8B2C", icon: "user" },
      { text: "VIP Room - Floor 3", tone: "High", toneColor: "#FF8B2C", icon: "star" },
      { text: "Employee Desks - Floor 2", tone: "Medium", toneColor: "#2962FF", icon: "briefcase" },
      { text: "Reception Area - Ground Floor", tone: "Medium", toneColor: "#2962FF", icon: "users" },
      { text: "Conference Room - Floor 2", tone: "Medium", toneColor: "#2962FF", icon: "file-text" },
      { text: "Main Entrance - Ground Floor", tone: "Low", toneColor: "#17C484", icon: "check-square" },
    ],
  },
  {
    title: "Security Support",
    subtitle: "Secondary Function · As needed",
    status: "Support",
    tone: "warning",
    accent: "#FFC83D",
    icon: "shield" as const,
    tasks: [
      { text: "Main Gate - Visitor Log Assist", tone: "", toneColor: "#FF8B2C", icon: "file-text" },
      { text: "Delivery Bay - Package Receipt", tone: "", toneColor: "#FF8B2C", icon: "briefcase" },
    ],
  },
  {
    title: "Pantry & Refreshments",
    subtitle: "Secondary Function · Morning only",
    status: "Active",
    tone: "success",
    accent: "#D9A6FF",
    icon: "coffee" as const,
    tasks: [
      { text: "Pantry Area - Floor 2 - Tea & Water", tone: "", toneColor: "#17C484", icon: "coffee" },
      { text: "VIP Room - Water Bottle Setup", tone: "", toneColor: "#17C484", icon: "star" },
    ],
  },
] as const;

const STATS = [
  { label: "Functions", value: "3" },
  { label: "Zones", value: "7" },
  { label: "Location", value: "1" },
] as const;

const SKILLS = [
  { label: "Deep Cleaning", icon: "brush" as const, color: "#2962FF" },
  { label: "Glass & Facade", icon: "layout" as const, color: "#2962FF" },
  { label: "Upholstery Care", icon: "briefcase" as const, color: "#2962FF" },
  { label: "Safety Compliance", icon: "shield" as const, color: "#F04438" },
  { label: "Chemical Handling", icon: "edit-3" as const, color: "#17C484" },
  { label: "Proof Documentation", icon: "camera" as const, color: "#2962FF" },
] as const;

function getStatusPillStyle(tone: "success" | "warning" | undefined) {
  if (tone === "warning") {
    return {
      badge: styles.statusWarning,
      text: styles.statusWarningText,
    };
  }

  return {
    badge: styles.statusSuccess,
    text: styles.statusSuccessText,
  };
}

export function ProfileScreen() {
  const { user, clearSession } = useAuth();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      const next = await getCurrentUser();
      setProfile(next);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  async function logout() {
    await clearSession();
    router.replace("/(auth)/login");
  }

  const roleLabel = formatRoleLabel(String(profile?.role ?? user?.role));
  const name = String(profile?.name ?? user?.name ?? "Rahul Dhumal");
  const employeeId =
    profile?.id ?? user?.id ? `EMP-ID: ${String(profile?.id ?? user?.id)}` : "EMP-ID: MB-0042";
  const stats = (profile?.stats as Record<string, unknown> | undefined) ?? {};
  const profileFacts = [
    {
      ...PROFILE_FACTS[0],
      value: String(
        (profile?.reportsTo as string | undefined) ??
          (profile?.managerName as string | undefined) ??
          PROFILE_FACTS[0].value,
      ),
    },
    {
      ...PROFILE_FACTS[1],
      value: String((stats.tasksPerDay as string | number | undefined) ?? PROFILE_FACTS[1].value),
    },
    PROFILE_FACTS[2],
  ] as const;

  return (
    <RolePageLayout
      eyebrow="Staff · Profile"
      title={name}
      subtitle={employeeId}
      headerCard={
        <View style={styles.heroCard}>
          <View style={styles.heroAvatar}>
            <Text style={styles.heroAvatarText}>
              {(name.match(/\b\w/g) ?? ["R", "D"]).slice(0, 2).join("")}
            </Text>
          </View>
          <View style={styles.heroBody}>
            <Text style={styles.heroName}>{name}</Text>
            <Text style={styles.heroMeta}>{employeeId}</Text>
            <View style={styles.heroBadgeRow}>
              <View style={styles.liveDotWrap}>
                <View style={styles.liveDot} />
              </View>
              <View style={styles.roleBadge}>
                <Ionicons name="business-outline" size={11} color="#8EC4FF" />
                <Text style={styles.roleBadgeText}>{roleLabel.toUpperCase()}</Text>
              </View>
            </View>
          </View>
        </View>
      }
    >
      <RefreshableScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onRefresh={loadProfile}
      >
        <View style={styles.infoCard}>
          {profileFacts.map((item, index) => (
            <View key={item.label}>
              <View style={styles.infoRow}>
                <View style={styles.infoLabelWrap}>
                  <View style={styles.infoIconWrap}>{item.icon}</View>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                </View>
                {"valueTone" in item && item.valueTone === "success" ? (
                  <View style={[styles.valuePill, styles.valuePillSuccess]}>
                    <Text style={[styles.valuePillText, styles.valuePillSuccessText]}>
                      {item.value}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.infoValue}>{item.value}</Text>
                )}
              </View>
              {index < PROFILE_FACTS.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <Ionicons name="folder" size={16} color="#FFC83D" />
            </View>
            <Text style={styles.sectionTitle}>Assigned Functions & Zones</Text>
          </View>

          <View style={styles.functionList}>
            {FUNCTION_GROUPS.map((group) => {
              const status = getStatusPillStyle(group.tone as "success" | "warning");
              return (
                <View key={group.title} style={styles.functionGroup}>
                  <View style={styles.functionHeader}>
                    <View style={[styles.functionIconWrap, { backgroundColor: `${group.accent}22` }]}>
                      <Feather name={group.icon} size={15} color={group.accent} />
                    </View>
                    <View style={styles.functionHeaderBody}>
                      <Text style={styles.functionTitle}>{group.title}</Text>
                      <Text style={styles.functionSubtitle}>{group.subtitle}</Text>
                    </View>
                    <View style={[styles.statusPill, status.badge]}>
                      <Text style={[styles.statusPillText, status.text]}>{group.status}</Text>
                    </View>
                  </View>

                  <View style={styles.functionTaskList}>
                    {group.tasks.map((task) => (
                      <View key={task.text} style={styles.functionTaskRow}>
                        <View style={[styles.functionTaskDot, { backgroundColor: task.toneColor }]} />
                        <Feather name={task.icon as never} size={12} color={task.toneColor} />
                        <Text style={styles.functionTaskText}>{task.text}</Text>
                        {task.tone ? (
                          <View style={[styles.taskTonePill, { backgroundColor: `${task.toneColor}18` }]}>
                            <Text style={[styles.taskToneText, { color: task.toneColor }]}>
                              {task.tone}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.statsRow}>
            {STATS.map((item) => (
              <View key={item.label} style={styles.statCell}>
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <Ionicons name="ribbon-outline" size={16} color="#FFC83D" />
            </View>
            <Text style={styles.sectionTitle}>Skills & Certifications</Text>
          </View>
          <View style={styles.skillsGrid}>
            {SKILLS.map((skill) => (
              <View key={skill.label} style={styles.skillChip}>
                <Feather name={skill.icon as never} size={12} color={skill.color} />
                <Text style={styles.skillChipText}>{skill.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <Pressable style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={18} color="#FF3131" />
          <Text style={styles.logoutButtonText}>Log Out Securely</Text>
        </Pressable>
      </RefreshableScrollView>
    </RolePageLayout>
  );
}
