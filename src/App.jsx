import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import EditModal from './components/EditModal';
import DiagramList from './components/DiagramList';
import { tokens } from './lib/tokens';
import { generateId, validateProcess } from './lib/schema';
import { autoLayout } from './lib/layout';
import { exportSVG, exportPNG, exportJSON, copyJSON, importJSON } from './lib/export';
import { listDiagrams, loadDiagram, saveDiagram, createDiagram } from './lib/storage';
import './App.css';

function useFileDrop(onDrop) {
  useEffect(() => {
    const prevent = (e) => e.preventDefault();
    const handleDrop = (e) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith('.json')) onDrop(file);
    };
    window.addEventListener('dragover', prevent);
    window.addEventListener('drop', handleDrop);
    return () => {
      window.removeEventListener('dragover', prevent);
      window.removeEventListener('drop', handleDrop);
    };
  }, [onDrop]);
}

export default function App() {
  const [activeDiagramId, setActiveDiagramId] = useState(null);
  const [process, setProcess] = useState(null);
  const [tool, setTool] = useState('select');
  const [selectedId, setSelectedId] = useState(null);
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const saveTimer = useRef(null);

  // On mount: if only one diagram exists, open it directly
  useEffect(() => {
    const diagrams = listDiagrams();
    if (diagrams.length === 1) {
      handleOpenDiagram(diagrams[0].id);
    }
  }, []);

  // Auto-save debounced 1 second
  useEffect(() => {
    if (!activeDiagramId || !process) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveDiagram(activeDiagramId, process);
    }, 1000);
    return () => clearTimeout(saveTimer.current);
  }, [activeDiagramId, process]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (!activeDiagramId) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'v':
          setTool('select');
          setConnectingFrom(null);
          break;
        case 'a':
          setTool('add');
          setConnectingFrom(null);
          break;
        case 'c':
          setTool('connect');
          break;
        case 'escape':
          setTool('select');
          setConnectingFrom(null);
          setSelectedId(null);
          setEditingItem(null);
          break;
        case 'delete':
        case 'backspace':
          if (selectedId) {
            e.preventDefault();
            handleDeleteItem(selectedId);
          }
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedId, activeDiagramId]);

  const handleFileDrop = useCallback(async (file) => {
    try {
      const data = await importJSON(file);
      const result = validateProcess(data);
      if (result.valid) {
        const id = createDiagram();
        saveDiagram(id, data);
        setActiveDiagramId(id);
        setProcess(data);
        setTool('select');
        setSelectedId(null);
        setConnectingFrom(null);
        setEditingItem(null);
      } else {
        alert('Invalid process JSON:\n' + result.errors.join('\n'));
      }
    } catch (err) {
      alert('Import failed: ' + err.message);
    }
  }, []);

  useFileDrop(handleFileDrop);

  const handleOpenDiagram = (id) => {
    const d = loadDiagram(id);
    if (d) {
      setActiveDiagramId(d.id);
      setProcess(d.process);
      setTool('select');
      setSelectedId(null);
      setConnectingFrom(null);
      setEditingItem(null);
    }
  };

  const handleBackToList = () => {
    if (activeDiagramId && process) {
      saveDiagram(activeDiagramId, process);
    }
    setActiveDiagramId(null);
    setProcess(null);
    setSelectedId(null);
    setConnectingFrom(null);
    setEditingItem(null);
  };

  const handleImportFromList = (id) => {
    handleOpenDiagram(id);
  };

  // --- Editor handlers ---

  const handleTitleChange = (title) => {
    setProcess((prev) => ({ ...prev, title }));
  };

  const handleSelectItem = (id) => {
    setSelectedId(id);
  };

  const handleMoveStep = useCallback((stepId, newX, newY) => {
    setProcess((prev) => ({
      ...prev,
      steps: prev.steps.map((s) =>
        s.id === stepId ? { ...s, x: Math.max(0, newX), y: Math.max(0, newY) } : s
      ),
    }));
  }, []);

  const handleAddStep = (x, y, laneId) => {
    const newStep = {
      id: generateId('s'),
      laneId,
      label: 'New Step',
      type: 'process',
      x: Math.round(x),
      y: Math.round(y),
      adoRef: '',
      description: '',
    };
    setProcess((prev) => ({ ...prev, steps: [...prev.steps, newStep] }));
    setSelectedId(newStep.id);
    setEditingItem({ item: newStep, type: 'step' });
  };

  const handleStartConnect = (stepId) => {
    setConnectingFrom(stepId);
  };

  const handleCompleteConnect = (toStepId) => {
    if (connectingFrom && connectingFrom !== toStepId) {
      const exists = process.connections.some(
        (c) => c.from === connectingFrom && c.to === toStepId
      );
      if (!exists) {
        const newConn = {
          id: generateId('c'),
          from: connectingFrom,
          to: toStepId,
          label: '',
        };
        setProcess((prev) => ({
          ...prev,
          connections: [...prev.connections, newConn],
        }));
      }
    }
    setConnectingFrom(null);
  };

  const handleDoubleClickItem = (item, type) => {
    setEditingItem({ item, type });
  };

  const handleSaveEdit = (updatedItem) => {
    const type = editingItem.type;
    setProcess((prev) => {
      if (type === 'step') {
        return { ...prev, steps: prev.steps.map((s) => (s.id === updatedItem.id ? updatedItem : s)) };
      }
      if (type === 'connection') {
        return { ...prev, connections: prev.connections.map((c) => (c.id === updatedItem.id ? updatedItem : c)) };
      }
      if (type === 'lane') {
        return { ...prev, lanes: prev.lanes.map((l) => (l.id === updatedItem.id ? updatedItem : l)) };
      }
      return prev;
    });
    setEditingItem(null);
  };

  const handleDeleteItem = (id) => {
    setProcess((prev) => {
      const isStep = prev.steps.some((s) => s.id === id);
      if (isStep) {
        return {
          ...prev,
          steps: prev.steps.filter((s) => s.id !== id),
          connections: prev.connections.filter((c) => c.from !== id && c.to !== id),
        };
      }
      const isConn = prev.connections.some((c) => c.id === id);
      if (isConn) {
        return { ...prev, connections: prev.connections.filter((c) => c.id !== id) };
      }
      const isLane = prev.lanes.some((l) => l.id === id);
      if (isLane && prev.lanes.length > 1) {
        const remainingStepIds = new Set(prev.steps.filter((s) => s.laneId !== id).map((s) => s.id));
        return {
          ...prev,
          lanes: prev.lanes.filter((l) => l.id !== id),
          steps: prev.steps.filter((s) => s.laneId !== id),
          connections: prev.connections.filter((c) => remainingStepIds.has(c.from) && remainingStepIds.has(c.to)),
        };
      }
      return prev;
    });
    setSelectedId(null);
    setEditingItem(null);
  };

  const handleAddLane = () => {
    const newLane = {
      id: generateId('l'),
      name: 'New Lane',
      color: process.lanes.length % tokens.colors.laneColors.length,
    };
    setProcess((prev) => ({ ...prev, lanes: [...prev.lanes, newLane] }));
    setEditingItem({ item: newLane, type: 'lane' });
  };

  const handleEditLane = (lane) => {
    setEditingItem({ item: lane, type: 'lane' });
  };

  const handleAutoLayout = () => {
    const result = autoLayout(process);
    setProcess((prev) => ({ ...prev, steps: result.steps }));
  };

  const getSvgElement = () => {
    const container = document.querySelector('.canvas-container');
    return container?.querySelector('svg');
  };

  const handleExportSVG = () => {
    const svg = getSvgElement();
    if (svg) exportSVG(svg, process.title);
  };

  const handleExportPNG = () => {
    const svg = getSvgElement();
    if (svg) exportPNG(svg, process.title);
  };

  const handleExportJSON = () => {
    exportJSON(process, process.title);
  };

  const handleCopyJSON = () => {
    copyJSON(process);
  };

  const handleImportJSON = async (file) => {
    try {
      const data = await importJSON(file);
      const result = validateProcess(data);
      if (result.valid) {
        setProcess(data);
        setSelectedId(null);
        setConnectingFrom(null);
      } else {
        alert('Invalid process JSON:\n' + result.errors.join('\n'));
      }
    } catch (err) {
      alert('Import failed: ' + err.message);
    }
  };

  const handleToolChange = (newTool) => {
    setTool(newTool);
    setConnectingFrom(null);
  };

  // Landing screen
  if (!activeDiagramId || !process) {
    return <DiagramList onOpen={handleOpenDiagram} />;
  }

  // Editor
  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: tokens.fonts.sans }}>
      <Sidebar
        process={process}
        tool={tool}
        onToolChange={handleToolChange}
        onTitleChange={handleTitleChange}
        onAddLane={handleAddLane}
        onEditLane={handleEditLane}
        onExportSVG={handleExportSVG}
        onExportPNG={handleExportPNG}
        onExportJSON={handleExportJSON}
        onCopyJSON={handleCopyJSON}
        onImportJSON={handleImportJSON}
        onAutoLayout={handleAutoLayout}
        onBackToList={handleBackToList}
      />
      <div className="canvas-container" style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <Canvas
          process={process}
          tool={tool}
          selectedId={selectedId}
          onSelectItem={handleSelectItem}
          onMoveStep={handleMoveStep}
          onAddStep={handleAddStep}
          onStartConnect={handleStartConnect}
          onCompleteConnect={handleCompleteConnect}
          connectingFrom={connectingFrom}
          onDoubleClickItem={handleDoubleClickItem}
        />
      </div>
      {editingItem && (
        <EditModal
          item={editingItem.item}
          itemType={editingItem.type}
          lanes={process.lanes}
          onSave={handleSaveEdit}
          onDelete={handleDeleteItem}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}
