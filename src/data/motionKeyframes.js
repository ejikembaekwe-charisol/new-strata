// Entrance animations, defined once.
//
// Three things need these and they must not drift: the inspector's Play button, the
// project's CSS export, and the shared-project export. A `motion.enter.*` token's value
// is a keyframes *name*, so the keyframes have to travel with the export — otherwise the
// token resolves to a name that means nothing in the target codebase.
//
// The `strata-` prefix keeps a pasted export from colliding with a host stylesheet.

export const ENTRANCE_KEYFRAMES = [
  {
    id: 'rise',
    label: 'Rise',
    animation: 'strata-enter-rise',
    token: 'motion.enter.rise',
    css: `@keyframes strata-enter-rise {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}`,
  },
  {
    id: 'fade',
    label: 'Fade',
    animation: 'strata-enter-fade',
    token: 'motion.enter.fade',
    css: `@keyframes strata-enter-fade {
  from { opacity: 0; }
  to   { opacity: 1; }
}`,
  },
  {
    id: 'scale',
    label: 'Scale',
    animation: 'strata-enter-scale',
    token: 'motion.enter.scale',
    css: `@keyframes strata-enter-scale {
  from { opacity: 0; transform: scale(0.9); }
  to   { opacity: 1; transform: scale(1); }
}`,
  },
  {
    id: 'slide',
    label: 'Slide',
    animation: 'strata-enter-slide',
    token: 'motion.enter.slide',
    css: `@keyframes strata-enter-slide {
  from { opacity: 0; transform: translateX(-20px); }
  to   { opacity: 1; transform: translateX(0); }
}`,
  },
];

/** Every keyframes block, for injecting into the app and appending to an export. */
export const entranceKeyframesCss = () =>
  ENTRANCE_KEYFRAMES.map(e => e.css).join('\n\n');

/** animation name → entrance, for resolving a mapped token back to a preview. */
export const entranceByAnimation = Object.fromEntries(
  ENTRANCE_KEYFRAMES.map(e => [e.animation, e])
);

/** token name → entrance, for the same job before the value is resolved. */
export const entranceByToken = Object.fromEntries(
  ENTRANCE_KEYFRAMES.map(e => [e.token, e])
);

/** The Motion tokens these entrances are offered as. */
export const ENTRANCE_TOKENS = ENTRANCE_KEYFRAMES.map(e => ({
  name: e.token,
  value: e.animation,
  type: 'animationName',
  layer: 'Semantic',
  description: e.label + ' entrance',
}));
