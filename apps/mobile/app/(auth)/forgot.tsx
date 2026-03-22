import { requestOtp } from "@madhuban/api";
import { Feather, Ionicons } from "@expo/vector-icons";
import { colors, font, typography } from "@madhuban/theme";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Button } from "../../src/components/Button";
import { TextField } from "../../src/components/TextField";
import { AuthLayout } from "../../src/layouts/AuthLayout";

export default function ForgotScreen() {
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      await requestOtp(mobile);
      router.push({
        pathname: "/(auth)/otp",
        params: { mobile },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send OTP");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      cardTitle="Reset Password"
      cardSubtitle="Enter your registered mobile or email. We'll send you a secure OTP to reset your access."
    >
      <View style={styles.form}>
        <TextField
          value={mobile}
          onChangeText={setMobile}
          placeholder="Mobile No. or Email"
          leftIcon={<Feather name="smartphone" size={16} color="#89A0C2" />}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          title="Send Reset OTP"
          onPress={onSubmit}
          loading={loading}
          variant="danger"
        />
        <Link href="/(auth)/login" asChild>
          <Pressable>
            <View style={styles.backRow}>
              <Ionicons name="arrow-back" size={14} color={colors.textMuted} />
              <Text style={styles.back}>Back to Login</Text>
            </View>
          </Pressable>
        </Link>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: { gap: 20 },
  error: {
    color: colors.danger,
    fontFamily: font.family.medium,
    fontSize: 12,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  back: {
    ...typography.authLink,
    color: colors.textMuted,
    textAlign: "center",
  },
});
