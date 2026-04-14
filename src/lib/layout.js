import { tokens } from './tokens';

export function autoLayout(process) {
  const { steps, connections, lanes } = process;
  if (steps.length === 0) return { steps: [], laneHeights: {} };

  // Build adjacency list and in-degree map
  const adj = {};
  const inDeg = {};
  steps.forEach((s) => {
    adj[s.id] = [];
    inDeg[s.id] = 0;
  });
  connections.forEach((c) => {
    if (adj[c.from]) adj[c.from].push(c.to);
    if (inDeg[c.to] !== undefined) inDeg[c.to]++;
  });

  // Kahn's topological sort — assign columns
  const queue = [];
  const column = {};
  steps.forEach((s) => {
    if (inDeg[s.id] === 0) {
      queue.push(s.id);
      column[s.id] = 0;
    }
  });

  const sorted = [];
  while (queue.length > 0) {
    const id = queue.shift();
    sorted.push(id);
    for (const next of adj[id] || []) {
      inDeg[next]--;
      column[next] = Math.max(column[next] || 0, column[id] + 1);
      if (inDeg[next] === 0) queue.push(next);
    }
  }

  // Handle any steps not reached (cycles or disconnected)
  const maxCol = Math.max(0, ...Object.values(column));
  steps.forEach((s) => {
    if (column[s.id] === undefined) {
      column[s.id] = maxCol + 1;
    }
  });

  // Group steps by lane, then sort within each lane by column
  const laneOrder = {};
  lanes.forEach((l, i) => (laneOrder[l.id] = i));

  const laneGroups = {};
  lanes.forEach((l) => (laneGroups[l.id] = []));
  steps.forEach((s) => {
    if (!laneGroups[s.laneId]) laneGroups[s.laneId] = [];
    laneGroups[s.laneId].push(s);
  });

  // Compute lane heights and y offsets
  const laneHeights = {};
  const laneYOffset = {};
  let currentY = 0;
  lanes.forEach((lane) => {
    const stepsInLane = laneGroups[lane.id] || [];
    // Count steps per column to find max rows
    const colCounts = {};
    stepsInLane.forEach((s) => {
      const col = column[s.id];
      colCounts[col] = (colCounts[col] || 0) + 1;
    });
    const maxRows = Math.max(1, ...Object.values(colCounts), 0);
    const height = Math.max(
      tokens.layout.minLaneHeight,
      maxRows * tokens.layout.verticalGap + tokens.layout.startY
    );
    laneHeights[lane.id] = height;
    laneYOffset[lane.id] = currentY;
    currentY += height;
  });

  // Assign x/y positions
  // Track row index per (lane, column) for vertical stacking
  const laneColRow = {};
  const newSteps = steps.map((s) => {
    const col = column[s.id];
    const key = `${s.laneId}-${col}`;
    const row = laneColRow[key] || 0;
    laneColRow[key] = row + 1;

    const x = tokens.layout.startX + col * tokens.layout.horizontalGap;
    const y = laneYOffset[s.laneId] + tokens.layout.startY + row * tokens.layout.verticalGap;

    return { ...s, x, y };
  });

  return { steps: newSteps, laneHeights };
}
