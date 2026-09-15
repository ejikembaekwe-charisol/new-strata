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

/**
 * A filter/choice chip. `dead` marks one that would return nothing — dimmed and not
 * clickable, so a dead end is visible before the click rather than after it.
 *
 * `dead` is optional, so the existing single-argument callers in ScratchSteps are
 * unaffected.
 */
export const chip = (on, dead) => ({
  padding: '0.45rem 0.95rem',
  borderRadius: '999px',
  border: '1px solid ' + (on ? 'var(--accent)' : 'var(--border)'),
  background: on ? 'var(--accent)' : 'var(--bg-tertiary)',
  color: on ? '#fff' : 'var(--text-secondary)',
  fontSize: '0.82rem',
  fontWeight: on ? 600 : 400,
  cursor: dead ? 'not-allowed' : 'pointer',
  fontFamily: 'inherit',
  // Removes the 300ms tap delay; these are the most-tapped controls in the flow.
  touchAction: 'manipulation',
  opacity: dead ? 0.38 : 1,
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
});

/** The count that rides inside a filter chip, after its label. */
export const chipCount = (on) => ({
  fontSize: '0.72rem',
  fontVariantNumeric: 'tabular-nums',
  color: on ? 'rgba(255,255,255,0.8)' : 'var(--text-tertiary)',
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
