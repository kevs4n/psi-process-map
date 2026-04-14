import { tokens } from '../lib/tokens';

const { sizes, colors } = tokens;

function getStepPort(step, side) {
  const w = sizes.stepWidth;
  const h = sizes.stepHeight;
  if (step.type === 'decision') {
    const half = sizes.decisionSize / 2;
    switch (side) {
      case 'right': return { x: step.x + half, y: step.y };
      case 'left': return { x: step.x - half, y: step.y };
      case 'bottom': return { x: step.x, y: step.y + half };
      case 'top': return { x: step.x, y: step.y - half };
    }
  }
  switch (side) {
    case 'right': return { x: step.x + w / 2, y: step.y };
    case 'left': return { x: step.x - w / 2, y: step.y };
    case 'bottom': return { x: step.x, y: step.y + h / 2 };
    case 'top': return { x: step.x, y: step.y - h / 2 };
  }
}

function choosePorts(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0
      ? { start: getStepPort(from, 'right'), end: getStepPort(to, 'left') }
      : { start: getStepPort(from, 'left'), end: getStepPort(to, 'right') };
  }
  return dy > 0
    ? { start: getStepPort(from, 'bottom'), end: getStepPort(to, 'top') }
    : { start: getStepPort(from, 'top'), end: getStepPort(to, 'bottom') };
}

export default function Connector({ connection, fromStep, toStep, isSelected, onDoubleClick, onClick }) {
  if (!fromStep || !toStep) return null;

  const { start, end } = choosePorts(fromStep, toStep);
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  // Cubic bezier control points
  const cp1x = start.x + dx * 0.4;
  const cp1y = start.y;
  const cp2x = end.x - dx * 0.4;
  const cp2y = end.y;

  const d = `M ${start.x},${start.y} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${end.x},${end.y}`;
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;

  return (
    <g onClick={onClick} onDoubleClick={onDoubleClick} style={{ cursor: 'pointer' }}>
      {/* Wide invisible hit area */}
      <path d={d} fill="none" stroke="transparent" strokeWidth={12} />
      <path
        d={d}
        fill="none"
        stroke={isSelected ? colors.selectionStroke : colors.connectorStroke}
        strokeWidth={isSelected ? 3 : sizes.connectorWidth}
        markerEnd="url(#arrowhead)"
      />
      {connection.label && (
        <g transform={`translate(${midX}, ${midY - 10})`}>
          <rect
            x={-connection.label.length * 4 - 4}
            y={-10}
            width={connection.label.length * 8 + 8}
            height={20}
            rx={4}
            fill="white"
            stroke="#ddd"
            strokeWidth={1}
          />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fill="#555"
            fontSize={sizes.fontSizeSmall}
            fontFamily={tokens.fonts.sans}
            fontWeight={500}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {connection.label}
          </text>
        </g>
      )}
    </g>
  );
}
