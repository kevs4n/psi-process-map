const VALID_TYPES = ['start', 'process', 'decision', 'end'];

export function generateId(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function validateProcess(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Data must be an object'] };
  }

  if (!data.title || typeof data.title !== 'string') {
    errors.push('Title is required and must be a string');
  }

  if (!Array.isArray(data.lanes) || data.lanes.length === 0) {
    errors.push('At least one lane is required');
  } else {
    const laneIds = new Set();
    data.lanes.forEach((lane, i) => {
      if (!lane.id) errors.push(`Lane ${i} missing id`);
      if (!lane.name) errors.push(`Lane ${i} missing name`);
      if (typeof lane.color !== 'number') errors.push(`Lane ${i} missing color index`);
      if (laneIds.has(lane.id)) errors.push(`Duplicate lane id: ${lane.id}`);
      laneIds.add(lane.id);
    });
  }

  const stepIds = new Set();
  if (!Array.isArray(data.steps)) {
    errors.push('Steps must be an array');
  } else {
    const laneIds = new Set((data.lanes || []).map((l) => l.id));
    data.steps.forEach((step, i) => {
      if (!step.id) errors.push(`Step ${i} missing id`);
      if (!step.laneId) errors.push(`Step ${i} missing laneId`);
      else if (laneIds.size > 0 && !laneIds.has(step.laneId))
        errors.push(`Step ${i} references unknown lane: ${step.laneId}`);
      if (!step.label) errors.push(`Step ${i} missing label`);
      if (!VALID_TYPES.includes(step.type))
        errors.push(`Step ${i} has invalid type: ${step.type}`);
      if (typeof step.x !== 'number') errors.push(`Step ${i} missing x position`);
      if (typeof step.y !== 'number') errors.push(`Step ${i} missing y position`);
      if (step.description !== undefined && typeof step.description !== 'string')
        errors.push(`Step ${i} description must be a string`);
      if (stepIds.has(step.id)) errors.push(`Duplicate step id: ${step.id}`);
      stepIds.add(step.id);
    });
  }

  if (!Array.isArray(data.connections)) {
    errors.push('Connections must be an array');
  } else {
    const connIds = new Set();
    data.connections.forEach((conn, i) => {
      if (!conn.id) errors.push(`Connection ${i} missing id`);
      if (!conn.from) errors.push(`Connection ${i} missing from`);
      else if (stepIds.size > 0 && !stepIds.has(conn.from))
        errors.push(`Connection ${i} references unknown step: ${conn.from}`);
      if (!conn.to) errors.push(`Connection ${i} missing to`);
      else if (stepIds.size > 0 && !stepIds.has(conn.to))
        errors.push(`Connection ${i} references unknown step: ${conn.to}`);
      if (connIds.has(conn.id)) errors.push(`Duplicate connection id: ${conn.id}`);
      connIds.add(conn.id);
    });
  }

  return { valid: errors.length === 0, errors };
}

export function createEmptyProcess() {
  return {
    title: 'New Process',
    lanes: [{ id: generateId('l'), name: 'Actor', color: 0 }],
    steps: [],
    connections: [],
  };
}
