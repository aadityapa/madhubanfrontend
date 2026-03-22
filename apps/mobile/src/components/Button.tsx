import { colors, radii, typography } from "@madhuban/theme";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Variant = "primary" | "secondary" | "danger" | "success";

const palette: Record<Variant, { bg: string; fg: string; shadow: string }> = {
  primary: { bg: colors.authBlue, fg: "#FFFFFF", shadow: colors.authGlowBlue },
  secondary: { bg: colors.surfaceElevated, fg: colors.text, shadow: "rgba(0,0,0,0.08)" },
  danger: { bg: colors.danger, fg: "#FFFFFF", shadow: colors.authGlowRed },
  success: { bg: colors.authGreen, fg: "#FFFFFF", shadow: colors.authGlowGreen },
};

export function Button({
  title,
  onPress,
  loading,
  disabled,
  variant = "primary",
  children,
  rightAdornment,
}: {
  title?: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: Variant;
  children?: ReactNode;
  rightAdornment?: string;
}) {
  const c = palette[variant];
  const secondary = variant === "secondary";
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: c.bg,
          borderColor: secondary ? "rgba(241,245,249,0.7)" : c.bg,
          shadowColor: c.shadow,
        },
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={c.fg} />
      ) : (
        <View style={styles.row}>
          <Text style={[styles.label, { color: c.fg }]}>{children ?? title}</Text>
          {rightAdornment ? (
            <Text style={[styles.icon, { color: c.fg }]}>{rightAdornment}</Text>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  label: {
    ...typography.authButton,
  },
  icon: {
    fontSize: 18,
    fontFamily: typography.authButton.fontFamily,
  },
  pressed: { opacity: 0.9 },
  disabled: { opacity: 0.55 },
});
