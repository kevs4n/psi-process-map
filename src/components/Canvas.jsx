import { useRef, useState, useCallback, useMemo } from 'react';
import StepShape from './StepShape';
import Connector from './Connector';
import { tokens } from '../lib/tokens';

const { sizes, colors } = tokens;

function computeLaneBands(lanes, steps) {
  // Find the max relative Y of steps within each lane
  const laneMaxRelY = {};
  lanes.forEach((l) => (laneMaxRelY[l.id] = 0));
  steps.forEach((s) => {
    if (laneMaxRelY[s.laneId] !== undefined) {
      laneMaxRelY[s.laneId] = Math.max(laneMaxRelY[s.laneId], s.y);
    }
  });

  // Stack lanes top-down, sizing each to fit its content
  const padding = 30;
  const bands = [];
  let currentY = 0;
  lanes.forEach((lane) => {
    const contentBottom = laneMaxRelY[lane.id] + sizes.stepHeight + padding;
    const height = Math.max(tokens.layout.minLaneHeight, contentBottom);
    bands.push({ lane, y: currentY, height });
    currentY += height;
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

  const laneBands = useMemo(
    () => computeLaneBands(process.lanes, process.steps),
    [process.lanes, process.steps]
  );

  // Build lane Y offset map for relative→absolute conversion
  const laneYOffset = useMemo(() => {
    const map = {};
    laneBands.forEach((b) => (map[b.lane.id] = b.y));
    return map;
  }, [laneBands]);

  // Steps with absolute Y positions for rendering
  const displaySteps = useMemo(() => {
    const map = {};
    process.steps.forEach((s) => {
      map[s.id] = { ...s, y: s.y + (laneYOffset[s.laneId] || 0) };
    });
    return map;
  }, [process.steps, laneYOffset]);

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
        let laneId = process.lanes[0]?.id;
        for (const band of laneBands) {
          if (pt.y >= band.y && pt.y <= band.y + band.height) {
            laneId = band.lane.id;
            break;
          }
        }
        // Convert click Y to lane-relative Y
        const relY = pt.y - (laneYOffset[laneId] || 0);
        onAddStep(pt.x, Math.max(0, relY), laneId);
      } else {
        onSelectItem(null);
      }
    }
  };

  const handleStepMouseDown = (e, stepId) => {
    e.stopPropagation();
    if (tool === 'connect') {
      if (connectingFrom) {
        if (connectingFrom !== stepId) onCompleteConnect(stepId);
      } else {
        onStartConnect(stepId);
      }
      return;
    }
    onSelectItem(stepId);
    if (tool === 'select') {
      const pt = getSVGPoint(e);
      const ds = displaySteps[stepId];
      setDragging({ id: stepId, offsetX: pt.x - ds.x, offsetY: pt.y - ds.y });
    }
  };

  const handleStepClick = (e, stepId) => {
    e.stopPropagation();
    if (tool === 'connect') {
      if (connectingFrom) {
        if (connectingFrom !== stepId) onCompleteConnect(stepId);
      } else {
        onStartConnect(stepId);
      }
      return;
    }
    onSelectItem(stepId);
  };

  const handleMouseMove = (e) => {
    const pt = getSVGPoint(e);
    setMousePos(pt);
    if (dragging) {
      const step = process.steps.find((s) => s.id === dragging.id);
      if (!step) return;
      const absY = pt.y - dragging.offsetY;
      const relY = absY - (laneYOffset[step.laneId] || 0);
      onMoveStep(dragging.id, pt.x - dragging.offsetX, relY);
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const handleConnClick = (e, conn) => {
    e.stopPropagation();
    onSelectItem(conn.id);
  };

  // Compute SVG dimensions from absolute positions
  const maxX = Math.max(800, ...Object.values(displaySteps).map((s) => s.x + sizes.stepWidth));
  const totalHeight = laneBands.length > 0
    ? laneBands[laneBands.length - 1].y + laneBands[laneBands.length - 1].height + 40
    : 600;

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

      {/* Connectors — use absolute positions */}
      {process.connections.map((conn) => (
        <Connector
          key={conn.id}
          connection={conn}
          fromStep={displaySteps[conn.from]}
          toStep={displaySteps[conn.to]}
          isSelected={selectedId === conn.id}
          onClick={(e) => handleConnClick(e, conn)}
          onDoubleClick={() => onDoubleClickItem(conn, 'connection')}
        />
      ))}

      {/* Steps — use absolute positions */}
      {process.steps.map((step) => (
        <StepShape
          key={step.id}
          step={displaySteps[step.id]}
          isSelected={selectedId === step.id}
          onMouseDown={(e) => handleStepMouseDown(e, step.id)}
          onClick={(e) => handleStepClick(e, step.id)}
          onDoubleClick={() => onDoubleClickItem(step, 'step')}
        />
      ))}

      {/* Connecting line preview */}
      {connectingFrom && displaySteps[connectingFrom] && (
        <line
          x1={displaySteps[connectingFrom].x}
          y1={displaySteps[connectingFrom].y}
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
