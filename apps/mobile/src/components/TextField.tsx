import { colors, radii, typography } from "@madhuban/theme";
import type { ReactNode } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

export function TextField({
  label,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  placeholder,
  leftIcon,
  rightIcon,
  textContentType,
}: {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
  autoCapitalize?: "none" | "sentences";
  placeholder?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  textContentType?:
    | "none"
    | "URL"
    | "addressCity"
    | "addressCityAndState"
    | "addressState"
    | "countryName"
    | "creditCardNumber"
    | "emailAddress"
    | "familyName"
    | "fullStreetAddress"
    | "givenName"
    | "jobTitle"
    | "location"
    | "middleName"
    | "name"
    | "namePrefix"
    | "nameSuffix"
    | "nickname"
    | "organizationName"
    | "postalCode"
    | "streetAddressLine1"
    | "streetAddressLine2"
    | "sublocality"
    | "telephoneNumber"
    | "username"
    | "password"
    | "newPassword"
    | "oneTimeCode";
}) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputWrap}>
        {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          placeholder={placeholder}
          placeholderTextColor="#8AA0C3"
          style={styles.input}
          textContentType={textContentType}
        />
        {rightIcon ? <View style={styles.icon}>{rightIcon}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  label: {
    ...typography.authFieldLabel,
    color: colors.textMuted,
    textTransform: "uppercase",
    paddingHorizontal: 6,
  },
  inputWrap: {
    minHeight: 46,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#F7FAFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
  },
  input: {
    flex: 1,
    color: colors.text,
    ...typography.authInput,
  },
  icon: {
    width: 18,
    alignItems: "center",
  },
});
