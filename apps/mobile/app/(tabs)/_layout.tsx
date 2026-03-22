import { colors } from "@madhuban/theme";
import { Tabs } from "expo-router";
import { Text } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { showQrTab } from "../../src/navigation/tabConfig";

function Icon({ label }: { label: string }) {
  return <Text style={{ fontSize: 18 }}>{label}</Text>;
}

export default function TabsLayout() {
  const { role } = useAuth();
  const qr = showQrTab(role);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surfaceElevated },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: () => <Icon label="⌂" />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tasks",
          tabBarIcon: () => <Icon label="☑" />,
        }}
      />
      <Tabs.Screen
        name="qr"
        options={{
          title: "Scan",
          href: qr ? undefined : null,
          tabBarIcon: () => <Icon label="▣" />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: () => <Icon label="▤" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: () => <Icon label="☺" />,
        }}
      />
    </Tabs>
  );
}
