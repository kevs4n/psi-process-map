import { useState } from 'react';
import { tokens } from '../lib/tokens';
import { listDiagrams, createDiagram, deleteDiagram, duplicateDiagram } from '../lib/storage';
import { importJSON } from '../lib/export';
import { validateProcess } from '../lib/schema';
import { saveDiagram } from '../lib/storage';

const { colors, fonts } = tokens;

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function DiagramList({ onOpen, onImport }) {
  const [diagrams, setDiagrams] = useState(() => listDiagrams());

  const refresh = () => setDiagrams(listDiagrams());

  const handleNew = () => {
    const id = createDiagram();
    onOpen(id);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    deleteDiagram(id);
    refresh();
  };

  const handleDuplicate = (e, id) => {
    e.stopPropagation();
    duplicateDiagram(id);
    refresh();
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = await importJSON(file);
      const result = validateProcess(data);
      if (result.valid) {
        const id = createDiagram();
        saveDiagram(id, data);
        onOpen(id);
      } else {
        alert('Invalid process JSON:\n' + result.errors.join('\n'));
      }
    } catch (err) {
      alert('Import failed: ' + err.message);
    }
    e.target.value = '';
  };

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: '100vh',
    background: colors.canvasBg,
    fontFamily: fonts.sans,
    padding: '60px 24px',
  };

  const headerStyle = {
    fontSize: 28,
    fontWeight: 700,
    color: '#333',
    marginBottom: 8,
  };

  const subtitleStyle = {
    fontSize: 14,
    color: '#888',
    marginBottom: 32,
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 16,
    width: '100%',
    maxWidth: 900,
  };

  const cardStyle = {
    background: '#fff',
    borderRadius: 10,
    padding: '20px 18px',
    cursor: 'pointer',
    border: '1px solid #e5e5e5',
    transition: 'box-shadow 0.15s',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  };

  const btnRow = {
    display: 'flex',
    gap: 8,
    marginBottom: 24,
    width: '100%',
    maxWidth: 900,
  };

  const btnStyle = {
    padding: '10px 20px',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    fontFamily: fonts.sans,
    cursor: 'pointer',
  };

  const smallBtn = {
    padding: '4px 10px',
    border: 'none',
    borderRadius: 5,
    fontSize: 12,
    fontFamily: fonts.sans,
    cursor: 'pointer',
    background: '#f0f0f0',
    color: '#555',
  };

  return (
    <div style={containerStyle}>
      <h1 style={headerStyle}>Process Map</h1>
      <p style={subtitleStyle}>Swimlane diagrams for process design and delivery tracking</p>

      <div style={btnRow}>
        <button
          onClick={handleNew}
          style={{ ...btnStyle, background: colors.sidebarBg, color: '#fff' }}
        >
          + New Diagram
        </button>
        <label style={{ ...btnStyle, background: '#fff', color: '#333', border: '1px solid #ddd', margin: 0 }}>
          Import JSON
          <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
        </label>
      </div>

      {diagrams.length === 0 ? (
        <p style={{ color: '#999', marginTop: 40 }}>No diagrams yet. Create one or import a JSON file.</p>
      ) : (
        <div style={gridStyle}>
          {diagrams.map((d) => (
            <div
              key={d.id}
              style={cardStyle}
              onClick={() => onOpen(d.id)}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
            >
              <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>{d.name}</div>
              <div style={{ fontSize: 12, color: '#aaa' }}>Updated {timeAgo(d.updatedAt)}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <button onClick={(e) => handleDuplicate(e, d.id)} style={smallBtn}>
                  Duplicate
                </button>
                <button
                  onClick={(e) => handleDelete(e, d.id)}
                  style={{ ...smallBtn, color: colors.danger }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
