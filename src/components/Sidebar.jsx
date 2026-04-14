import { useRef, useState } from 'react';
import Toolbar from './Toolbar';
import { tokens } from '../lib/tokens';

const { colors, fonts } = tokens;

export default function Sidebar({
  process,
  tool,
  onToolChange,
  onTitleChange,
  onAddLane,
  onEditLane,
  onExportSVG,
  onExportPNG,
  onExportJSON,
  onCopyJSON,
  onImportJSON,
  onAutoLayout,
  onBackToList,
}) {
  const fileRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopyJSON();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onImportJSON(file);
      e.target.value = '';
    }
  };

  const sectionTitle = {
    fontSize: 11,
    fontWeight: 600,
    color: colors.sidebarAccent,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 8,
  };

  const btnStyle = {
    width: '100%',
    padding: '7px 10px',
    background: 'transparent',
    color: colors.sidebarText,
    border: `1px solid ${colors.sidebarHover}`,
    borderRadius: 6,
    cursor: 'pointer',
    fontFamily: fonts.sans,
    fontSize: 13,
    textAlign: 'left',
    marginBottom: 4,
  };

  return (
    <div
      style={{
        width: tokens.sizes.sidebarWidth,
        minWidth: tokens.sizes.sidebarWidth,
        height: '100vh',
        background: colors.sidebarBg,
        color: colors.sidebarText,
        fontFamily: fonts.sans,
        padding: '16px 12px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      {/* Back to list */}
      <button
        onClick={onBackToList}
        style={{
          background: 'transparent',
          border: 'none',
          color: colors.sidebarAccent,
          fontFamily: fonts.sans,
          fontSize: 12,
          cursor: 'pointer',
          padding: '0 0 8px 0',
          textAlign: 'left',
        }}
      >
        &larr; All Diagrams
      </button>

      {/* Title */}
      <input
        value={process.title}
        onChange={(e) => onTitleChange(e.target.value)}
        style={{
          background: 'transparent',
          border: 'none',
          borderBottom: `1px solid ${colors.sidebarHover}`,
          color: '#fff',
          fontFamily: fonts.sans,
          fontSize: 16,
          fontWeight: 700,
          padding: '4px 0',
          width: '100%',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />

      {/* Tools */}
      <div style={sectionTitle}>Tools</div>
      <Toolbar tool={tool} onToolChange={onToolChange} />

      {/* Lanes */}
      <div style={sectionTitle}>Lanes</div>
      {process.lanes.map((lane) => (
        <button
          key={lane.id}
          onClick={() => onEditLane(lane)}
          style={{
            ...btnStyle,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              background: colors.laneColors[lane.color % colors.laneColors.length].replace('0.10', '0.6'),
              flexShrink: 0,
            }}
          />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {lane.name}
          </span>
        </button>
      ))}
      <button onClick={onAddLane} style={{ ...btnStyle, textAlign: 'center', color: colors.sidebarAccent }}>
        + Add Lane
      </button>

      {/* Export */}
      <div style={sectionTitle}>Export</div>
      <button onClick={onExportSVG} style={btnStyle}>Export SVG</button>
      <button onClick={onExportPNG} style={btnStyle}>Export PNG</button>
      <button onClick={onExportJSON} style={btnStyle}>Export JSON</button>
      <button onClick={handleCopy} style={{ ...btnStyle, color: copied ? '#a6e3a1' : colors.sidebarText }}>
        {copied ? 'Copied!' : 'Copy JSON'}
      </button>

      {/* Import */}
      <div style={sectionTitle}>Import</div>
      <button onClick={() => fileRef.current?.click()} style={btnStyle}>
        Import JSON
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Auto Layout */}
      <div style={sectionTitle}>Layout</div>
      <button
        onClick={onAutoLayout}
        style={{ ...btnStyle, color: colors.sidebarAccent, fontWeight: 500 }}
      >
        Auto-Layout
      </button>

      {/* Shortcuts */}
      <div style={{ ...sectionTitle, marginTop: 'auto' }}>Shortcuts</div>
      <div style={{ fontSize: 11, color: '#888', lineHeight: 1.8, fontFamily: fonts.mono }}>
        V - Select<br />
        A - Add Step<br />
        C - Connect<br />
        Esc - Cancel<br />
        Del - Remove
      </div>
    </div>
  );
}
