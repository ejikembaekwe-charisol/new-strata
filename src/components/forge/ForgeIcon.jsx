// The Forge toolbar's icons, exported from the Figma file rather than redrawn.
//
// They are rendered as a CSS mask instead of an <img> for one reason: each export has its
// state's colour baked in — the eye came out pink because it was drawn active, the code
// glyph grey because it was drawn inactive — and an <img> cannot be recoloured. As a mask
// only the alpha matters, so the shape is exactly Figma's and the colour is whatever
// `currentColor` is on the button. Active, inactive and the light theme all follow from that
// rather than from three copies of each file.

import eye from '../../assets/forge/eye.svg';
import code from '../../assets/forge/code.svg';
import laptop from '../../assets/forge/laptop.svg';
import phone from '../../assets/forge/phone.svg';
import settings from '../../assets/forge/settings.svg';
import chevronDown from '../../assets/forge/chevron-down.svg';
import plus from '../../assets/forge/plus.svg';
import search from '../../assets/forge/search.svg';
import chevronRight from '../../assets/forge/chevron-right.svg';
import xCircle from '../../assets/forge/x-circle.svg';
import brain from '../../assets/forge/brain.svg';
import shuffle from '../../assets/forge/shuffle.svg';
import arrowUpRight from '../../assets/forge/arrow-up-right.svg';
import zap from '../../assets/forge/zap.svg';
import moon from '../../assets/forge/moon.svg';
import users from '../../assets/forge/users.svg';
import sparkles from '../../assets/forge/sparkles.svg';
import figma from '../../assets/forge/figma.svg';

const SOURCES = {
  eye, code, laptop, phone, settings, chevronDown, plus, search, chevronRight,
  // The connect screen's provider glyphs, from the same file.
  xCircle, brain, shuffle, arrowUpRight, zap, moon, users, sparkles, figma,
};

export default function ForgeIcon({ name, size = 16, style }) {
  const src = SOURCES[name];
  if (!src) return null;
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block', width: size, height: size, flexShrink: 0,
        background: 'currentColor',
        // Quoted on purpose: Vite inlines a small SVG as a data: URI that contains single
        // quotes, and an unquoted url() rejects those outright — the whole declaration is
        // dropped and the icon silently disappears.
        maskImage: 'url("' + src + '")',
        WebkitMaskImage: 'url("' + src + '")',
        maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center', WebkitMaskPosition: 'center',
        maskSize: 'contain', WebkitMaskSize: 'contain',
        ...style,
      }}
    />
  );
}
