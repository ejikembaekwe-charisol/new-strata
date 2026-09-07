// A component preview shrunk into a fixed tile.
//
// The Components tree used to show a pink icon and a name, so seeing what a component
// actually looked like cost a click and a trip through the properties rail. This puts the
// real preview on the row.
//
// It draws whatever it is handed — the same renderComponentPreview output the rail uses —
// so a thumbnail and the rail can never disagree about what a component looks like.

import { useEffect, useRef, useState } from 'react';

export default function ComponentThumb({ children, width = 120, height = 64, className }) {
  const box = useRef(null);
  const inner = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const outer = box.current;
    const el = inner.current;
    if (!outer || !el) return;

    const measure = () => {
      // The tile's own size is read from the element, not from the props, because a
      // stylesheet may override it — the mobile breakpoint shrinks the tile, and scaling to
      // the prop size there would overflow and clip.
      const bw = outer.clientWidth;
      const bh = outer.clientHeight;
      // offsetWidth is the layout size and a transform does not change it, so this keeps
      // reporting the component's natural size however far it has been scaled down. No
      // hidden measuring pass, and no second render.
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (!bw || !bh || !w || !h) return;
      // Capped at 1: a badge sits at its own size rather than being blown up to fill the tile.
      setScale(Math.min(1, bw / w, bh / h));
    };

    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    ro.observe(outer);
    return () => ro.disconnect();
  }, [children]);

  return (
    <div
      ref={box}
      className={className}
      // Decorative: the component's name sits beside it and is the accessible label.
      aria-hidden="true"
      style={{
        width, height, flexShrink: 0,
        position: 'relative', overflow: 'hidden',
        borderRadius: '7px',
        background: 'var(--bg)',
        // A preview can contain a real button wired to an alert. Letting clicks fall
        // through means the row selects the component, as it did before the tile existed.
        pointerEvents: 'none',
      }}
    >
      <div
        ref={inner}
        style={{
          position: 'absolute', top: '50%', left: '50%',
          // Absolute positioning inside a 120px box would otherwise wrap the content to
          // 120px and make the measurement meaningless. max-content sizes to the
          // component's own intrinsic width instead.
          width: 'max-content',
          transform: 'translate(-50%, -50%) scale(' + scale + ')',
          transformOrigin: 'center',
        }}
      >
        {children}
      </div>
    </div>
  );
}
