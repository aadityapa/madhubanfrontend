export function SkeletonBlock({
  width = "100%",
  height = 16,
  radius = 8,
  style,
}: {
  width?: number | string;
  height?: number | string;
  radius?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background:
          "linear-gradient(90deg, rgba(226,232,240,0.9) 0%, rgba(241,245,249,1) 50%, rgba(226,232,240,0.9) 100%)",
        backgroundSize: "200% 100%",
        animation: "admin-skeleton-shimmer 1.4s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

export function SkeletonTheme() {
  return (
    <style>{`
      @keyframes admin-skeleton-shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
  );
}

export function SkeletonMetricCard() {
  return (
    <div style={ss.metricCard}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
        <SkeletonBlock width={40} height={40} radius={12} />
        <SkeletonBlock width={64} height={22} radius={999} />
      </div>
      <SkeletonBlock width="42%" height={12} />
      <SkeletonBlock width="58%" height={30} style={{ marginTop: 12 }} />
      <SkeletonBlock width="75%" height={12} style={{ marginTop: 12 }} />
    </div>
  );
}

export function SkeletonTableRows({
  rows = 5,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: cols }, (_, colIndex) => (
            <td key={colIndex} style={{ padding: "16px" }}>
              <SkeletonBlock
                width={colIndex === 0 ? "72%" : colIndex === cols - 1 ? 72 : "54%"}
                height={14}
                radius={7}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function SkeletonCardList({
  count = 3,
  lines = 3,
}: {
  count?: number;
  lines?: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} style={ss.listCard}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <SkeletonBlock width="35%" height={12} />
              <SkeletonBlock width="68%" height={18} style={{ marginTop: 10 }} />
            </div>
            <SkeletonBlock width={34} height={34} radius={10} />
          </div>
          {Array.from({ length: lines }, (__unused, lineIndex) => (
            <SkeletonBlock
              key={lineIndex}
              width={lineIndex === lines - 1 ? "45%" : "100%"}
              height={12}
              style={{ marginTop: 10 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

const ss: Record<string, React.CSSProperties> = {
  metricCard: {
    background: "var(--c-card)",
    border: "1px solid var(--c-card-border)",
    borderRadius: 16,
    padding: 18,
  },
  listCard: {
    background: "var(--c-card)",
    border: "1px solid var(--c-card-border)",
    borderRadius: 12,
    padding: 16,
  },
};
