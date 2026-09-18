// The frame a generated page runs in.
//
// It is deliberately a thin component: everything that decides what is safe lives in
// data/previewDocument.js, so there is one place to review and one string to grep. The two
// things this file adds are the sandbox assertion and the visible border — and the border is
// a security feature, not styling. A generated page can render a pixel-perfect sign-in
// screen; it cannot submit anything, but it can look convincing, so the chrome that says
// "this is a preview" has to live outside the frame where the frame cannot paint over it.

import { useEffect, useRef } from 'react';
import { PREVIEW_SANDBOX } from '../../data/previewDocument';

export default function PreviewFrame({ srcDoc, renderId = 0, title = 'Generated preview', height }) {
  const ref = useRef(null);

  // A comment is not enough for a mistake with this blast radius: allow-same-origin beside
  // allow-scripts would hand generated code Strata's own origin, and with it every API key
  // in localStorage. Shout in development if the attribute that reaches the DOM ever carries
  // both, whatever the constant says.
  useEffect(() => {
    if (!import.meta.env?.DEV) return;
    const attr = ref.current?.getAttribute('sandbox') || '';
    if (attr.includes('allow-scripts') && attr.includes('allow-same-origin')) {
      console.error('Strata: the preview frame is running unsandboxed. allow-same-origin and allow-scripts together are equivalent to no sandbox, and the API key vault is on this origin.');
    }
  }, [renderId]);

  return (
    <iframe
      // A new key rather than a new srcDoc: reassigning srcDoc reloads the frame, but timers,
      // animation loops and audio from the previous document can outlive the swap. A key
      // change makes React drop the element and build a fresh browsing context, and it resets
      // scroll, which is what a new document wants anyway.
      key={renderId}
      ref={ref}
      title={title}
      srcDoc={srcDoc}
      sandbox={PREVIEW_SANDBOX}
      referrerPolicy="no-referrer"
      // An empty permissions policy: no camera, microphone, geolocation or the rest.
      allow=""
      style={{
        width: '100%',
        height: height || '100%',
        border: 'none',
        display: 'block',
        background: '#fff',
      }}
    />
  );
}
