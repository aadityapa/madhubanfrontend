import { colors } from "@madhuban/theme";
import { Tabs } from "expo-router";
import { RoleTabBar } from "./RoleTabBar";

export function RoleTabsLayout({ role }: { role: string }) {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.surface },
      }}
      tabBar={(props) => <RoleTabBar {...props} />}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="tasks" options={{ title: "Tasks" }} />
      <Tabs.Screen name="qr" options={{ title: "Scan", href: null }} />
      <Tabs.Screen name="reports" options={{ title: "Reports" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
