// The four model providers Strata Forge can connect to, and a real request that proves a key
// works.
//
// This is the first outbound request Strata has ever made. Everything else the app calls "AI"
// is a setTimeout with a hardcoded answer, so the bar here is that nothing in this file may
// report a fact it did not observe.
//
// The test is list-models rather than a completion for two reasons: it bills nothing, and it
// comes back with something real to show — the models the key can actually see.
//
// Why these requests are shaped the way they are:
//   - Anthropic's `anthropic-dangerous-direct-browser-access` header IS the CORS opt-in. Without
//     it the preflight fails and you get the same opaque browser block as any other refusal.
//   - Gemini is the only simple request here (no custom header), so it is the only one with no
//     preflight. The other three are preflighted, and a failed preflight is indistinguishable
//     from any other CORS failure once it reaches JS.
//   - No Content-Type on any of them. These are GETs with no body, and adding one would force a
//     preflight where Gemini currently avoids it.

const trimSlash = (s) => String(s || '').replace(/\/+$/, '');

export const LLM_PROVIDERS = [
  {
    id: 'anthropic',
    label: 'Anthropic',
    keyPlaceholder: 'sk-ant-...',
    keyHint: 'From console.anthropic.com → API keys.',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    needsBaseUrl: false,
    buildModelsRequest: (secret) => ({
      url: 'https://api.anthropic.com/v1/models',
      headers: {
        'x-api-key': secret,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
    }),
    parseModels: (json) => (json?.data || []).map(m => ({ id: m.id, label: m.display_name || m.id })),
  },
  {
    id: 'openai',
    label: 'OpenAI',
    keyPlaceholder: 'sk-proj-...',
    keyHint: 'From platform.openai.com → API keys.',
    docsUrl: 'https://platform.openai.com/api-keys',
    needsBaseUrl: false,
    buildModelsRequest: (secret) => ({
      url: 'https://api.openai.com/v1/models',
      headers: { Authorization: 'Bearer ' + secret },
    }),
    parseModels: (json) => (json?.data || []).map(m => ({ id: m.id, label: m.id })),
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    keyPlaceholder: 'AIza...',
    // Worth stating plainly: Google takes the key in the query string, so unlike the other
    // three it appears in the browser's network panel and in the logs of anything between.
    keyHint: 'From aistudio.google.com. Google takes this key in the URL, so it shows up in the network panel and in any proxy log along the way.',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    needsBaseUrl: false,
    buildModelsRequest: (secret) => ({
      url: 'https://generativelanguage.googleapis.com/v1beta/models?key=' + encodeURIComponent(secret),
      headers: {},
    }),
    parseModels: (json) => (json?.models || []).map(m => ({
      id: String(m.name || '').replace(/^models\//, ''),
      label: m.displayName || String(m.name || '').replace(/^models\//, ''),
    })),
  },
  {
    id: 'custom',
    label: 'OpenAI-compatible',
    keyPlaceholder: 'sk-... (or anything the server accepts)',
    keyHint: 'Any server that speaks the OpenAI API — OpenRouter, Groq, Together, or Ollama and LM Studio on your own machine.',
    docsUrl: '',
    needsBaseUrl: true,
    buildModelsRequest: (secret, { baseUrl } = {}) => ({
      url: trimSlash(baseUrl) + '/models',
      headers: secret ? { Authorization: 'Bearer ' + secret } : {},
    }),
    parseModels: (json) => (json?.data || json?.models || []).map(m => ({
      id: m.id || m.name, label: m.id || m.name,
    })),
  },
];

export const getProvider = (id) => LLM_PROVIDERS.find(p => p.id === id) || null;

/**
 * @returns {{ ok: boolean, url: string, reason: string }}
 */
export function normaliseBaseUrl(raw) {
  const s = String(raw || '').trim();
  if (!s) return { ok: false, url: '', reason: 'Enter the base URL of your server.' };
  let parsed;
  try {
    parsed = new URL(s);
  } catch {
    return { ok: false, url: '', reason: 'That is not a URL Strata can parse.' };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, url: '', reason: 'The URL has to start with http:// or https://.' };
  }
  return { ok: true, url: trimSlash(parsed.origin + parsed.pathname), reason: '' };
}

const clip = (s, n = 300) => {
  const t = String(s || '').trim().replace(/\s+/g, ' ');
  return t.length > n ? t.slice(0, n) + '…' : t;
};

/** Pulls the provider's own words out of whatever error shape it used. */
const providerMessage = (json, text) => {
  const m = json?.error?.message || json?.error?.msg || json?.message
    || (typeof json?.error === 'string' ? json.error : '');
  return clip(m || text);
};

const result = (status, extra = {}) => ({
  status,
  reachedProvider: false,
  httpStatus: null,
  models: [],
  modelCount: 0,
  message: '',
  detail: '',
  providerId: '',
  checkedAt: new Date().toISOString(),
  durationMs: 0,
  ...extra,
});

/**
 * Asks the provider for its model list, with the given key.
 *
 * **This never rejects.** Every path — including a thrown fetch — resolves to a result object.
 * That is deliberate: a `catch` in the UI would have to invent its own wording for a failure it
 * cannot see the shape of, and inventing wording is exactly how a page starts lying.
 *
 * `reachedProvider` is the field every sentence should key off. It is true only when the
 * provider answered. **Nothing may be said about whether the key is good unless it is true** —
 * a browser-blocked request tells you nothing about the key at all.
 *
 * @returns {Promise<{
 *   status: 'ok'|'rejected'|'rate-limited'|'provider-error'|'blocked'|'timeout'|'cancelled'|'bad-url',
 *   reachedProvider: boolean, httpStatus: number|null, models: {id:string,label:string}[],
 *   modelCount: number, message: string, detail: string, providerId: string,
 *   checkedAt: string, durationMs: number }>}
 */
export async function testKey({ providerId, secret, baseUrl = '', timeoutMs = 12000, signal } = {}) {
  const started = Date.now();
  const provider = getProvider(providerId);
  const done = (r) => ({ ...r, providerId: providerId || '', durationMs: Date.now() - started });

  if (!provider) {
    return done(result('bad-url', { message: 'No such provider.' }));
  }

  let base = '';
  if (provider.needsBaseUrl) {
    const n = normaliseBaseUrl(baseUrl);
    if (!n.ok) return done(result('bad-url', { message: n.reason }));
    base = n.url;
    // An https page cannot read a plain-http address, whoever owns it. Say so before firing a
    // request that the browser will refuse anyway.
    if (typeof window !== 'undefined' && window.location?.protocol === 'https:' && base.startsWith('http://')) {
      return done(result('bad-url', {
        message: 'Strata is served over https, and browsers do not let an https page read a plain-http address. Use an https URL, or run Strata locally over http.',
      }));
    }
  }

  const { url, headers } = provider.buildModelsRequest(String(secret || ''), { baseUrl: base });

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

  // An abort can land after the headers but before the body is read, in which case fetch
  // resolves and only the text() fails. Reporting that as "answered, but not with a model
  // list" would blame the provider for our own deadline, so both places route through here.
  const abortedResult = () => (ctrl.signal.reason?.name === 'TimeoutError'
    ? result('timeout', {
      message: 'No answer within ' + (timeoutMs >= 1000 ? Math.round(timeoutMs / 1000) + 's' : timeoutMs + 'ms') + '.',
    })
    : result('cancelled', { message: 'Cancelled.' }));

  try {
    const res = await fetch(url, { method: 'GET', headers, signal: ctrl.signal });
    const text = await res.text().catch(() => '');
    if (ctrl.signal.aborted) return done(abortedResult());
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = null; }

    const base2 = { reachedProvider: true, httpStatus: res.status };

    if (res.status === 401 || res.status === 403) {
      return done(result('rejected', {
        ...base2,
        message: provider.label + ' answered and refused this key (HTTP ' + res.status + ').',
        detail: providerMessage(json, text),
      }));
    }
    if (res.status === 429) {
      return done(result('rate-limited', {
        ...base2,
        message: provider.label + ' is rate-limiting right now. That says nothing about whether the key is good — try again shortly.',
        detail: providerMessage(json, text),
      }));
    }
    if (!res.ok) {
      return done(result('provider-error', {
        ...base2,
        message: provider.label + ' answered with HTTP ' + res.status + '.',
        detail: providerMessage(json, text),
      }));
    }

    const models = json ? provider.parseModels(json) : [];
    if (!models.length) {
      return done(result('provider-error', {
        ...base2,
        message: provider.label + ' answered, but not with a model list Strata recognises.',
        detail: clip(text),
      }));
    }
    return done(result('ok', {
      ...base2,
      models,
      modelCount: models.length,
      message: provider.label + ' answered and accepted this key. '
        + models.length + (models.length === 1 ? ' model' : ' models') + ' returned.',
    }));
  } catch {
    if (ctrl.signal.aborted) return done(abortedResult());
    // fetch throws a bare TypeError for a CORS refusal, a DNS failure and an offline machine
    // alike, with no way to tell them apart from script. Do not guess which one it was.
    return done(result('blocked', {
      message: 'The browser blocked this before any answer came back. That usually means the provider does not allow a direct call from a web page, or the network is unavailable — Strata cannot tell which from inside the page.',
    }));
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onOuterAbort);
  }
}
