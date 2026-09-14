// A template, expressed as the design system it would actually build.
//
// The template gallery's cards describe a template by its inputs — three colours, a type
// pairing, a scale. Its detail page shows the same thing the public system page shows, and
// to do that honestly it needs the *output*: the token store applying it would produce.
//
// That store is not a projection or a mock-up. It is built by the same two functions the
// wizard uses on Apply — `tokensFromChoices` then `deriveTokens` — so every number on a
// template's page is the number you get, not an estimate of it. Thirteen authored tokens
// become eighty-nine: three colours expand to thirty-three ramp steps, and the scale
// unlocks the leading, weights and text styles.
//
// Components are deliberately absent. A template ships none, so the page renders no
// Components tab rather than borrowing the demo set, and the count it shows is zero
// because zero is true.

import { deriveTokens } from './derivedTokens';
import { storeFromList } from './tokenTypes';
import { tokensFromChoices, pairingById, industryName } from '../components/newProject/designSystemData';
import { scaleLabel } from '../components/newProject/templateData';

/**
 * The full system a template describes: its token store, its brand fields, and the
 * one-line facts the page prints under the title.
 */
export const systemFromTemplate = (t) => {
  if (!t) return null;
  const pairing = pairingById(t.pairingId);
  const authored = tokensFromChoices(
    t.palette,
    pairing,
    { base: t.baseSize, ratio: t.scaleRatio },
  );
  return {
    name: t.name,
    description: t.description,
    color: t.palette?.primary,
    tokensMap: deriveTokens(storeFromList(authored)),
    // The same keys SharedProject reads off a project's `brand`, so the view cannot tell
    // a template from a published project and needs no branch for either.
    brand: {
      primaryColor: t.palette?.primary,
      secondaryColor: t.palette?.secondary,
      accentColor: t.palette?.accent,
      headingFont: pairing?.heading,
      bodyFont: pairing?.body,
      toneKeywords: [...(t.voiceTags || [])],
    },
    components: [],
    meta: [industryName(t.industry), t.vibe, scaleLabel(t.scaleRatio)].filter(Boolean),
    authoredCount: authored.length,
  };
};
