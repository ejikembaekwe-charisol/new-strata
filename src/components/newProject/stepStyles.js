// The shared look of the setup steps: a selectable card, a chip, and the grid they sit in.
//
// These lived inside ScratchSteps until the template gallery needed the same three. They
// could not simply be exported from there — that file exports components, and
// react-refresh/only-export-components rightly objects to a mixed module, which is the
// same reason START_OPTIONS in StartChoice is deliberately not exported.
//
// One copy matters more than the file count: a template card that drifted from the
// wizard's own cards would make the gallery look like a different product.

export const card = (selected) => ({
  position: 'relative',
  background: 'var(--bg-secondary)',
  border: '1px solid ' + (selected ? 'var(--accent)' : 'var(--border)'),
  boxShadow: selected ? '0 0 0 1px var(--accent)' : 'none',
  borderRadius: '16px',
  padding: '1.1rem',
  cursor: 'pointer',
  textAlign: 'left',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s, box-shadow 0.15s',
});

export const chip = (on) => ({
  padding: '0.45rem 0.95rem',
  borderRadius: '999px',
  border: '1px solid ' + (on ? 'var(--accent)' : 'var(--border)'),
  background: on ? 'var(--accent)' : 'var(--bg-tertiary)',
  color: on ? '#fff' : 'var(--text-secondary)',
  fontSize: '0.82rem',
  fontWeight: on ? 600 : 400,
  cursor: 'pointer',
  fontFamily: 'inherit',
});

export const grid = (min) => ({
  display: 'grid',
  gridTemplateColumns: `repeat(auto-fit, minmax(${min}, 1fr))`,
  gap: '0.75rem',
});

/** The uppercase micro-label above a group of choices. */
export const groupLabel = {
  fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.07em',
  color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: '0.5rem',
};
