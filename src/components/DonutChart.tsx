interface DonutSegment {
  value: number;
  colorClassName: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  total: number;
  size?: number;
  strokeWidth?: number;
  centerLabel: string;
  centerValue: string | number;
}

// Hand-built SVG donut (no charting library): each segment is a <circle>
// stroked with a dash length proportional to its share of the total,
// rotated into place via a cumulative dash-offset.
export default function DonutChart({
  segments,
  total,
  size = 160,
  strokeWidth = 20,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-gray-100"
          strokeWidth={strokeWidth}
        />
        {total > 0 &&
          segments.map((segment, i) => {
            if (segment.value === 0) return null;
            const dash = (segment.value / total) * circumference;
            const offset = cumulative;
            cumulative += dash;
            return (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                className={segment.colorClassName}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            );
          })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-900">{centerValue}</span>
        <span className="text-xs text-gray-500">{centerLabel}</span>
      </div>
    </div>
  );
}
