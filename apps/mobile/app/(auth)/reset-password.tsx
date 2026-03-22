import { resetPasswordWithOtp } from "@madhuban/api";
import { Ionicons } from "@expo/vector-icons";
import { colors, font, typography } from "@madhuban/theme";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Button } from "../../src/components/Button";
import { TextField } from "../../src/components/TextField";
import { AuthLayout } from "../../src/layouts/AuthLayout";

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{
    mobile?: string;
    otp?: string;
    resetToken?: string;
  }>();
  const mobile = useMemo(() => String(params.mobile ?? ""), [params.mobile]);
  const otp = useMemo(() => String(params.otp ?? ""), [params.otp]);
  const resetToken = useMemo(
    () => String(params.resetToken ?? ""),
    [params.resetToken],
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await resetPasswordWithOtp(mobile, otp, password, resetToken || undefined);
      router.replace("/(auth)/login");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      cardTitle="Create New Password"
      cardSubtitle="Choose a strong password to secure your account before signing in again."
    >
      <View style={styles.form}>
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholder="••••••••"
          leftIcon={<Ionicons name="lock-closed-outline" size={16} color="#89A0C2" />}
          textContentType="newPassword"
        />
        <TextField
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholder="••••••••"
          leftIcon={<Ionicons name="checkmark-circle-outline" size={16} color="#89A0C2" />}
          textContentType="newPassword"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          title="Update Password"
          onPress={onSubmit}
          loading={loading}
          variant="success"
        />
        <Pressable onPress={() => router.replace("/(auth)/login")}>
          <Text style={styles.back}>Back to Login</Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  error: {
    color: colors.danger,
    fontFamily: font.family.medium,
    fontSize: 12,
  },
  back: {
    ...typography.authLink,
    color: colors.textMuted,
    textAlign: "center",
  },
});
