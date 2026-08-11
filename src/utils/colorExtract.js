/**
 * Extract dominant colors from an uploaded image using Canvas API.
 * Skips transparent, near-white, and near-black pixels for better results.
 *
 * `maxColors` defaults to 3 to keep existing callers (the onboarding wizard)
 * unchanged — they only ever read primaryColor/secondaryColor/accentColor.
 * Callers that want to show everything the image actually contains (e.g. the
 * token/component upload pickers) can pass a higher value and read `colors`.
 */
export function extractColorsFromImage(file, maxColors = 3) {
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

      const distinct = pickDistinct(sorted, maxColors);
      URL.revokeObjectURL(url);

      resolve({
        primaryColor: distinct[0] || '#FC0694',
        secondaryColor: distinct[1] || '#1A1A24',
        accentColor: distinct[2] || '#3B82F6',
        colors: distinct,
        extracted: distinct.length > 0,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ primaryColor: '#FC0694', secondaryColor: '#1A1A24', accentColor: '#3B82F6', colors: [], extracted: false });
    };

    img.src = url;
  });
}

/**
 * Suggest a name that doesn't collide with `existingNames`, incrementing a
 * numeric suffix until it finds one that's free. `separator` lets callers
 * match their own naming convention (e.g. "." for dot-namespaced token
 * names, " " for human-readable component names).
 */
export function suggestUniqueName(baseName, existingNames = [], separator = '.') {
  const taken = new Set(existingNames);
  let n = 1;
  let candidate = `${baseName}${separator}${n}`;
  while (taken.has(candidate)) {
    n += 1;
    candidate = `${baseName}${separator}${n}`;
  }
  return candidate;
}

/**
 * Estimate real font sizes present in an uploaded image by measuring text
 * line heights directly from pixel data — no OCR, no font matching, just an
 * honest geometric measurement so we never claim to detect a font we can't.
 *
 * Method: binarize the image (Otsu threshold), then for each row count how
 * often the row flips between ink/background. Text rows have many small
 * flips (individual glyph strokes); solid-color UI blocks have very few
 * (just their left/right edges). Contiguous text-flagged rows are grouped
 * into bands — each band's height, scaled back to the image's native
 * resolution, is one measured text-line height. Similar heights across the
 * image are clustered and the most common ones are returned as candidate
 * font sizes (largest first). Returns `{ sizes: [], extracted: false }` when
 * nothing resembling text is found (e.g. a photo with no UI text).
 */
export function extractFontSizesFromImage(file, maxSizes = 5) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const naturalW = img.width || 1;
      const naturalH = img.height || 1;
      const maxDim = 600;
      const scale = Math.min(1, maxDim / Math.max(naturalW, naturalH));
      const w = Math.max(1, Math.round(naturalW * scale));
      const h = Math.max(1, Math.round(naturalH * scale));

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const { data } = ctx.getImageData(0, 0, w, h);
      URL.revokeObjectURL(url);

      const pixelCount = w * h;
      const gray = new Uint8ClampedArray(pixelCount);
      const hist = new Array(256).fill(0);
      for (let p = 0; p < pixelCount; p++) {
        const i = p * 4;
        const v = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        gray[p] = v;
        hist[v] += 1;
      }

      // Otsu's method: find the luminance threshold that best splits the
      // image into two classes (ink vs. background).
      let sumAll = 0;
      for (let t = 0; t < 256; t++) sumAll += t * hist[t];
      let sumB = 0, weightB = 0, maxVariance = 0, threshold = 127;
      for (let t = 0; t < 256; t++) {
        weightB += hist[t];
        if (weightB === 0) continue;
        const weightF = pixelCount - weightB;
        if (weightF === 0) break;
        sumB += t * hist[t];
        const meanB = sumB / weightB;
        const meanF = (sumAll - sumB) / weightF;
        const variance = weightB * weightF * (meanB - meanF) * (meanB - meanF);
        if (variance > maxVariance) { maxVariance = variance; threshold = t; }
      }

      const darkPixels = hist.slice(0, threshold).reduce((a, b) => a + b, 0);
      const lightBackground = darkPixels < pixelCount / 2;
      const isInk = (v) => (lightBackground ? v < threshold : v >= threshold);

      const rowTransitions = new Array(h).fill(0);
      for (let y = 0; y < h; y++) {
        const rowStart = y * w;
        let prev = isInk(gray[rowStart]);
        let count = 0;
        for (let x = 1; x < w; x++) {
          const cur = isInk(gray[rowStart + x]);
          if (cur !== prev) count += 1;
          prev = cur;
        }
        rowTransitions[y] = count;
      }

      const textThreshold = Math.max(6, w * 0.02);
      const bands = [];
      let bandStart = null;
      for (let y = 0; y < h; y++) {
        const isTextRow = rowTransitions[y] >= textThreshold;
        if (isTextRow && bandStart === null) bandStart = y;
        if (!isTextRow && bandStart !== null) {
          bands.push(y - bandStart);
          bandStart = null;
        }
      }
      if (bandStart !== null) bands.push(h - bandStart);

      const scaleBack = naturalH / h;
      const measuredHeights = bands
        .filter((bandHeight) => bandHeight >= 3 && bandHeight <= 80)
        .map((bandHeight) => Math.round(bandHeight * scaleBack))
        // Below ~6px real-image pixels is almost always an anti-aliasing
        // artifact or a thin divider, not readable text.
        .filter((px) => px >= 6);

      if (!measuredHeights.length) {
        resolve({ sizes: [], extracted: false });
        return;
      }

      // Cluster similar measured heights (within ~20%) and keep the most
      // frequent ones — a real font size shows up on many lines, noise doesn't.
      const clusters = [];
      for (const height of measuredHeights.sort((a, b) => a - b)) {
        const cluster = clusters.find((c) => Math.abs(height - c.avg) <= Math.max(2, c.avg * 0.2));
        if (cluster) {
          cluster.values.push(height);
          cluster.avg = cluster.values.reduce((a, b) => a + b, 0) / cluster.values.length;
        } else {
          clusters.push({ values: [height], avg: height });
        }
      }

      const sizes = clusters
        .sort((a, b) => b.values.length - a.values.length)
        .slice(0, maxSizes)
        .map((c) => Math.round(c.avg))
        .sort((a, b) => b - a);

      resolve({ sizes, extracted: sizes.length > 0 });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ sizes: [], extracted: false });
    };

    img.src = url;
  });
}

/**
 * Detect distinct rectangular UI-element-shaped regions in an uploaded
 * design screenshot (e.g. a Figma screen export) using only Canvas 2D pixel
 * data — no OCR, no ML, no backend. This finds real geometric regions
 * (connected blobs of near-uniform color, bounded by contrast edges); it
 * never claims to recognize *what* a region is (button/card/etc.) — only
 * that a distinct rectangular area was measured in the actual pixels.
 *
 * Method: quantize color (like `extractColorsFromImage`) and add a contrast
 * "edge barrier" (like `extractFontSizesFromImage`'s Otsu step, but a
 * gradient here) so two same-colored-but-separated regions don't merge.
 * Flood-fill connected same-color, non-edge pixels into blobs, then keep
 * only blobs shaped like UI elements (big enough, mostly-rectangular, not
 * a hairline, not the page background) and report their bounding boxes in
 * the original image's pixel space, plus each blob's true averaged color.
 */
export function detectComponentRegions(file, opts = {}) {
  const {
    maxWorkingDim = 900,
    maxRegions = 20,
    minFillRatio = 0.75,
    maxAspectRatio = 25,
    maxRegionFraction = 0.6,
    edgeThreshold = 20,
    maxBlobs = 5000,
  } = opts;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      try {
        const naturalW = img.width || 1;
        const naturalH = img.height || 1;
        const scale = Math.min(1, maxWorkingDim / Math.max(naturalW, naturalH));
        const w = Math.max(1, Math.round(naturalW * scale));
        const h = Math.max(1, Math.round(naturalH * scale));

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);
        URL.revokeObjectURL(url);

        const n = w * h;
        const gray = new Uint8ClampedArray(n);
        const quant = new Uint16Array(n);
        const rArr = new Uint8ClampedArray(n);
        const gArr = new Uint8ClampedArray(n);
        const bArr = new Uint8ClampedArray(n);
        const TRANSPARENT_BUCKET = 999;

        for (let p = 0; p < n; p++) {
          const i = p * 4;
          const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
          rArr[p] = r; gArr[p] = g; bArr[p] = b;
          gray[p] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
          if (a < 128) {
            quant[p] = TRANSPARENT_BUCKET;
          } else {
            const qr = Math.round(r / 32), qg = Math.round(g / 32), qb = Math.round(b / 32);
            quant[p] = qr * 81 + qg * 9 + qb;
          }
        }

        // Edge barrier: a real contrast measurement, not a guess — flood
        // fill must never cross it, even when the quantized bucket matches
        // on both sides (catches e.g. a white card on an off-white page).
        const edge = new Uint8Array(n);
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = y * w + x;
            const gx = x > 0 ? Math.abs(gray[idx] - gray[idx - 1]) : 0;
            const gy = y > 0 ? Math.abs(gray[idx] - gray[idx - w]) : 0;
            edge[idx] = (gx + gy) >= edgeThreshold ? 1 : 0;
          }
        }

        const visited = new Uint8Array(n);
        const blobs = [];
        let blobCount = 0;
        const stack = [];

        for (let start = 0; start < n; start++) {
          if (visited[start] || edge[start]) { visited[start] = 1; continue; }
          if (blobCount >= maxBlobs) { visited[start] = 1; continue; }

          const bucket = quant[start];
          visited[start] = 1;
          stack.length = 0;
          stack.push(start);

          let minX = start % w, maxX = minX, minY = Math.floor(start / w), maxY = minY;
          let count = 0, sumR = 0, sumG = 0, sumB = 0;

          while (stack.length) {
            const cur = stack.pop();
            const cx = cur % w, cy = (cur - cx) / w;
            count++;
            sumR += rArr[cur]; sumG += gArr[cur]; sumB += bArr[cur];
            if (cx < minX) minX = cx; if (cx > maxX) maxX = cx;
            if (cy < minY) minY = cy; if (cy > maxY) maxY = cy;

            if (cx > 0) { const nb = cur - 1; if (!visited[nb] && !edge[nb] && quant[nb] === bucket) { visited[nb] = 1; stack.push(nb); } }
            if (cx < w - 1) { const nb = cur + 1; if (!visited[nb] && !edge[nb] && quant[nb] === bucket) { visited[nb] = 1; stack.push(nb); } }
            if (cy > 0) { const nb = cur - w; if (!visited[nb] && !edge[nb] && quant[nb] === bucket) { visited[nb] = 1; stack.push(nb); } }
            if (cy < h - 1) { const nb = cur + w; if (!visited[nb] && !edge[nb] && quant[nb] === bucket) { visited[nb] = 1; stack.push(nb); } }
          }

          blobCount++;
          blobs.push({ minX, maxX, minY, maxY, count, avgR: sumR / count, avgG: sumG / count, avgB: sumB / count });
        }

        const workingArea = w * h;
        const candidates = [];
        for (const b of blobs) {
          const bboxW = b.maxX - b.minX + 1;
          const bboxH = b.maxY - b.minY + 1;
          const bboxArea = bboxW * bboxH;
          const fillRatio = b.count / bboxArea;
          if (bboxW < Math.max(10, w * 0.012)) continue;
          if (bboxH < Math.max(8, h * 0.012)) continue;
          if (fillRatio < minFillRatio) continue;
          const aspect = Math.max(bboxW, bboxH) / Math.min(bboxW, bboxH);
          if (aspect > maxAspectRatio) continue;

          const touchesEdge = b.minX <= w * 0.01 || b.maxX >= w * 0.99 - 1 || b.minY <= h * 0.01 || b.maxY >= h * 0.99 - 1;
          const isBackground = touchesEdge || bboxArea >= workingArea * maxRegionFraction;
          candidates.push({ ...b, bboxW, bboxH, bboxArea, fillRatio, isBackground });
        }

        // Tight-crop fallback: a screenshot cropped close around one element
        // can get excluded by the background-size/edge-touch rule above —
        // without this, the single-element case would wrongly detect nothing.
        let pool = candidates.filter((c) => !c.isBackground);
        if (pool.length === 0 && candidates.length > 0) pool = candidates;

        const totalDetected = pool.length;
        const sorted = pool.sort((a, b2) => b2.bboxArea - a.bboxArea);
        const top = sorted.slice(0, maxRegions);
        const truncated = totalDetected > maxRegions;

        const scaleBack = 1 / scale;
        const regions = top.map((c) => {
          let nx = Math.round(c.minX * scaleBack);
          let ny = Math.round(c.minY * scaleBack);
          let nw = Math.round(c.bboxW * scaleBack);
          let nh = Math.round(c.bboxH * scaleBack);
          const pad = Math.max(4, Math.round(Math.max(nw, nh) * 0.03));
          nx = Math.max(0, nx - pad);
          ny = Math.max(0, ny - pad);
          nw = Math.min(naturalW - nx, nw + pad * 2);
          nh = Math.min(naturalH - ny, nh + pad * 2);
          return {
            x: nx, y: ny, width: nw, height: nh,
            dominantColor: rgbToHex(Math.round(c.avgR), Math.round(c.avgG), Math.round(c.avgB)),
            fillRatio: c.fillRatio,
          };
        });

        resolve({ regions, extracted: regions.length > 0, truncated, totalDetected, image: img });
      } catch (err) {
        URL.revokeObjectURL(url);
        resolve({ regions: [], extracted: false, truncated: false, totalDetected: 0, image: null });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ regions: [], extracted: false, truncated: false, totalDetected: 0, image: null });
    };

    img.src = url;
  });
}

/**
 * Crop one region out of an already-decoded image (as returned by
 * `detectComponentRegions`) into its own compressed data URL. Distinct from
 * `resizeImageToDataUrl`, which loads its own fresh Image per call from a
 * File — here the same decoded image is cropped many times, once per
 * detected region, without re-reading or re-decoding the source file.
 */
export function cropImageRegionToDataUrl(image, x, y, width, height, maxDim = 320, quality = 0.82) {
  return new Promise((resolve) => {
    const scale = Math.min(1, maxDim / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, x, y, width, height, 0, 0, canvas.width, canvas.height);
    resolve(canvas.toDataURL('image/jpeg', quality));
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

