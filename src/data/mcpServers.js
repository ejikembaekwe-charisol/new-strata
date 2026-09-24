// MCP servers: what a page in a browser can honestly say about one.
//
// This is the probe that shipped as figmaMcp.js, generalised from Figma's Dev Mode server to
// any MCP endpoint and given a tools/list follow-up so the capability tags on the screen are
// the server's own tool names rather than names someone typed into a design.
//
// The constraint that shapes everything here has not changed. An MCP server for editors and
// agents speaks JSON-RPC over stdio or over HTTP on the loopback address. A web page cannot
// spawn a process at all, and reaching http://127.0.0.1 from a page depends on where the page
// itself came from:
//
//   - Served over https, the page cannot read a plain-http address on the user's machine.
//     Firefox and Safari stop it as mixed content; Chrome treats 127.0.0.1 as trustworthy and
//     stops it under Private Network Access instead, wanting a preflight header these servers
//     do not send. Different mechanisms, same outcome — which is why the copy states the
//     outcome and never names the mechanism. Naming one would be wrong about half the browsers.
//   - Served over plain http (a local `npm run dev`), there is no such rule, but the server
//     still has to send CORS headers or the read fails anyway.
//
// So on the deployed build a local server reports `insecure-origin` for everyone, without a
// request being sent. That is the honest answer, and it is worth more than a spinner.
//
// Three things are deliberately NOT done, because each makes a failure look like a success:
//   1. `mode: 'no-cors'`. It resolves with an opaque response: status always 0, body
//      unreadable. It cannot tell success from failure, so it never sets `observed`.
//   2. <img>/<script> onerror timing probes. A side channel is not an observation.
//   3. Retrying after a TypeError. The same block produces the same TypeError.
//
// **A probe result is never stored.** It describes one endpoint at one moment; a "connected"
// badge read back out of localStorage would outlive the fact it described. Only the endpoints
// you configured are persisted.

const STORAGE_KEY = 'strata_mcp_servers';

/** The one server Strata knows the address of without being told. */
export const MCP_PRESETS = Object.freeze([
  Object.freeze({
    id: 'figma-dev-mode',
    name: 'Figma MCP',
    blurb: 'Figma Desktop’s Dev Mode server. Reads the frame you have selected — its layers, '
      + 'variables and exported assets — so a model can be asked about a design rather than a screenshot.',
    url: 'http://127.0.0.1:3845/mcp',
    icon: 'figma',
    local: true,
    docsUrl: 'https://help.figma.com/hc/en-us/articles/32132100833559',
  }),
]);

const read = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
};

/** Servers this person added, in the order they added them. Reading never writes. */
export function listServers(owner) {
  return read().filter(s => s.owner === owner);
}

/**
 * Adds one endpoint. No secret is involved, so this is an ordinary list rather than the key
 * vault — but a URL can carry a token in a query string, so it is still scoped to one person.
 *
 * @returns {{ok: boolean, reason?: string, entry?: object}}
 */
export function addServer({ owner, name, url }) {
  const clean = normaliseUrl(url);
  if (!clean.ok) return { ok: false, reason: clean.reason };
  const all = read();
  if (all.some(s => s.owner === owner && s.url === clean.url)) {
    return { ok: false, reason: 'That endpoint is already on the list.' };
  }
  const entry = {
    id: 'mcp-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
    owner,
    name: String(name || '').trim() || hostOf(clean.url),
    url: clean.url,
    addedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...all, entry]));
  } catch {
    return { ok: false, reason: 'The browser refused to store it — its storage is full.' };
  }
  return { ok: true, entry };
}

export function removeServer(id) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(read().filter(s => s.id !== id)));
  } catch { /* nothing to undo: the list is what it was */ }
}

const hostOf = (url) => {
  try { return new URL(url).host; } catch { return url; }
};

/** @returns {{ok: true, url: string}|{ok: false, reason: string}} */
export function normaliseUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return { ok: false, reason: 'Enter the server’s address.' };
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, reason: 'That is not a URL Strata can parse. It needs the scheme too, as in http://127.0.0.1:3845/mcp.' };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, reason: 'Only http and https can be reached from a browser. A stdio server has no address a page can call.' };
  }
  return { ok: true, url: parsed.toString().replace(/\/+$/, '') };
}

const shape = (status, extra = {}) => ({
  status,
  attempted: false,
  // True only when bytes actually came back. Nothing may be asserted about the server unless
  // this is true.
  observed: false,
  httpStatus: null,
  serverInfo: null,
  tools: [],
  url: '',
  pageOrigin: typeof window !== 'undefined' ? window.location?.origin || '' : '',
  checkedAt: new Date().toISOString(),
  durationMs: 0,
  message: '',
  remedy: '',
  possibilities: [],
  ...extra,
});

/**
 * The part that needs no network: a browser rule, which is higher-confidence than anything a
 * request could tell us. Returns a terminal result, or null when a probe is worth attempting.
 */
export function precheck(url) {
  const pageProtocol = typeof window !== 'undefined' ? window.location?.protocol : 'http:';
  const isPlainHttp = String(url || '').startsWith('http://');
  if (pageProtocol === 'https:' && isPlainHttp) {
    return shape('insecure-origin', {
      url,
      message: 'This page is served over https, and browsers do not let it read a plain-http address. Strata cannot check this one from here.',
      remedy: 'Run Strata locally over http, or point this at an https endpoint.',
    });
  }
  return null;
}

/** The SSE transport answers with `data:` lines, so the JSON may not be the whole body. */
const parseBody = (text) => {
  try {
    const line = text.includes('data:')
      ? (text.split('\n').find(l => l.startsWith('data:')) || '').slice(5).trim()
      : text;
    return line ? JSON.parse(line) : null;
  } catch {
    return null;
  }
};

const rpc = (url, body, sessionId, signal) => fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
    ...(sessionId ? { 'Mcp-Session-Id': sessionId } : {}),
  },
  body: JSON.stringify(body),
  signal,
});

/**
 * Sends one JSON-RPC `initialize` and, if that works, asks what tools the server has.
 *
 * **Never rejects.** Four seconds is generous for loopback: it answers at once or it is not
 * there. The tools request is best-effort — a server that refuses it, or a CORS policy that
 * hides the session header, costs the capability tags and nothing else.
 *
 * @returns {Promise<{
 *   status: 'insecure-origin'|'ok'|'responding'|'unreachable'|'timeout'|'cancelled',
 *   attempted: boolean, observed: boolean, httpStatus: number|null,
 *   serverInfo: {name?: string, version?: string}|null, tools: {name: string}[],
 *   url: string, pageOrigin: string, checkedAt: string, durationMs: number,
 *   message: string, remedy: string, possibilities: string[] }>}
 */
export async function probeServer({ url, timeoutMs = 4000, signal } = {}) {
  const started = Date.now();
  const done = (r) => ({ ...r, durationMs: Date.now() - started });

  const blocked = precheck(url);
  if (blocked) return done(blocked);

  const ctrl = new AbortController();
  const timer = setTimeout(
    () => ctrl.abort(new DOMException('timeout', 'TimeoutError')),
    Math.max(1, timeoutMs),
  );
  const onOuterAbort = () => ctrl.abort(signal?.reason);
  if (signal) {
    if (signal.aborted) onOuterAbort();
    else signal.addEventListener('abort', onOuterAbort, { once: true });
  }

  // An abort between the headers and the body would otherwise read as "something answered but
  // did not speak MCP".
  const abortedResult = () => (ctrl.signal.reason?.name === 'TimeoutError'
    ? shape('timeout', {
      attempted: true, url,
      message: 'Nothing answered within ' + (timeoutMs >= 1000 ? Math.round(timeoutMs / 1000) + 's' : timeoutMs + 'ms') + '.',
    })
    : shape('cancelled', { attempted: true, url, message: 'Cancelled.' }));

  try {
    const res = await rpc(url, {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'Strata Forge', version: '0.1' },
      },
    }, '', ctrl.signal);

    const text = await res.text().catch(() => '');
    if (ctrl.signal.aborted) return done(abortedResult());
    const json = parseBody(text);
    const info = json?.result?.serverInfo;

    if (!res.ok || !info) {
      return done(shape('responding', {
        attempted: true, observed: true, httpStatus: res.status, url,
        message: 'Something is listening there and the browser was allowed to read it, but it did not answer with an MCP initialize result (HTTP ' + res.status + ').',
      }));
    }

    // Best-effort: the handshake wants the session id back, and a CORS policy that does not
    // expose the header makes it unreadable. Missing tags are not a failed connection.
    let tools = [];
    try {
      const sessionId = res.headers.get('mcp-session-id') || '';
      await rpc(url, { jsonrpc: '2.0', method: 'notifications/initialized' }, sessionId, ctrl.signal);
      const listed = await rpc(url, { jsonrpc: '2.0', id: 2, method: 'tools/list' }, sessionId, ctrl.signal);
      const body = parseBody(await listed.text().catch(() => ''));
      tools = (body?.result?.tools || []).map(t => ({ name: t.name })).filter(t => t.name);
    } catch { /* the connection itself is still a fact */ }

    return done(shape('ok', {
      attempted: true, observed: true, httpStatus: res.status, url, tools,
      serverInfo: { name: info.name, version: info.version },
      message: 'Answered: ' + (info.name || 'an MCP server') + (info.version ? ' ' + info.version : '') + '.'
        + (tools.length ? ' It listed ' + tools.length + ' tool' + (tools.length === 1 ? '' : 's') + '.' : ''),
    }));
  } catch {
    if (ctrl.signal.aborted) return done(abortedResult());
    return done(shape('unreachable', {
      attempted: true, url,
      message: 'No answer came back. The browser gives no reason it can be asked about, so Strata cannot tell which of these it was:',
      possibilities: [
        'Nothing is running at that address.',
        'It is listening on a different port or path.',
        'It is running perfectly well but sends none of the CORS headers a web page needs — in which case no browser can read it, only an editor-based MCP client.',
      ],
    }));
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onOuterAbort);
  }
}
