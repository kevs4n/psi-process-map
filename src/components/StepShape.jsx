import { tokens } from '../lib/tokens';

const { sizes, colors, fonts } = tokens;

function isUrl(str) {
  return str && (str.startsWith('http://') || str.startsWith('https://'));
}

function adoDisplayLabel(ref) {
  if (!ref) return '';
  if (isUrl(ref)) {
    // Extract work item ID from ADO URL: last path segment
    const parts = ref.replace(/\/+$/, '').split('/');
    const id = parts[parts.length - 1];
    return `WI-${id}`;
  }
  return ref;
}

function getShapeProps(type) {
  switch (type) {
    case 'start':
      return { fill: colors.startFill, stroke: colors.startStroke };
    case 'end':
      return { fill: colors.endFill, stroke: colors.endStroke };
    case 'decision':
      return { fill: colors.decisionFill, stroke: colors.decisionStroke };
    case 'process':
    default:
      return { fill: colors.processFill, stroke: colors.processStroke };
  }
}

export default function StepShape({ step, isSelected, onMouseDown, onDoubleClick, onClick }) {
  const { fill, stroke } = getShapeProps(step.type);
  const w = sizes.stepWidth;
  const h = sizes.stepHeight;

  const renderShape = () => {
    if (step.type === 'decision') {
      const s = sizes.decisionSize;
      const half = s / 2;
      const points = `${half},0 ${s},${half} ${half},${s} 0,${half}`;
      return (
        <polygon
          points={points}
          fill={fill}
          stroke={stroke}
          strokeWidth={2}
          transform={`translate(${-half}, ${-half})`}
        />
      );
    }

    const rx = step.type === 'start' || step.type === 'end' ? sizes.pillRadius : sizes.cornerRadius;
    return (
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        rx={rx}
        ry={rx}
        fill={fill}
        stroke={stroke}
        strokeWidth={2}
      />
    );
  };

  const getBBox = () => {
    if (step.type === 'decision') {
      const s = sizes.decisionSize;
      return { x: -s / 2 - 4, y: -s / 2 - 4, w: s + 8, h: s + 8 };
    }
    return { x: -w / 2 - 4, y: -h / 2 - 4, w: w + 8, h: h + 8 };
  };

  const bbox = getBBox();

  return (
    <g
      transform={`translate(${step.x}, ${step.y})`}
      style={{ cursor: 'pointer' }}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      onClick={onClick}
    >
      {isSelected && (
        <rect
          data-selection="true"
          x={bbox.x}
          y={bbox.y}
          width={bbox.w}
          height={bbox.h}
          rx={4}
          fill="none"
          stroke={colors.selectionStroke}
          strokeWidth={2}
          strokeDasharray="6 3"
        />
      )}
      {renderShape()}
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fill="#333"
        fontSize={sizes.fontSize}
        fontFamily={tokens.fonts.sans}
        fontWeight={500}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {step.label}
      </text>
      {step.adoRef && (() => {
        const badgeY = step.type === 'decision' ? sizes.decisionSize / 2 + 16 : h / 2 + 16;
        const label = adoDisplayLabel(step.adoRef);
        const textEl = (
          <text
            textAnchor="middle"
            y={badgeY}
            fill={isUrl(step.adoRef) ? colors.selectionStroke : '#888'}
            fontSize={sizes.fontSizeSmall}
            fontFamily={tokens.fonts.mono}
            style={{ cursor: isUrl(step.adoRef) ? 'pointer' : 'default', userSelect: 'none' }}
            textDecoration={isUrl(step.adoRef) ? 'underline' : 'none'}
          >
            {label}
          </text>
        );
        if (isUrl(step.adoRef)) {
          return (
            <a
              href={step.adoRef}
              xlinkHref={step.adoRef}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {textEl}
            </a>
          );
        }
        return textEl;
      })()}
    </g>
  );
}
