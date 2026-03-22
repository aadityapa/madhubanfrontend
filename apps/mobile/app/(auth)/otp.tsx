import { verifyOtp } from "@madhuban/api";
import { colors, font, typography } from "@madhuban/theme";
import { Link, router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Button } from "../../src/components/Button";
import { OtpInput } from "../../src/components/OtpInput";
import { AuthLayout } from "../../src/layouts/AuthLayout";

export default function OtpScreen() {
  const params = useLocalSearchParams<{ mobile?: string }>();
  const mobile = useMemo(() => String(params.mobile ?? ""), [params.mobile]);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      const res = (await verifyOtp(mobile, otp)) as {
        resetToken?: string;
        data?: { resetToken?: string };
      };
      const resetToken =
        res?.resetToken ?? res?.data?.resetToken ?? "demo-reset-token";
      router.push({
        pathname: "/(auth)/reset-password",
        params: { mobile, otp, resetToken },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      cardTitle="Verify Access"
      cardSubtitle="Enter the 4-digit code sent to your registered device."
      cardContentStyle={styles.content}
    >
      <View style={styles.form}>
        <OtpInput value={otp} onChange={setOtp} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Verify & Login" variant="success" onPress={onSubmit} loading={loading} />
        <Link href="/(auth)/forgot" asChild>
          <Pressable>
            <Text style={styles.resend}>Didn't receive? Resend Code</Text>
          </Pressable>
        </Link>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    marginTop: 22,
  },
  form: { gap: 18 },
  error: {
    color: colors.danger,
    fontFamily: font.family.medium,
    fontSize: 12,
    textAlign: "center",
  },
  resend: {
    ...typography.authLink,
    color: colors.authBlue,
    textAlign: "center",
  },
});
