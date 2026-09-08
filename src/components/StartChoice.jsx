// The two ways into a brand: build one, or bring one.
//
// Lifted out of ProjectDetail's Get Started modal so the create flow can present the same
// choice as its second step. Both callers render these exact cards, so the two doors and
// what they promise cannot drift apart depending on where you met them.
//
// It renders content only — heading, copy, cards. The caller supplies the frame, because
// one of them is a modal over the Brand Bible and the other is a step on a page.

const START_OPTIONS = [
  {
    key: 'scratch',
    title: 'Start from scratch',
    desc: 'Answer two questions and we will suggest a palette and type pairing to build on.',
    accent: true,
    icon: (<><path d="M12 2v20M2 12h20" /></>),
  },
  {
    key: 'engine',
    title: 'Import what you have',
    desc: 'Point us at a Figma file, a live site, or a tokens.json and refine it from there.',
    accent: false,
    icon: (
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </>
    ),
  },
];

export default function StartChoice({ onPick, heading = 'How do you want to start?', sub = 'Either way you can change everything afterwards.', onClose }) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {heading}
          </h3>
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {sub}
          </p>
        </div>
        {/* Only the modal needs a dismiss; the create page has its own Back and Skip. */}
        {onClose && (
          <button
            onClick={onClose}
            title="Close"
            style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}
          >
            ×
          </button>
        )}
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1rem', marginTop: '1.5rem',
      }}>
        {START_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => onPick(opt.key)}
            style={{
              textAlign: 'left', padding: '1.4rem', cursor: 'pointer', fontFamily: 'inherit',
              background: opt.accent ? 'var(--accent-glow)' : 'var(--bg-tertiary)',
              border: '1px solid ' + (opt.accent ? 'var(--accent)' : 'var(--border)'),
              borderRadius: '12px',
            }}
          >
            <span style={{ display: 'flex', color: opt.accent ? 'var(--accent)' : 'var(--text-secondary)', marginBottom: '0.85rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {opt.icon}
              </svg>
            </span>
            <span style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              {opt.title}
            </span>
            <span style={{ display: 'block', fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              {opt.desc}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
