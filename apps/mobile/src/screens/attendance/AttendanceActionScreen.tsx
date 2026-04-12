import { Feather, Ionicons } from "@expo/vector-icons";
import { checkIn, checkOut } from "@madhuban/api";
import { colors, font, radii, space } from "@madhuban/theme";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../../components/Button";
import { RefreshableScrollView } from "../../components/RefreshableScrollView";
import { useAuth } from "../../context/AuthContext";
import { getRoleHomePath } from "../../navigation/roleRoutes";

type AttendanceMode = "check-in" | "check-out";

function getScreenCopy(mode: AttendanceMode) {
  return {
    title: mode === "check-in" ? "Daily Check-In" : "Daily Check-Out",
    subtitle:
      mode === "check-in"
        ? "Selfie + GPS required to begin shift"
        : "Selfie + GPS required to complete shift",
    primaryAction: mode === "check-in" ? "Check In" : "Check Out",
    confirmedAction: mode === "check-in" ? "Check In Confirmed" : "Check Out Confirmed",
    timeLabel: mode === "check-in" ? "Check In Time" : "Check Out Time",
    dateLabel: mode === "check-in" ? "Check In Date" : "Check Out Date",
    helper:
      mode === "check-in"
        ? "After uploading selfie check in will be recorded."
        : "After uploading selfie check out will be recorded.",
  };
}

function InfoTile({
  icon,
  iconColor,
  title,
  subtitle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.infoTile}>
      <View style={styles.infoTileIcon}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <Text style={styles.infoTileTitle}>{title}</Text>
      <Text style={styles.infoTileSubtitle}>{subtitle}</Text>
    </View>
  );
}

export function AttendanceActionScreen({ mode }: { mode: AttendanceMode }) {
  const insets = useSafeAreaInsets();
  const { role } = useAuth();
  const copy = useMemo(() => getScreenCopy(mode), [mode]);
  const [insideGeofence, setInsideGeofence] = useState(true);
  const [selfieTaken, setSelfieTaken] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const zoneStatusText = insideGeofence ? "GPS ACTIVE" : "OUT OF ZONE";
  const zoneStatusTone = insideGeofence ? styles.zoneStatusActive : styles.zoneStatusAlert;
  const actionEnabled = insideGeofence && selfieTaken && !confirmed;

  function handleCapture() {
    if (!insideGeofence) return;
    setSelfieTaken(true);
    setConfirmed(false);
    setStatusMessage(null);
  }

  useEffect(() => {
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, []);

  async function handlePrimaryAction() {
    if (!actionEnabled) return;
    setSubmitting(true);
    setStatusMessage(null);
    try {
      if (mode === "check-in") {
        await checkIn("Head Office, Shivaji Nagar");
      } else {
        await checkOut();
      }
      setConfirmed(true);
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : `Unable to ${mode.replace("-", " ")} right now.`,
      );
      return;
    } finally {
      setSubmitting(false);
    }
    redirectTimer.current = setTimeout(() => {
      router.replace(getRoleHomePath(role));
    }, 1200);
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={18} color="#475569" />
          </Pressable>

          <View style={styles.headerCopy}>
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.subtitle}>{copy.subtitle}</Text>
          </View>

          <View style={[styles.zoneBadge, zoneStatusTone]}>
            <View style={[styles.zoneBadgeDot, insideGeofence ? styles.zoneDotActive : styles.zoneDotAlert]} />
            <Text style={[styles.zoneBadgeText, insideGeofence ? styles.zoneBadgeTextActive : styles.zoneBadgeTextAlert]}>
              {zoneStatusText}
            </Text>
          </View>
        </View>
      </View>

      <RefreshableScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onRefresh={async () => {}}
      >
        {!insideGeofence ? (
          <View style={styles.alertCard}>
            <View style={styles.alertIcon}>
              <Ionicons name="warning-outline" size={16} color={colors.danger} />
            </View>
            <View style={styles.alertBody}>
              <Text style={styles.alertTitle}>Outside Geo-fence Zone</Text>
              <Text style={styles.alertText}>
                You must be within the authorized premises to {mode.replace("-", " ")}.
              </Text>
            </View>
          </View>
        ) : null}

        <Pressable style={[styles.selfieCard, selfieTaken && styles.selfieCardCaptured]} onPress={handleCapture}>
          {selfieTaken ? (
            <View style={[styles.selfiePreview, confirmed && styles.selfiePreviewConfirmed]}>
              <View style={styles.selfieOverlayTop}>
                <Text style={styles.selfieLocation}>Vikram Monarch, Pune - 18.5592 N, 73.8098 E</Text>
              </View>
              <View style={styles.selfieFaceBadge}>
                <Text style={styles.selfieFaceText}>RK</Text>
              </View>
              <View style={styles.selfieOverlayBottom}>
                <Ionicons name="time-outline" size={12} color="#FFFFFF" />
                <Text style={styles.selfieTime}>06:01 pm</Text>
              </View>
              {confirmed ? (
                <View style={styles.selfieConfirmedBadge}>
                  <Ionicons name="checkmark-circle" size={40} color="#FFFFFF" />
                </View>
              ) : null}
            </View>
          ) : (
            <View style={styles.selfiePlaceholder}>
              <View style={styles.selfiePlaceholderIcon}>
                <Ionicons name="cloud-upload-outline" size={24} color="#94A3B8" />
              </View>
              <Text style={styles.selfiePlaceholderTitle}>Tap to Take Selfie</Text>
              <Text style={styles.selfiePlaceholderText}>
                {insideGeofence ? "Face must be clearly visible" : `GPS outside zone - ${mode} blocked`}
              </Text>
            </View>
          )}
        </Pressable>

        {selfieTaken ? (
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailIconWrap}>
                <Ionicons name="location-outline" size={15} color="#FF5B5B" />
              </View>
              <View>
                <Text style={styles.detailValue}>Rahul Dhumal, Pune</Text>
                <Text style={styles.detailLabel}>Co-Ordinates.</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIconWrap}>
                <Ionicons name="time-outline" size={15} color="#FF8A00" />
              </View>
              <View>
                <Text style={styles.detailValue}>06:01 pm</Text>
                <Text style={styles.detailLabel}>{copy.timeLabel}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIconWrap}>
                <Ionicons name="calendar-outline" size={15} color="#4F7CFF" />
              </View>
              <View>
                <Text style={styles.detailValue}>Thursday, 19 March 2026</Text>
                <Text style={styles.detailLabel}>{copy.dateLabel}</Text>
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.premisesCard}>
          <View>
            <Text style={styles.premisesTitle}>
              {insideGeofence ? "You are in premises" : "You are outside premises"}
            </Text>
            <Text style={styles.premisesSubtitle}>Vikram Monarch, Shivaji Nagar</Text>
          </View>
          <View style={[styles.zoneBadge, insideGeofence ? styles.zoneStatusActive : styles.zoneStatusAlert]}>
            <View style={[styles.zoneBadgeDot, insideGeofence ? styles.zoneDotActive : styles.zoneDotAlert]} />
            <Text style={[styles.zoneBadgeText, insideGeofence ? styles.zoneBadgeTextActive : styles.zoneBadgeTextAlert]}>
              {insideGeofence ? "GPS Active" : "GPS Alert"}
            </Text>
          </View>
        </View>

        <View style={styles.tileGrid}>
          <InfoTile icon="location-outline" iconColor="#FF5B5B" title="Head Office" subtitle="Current Location" />
          <InfoTile
            icon="locate-outline"
            iconColor={insideGeofence ? "#0F9F6E" : "#FF5B5B"}
            title={insideGeofence ? "Inside Zone" : "Outside Zone"}
            subtitle="Geofence Status"
          />
          <InfoTile icon="sunny-outline" iconColor="#FF9F1A" title="Day Shift" subtitle="8:00 AM - 5:00 PM" />
          <InfoTile icon="clipboard-outline" iconColor="#4F7CFF" title="27 Tasks" subtitle="Assigned Today" />
        </View>

        <View style={styles.demoRow}>
          <Text style={styles.demoLabel}>DEMO: TOGGLE GEO-FENCE</Text>
          <Switch
            value={insideGeofence}
            onValueChange={(value) => {
              setInsideGeofence(value);
              if (!value) {
                setConfirmed(false);
              }
            }}
            thumbColor="#FFFFFF"
            trackColor={{ false: "#F43F5E", true: "#22C55E" }}
          />
        </View>

        <Button
          title={
            confirmed
              ? copy.confirmedAction
              : submitting
                ? "Submitting..."
              : insideGeofence
                ? selfieTaken
                  ? copy.primaryAction
                  : "Take Selfie First"
                : "Outside Geo-fence"
          }
          onPress={handlePrimaryAction}
          disabled={submitting || (!actionEnabled && !confirmed)}
          variant={confirmed ? "success" : "primary"}
        />

        <Text style={styles.helperText}>
          {statusMessage ?? (confirmed ? "Attendance recorded successfully." : copy.helper)}
        </Text>
      </RefreshableScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    paddingHorizontal: space.md,
    paddingBottom: space.sm,
    backgroundColor: colors.surfaceElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF4FB",
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontFamily: font.family.black,
    fontSize: 16,
  },
  subtitle: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: font.family.medium,
    fontSize: 11,
    lineHeight: 14,
  },
  zoneBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  zoneStatusActive: {
    backgroundColor: "#E9FBF2",
  },
  zoneStatusAlert: {
    backgroundColor: "#FFF1F2",
  },
  zoneBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: radii.full,
  },
  zoneDotActive: {
    backgroundColor: "#10B981",
  },
  zoneDotAlert: {
    backgroundColor: colors.danger,
  },
  zoneBadgeText: {
    fontFamily: font.family.bold,
    fontSize: 10,
  },
  zoneBadgeTextActive: {
    color: "#10B981",
  },
  zoneBadgeTextAlert: {
    color: colors.danger,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: space.md,
    gap: 12,
    paddingBottom: 28,
  },
  alertCard: {
    flexDirection: "row",
    gap: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    padding: 14,
  },
  alertIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF1F2",
  },
  alertBody: {
    flex: 1,
    gap: 4,
  },
  alertTitle: {
    color: colors.danger,
    fontFamily: font.family.bold,
    fontSize: 13,
  },
  alertText: {
    color: "#F87171",
    fontFamily: font.family.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  selfieCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#D7E2F1",
    backgroundColor: colors.surfaceElevated,
    overflow: "hidden",
  },
  selfieCardCaptured: {
    borderStyle: "solid",
    borderColor: "#A7F3D0",
  },
  selfiePlaceholder: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 20,
  },
  selfiePlaceholderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#D7E2F1",
  },
  selfiePlaceholderTitle: {
    color: colors.text,
    fontFamily: font.family.bold,
    fontSize: 18,
  },
  selfiePlaceholderText: {
    color: colors.textMuted,
    fontFamily: font.family.medium,
    fontSize: 12,
  },
  selfiePreview: {
    minHeight: 200,
    padding: 14,
    justifyContent: "space-between",
    backgroundColor: "#334155",
  },
  selfiePreviewConfirmed: {
    backgroundColor: "#0F9F6E",
  },
  selfieOverlayTop: {
    alignSelf: "flex-start",
    borderRadius: radii.full,
    backgroundColor: "rgba(15,23,42,0.22)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  selfieLocation: {
    color: "#FFFFFF",
    fontFamily: font.family.bold,
    fontSize: 10,
  },
  selfieFaceBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
  },
  selfieFaceText: {
    color: "#FFFFFF",
    fontFamily: font.family.black,
    fontSize: 34,
  },
  selfieOverlayBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  selfieTime: {
    color: "#FFFFFF",
    fontFamily: font.family.medium,
    fontSize: 12,
  },
  selfieConfirmedBadge: {
    position: "absolute",
    top: "40%",
    alignSelf: "center",
  },
  detailCard: {
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 14,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detailIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFD",
  },
  detailValue: {
    color: colors.text,
    fontFamily: font.family.bold,
    fontSize: 14,
  },
  detailLabel: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: font.family.medium,
    fontSize: 11,
  },
  premisesCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  premisesTitle: {
    color: colors.text,
    fontFamily: font.family.bold,
    fontSize: 14,
  },
  premisesSubtitle: {
    marginTop: 3,
    color: colors.textMuted,
    fontFamily: font.family.medium,
    fontSize: 11,
  },
  tileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  infoTile: {
    width: "48.4%",
    borderRadius: radii.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 8,
  },
  infoTileIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFD",
  },
  infoTileTitle: {
    color: colors.text,
    fontFamily: font.family.bold,
    fontSize: 14,
  },
  infoTileSubtitle: {
    color: colors.textMuted,
    fontFamily: font.family.medium,
    fontSize: 11,
  },
  demoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: radii.md,
    backgroundColor: "#FFF8E6",
    borderWidth: 1,
    borderColor: "#FDE68A",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  demoLabel: {
    color: "#D97706",
    fontFamily: font.family.bold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  helperText: {
    textAlign: "center",
    color: "#94A3B8",
    fontFamily: font.family.medium,
    fontSize: 11,
  },
});
