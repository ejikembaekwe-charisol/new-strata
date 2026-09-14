// Black or white, whichever is actually readable on a given colour.
//
// Its own module rather than a ninth non-component export on ColorPicker.jsx, which
// react-refresh already complains about eight times over. The maths is the same WCAG
// contrast the colour ramps use — imported, not reimplemented, because two copies could
// disagree about the same hex.
//
// Two callers today: the template gallery colouring a card's canvas, and the public
// system page colouring its primary swatch.

import { hexToRgb, contrastRatio } from '../components/ColorPicker';

export const inkOn = (bg, light = '#FFFFFF', dark = '#0B0B0F') => {
  const c = hexToRgb(bg);
  if (!c) return light;
  return (contrastRatio(c, hexToRgb(light)) || 0) >= (contrastRatio(c, hexToRgb(dark)) || 0)
    ? light : dark;
};
