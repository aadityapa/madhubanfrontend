import { Feather, Ionicons } from "@expo/vector-icons";
import {
  checkIn,
  checkOut,
  submitStaffAttendance,
  submitSupervisorAttendance,
} from "@madhuban/api";
import { colors, font, radii, space } from "@madhuban/theme";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../../components/Button";
import { RefreshableScrollView } from "../../components/RefreshableScrollView";
import { useAuth } from "../../context/AuthContext";
import { getRoleHomePath } from "../../navigation/roleRoutes";

type AttendanceMode = "check-in" | "check-out";

type CapturedSelfie = {
  uri: string;
  width?: number;
  height?: number;
};

type CoordinatesState = {
  latitude: number;
  longitude: number;
};

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

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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
  const isSupervisor = String(role ?? "").trim().toLowerCase() === "supervisor";
  const isStaff = String(role ?? "").trim().toLowerCase() === "staff";
  const copy = useMemo(() => getScreenCopy(mode), [mode]);
  const cameraRef = useRef<CameraView | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [insideGeofence, setInsideGeofence] = useState(true);
  const [selfie, setSelfie] = useState<CapturedSelfie | null>(null);
  const [capturedAt, setCapturedAt] = useState<Date | null>(null);
  const [coords, setCoords] = useState<CoordinatesState | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const zoneStatusText = insideGeofence ? "GPS ACTIVE" : "OUT OF ZONE";
  const zoneStatusTone = insideGeofence ? styles.zoneStatusActive : styles.zoneStatusAlert;
  const actionEnabled = insideGeofence && (!!selfie || mode === "check-out") && !!coords && !confirmed;

  useEffect(() => {
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, []);

  async function ensureLocation() {
    setLoadingLocation(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        throw new Error("Location permission is required for attendance.");
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const nextCoords = {
        latitude: Number(position.coords.latitude.toFixed(4)),
        longitude: Number(position.coords.longitude.toFixed(4)),
      };
      setCoords(nextCoords);
      setInsideGeofence(true);
      return nextCoords;
    } catch (error) {
      setInsideGeofence(false);
      throw error;
    } finally {
      setLoadingLocation(false);
    }
  }

  async function handleCapture() {
    if (!insideGeofence && !coords) {
      try {
        await ensureLocation();
      } catch (error) {
        setStatusMessage(error instanceof Error ? error.message : "Location permission is required.");
        return;
      }
    }

    const permission =
      cameraPermission?.granted ? cameraPermission : await requestCameraPermission();
    if (!permission?.granted) {
      setStatusMessage("Camera permission is required for attendance selfie.");
      return;
    }

    setStatusMessage(null);
    setCameraOpen(true);
  }

  async function capturePhoto() {
    if (!cameraRef.current) return;
    try {
      const nextCoords = coords ?? (await ensureLocation());
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
      });
      setCoords(nextCoords);
      setSelfie({ uri: photo.uri, width: photo.width, height: photo.height });
      setCapturedAt(new Date());
      setConfirmed(false);
      setCameraOpen(false);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Unable to capture selfie.");
    }
  }

  async function handlePrimaryAction() {
    if (!actionEnabled) return;
    setSubmitting(true);
    setStatusMessage(null);
    try {
      const nextCoords = coords ?? (await ensureLocation());
      if (isSupervisor) {
        await submitSupervisorAttendance({
          action: mode === "check-in" ? "check_in" : "check_out",
          latitude: String(nextCoords.latitude),
          longitude: String(nextCoords.longitude),
          selfie:
            mode === "check-in" && selfie
              ? {
                  uri: selfie.uri,
                  type: "image/jpeg",
                  name: `attendance-selfie-${Date.now()}.jpg`,
                }
              : undefined,
        });
      } else if (isStaff) {
        await submitStaffAttendance({
          action: mode === "check-in" ? "check_in" : "check_out",
          latitude: String(nextCoords.latitude),
          longitude: String(nextCoords.longitude),
          selfie:
            mode === "check-in" && selfie
              ? {
                  uri: selfie.uri,
                  type: "image/jpeg",
                  name: `attendance-selfie-${Date.now()}.jpg`,
                }
              : undefined,
        });
      } else if (mode === "check-in") {
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

  const previewTime = capturedAt ? formatTime(capturedAt) : "--";
  const previewDate = capturedAt ? formatDate(capturedAt) : "--";
  const coordinatesText = coords ? `${coords.latitude} N, ${coords.longitude} E` : "Location pending";

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <Modal visible={cameraOpen} animationType="slide" onRequestClose={() => setCameraOpen(false)}>
        <View style={styles.cameraScreen}>
          <CameraView ref={cameraRef} facing="front" style={styles.cameraView} />
          <View style={[styles.cameraHeader, { paddingTop: insets.top + 12 }]}>
            <Pressable style={styles.cameraBackButton} onPress={() => setCameraOpen(false)}>
              <Feather name="x" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
          <View style={[styles.cameraFooter, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <Pressable style={styles.captureButtonOuter} onPress={capturePhoto}>
              <View style={styles.captureButtonInner} />
            </Pressable>
          </View>
        </View>
      </Modal>

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
            <View
              style={[
                styles.zoneBadgeDot,
                insideGeofence ? styles.zoneDotActive : styles.zoneDotAlert,
              ]}
            />
            <Text
              style={[
                styles.zoneBadgeText,
                insideGeofence ? styles.zoneBadgeTextActive : styles.zoneBadgeTextAlert,
              ]}
            >
              {zoneStatusText}
            </Text>
          </View>
        </View>
      </View>

      <RefreshableScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onRefresh={async () => {
          await ensureLocation();
        }}
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

        <Pressable
          style={[styles.selfieCard, selfie && styles.selfieCardCaptured]}
          onPress={mode === "check-in" ? handleCapture : () => void ensureLocation().catch(() => {})}
        >
          {selfie ? (
            <View style={[styles.selfiePreview, confirmed && styles.selfiePreviewConfirmed]}>
              <Image source={{ uri: selfie.uri }} style={styles.selfieImage} />
              <View style={styles.selfieShade} />
              <View style={styles.selfieOverlayTop}>
                <Text style={styles.selfieLocation}>Current Coordinates - {coordinatesText}</Text>
              </View>
              <View style={styles.selfieFaceBadge}>
                <Ionicons name="camera" size={28} color="#FFFFFF" />
              </View>
              <View style={styles.selfieOverlayBottom}>
                <Ionicons name="time-outline" size={12} color="#FFFFFF" />
                <Text style={styles.selfieTime}>{previewTime}</Text>
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
                <Ionicons
                  name={mode === "check-in" ? "camera-outline" : "locate-outline"}
                  size={24}
                  color="#94A3B8"
                />
              </View>
              <Text style={styles.selfiePlaceholderTitle}>
                {mode === "check-in" ? "Tap to Take Selfie" : "Tap to Refresh GPS"}
              </Text>
              <Text style={styles.selfiePlaceholderText}>
                {mode === "check-in"
                  ? insideGeofence
                    ? "Face must be clearly visible"
                    : `GPS outside zone - ${mode} blocked`
                  : loadingLocation
                    ? "Refreshing current coordinates..."
                    : "Check-out uses live GPS coordinates"}
              </Text>
            </View>
          )}
        </Pressable>

        {(selfie || coords) ? (
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailIconWrap}>
                <Ionicons name="location-outline" size={15} color="#FF5B5B" />
              </View>
              <View>
                <Text style={styles.detailValue}>{coordinatesText}</Text>
                <Text style={styles.detailLabel}>Co-Ordinates.</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIconWrap}>
                <Ionicons name="time-outline" size={15} color="#FF8A00" />
              </View>
              <View>
                <Text style={styles.detailValue}>{previewTime}</Text>
                <Text style={styles.detailLabel}>{copy.timeLabel}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIconWrap}>
                <Ionicons name="calendar-outline" size={15} color="#4F7CFF" />
              </View>
              <View>
                <Text style={styles.detailValue}>{previewDate}</Text>
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
            <Text style={styles.premisesSubtitle}>Current attendance location</Text>
          </View>
          <View
            style={[
              styles.zoneBadge,
              insideGeofence ? styles.zoneStatusActive : styles.zoneStatusAlert,
            ]}
          >
            <View
              style={[
                styles.zoneBadgeDot,
                insideGeofence ? styles.zoneDotActive : styles.zoneDotAlert,
              ]}
            />
            <Text
              style={[
                styles.zoneBadgeText,
                insideGeofence ? styles.zoneBadgeTextActive : styles.zoneBadgeTextAlert,
              ]}
            >
              {insideGeofence ? "GPS Active" : "GPS Alert"}
            </Text>
          </View>
        </View>

        <View style={styles.tileGrid}>
          <InfoTile
            icon="location-outline"
            iconColor="#FF5B5B"
            title="Current Location"
            subtitle={coordinatesText}
          />
          <InfoTile
            icon="locate-outline"
            iconColor={insideGeofence ? "#0F9F6E" : "#FF5B5B"}
            title={insideGeofence ? "Inside Zone" : "Outside Zone"}
            subtitle="Geofence Status"
          />
          <InfoTile icon="sunny-outline" iconColor="#FF9F1A" title="Day Shift" subtitle="8:00 AM - 5:00 PM" />
          <InfoTile
            icon="camera-outline"
            iconColor="#4F7CFF"
            title={mode === "check-in" ? "Selfie Required" : "GPS Required"}
            subtitle={mode === "check-in" ? "Capture before submit" : "Live coordinates on submit"}
          />
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
                : loadingLocation
                  ? "Fetching GPS..."
                  : mode === "check-in"
                    ? selfie
                      ? copy.primaryAction
                      : "Take Selfie First"
                    : copy.primaryAction
          }
          onPress={handlePrimaryAction}
          disabled={submitting || loadingLocation || (!actionEnabled && !confirmed)}
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
  cameraScreen: {
    flex: 1,
    backgroundColor: "#000000",
  },
  cameraView: {
    flex: 1,
  },
  cameraHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    alignItems: "flex-end",
  },
  cameraBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,23,42,0.42)",
  },
  cameraFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
  },
  captureButtonOuter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 5,
    borderColor: "rgba(255,255,255,0.78)",
    alignItems: "center",
    justifyContent: "center",
  },
  captureButtonInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#FFFFFF",
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
    textAlign: "center",
  },
  selfiePreview: {
    minHeight: 200,
    padding: 14,
    justifyContent: "space-between",
    backgroundColor: "#334155",
  },
  selfieImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  selfieShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.28)",
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
