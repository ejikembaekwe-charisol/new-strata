// Everything a project's token set gains without being asked.
//
// Colour ramps and the type scale are both *derived*: read out of the tokens a project
// already stores, on every load, rather than written into it. Nothing reaches localStorage
// until the first token edit, and because the editor and the shared view both come through
// here they can never show different sets.
//
// This exists so the call sites do not accumulate a list. Adding the spacing or radius
// scale later is one more line here and no change anywhere else.

import { addColorRamps } from './colorRamp';
import { addTypeScale } from './typeScale.js';
import { addTextStyles } from './textStyles.js';

// Order matters in one place: the text styles alias the scale's steps, so the scale has to
// exist before they are built. Otherwise each pass touches one category and reads nothing
// another produced.
const PASSES = [addColorRamps, addTypeScale, addTextStyles];

/**
 * Idempotent: every pass leaves a set that already holds its output untouched, so running
 * this on each render or each load is safe.
 */
export const deriveTokens = (tokens) =>
  PASSES.reduce((acc, pass) => pass(acc), tokens);
