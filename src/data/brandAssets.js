// Logos and website screenshots for the eight templates that interpret a real product.
//
// An explicit map rather than import.meta.glob: a missing file is then a build error rather
// than a silently blank tile, and only these eight have assets — the other twelve templates
// resolve to undefined here and render no logo and no screenshot at all.
//
// Provenance, because it matters for what the UI is allowed to claim:
//   logos   — each site's own apple-touch-icon or declared icon, fetched over plain HTTPS.
//   shots   — captured with the ScrapeGraph CLI at 1440x900, unedited.
// `capturedAt` is shown in the caption. A screenshot without a date quietly becomes a lie
// as the site is redesigned; with one, a reader can judge how stale it is.
//
// Several captures include the cookie or region banner the site served at the time. They are
// left in. Cropping them would mean presenting a doctored image as "their website", and the
// banner is what was actually served — it is an artefact of where the capture ran from, not
// of the brand's design.

import appleLogo from '../assets/brands/apple.png';
import stripeLogo from '../assets/brands/stripe.png';
import linearLogo from '../assets/brands/linear.ico';
import githubLogo from '../assets/brands/github.png';
import vercelLogo from '../assets/brands/vercel.png';
import figmaLogo from '../assets/brands/figma.png';
import framerLogo from '../assets/brands/framer.png';
import claudeLogo from '../assets/brands/claude.png';

import appleShot from '../assets/sites/apple.jpg';
import stripeShot from '../assets/sites/stripe.jpg';
import linearShot from '../assets/sites/linear.jpg';
import githubShot from '../assets/sites/github.jpg';
import vercelShot from '../assets/sites/vercel.jpg';
import figmaShot from '../assets/sites/figma.jpg';
import framerShot from '../assets/sites/framer.jpg';
import claudeShot from '../assets/sites/claude.jpg';

const CAPTURED_AT = '2026-09-15';

export const BRAND_ASSETS = {
  apple: { logo: appleLogo, shot: appleShot, site: 'apple.com', url: 'https://www.apple.com' },
  stripe: { logo: stripeLogo, shot: stripeShot, site: 'stripe.com', url: 'https://stripe.com' },
  linear: { logo: linearLogo, shot: linearShot, site: 'linear.app', url: 'https://linear.app' },
  github: { logo: githubLogo, shot: githubShot, site: 'github.com', url: 'https://github.com' },
  vercel: { logo: vercelLogo, shot: vercelShot, site: 'vercel.com', url: 'https://vercel.com' },
  figma: { logo: figmaLogo, shot: figmaShot, site: 'figma.com', url: 'https://www.figma.com' },
  framer: { logo: framerLogo, shot: framerShot, site: 'framer.com', url: 'https://www.framer.com' },
  // claude.ai serves a sign-in wall, which shows nothing of the design the template
  // describes. claude.com is the product page the palette and type actually come from.
  claude: { logo: claudeLogo, shot: claudeShot, site: 'claude.com', url: 'https://claude.com' },
};

/** The assets for a template, or null. Null is the normal case: 12 of 20 have none. */
export const brandAssetsFor = (id) => {
  const a = BRAND_ASSETS[id];
  return a ? { ...a, capturedAt: CAPTURED_AT } : null;
};

/** For a caption: "15 September 2026". */
export const capturedLabel = () => new Date(CAPTURED_AT + 'T00:00:00').toLocaleDateString('en-GB', {
  day: 'numeric', month: 'long', year: 'numeric',
});
