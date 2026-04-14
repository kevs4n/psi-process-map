import { tokens } from '../lib/tokens';

const tools = [
  { id: 'select', label: 'Select', shortcut: 'V' },
  { id: 'add', label: 'Add Step', shortcut: 'A' },
  { id: 'connect', label: 'Connect', shortcut: 'C' },
];

export default function Toolbar({ tool, onToolChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {tools.map((t) => (
        <button
          key={t.id}
          onClick={() => onToolChange(t.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 10px',
            background: tool === t.id ? tokens.colors.sidebarAccent : 'transparent',
            color: tool === t.id ? tokens.colors.sidebarBg : tokens.colors.sidebarText,
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontFamily: tokens.fonts.sans,
            fontSize: 13,
            fontWeight: tool === t.id ? 600 : 400,
          }}
        >
          <span>{t.label}</span>
          <span
            style={{
              fontSize: 11,
              fontFamily: tokens.fonts.mono,
              opacity: 0.6,
            }}
          >
            {t.shortcut}
          </span>
        </button>
      ))}
    </div>
  );
}
