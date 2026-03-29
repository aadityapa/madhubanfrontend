import { colors, font, radii } from "@madhuban/theme";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  root: {
    gap: 14,
    paddingBottom: 28,
  },
  segmentedControl: {
    flexDirection: "row",
    gap: 10,
    padding: 6,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  segmentButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  segmentButtonActive: {
    backgroundColor: "#F7F4EF",
  },
  segmentButtonText: {
    color: "rgba(242,246,255,0.74)",
    fontFamily: font.family.bold,
    fontSize: 14,
  },
  segmentButtonTextActive: {
    color: "#23324B",
  },
  duoGrid: {
    flexDirection: "row",
    gap: 12,
  },
  halfCard: {
    flex: 1,
  },
  card: {
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7ECF4",
    padding: 16,
    gap: 14,
    shadowColor: "rgba(18, 29, 56, 0.08)",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 3,
  },
  sectionTitle: {
    color: "#74839B",
    fontFamily: font.family.bold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  sectionHeaderInline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionHeaderInlineTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  priorityList: {
    gap: 14,
    marginTop: 4,
  },
  priorityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  priorityLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: 86,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityLabel: {
    color: "#1F2D46",
    fontFamily: font.family.bold,
    fontSize: 13,
  },
  priorityBarTrack: {
    flex: 1,
    height: 5,
    borderRadius: radii.full,
    backgroundColor: "#EBF0F7",
    overflow: "hidden",
  },
  priorityBarFill: {
    height: "100%",
    borderRadius: radii.full,
  },
  priorityValue: {
    width: 26,
    color: "#1F2D46",
    fontFamily: font.family.black,
    fontSize: 13,
    textAlign: "right",
  },
  streakSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  streakIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFF1E6",
    alignItems: "center",
    justifyContent: "center",
  },
  streakValue: {
    color: "#1F2D46",
    fontFamily: font.family.black,
    fontSize: 34,
    lineHeight: 36,
  },
  streakLabel: {
    color: "#8B98AE",
    fontFamily: font.family.bold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  streakMeta: {
    color: "#A4B0C2",
    fontFamily: font.family.medium,
    fontSize: 11,
  },
  weekLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  weekLabel: {
    width: 20,
    textAlign: "center",
    color: "#C2CAD8",
    fontFamily: font.family.bold,
    fontSize: 10,
  },
  heatmap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  heatCell: {
    width: 20,
    height: 20,
    borderRadius: 5,
  },
  heatCellPresent: {
    backgroundColor: "#32D399",
  },
  heatCellAbsent: {
    backgroundColor: "#FFD9DE",
  },
  legendRow: {
    flexDirection: "row",
    gap: 14,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: "#A4B0C2",
    fontFamily: font.family.medium,
    fontSize: 11,
  },
  zoneList: {
    gap: 14,
  },
  zoneRow: {
    gap: 7,
  },
  zoneRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  zoneName: {
    color: "#1F2D46",
    fontFamily: font.family.bold,
    fontSize: 15,
  },
  zoneScore: {
    color: "#2962FF",
    fontFamily: font.family.black,
    fontSize: 14,
  },
  zoneTrack: {
    height: 6,
    borderRadius: radii.full,
    backgroundColor: "#EDF2F8",
    overflow: "hidden",
  },
  zoneFill: {
    height: "100%",
    borderRadius: radii.full,
  },
  feedbackList: {
    gap: 14,
  },
  feedbackRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  feedbackAvatar: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "#F0F3F8",
    alignItems: "center",
    justifyContent: "center",
  },
  feedbackAvatarText: {
    color: "#64748B",
    fontFamily: font.family.bold,
    fontSize: 13,
  },
  feedbackBody: {
    flex: 1,
    gap: 4,
  },
  feedbackTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  feedbackTask: {
    flex: 1,
    color: "#1F2D46",
    fontFamily: font.family.bold,
    fontSize: 16,
  },
  feedbackWhen: {
    color: "#A4B0C2",
    fontFamily: font.family.medium,
    fontSize: 12,
  },
  feedbackNote: {
    color: "#7C8AA2",
    fontFamily: font.family.medium,
    fontSize: 13,
  },
  ratingRow: {
    flexDirection: "row",
    gap: 2,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 2,
  },
  leaveHeading: {
    color: "#62748E",
    fontFamily: font.family.black,
    fontSize: 20,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  applyLeaveButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    backgroundColor: "#23324B",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  applyLeaveButtonText: {
    color: "#FFFFFF",
    fontFamily: font.family.bold,
    fontSize: 13,
  },
  leaveStatsRow: {
    flexDirection: "row",
    gap: 10,
  },
  leaveStatCard: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7ECF4",
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: "center",
    gap: 6,
  },
  leaveStatIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F8FAFD",
    alignItems: "center",
    justifyContent: "center",
  },
  leaveStatValue: {
    color: "#23324B",
    fontFamily: font.family.black,
    fontSize: 34,
    lineHeight: 36,
  },
  leaveStatLabel: {
    color: "#9AA8BC",
    fontFamily: font.family.bold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  applicationList: {
    gap: 14,
  },
  applicationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 6,
  },
  applicationTitle: {
    color: "#23324B",
    fontFamily: font.family.bold,
    fontSize: 17,
  },
  applicationMeta: {
    marginTop: 2,
    color: "#8FA0B7",
    fontFamily: font.family.medium,
    fontSize: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontFamily: font.family.bold,
    fontSize: 12,
  },
  statusWarning: {
    backgroundColor: "#FFF4E3",
  },
  statusWarningText: {
    color: "#F59E0B",
  },
  statusSuccess: {
    backgroundColor: "#E9FBF3",
  },
  statusSuccessText: {
    color: "#17C484",
  },
  statusDanger: {
    backgroundColor: "#FFEAEF",
  },
  statusDangerText: {
    color: "#FF4D6D",
  },
});
