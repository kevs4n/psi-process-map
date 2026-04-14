import { useState, useEffect } from 'react';
import { tokens } from '../lib/tokens';

export default function EditModal({ item, itemType, lanes, onSave, onDelete, onClose }) {
  const [formData, setFormData] = useState({ ...item });

  useEffect(() => {
    setFormData({ ...item });
  }, [item]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const modalStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const overlayStyle = {
    position: 'absolute',
    inset: 0,
    background: tokens.colors.modalOverlay,
  };

  const cardStyle = {
    position: 'relative',
    background: tokens.colors.modalBg,
    borderRadius: 12,
    padding: 24,
    minWidth: 340,
    maxWidth: 420,
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    fontFamily: tokens.fonts.sans,
  };

  const labelStyle = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#555',
    marginBottom: 4,
    marginTop: 12,
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid #ddd',
    borderRadius: 6,
    fontSize: 14,
    fontFamily: tokens.fonts.sans,
    boxSizing: 'border-box',
  };

  const selectStyle = { ...inputStyle };

  const btnRow = {
    display: 'flex',
    gap: 8,
    marginTop: 20,
    justifyContent: 'flex-end',
  };

  const btnBase = {
    padding: '8px 16px',
    border: 'none',
    borderRadius: 6,
    fontSize: 13,
    fontFamily: tokens.fonts.sans,
    fontWeight: 500,
    cursor: 'pointer',
  };

  return (
    <div style={modalStyle}>
      <div style={overlayStyle} onClick={onClose} />
      <form style={cardStyle} onSubmit={handleSubmit}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
          Edit {itemType === 'step' ? 'Step' : itemType === 'connection' ? 'Connection' : 'Lane'}
        </h3>

        {itemType === 'step' && (
          <>
            <label style={labelStyle}>Label</label>
            <input
              style={inputStyle}
              value={formData.label || ''}
              onChange={(e) => handleChange('label', e.target.value)}
              autoFocus
            />
            <label style={labelStyle}>Type</label>
            <select
              style={selectStyle}
              value={formData.type || 'process'}
              onChange={(e) => handleChange('type', e.target.value)}
            >
              <option value="start">Start</option>
              <option value="process">Process</option>
              <option value="decision">Decision</option>
              <option value="end">End</option>
            </select>
            <label style={labelStyle}>Lane</label>
            <select
              style={selectStyle}
              value={formData.laneId || ''}
              onChange={(e) => handleChange('laneId', e.target.value)}
            >
              {lanes.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <label style={labelStyle}>ADO Link</label>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                value={formData.adoRef || ''}
                onChange={(e) => handleChange('adoRef', e.target.value)}
                placeholder="https://dev.azure.com/..."
              />
              {formData.adoRef && (formData.adoRef.startsWith('http://') || formData.adoRef.startsWith('https://')) && (
                <a
                  href={formData.adoRef}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 12,
                    color: tokens.colors.sidebarAccent,
                    whiteSpace: 'nowrap',
                    textDecoration: 'none',
                  }}
                >
                  Open
                </a>
              )}
            </div>
            <label style={labelStyle}>Description</label>
            <textarea
              style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }}
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Optional — used in HTML RFP exports"
            />
          </>
        )}

        {itemType === 'connection' && (
          <>
            <label style={labelStyle}>Label</label>
            <input
              style={inputStyle}
              value={formData.label || ''}
              onChange={(e) => handleChange('label', e.target.value)}
              placeholder="e.g. Yes / No"
              autoFocus
            />
          </>
        )}

        {itemType === 'lane' && (
          <>
            <label style={labelStyle}>Name</label>
            <input
              style={inputStyle}
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              autoFocus
            />
            <label style={labelStyle}>Color</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              {tokens.colors.laneColors.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleChange('color', i)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    border: formData.color === i ? `2px solid ${tokens.colors.selectionStroke}` : '2px solid #ddd',
                    background: c.replace('0.10', '0.5'),
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </>
        )}

        <div style={btnRow}>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            style={{ ...btnBase, background: tokens.colors.danger, color: 'white', marginRight: 'auto' }}
          >
            Delete
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{ ...btnBase, background: '#eee', color: '#333' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{ ...btnBase, background: tokens.colors.sidebarAccent, color: '#fff' }}
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
