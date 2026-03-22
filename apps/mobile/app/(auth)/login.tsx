import { mobileLogin } from "@madhuban/api";
import type { AuthMethod } from "@madhuban/types";
import { Feather, Ionicons } from "@expo/vector-icons";
import { colors, font, typography } from "@madhuban/theme";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Button } from "../../src/components/Button";
import { TextField } from "../../src/components/TextField";
import { useAuth } from "../../src/context/AuthContext";
import { AuthLayout } from "../../src/layouts/AuthLayout";

export default function LoginScreen() {
  const { setSession } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [method, setMethod] = useState<AuthMethod>("mobile");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      const { token, user } = await mobileLogin(identifier, password);
      await setSession(token, user);
      router.replace("/(tabs)/home");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <View style={styles.segment}>
        <Pressable
          style={[styles.segmentItem, method === "mobile" && styles.segmentActive]}
          onPress={() => setMethod("mobile")}
        >
          <Feather
            name="smartphone"
            size={14}
            color={method === "mobile" ? colors.authBlue : colors.textMuted}
          />
          <Text style={[styles.segmentText, method === "mobile" && styles.segmentTextActive]}>
            Mobile
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segmentItem, method === "email" && styles.segmentActive]}
          onPress={() => setMethod("email")}
        >
          <Feather
            name="mail"
            size={14}
            color={method === "email" ? colors.authBlue : colors.textMuted}
          />
          <Text style={[styles.segmentText, method === "email" && styles.segmentTextActive]}>
            Email
          </Text>
        </Pressable>
      </View>

      <View style={styles.form}>
        <TextField
          label={method === "mobile" ? "Mobile Number" : "Email Address"}
          value={identifier}
          onChangeText={setIdentifier}
          keyboardType={method === "mobile" ? "phone-pad" : "email-address"}
          autoCapitalize="none"
          placeholder={method === "mobile" ? "+91 90000 00000" : "checker@madhuban.com"}
          leftIcon={
            <Feather
              name={method === "mobile" ? "smartphone" : "mail"}
              size={16}
              color="#89A0C2"
            />
          }
          textContentType={method === "mobile" ? "telephoneNumber" : "emailAddress"}
        />
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholder="••••••••"
          leftIcon={<Ionicons name="lock-closed-outline" size={16} color="#89A0C2" />}
          textContentType="password"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Link href="/(auth)/forgot" asChild>
          <Pressable>
            <Text style={styles.link}>Forgot Password?</Text>
          </Pressable>
        </Link>
      </View>

      <Button
        title="Secure Login"
        onPress={onSubmit}
        loading={loading}
        rightAdornment="→"
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  segment: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: "#F5F7FB",
    padding: 5,
    flexDirection: "row",
    gap: 6,
  },
  segmentItem: {
    flex: 1,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  segmentActive: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: "rgba(220,229,240,0.9)",
    shadowColor: "rgba(84, 104, 145, 0.12)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 1,
  },
  segmentText: {
    ...typography.authLink,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  segmentTextActive: { color: colors.authBlue },
  form: {
    gap: 16,
  },
  link: {
    ...typography.authLink,
    color: colors.authBlue,
    textAlign: "right",
    marginTop: 2,
  },
  error: {
    color: colors.danger,
    fontFamily: font.family.medium,
    fontSize: 12,
  },
});
