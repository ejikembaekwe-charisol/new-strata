// The little visual a token gets: a swatch, an Aa at its size, a rule at its width.
//
// Moved out of SharedProject because the template detail view renders the same grid and
// the two must not drift — a template's `border.radius.md` should look exactly like a
// published system's.



export const renderTokenPreview = (token) => {
  const { type, value } = token;
  if (!value) return <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>-</span>;
  let cleanValue = String(value).trim();

  switch (type) {
    case 'color':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '20px', height: '20px', borderRadius: '4px',
            background: cleanValue, border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)', flexShrink: 0
          }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{cleanValue}</span>
        </div>
      );
    case 'fontSize':
      let sizeVal = cleanValue;
      if (/^\d+$/.test(sizeVal)) sizeVal += 'px';
      return <span style={{ fontSize: sizeVal, color: 'var(--text-primary)' }}>Aa</span>;
    case 'fontFamily':
      return <span style={{ fontFamily: cleanValue, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Aa Bb</span>;
    case 'spacing':
      let spacingVal = cleanValue;
      if (/^\d+$/.test(spacingVal)) spacingVal += 'px';
      return <div style={{ height: '8px', width: spacingVal, maxWidth: '80px', minWidth: '4px', background: 'var(--accent)', borderRadius: '2px', opacity: 0.8 }} />;
    case 'borderRadius':
      let radiusVal = cleanValue;
      if (/^\d+$/.test(radiusVal)) radiusVal += 'px';
      return <div style={{ width: '28px', height: '28px', border: '2px solid var(--accent)', borderRadius: radiusVal, background: 'var(--accent-glow)' }} />;
    case 'shadow':
      return <div style={{ width: '28px', height: '28px', background: 'var(--bg-secondary)', borderRadius: '4px', boxShadow: cleanValue, border: '1px solid var(--border)' }} />;
    case 'duration':
    case 'easing':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div 
            className="motion-preview-box"
            style={{
              width: '14px', height: '14px', borderRadius: '50%', background: 'var(--accent)',
              transition: `transform 400ms cubic-bezier(0.4, 0, 0.2, 1)`,
            }}
            onMouseEnter={e => {
              const animDuration = type === 'duration' ? cleanValue : '300ms';
              const animEasing = type === 'easing' ? cleanValue : 'ease';
              e.currentTarget.style.transition = `transform ${animDuration} ${animEasing}`;
              e.currentTarget.style.transform = 'translateX(10px)';
            }}
            onMouseLeave={e => {
              const animDuration = type === 'duration' ? cleanValue : '300ms';
              const animEasing = type === 'easing' ? cleanValue : 'ease';
              e.currentTarget.style.transition = `transform ${animDuration} ${animEasing}`;
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          />
          <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Hover</span>
        </div>
      );
    default:
      return <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{value}</span>;
  }
};
