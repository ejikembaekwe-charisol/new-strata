// Can this page reach Figma's Dev Mode MCP server?
//
// This is a diagnostic, not a connector, and it is worth being blunt about why. Figma Desktop
// runs that server on http://127.0.0.1:3845 for local MCP clients — editors, agents, things
// with no browser sandbox around them. A web page is not one of those:
//
//   - Served over https, the page cannot read a plain-http address on the user's machine at
//     all. Firefox and Safari stop it as mixed content; Chrome treats 127.0.0.1 as trustworthy
//     and stops it under Private Network Access instead, wanting a preflight header the Figma
//     server does not send. Different mechanisms, same outcome, which is why the copy below
//     states the outcome and never names the mechanism — naming one would be wrong about half
//     the browsers.
//   - Served over plain http (a local `npm run dev`), there is no such rule, but the server
//     still has to send CORS headers or the read fails anyway.
//
// So on the deployed build this will report `insecure-origin` for everyone, without sending a
// request. It earns its place by naming the obstacle rather than spinning forever, and by
// pointing at the path that does work from a browser — Figma's REST API with a personal access
// token, which is an ordinary https call, and whose vault this app already has.
//
// Three things are deliberately NOT done here, because each one makes a failure look like a
// success:
//   1. `mode: 'no-cors'`. It resolves with an opaque response: status always 0, body
//      unreadable. It cannot tell success from failure, so it is not evidence, and it must
//      never set `observed`.
//   2. <img>/<script> onerror timing probes. A side channel is not an observation.
//   3. Retrying /sse after a TypeError. The same block produces the same TypeError; it only
//      doubles the wait.

export const MCP_DEFAULT_ORIGIN = 'http://127.0.0.1:3845';

const shape = (status, extra = {}) => ({
  status,
  attempted: false,
  // The MCP analogue of reachedProvider: true only when bytes actually came back. Nothing may
  // be asserted about the server unless this is true.
  observed: false,
  httpStatus: null,
  serverInfo: null,
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
 * The part that needs no network. Returns a terminal result when the page's own protocol
 * already settles it, and null when a probe is worth attempting.
 *
 * This is the highest-confidence outcome in the whole module, because it is a browser rule
 * rather than an observation.
 */
export function precheck() {
  const protocol = typeof window !== 'undefined' ? window.location?.protocol : 'http:';
  if (protocol === 'https:') {
    return shape('insecure-origin', {
      message: 'This page is served over https. Browsers do not let it read a plain-http address on your own machine, so Strata cannot check from here.',
      remedy: 'Run Strata locally over http and try again, or connect Figma with an access token instead — that is an ordinary https call a browser is allowed to make.',
    });
  }
  return null;
}

/**
 * Sends one JSON-RPC `initialize` to the MCP endpoint and reports exactly what came back.
 *
 * **Never rejects.** Four seconds is a generous timeout for something on loopback: it either
 * answers at once or it is not there.
 *
 * @returns {Promise<{
 *   status: 'insecure-origin'|'ok'|'responding'|'unreachable'|'timeout'|'cancelled',
 *   attempted: boolean, observed: boolean, httpStatus: number|null,
 *   serverInfo: {name?: string, version?: string}|null, url: string, pageOrigin: string,
 *   checkedAt: string, durationMs: number, message: string, remedy: string,
 *   possibilities: string[] }>}
 */
export async function probeMcp({ origin = MCP_DEFAULT_ORIGIN, timeoutMs = 4000, signal } = {}) {
  const started = Date.now();
  const done = (r) => ({ ...r, durationMs: Date.now() - started });

  const blocked = precheck();
  if (blocked) return done(blocked);

  const url = String(origin).replace(/\/+$/, '') + '/mcp';
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

  // Same hazard as llmProviders: an abort between the headers and the body would otherwise
  // read as "something answered but did not speak MCP".
  const abortedResult = () => (ctrl.signal.reason?.name === 'TimeoutError'
    ? shape('timeout', {
      attempted: true, url,
      message: 'Nothing answered within ' + (timeoutMs >= 1000 ? Math.round(timeoutMs / 1000) + 's' : timeoutMs + 'ms') + '.',
    })
    : shape('cancelled', { attempted: true, url, message: 'Cancelled.' }));

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'Strata Forge', version: '0.1' },
        },
      }),
      signal: ctrl.signal,
    });

    const text = await res.text().catch(() => '');
    if (ctrl.signal.aborted) return done(abortedResult());
    // The streamable-HTTP transport may answer as SSE, so the JSON can be behind a `data:`
    // prefix rather than being the whole body.
    let json = null;
    try {
      const line = text.includes('data:')
        ? (text.split('\n').find(l => l.startsWith('data:')) || '').slice(5).trim()
        : text;
      json = line ? JSON.parse(line) : null;
    } catch {
      json = null;
    }

    const info = json?.result?.serverInfo;
    if (res.ok && info) {
      return done(shape('ok', {
        attempted: true, observed: true, httpStatus: res.status, url,
        serverInfo: { name: info.name, version: info.version },
        message: 'Answered: ' + (info.name || 'an MCP server')
          + (info.version ? ' ' + info.version : '') + '.',
      }));
    }

    return done(shape('responding', {
      attempted: true, observed: true, httpStatus: res.status, url,
      message: 'Something is listening on ' + origin + ' and the browser was allowed to read it, but it did not answer with an MCP initialize result (HTTP ' + res.status + ').',
    }));
  } catch {
    if (ctrl.signal.aborted) return done(abortedResult());
    return done(shape('unreachable', {
      attempted: true, url,
      message: 'No answer came back from ' + origin + '. The browser gives no reason it can be asked about, so Strata cannot tell which of these it was:',
      possibilities: [
        'Figma Desktop is not running, or no file is open in it.',
        'The Dev Mode MCP server is switched off in Figma’s preferences.',
        'It is listening on a different port.',
        'It is running perfectly well but sends none of the CORS headers a web page needs — in which case no browser can read it, only an editor-based MCP client.',
      ],
      remedy: 'Connecting Figma with an access token instead is an ordinary https call, which a browser does allow.',
    }));
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onOuterAbort);
  }
}
