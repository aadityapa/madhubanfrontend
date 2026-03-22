import { colors, font } from "@madhuban/theme";
import { useRef } from "react";
import { StyleSheet, TextInput, View } from "react-native";

const LENGTH = 4;

export function OtpInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (digits: string) => void;
}) {
  const refs = useRef<Array<TextInput | null>>([]);
  const digits = value.replace(/\D/g, "").slice(0, LENGTH).split("");
  while (digits.length < LENGTH) digits.push("");

  function setAt(index: number, char: string) {
    const next = value.replace(/\D/g, "").split("");
    while (next.length < LENGTH) next.push("");
    next[index] = char;
    onChange(next.join("").replace(/\D/g, "").slice(0, LENGTH));
  }

  return (
    <View style={styles.row}>
      {Array.from({ length: LENGTH }).map((_, i) => (
        <TextInput
          key={i}
          ref={(r) => {
            refs.current[i] = r;
          }}
          value={digits[i] ?? ""}
          keyboardType="number-pad"
          maxLength={1}
          onChangeText={(t) => {
            const c = t.replace(/\D/g, "").slice(-1);
            setAt(i, c);
            if (c && i < LENGTH - 1) refs.current[i + 1]?.focus();
          }}
          style={styles.cell}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
  },
  cell: {
    width: 56,
    height: 58,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#F7FAFF",
    textAlign: "center",
    fontFamily: font.family.black,
    fontSize: 22,
    color: colors.text,
  },
});
