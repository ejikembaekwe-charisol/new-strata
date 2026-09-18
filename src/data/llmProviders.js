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
//   - Among the model-list GETs, Gemini is the only simple request (no custom header), so it
//     is the only one with no preflight. The other three are preflighted, and a failed
//     preflight is indistinguishable from any other CORS failure once it reaches JS.
//   - No Content-Type on any of the GETs. They have no body, and adding one would force a
//     preflight where Gemini currently avoids it.
//   - Every chat POST is preflighted, Gemini included: the body is JSON, so it carries a
//     Content-Type, and that is enough on its own. Gemini's preflight-free property belonged
//     to its GET alone. This changes nothing a user is told — a failed preflight already
//     arrives as the same bare TypeError, already reported as `blocked` without naming why.

const trimSlash = (s) => String(s || '').replace(/\/+$/, '');

/**
 * The OpenAI reply shape, shared by `openai` and every OpenAI-compatible server.
 *
 * `message.content` arrives three ways in the wild: a string, `null` (a tool call, or a
 * filtered answer), or an array of parts on some compatible servers. A null becomes '',
 * which sendChat then classifies as `empty` rather than passing "null" along as text.
 */
/** Anthropic demands a cap, so this is the one number Strata invents for a request. It is
 *  reported back as `maxTokens` so a cut-off reply can say whose limit stopped it. 8192
 *  rather than the conventional 4096: a self-contained HTML page routinely runs past 4k
 *  output tokens, and a default that makes truncation the normal case is a bad default. */
const ANTHROPIC_MAX_TOKENS = 8192;

const openAiReply = (json) => {
  const msg = json?.choices?.[0]?.message;
  const raw = msg?.content;
  const text = typeof raw === 'string' ? raw
    : Array.isArray(raw) ? raw.map(p => (typeof p === 'string' ? p : p?.text || '')).join('')
      : '';
  return {
    text,
    stopReason: json?.choices?.[0]?.finish_reason || '',
    usage: json?.usage
      ? { inputTokens: json.usage.prompt_tokens ?? null, outputTokens: json.usage.completion_tokens ?? null }
      : null,
    blockReason: '',
  };
};

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
    defaultModel: 'claude-sonnet-4-5',
    needsModel: false,
    defaultMaxTokens: ANTHROPIC_MAX_TOKENS,
    // The only provider that refuses to pick a cap for you.
    maxTokensRequired: true,
    buildChatRequest: (secret, { model, messages, system, maxTokens }) => ({
      url: 'https://api.anthropic.com/v1/messages',
      headers: {
        'x-api-key': secret,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: {
        model,
        max_tokens: maxTokens || ANTHROPIC_MAX_TOKENS,
        ...(system ? { system } : {}),
        messages: messages.map(m => ({ role: m.role, content: [{ type: 'text', text: m.content }] })),
      },
    }),
    // Not content[0].text: the first block can be a thinking block, whose `.text` is
    // undefined — and "undefined" is a string that would render happily into an iframe.
    parseChatReply: (json) => ({
      text: (json?.content || []).filter(b => b?.type === 'text').map(b => b.text || '').join('\n'),
      stopReason: json?.stop_reason || '',
      usage: json?.usage
        ? { inputTokens: json.usage.input_tokens ?? null, outputTokens: json.usage.output_tokens ?? null }
        : null,
      blockReason: '',
    }),
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
    defaultModel: 'gpt-4.1',
    needsModel: false,
    defaultMaxTokens: null,
    maxTokensRequired: false,
    buildChatRequest: (secret, { model, messages, system, maxTokens }) => ({
      url: 'https://api.openai.com/v1/chat/completions',
      headers: { Authorization: 'Bearer ' + secret },
      body: {
        model,
        messages: [...(system ? [{ role: 'system', content: system }] : []), ...messages],
        // OpenAI's own reasoning models reject `max_tokens` outright, which is why this and
        // the OpenAI-compatible descriptor below cannot share one builder.
        ...(maxTokens ? { max_completion_tokens: maxTokens } : {}),
      },
    }),
    parseChatReply: openAiReply,
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
    defaultModel: 'gemini-2.5-flash',
    needsModel: false,
    defaultMaxTokens: null,
    maxTokensRequired: false,
    buildChatRequest: (secret, { model, messages, system, maxTokens }) => ({
      // The id goes in the path, so a bare `models/` prefix has to come off first —
      // encodeURIComponent would turn its slash into %2F and 404.
      url: 'https://generativelanguage.googleapis.com/v1beta/models/'
        + encodeURIComponent(String(model).replace(/^models\//, ''))
        + ':generateContent?key=' + encodeURIComponent(secret),
      headers: {},
      body: {
        ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
        // Gemini has no system role inside contents, and calls the assistant 'model'.
        contents: messages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        ...(maxTokens ? { generationConfig: { maxOutputTokens: maxTokens } } : {}),
      },
    }),
    parseChatReply: (json) => ({
      text: (json?.candidates?.[0]?.content?.parts || []).map(p => p?.text || '').join(''),
      stopReason: json?.candidates?.[0]?.finishReason || '',
      usage: json?.usageMetadata
        ? {
          inputTokens: json.usageMetadata.promptTokenCount ?? null,
          outputTokens: json.usageMetadata.candidatesTokenCount ?? null,
        }
        : null,
      // A prompt-level block comes back as HTTP 200 with no candidates at all — the purest
      // example of a failure a model list cannot have.
      blockReason: json?.promptFeedback?.blockReason || '',
    }),
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
    defaultModel: '',
    // No guess is defensible about what is running on someone's own server, and a guess
    // produces a 404 that reads like a broken feature.
    needsModel: true,
    defaultMaxTokens: null,
    maxTokensRequired: false,
    buildChatRequest: (secret, { baseUrl, model, messages, system, maxTokens }) => ({
      url: trimSlash(baseUrl) + '/chat/completions',
      headers: secret ? { Authorization: 'Bearer ' + secret } : {},
      body: {
        model,
        messages: [...(system ? [{ role: 'system', content: system }] : []), ...messages],
        // `max_tokens`, not OpenAI's `max_completion_tokens`: Ollama, LM Studio, Groq and
        // most compatible servers have never heard of the newer name.
        ...(maxTokens ? { max_tokens: maxTokens } : {}),
      },
    }),
    parseChatReply: openAiReply,
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

// ── Asking a model for something ────────────────────────────────────────────
//
// testKey proves a key works. This spends it.
//
// Two things separate a completion from a model list, and both shape the code below. It
// costs the user money on every press, so nothing here fires without one. And it can fail
// in ways a list cannot: a reply that is real but cut off, a reply the provider withheld,
// a 200 with nothing in it, a prompt longer than the model's context.

/**
 * The model to send, and how it was chosen.
 *
 * `models` is the list a key test already returned, so the caller never needs a second
 * request to populate a picker. sendChat reports the id it actually sent, because a
 * fallback the UI cannot see is a fallback that gets blamed on the model.
 */
export function pickModel(providerId, { model, models } = {}) {
  const chosen = String(model || '').trim();
  if (chosen) return chosen;
  const provider = getProvider(providerId);
  if (!provider) return '';
  const list = Array.isArray(models) ? models : [];
  if (list.length) {
    if (provider.defaultModel && list.some(m => m.id === provider.defaultModel)) return provider.defaultModel;
    return list[0].id || '';
  }
  return provider.defaultModel || '';
}

/**
 * A caller's cap wins. Otherwise only Anthropic gets one, because a number we invent is a
 * number we then have to defend — omitting the field lets each provider's own default apply.
 */
const resolveMaxTokens = (provider, requested) => {
  const n = Math.floor(Number(requested));
  if (Number.isFinite(n) && n > 0) return n;
  return provider.maxTokensRequired ? provider.defaultMaxTokens : null;
};

const chatResult = (status, extra = {}) => ({
  status,
  reachedProvider: false,
  httpStatus: null,
  text: '',
  stopReason: '',
  truncated: false,
  usage: null,
  model: '',
  maxTokens: null,
  message: '',
  detail: '',
  providerId: '',
  checkedAt: new Date().toISOString(),
  durationMs: 0,
  ...extra,
});

/** A stop reason that means the model ran out of room rather than finished. */
const TRUNCATING = new Set(['max_tokens', 'length', 'MAX_TOKENS']);
/** A stop reason where the provider told us it withheld the answer. */
const WITHHELD = new Set(['refusal', 'content_filter', 'SAFETY', 'PROHIBITED_CONTENT', 'RECITATION']);

/** Markers a provider uses when the prompt itself was too long. Matched, never guessed: a
 *  400 that fits none of these stays a plain provider error with the provider's own words. */
const isContextLength = (json, text) => {
  const code = String(json?.error?.code || json?.error?.type || '');
  if (code === 'context_length_exceeded') return true;
  const blob = (providerMessage(json, text) || '').toLowerCase();
  return /prompt is too long|context length|context window|input token count|too many tokens/.test(blob);
};

/** A 429 an account can never retry its way out of. */
const isQuota = (json, text) => {
  const code = String(json?.error?.code || json?.error?.type || '');
  if (/insufficient_quota|billing/.test(code)) return true;
  return /quota|billing|credit|payment/i.test(providerMessage(json, text) || '');
};

/**
 * Sends a conversation and returns the reply.
 *
 * Same contract as testKey: **never rejects**, and `reachedProvider` is the field every
 * sentence keys off — nothing may be said about the key, the model, the prompt or the reply
 * unless it is true.
 *
 * The status vocabulary extends testKey's with four a completion can produce:
 *   `filtered`       the provider said it withheld the answer
 *   `empty`          a 200 in a shape we recognise, with no text and no reason given
 *   `overloaded`     the provider is over capacity (Anthropic 529, others 503)
 *   `context-length` the prompt was longer than the model's context
 *
 * `truncated` is deliberately NOT a status. A cut-off reply is real text that is often
 * nearly usable, and a caller treating anything but `ok` as failure would throw away a
 * nearly-complete document. It comes back as `ok` with `truncated: true`.
 *
 * `bad-url` widens here to mean "Strata refused to send": no such provider, an unusable base
 * URL, a plain-http target from an https page, or no model chosen where one is required.
 *
 * @returns {Promise<{status: string, reachedProvider: boolean, httpStatus: number|null,
 *   text: string, stopReason: string, truncated: boolean,
 *   usage: {inputTokens: number, outputTokens: number}|null, model: string,
 *   maxTokens: number|null, message: string, detail: string, providerId: string,
 *   checkedAt: string, durationMs: number}>}
 */
export async function sendChat({
  providerId, secret, baseUrl = '', model = '', models = null,
  system = '', messages = [], maxTokens,
  // 90s, not testKey's 12s: a model writing a whole page routinely takes half a minute, and
  // a short deadline would report "no answer" over a provider that was mid-sentence.
  timeoutMs = 90000, signal,
} = {}) {
  const started = Date.now();
  const provider = getProvider(providerId);
  const done = (r) => ({ ...r, providerId: providerId || '', durationMs: Date.now() - started });

  if (!provider) return done(chatResult('bad-url', { message: 'No such provider.' }));

  let base = '';
  if (provider.needsBaseUrl) {
    const n = normaliseBaseUrl(baseUrl);
    if (!n.ok) return done(chatResult('bad-url', { message: n.reason }));
    base = n.url;
    if (typeof window !== 'undefined' && window.location?.protocol === 'https:' && base.startsWith('http://')) {
      return done(chatResult('bad-url', {
        message: 'Strata is served over https, and browsers do not let an https page read a plain-http address. Use an https URL, or run Strata locally over http.',
      }));
    }
  }

  const useModel = pickModel(providerId, { model, models });
  if (!useModel) {
    return done(chatResult('bad-url', {
      message: provider.needsModel
        ? 'Pick a model. Strata will not guess what is running on your server.'
        : 'No model to send.',
    }));
  }
  const cap = resolveMaxTokens(provider, maxTokens);

  const { url, headers, body } = provider.buildChatRequest(String(secret || ''), {
    baseUrl: base, model: useModel, messages, system, maxTokens: cap,
  });
  const sent = { model: useModel, maxTokens: cap };

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
  const abortedResult = () => (ctrl.signal.reason?.name === 'TimeoutError'
    ? chatResult('timeout', {
      ...sent,
      message: 'No answer within ' + (timeoutMs >= 1000 ? Math.round(timeoutMs / 1000) + 's' : timeoutMs + 'ms') + '.',
    })
    : chatResult('cancelled', { ...sent, message: 'Cancelled.' }));

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const text = await res.text().catch(() => '');
    if (ctrl.signal.aborted) return done(abortedResult());
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = null; }

    const head = { ...sent, reachedProvider: true, httpStatus: res.status };

    if (res.status === 401 || res.status === 403) {
      return done(chatResult('rejected', {
        ...head,
        message: provider.label + ' answered and refused this key (HTTP ' + res.status + ').',
        detail: providerMessage(json, text),
      }));
    }
    if (res.status === 429) {
      // A quota 429 will never succeed on a retry, so it must not carry "try again shortly".
      const quota = isQuota(json, text);
      return done(chatResult('rate-limited', {
        ...head,
        message: quota
          ? provider.label + ' answered and refused this request on quota or billing, not on the key.'
          : provider.label + ' is rate-limiting right now. That says nothing about whether the key is good — try again shortly.',
        detail: providerMessage(json, text),
      }));
    }
    if (res.status === 529 || res.status === 503 || res.status === 502 || res.status === 504) {
      return done(chatResult('overloaded', {
        ...head,
        message: provider.label + ' is over capacity right now (HTTP ' + res.status + '). Nothing to do with the key or the prompt.',
        detail: providerMessage(json, text),
      }));
    }
    if (res.status === 400 && isContextLength(json, text)) {
      return done(chatResult('context-length', {
        ...head,
        message: 'The prompt was longer than this model can take.',
        detail: providerMessage(json, text),
      }));
    }
    if (!res.ok) {
      const notFound = res.status === 404 || /model/i.test(providerMessage(json, text) || '');
      return done(chatResult('provider-error', {
        ...head,
        message: provider.label + ' answered with HTTP ' + res.status + '.'
          + (notFound ? ' If this is about the model, pick one from the list the key returned.' : ''),
        detail: providerMessage(json, text),
      }));
    }

    const parsed = json ? provider.parseChatReply(json) : { text: '', stopReason: '', usage: null, blockReason: '' };
    const stopReason = parsed.stopReason || '';
    const withheld = parsed.blockReason || (WITHHELD.has(stopReason) ? stopReason : '');

    if (withheld) {
      return done(chatResult('filtered', {
        ...head, stopReason, usage: parsed.usage || null,
        message: provider.label + ' withheld this answer (' + withheld + '). Rewording the prompt is the only thing that helps.',
        detail: providerMessage(json, ''),
      }));
    }
    if (!parsed.text) {
      return done(chatResult('empty', {
        ...head, stopReason, usage: parsed.usage || null,
        message: provider.label + ' answered, but with no text in it.',
        detail: clip(text),
      }));
    }

    const truncated = TRUNCATING.has(stopReason);
    return done(chatResult('ok', {
      ...head,
      text: parsed.text,
      stopReason,
      truncated,
      usage: parsed.usage || null,
      message: truncated
        ? 'The reply was cut off at the ' + (cap ? cap + '-token' : 'model’s') + ' limit, so it is incomplete.'
        : provider.label + ' answered.',
    }));
  } catch {
    if (ctrl.signal.aborted) return done(abortedResult());
    return done(chatResult('blocked', {
      ...sent,
      message: 'The browser blocked this before any answer came back. That usually means the provider does not allow a direct call from a web page, or the network is unavailable — Strata cannot tell which from inside the page.',
    }));
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onOuterAbort);
  }
}
