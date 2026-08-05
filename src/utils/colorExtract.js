/**
 * Extract dominant colors from an uploaded image using Canvas API.
 * Skips transparent, near-white, and near-black pixels for better results.
 */
export function extractColorsFromImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 120;
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, size, size);
      const { data } = ctx.getImageData(0, 0, size, size);

      const colorMap = {};
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
        if (a < 128) continue;                          // transparent
        if (r > 235 && g > 235 && b > 235) continue;   // near-white
        if (r < 25 && g < 25 && b < 25) continue;      // near-black

        // Quantize to 32-step buckets
        const qr = Math.round(r / 32) * 32;
        const qg = Math.round(g / 32) * 32;
        const qb = Math.round(b / 32) * 32;
        const key = `${qr},${qg},${qb}`;
        colorMap[key] = (colorMap[key] || 0) + 1;
      }

      const sorted = Object.entries(colorMap)
        .sort((a, b) => b[1] - a[1])
        .map(([key]) => {
          const [r, g, b] = key.split(',').map(Number);
          return rgbToHex(r, g, b);
        });

      const distinct = pickDistinct(sorted, 3);
      URL.revokeObjectURL(url);

      resolve({
        primaryColor: distinct[0] || '#FC0694',
        secondaryColor: distinct[1] || '#1A1A24',
        accentColor: distinct[2] || '#3B82F6',
        extracted: distinct.length > 0,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ primaryColor: '#FC0694', secondaryColor: '#1A1A24', accentColor: '#3B82F6', extracted: false });
    };

    img.src = url;
  });
}

/**
 * Downscale + compress an uploaded image into a base64 data URL, small
 * enough to persist safely in localStorage (unlike a raw File/object URL,
 * a data URL survives a page reload since it's plain JSON-serializable text).
 */
export function resizeImageToDataUrl(file, maxDim = 480, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load image'));
    };

    img.src = url;
  });
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function colorDist(h1, h2) {
  const parse = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
  const [r1,g1,b1] = parse(h1), [r2,g2,b2] = parse(h2);
  return Math.sqrt((r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2);
}

function pickDistinct(colors, n) {
  if (!colors.length) return [];
  const out = [colors[0]];
  for (const c of colors.slice(1)) {
    if (out.length >= n) break;
    if (out.every(d => colorDist(c, d) > 75)) out.push(c);
  }
  return out;
}

/**
 * Parse plain-text brand guidelines (MD, TXT) to extract
 * colors, fonts, and tone keywords.
 */
export function parseBrandText(text) {
  const result = {
    primaryColor: null,
    secondaryColor: null,
    accentColor: null,
    headingFont: null,
    bodyFont: null,
    toneKeywords: [],
    extracted: false,
  };

  // Extract hex colors
  const hexes = [...new Set((text.match(/#[0-9A-Fa-f]{6}\b/g) || []))];
  if (hexes[0]) result.primaryColor = hexes[0];
  if (hexes[1]) result.secondaryColor = hexes[1];
  if (hexes[2]) result.accentColor = hexes[2];

  // Extract fonts — look for patterns like "Outfit" or "font: Inter"
  const KNOWN_FONTS = [
    'Outfit','Inter','Roboto','DM Sans','Poppins','Manrope',
    'Plus Jakarta Sans','Sora','Nunito','Lato','Montserrat',
    'Raleway','Open Sans','Source Sans','IBM Plex Sans',
    'Geist','Figtree','Space Grotesk','General Sans',
    'Playfair Display','Merriweather','Lora','Georgia',
  ];
  for (const font of KNOWN_FONTS) {
    const re = new RegExp(`\\b${font}\\b`, 'i');
    if (re.test(text)) {
      if (!result.headingFont) result.headingFont = font;
      else if (!result.bodyFont && result.headingFont !== font) result.bodyFont = font;
    }
    if (result.headingFont && result.bodyFont) break;
  }

  // Extract tone keywords matching our predefined list
  const TONE_OPTIONS = ['Bold','Minimal','Playful','Corporate','Friendly','Technical','Luxury','Warm','Energetic','Calm'];
  result.toneKeywords = TONE_OPTIONS.filter(t => new RegExp(`\\b${t}\\b`, 'i').test(text));

  result.extracted = !!(hexes.length || result.headingFont || result.toneKeywords.length);
  return result;
}

/**
 * Parse JSON tokens to extract primary, secondary, and accent colors.
 */
export function parseJsonTokens(text) {
  const result = {
    primaryColor: null,
    secondaryColor: null,
    accentColor: null,
    extracted: false,
  };

  if (!text) return result;

  try {
    const data = JSON.parse(text);
    
    // Support Strata format: { Color: [ { name, value, type }, ... ] }
    if (data && data.Color && Array.isArray(data.Color)) {
      const primary = data.Color.find(t => t.name === 'color.primary')?.value;
      const secondary = data.Color.find(t => t.name === 'color.secondary')?.value;
      const accent = data.Color.find(t => t.name === 'color.accent')?.value;
      if (primary) result.primaryColor = primary;
      if (secondary) result.secondaryColor = secondary;
      if (accent) result.accentColor = accent;
    } else {
      // General JSON recursive or regex search for hex colors
      const hexes = [...new Set((text.match(/#[0-9A-Fa-f]{6}\b/g) || []))];
      if (hexes[0]) result.primaryColor = hexes[0];
      if (hexes[1]) result.secondaryColor = hexes[1];
      if (hexes[2]) result.accentColor = hexes[2];
    }
    result.extracted = !!(result.primaryColor || result.secondaryColor || result.accentColor);
  } catch (e) {
    // Graceful fallback to regex parsing if JSON is malformed
    const hexes = [...new Set((text.match(/#[0-9A-Fa-f]{6}\b/g) || []))];
    if (hexes[0]) result.primaryColor = hexes[0];
    if (hexes[1]) result.secondaryColor = hexes[1];
    if (hexes[2]) result.accentColor = hexes[2];
    result.extracted = hexes.length > 0;
  }
  return result;
}

