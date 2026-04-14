import { useRef, useState, useCallback, useMemo } from 'react';
import StepShape from './StepShape';
import Connector from './Connector';
import { tokens } from '../lib/tokens';

const { sizes, colors } = tokens;

function computeLaneBands(lanes, steps) {
  const laneCounts = {};
  lanes.forEach((l) => (laneCounts[l.id] = 0));
  steps.forEach((s) => {
    if (laneCounts[s.laneId] !== undefined) laneCounts[s.laneId]++;
  });

  // Find max Y per lane to size bands properly
  const laneMaxY = {};
  const laneMinY = {};
  lanes.forEach((l) => {
    laneMaxY[l.id] = 0;
    laneMinY[l.id] = Infinity;
  });
  steps.forEach((s) => {
    if (laneMaxY[s.laneId] !== undefined) {
      laneMaxY[s.laneId] = Math.max(laneMaxY[s.laneId], s.y);
      laneMinY[s.laneId] = Math.min(laneMinY[s.laneId], s.y);
    }
  });

  const bands = [];
  let currentY = 0;
  lanes.forEach((lane) => {
    const minY = laneMinY[lane.id] === Infinity ? 0 : laneMinY[lane.id];
    const maxY = laneMaxY[lane.id];
    const contentHeight = maxY - minY + sizes.stepHeight + 40;
    const height = Math.max(tokens.layout.minLaneHeight, contentHeight);
    bands.push({
      lane,
      y: minY > 0 ? minY - 30 : currentY,
      height,
    });
    currentY = (minY > 0 ? minY - 30 : currentY) + height;
  });

  return bands;
}

export default function Canvas({
  process,
  tool,
  selectedId,
  onSelectItem,
  onMoveStep,
  onAddStep,
  onStartConnect,
  onCompleteConnect,
  connectingFrom,
  onDoubleClickItem,
}) {
  const svgRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const stepMap = useMemo(() => {
    const map = {};
    process.steps.forEach((s) => (map[s.id] = s));
    return map;
  }, [process.steps]);

  const getSVGPoint = useCallback(
    (e) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    },
    []
  );

  const handleCanvasClick = (e) => {
    if (e.target === svgRef.current || e.target.tagName === 'rect' && e.target.dataset.background) {
      if (tool === 'add') {
        const pt = getSVGPoint(e);
        // Determine which lane we clicked in
        const bands = computeLaneBands(process.lanes, process.steps);
        let laneId = process.lanes[0]?.id;
        for (const band of bands) {
          if (pt.y >= band.y && pt.y <= band.y + band.height) {
            laneId = band.lane.id;
            break;
          }
        }
        onAddStep(pt.x, pt.y, laneId);
      } else {
        onSelectItem(null);
      }
    }
  };

  const handleStepMouseDown = (e, step) => {
    e.stopPropagation();
    if (tool === 'connect') {
      if (connectingFrom) {
        if (connectingFrom !== step.id) onCompleteConnect(step.id);
      } else {
        onStartConnect(step.id);
      }
      return;
    }
    onSelectItem(step.id);
    if (tool === 'select') {
      const pt = getSVGPoint(e);
      setDragging({ id: step.id, offsetX: pt.x - step.x, offsetY: pt.y - step.y });
    }
  };

  const handleStepClick = (e, step) => {
    e.stopPropagation();
    if (tool === 'connect') {
      if (connectingFrom) {
        if (connectingFrom !== step.id) onCompleteConnect(step.id);
      } else {
        onStartConnect(step.id);
      }
      return;
    }
    onSelectItem(step.id);
  };

  const handleMouseMove = (e) => {
    const pt = getSVGPoint(e);
    setMousePos(pt);
    if (dragging) {
      onMoveStep(dragging.id, pt.x - dragging.offsetX, pt.y - dragging.offsetY);
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const handleConnClick = (e, conn) => {
    e.stopPropagation();
    onSelectItem(conn.id);
  };

  // Compute SVG dimensions
  const maxX = Math.max(800, ...process.steps.map((s) => s.x + sizes.stepWidth));
  const maxY = Math.max(600, ...process.steps.map((s) => s.y + sizes.stepHeight + 40));

  const laneBands = computeLaneBands(process.lanes, process.steps);
  const totalHeight = Math.max(maxY + 80, ...laneBands.map((b) => b.y + b.height + 40));

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox={`0 0 ${maxX + 100} ${totalHeight}`}
      style={{ background: colors.canvasBg, display: 'block' }}
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <defs>
        <pattern id="dotGrid" width={sizes.gridSpacing} height={sizes.gridSpacing} patternUnits="userSpaceOnUse">
          <circle cx={sizes.gridSpacing / 2} cy={sizes.gridSpacing / 2} r={1} fill={colors.gridDot} />
        </pattern>
        <marker
          id="arrowhead"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth={sizes.arrowSize}
          markerHeight={sizes.arrowSize}
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={colors.connectorArrow} />
        </marker>
      </defs>

      {/* Background grid */}
      <rect data-background="true" width="100%" height="100%" fill="url(#dotGrid)" />

      {/* Lane bands */}
      {laneBands.map((band) => (
        <g key={band.lane.id}>
          <rect
            x={0}
            y={band.y}
            width={maxX + 100}
            height={band.height}
            fill={colors.laneColors[band.lane.color % colors.laneColors.length]}
            stroke={colors.laneBorder}
            strokeWidth={0.5}
          />
          <rect
            x={0}
            y={band.y}
            width={sizes.laneHeaderWidth}
            height={band.height}
            fill={colors.laneHeaderColors[band.lane.color % colors.laneHeaderColors.length]}
          />
          <text
            x={sizes.laneHeaderWidth / 2}
            y={band.y + band.height / 2}
            textAnchor="middle"
            dominantBaseline="central"
            transform={`rotate(-90, ${sizes.laneHeaderWidth / 2}, ${band.y + band.height / 2})`}
            fill="#555"
            fontSize={12}
            fontWeight={600}
            fontFamily={tokens.fonts.sans}
            style={{ userSelect: 'none' }}
          >
            {band.lane.name}
          </text>
        </g>
      ))}

      {/* Connectors */}
      {process.connections.map((conn) => (
        <Connector
          key={conn.id}
          connection={conn}
          fromStep={stepMap[conn.from]}
          toStep={stepMap[conn.to]}
          isSelected={selectedId === conn.id}
          onClick={(e) => handleConnClick(e, conn)}
          onDoubleClick={() => onDoubleClickItem(conn, 'connection')}
        />
      ))}

      {/* Steps */}
      {process.steps.map((step) => (
        <StepShape
          key={step.id}
          step={step}
          isSelected={selectedId === step.id}
          onMouseDown={(e) => handleStepMouseDown(e, step)}
          onClick={(e) => handleStepClick(e, step)}
          onDoubleClick={() => onDoubleClickItem(step, 'step')}
        />
      ))}

      {/* Connecting line preview */}
      {connectingFrom && stepMap[connectingFrom] && (
        <line
          x1={stepMap[connectingFrom].x}
          y1={stepMap[connectingFrom].y}
          x2={mousePos.x}
          y2={mousePos.y}
          stroke={colors.selectionStroke}
          strokeWidth={2}
          strokeDasharray="6 3"
          pointerEvents="none"
        />
      )}
    </svg>
  );
}
