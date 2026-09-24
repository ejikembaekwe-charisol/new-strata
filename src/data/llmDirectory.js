// The providers the connect screen offers, and what connecting to each one actually means.
//
// The frame this is built from lists sixteen rows. Only the ones a browser can reach with an
// API key are here, because a row that cannot work is worse than a row that is missing: it
// takes a decision from someone and then fails at the end of it.
//
// What got left out, and why:
//   - **Cursor, GitHub Copilot, OpenCode Go, OpenCode Zen, Kimi For Coding.** These are IDE
//     and CLI subscriptions. None of them exposes a key-addressable HTTP API that a web page
//     can call, so there is nothing for Strata to send a key to.
//   - **"Strata automatically connects to Claude Code and Codex on your system."** It cannot.
//     Strata is a page in your browser with no server and no process on your machine; it can
//     neither see nor launch a local CLI. That sentence is not repeated anywhere in the UI.
//
// What is here is of two kinds. Three providers have their own adapter in llmProviders.js.
// The rest are OpenAI-compatible servers, so they are the `custom` adapter with the base URL
// filled in for you — exactly what you would otherwise paste by hand.
//
// `browserOk` is the one claim on this screen that could mislead, so it is deliberately
// three-valued. `true` means the provider is known to answer a request made from a web page.
// `null` means unknown — the service has an API, and whether it lets a browser call it is
// between it and your browser. Nothing here says `false`, because a provider that refuses
// today may allow it tomorrow; an unknown that turns out to be blocked is reported by the
// key test itself, which says so without guessing at a cause.

import { MODEL_CATALOGUE } from './modelCatalogue';

/** The first few names from the catalogue, so this screen and the model picker cannot disagree. */
const fromCatalogue = (providerId, count) =>
  (MODEL_CATALOGUE[providerId] || []).slice(0, count).map(m => m.label).join(' · ');

/**
 * @typedef {object} DirectoryEntry
 * @property {string} id
 * @property {string} name
 * @property {string} models        the line under the name
 * @property {string} via           which adapter in llmProviders.js carries it
 * @property {string} [baseUrl]     pre-filled for OpenAI-compatible servers
 * @property {string} [icon]        a ForgeIcon name
 * @property {string} [initials]    a letter tile, where the frame had no glyph
 * @property {true|null} browserOk
 * @property {string} keysUrl       where to get a key
 */

/** @type {DirectoryEntry[]} */
export const PROVIDER_DIRECTORY = [
  {
    id: 'anthropic', name: 'Anthropic Claude', models: fromCatalogue('anthropic', 4),
    via: 'anthropic', icon: 'brain', browserOk: true,
    keysUrl: 'https://console.anthropic.com/settings/keys',
  },
  {
    id: 'openai', name: 'OpenAI ChatGPT', models: fromCatalogue('openai', 3),
    via: 'openai', initials: 'GPT', browserOk: true,
    keysUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'gemini', name: 'Google Gemini', models: fromCatalogue('gemini', 3),
    via: 'gemini', initials: 'G', browserOk: true,
    keysUrl: 'https://aistudio.google.com/apikey',
  },
  {
    id: 'openrouter', name: 'OpenRouter', models: 'One key for many models, e.g. Claude, GPT, Gemini, Llama',
    via: 'custom', baseUrl: 'https://openrouter.ai/api/v1', icon: 'shuffle', browserOk: true,
    keysUrl: 'https://openrouter.ai/keys',
  },
  {
    id: 'xai', name: 'xAI', models: 'e.g. Grok 4.6 · Grok 4.5',
    via: 'custom', baseUrl: 'https://api.x.ai/v1', icon: 'arrowUpRight', browserOk: null,
    keysUrl: 'https://console.x.ai',
  },
  {
    id: 'deepseek', name: 'DeepSeek', models: 'e.g. DeepSeek V4 Flash · DeepSeek V4 Pro',
    via: 'custom', baseUrl: 'https://api.deepseek.com/v1', icon: 'zap', browserOk: null,
    keysUrl: 'https://platform.deepseek.com/api_keys',
  },
  {
    id: 'moonshot', name: 'Moonshot AI', models: 'e.g. Kimi K2.5 · Kimi K2.6 · Kimi K2.7 Code',
    via: 'custom', baseUrl: 'https://api.moonshot.ai/v1', icon: 'moon', browserOk: null,
    keysUrl: 'https://platform.moonshot.ai/console/api-keys',
  },
  {
    id: 'together', name: 'Together AI', models: 'e.g. MiniMax M3 · Qwen3 235B · Qwen3.5 397B',
    via: 'custom', baseUrl: 'https://api.together.xyz/v1', icon: 'users', browserOk: null,
    keysUrl: 'https://api.together.ai/settings/api-keys',
  },
  {
    id: 'fireworks', name: 'Fireworks AI', models: 'e.g. DeepSeek V4 Pro · GLM 5.2 · Qwen3',
    via: 'custom', baseUrl: 'https://api.fireworks.ai/inference/v1', icon: 'sparkles', browserOk: null,
    keysUrl: 'https://fireworks.ai/account/api-keys',
  },
  {
    id: 'zai', name: 'Z.AI', models: 'e.g. GLM 5.2',
    via: 'custom', baseUrl: 'https://api.z.ai/api/paas/v4', initials: 'Z', browserOk: null,
    keysUrl: 'https://z.ai/manage-apikey/apikey-list',
  },
];

/** The frame's last row: any other OpenAI-compatible server, including one on your own machine. */
export const CUSTOM_ENTRY = Object.freeze({
  id: 'custom', name: 'Add custom provider',
  models: 'Any OpenAI-compatible server — Groq, Ollama, vLLM, something of your own',
  via: 'custom', baseUrl: '', icon: 'plus', browserOk: null, keysUrl: '',
});

export const ALL_ENTRIES = [...PROVIDER_DIRECTORY, CUSTOM_ENTRY];

export const entryById = (entryId) => ALL_ENTRIES.find(e => e.id === entryId) || null;

const sameEndpoint = (a, b) =>
  String(a || '').replace(/\/+$/, '').toLowerCase() === String(b || '').replace(/\/+$/, '').toLowerCase();

/** The presets' endpoints, so a hand-typed base URL that matches one is credited to that row. */
const PRESET_URLS = PROVIDER_DIRECTORY.filter(e => e.baseUrl).map(e => e.baseUrl);

/**
 * Which rows this person already has a key for.
 *
 * A saved key names its provider and, for OpenAI-compatible servers, its base URL — so a
 * preset is connected only when a key points at that preset's endpoint. A key for some other
 * endpoint belongs to the custom row instead, and neither row claims the other's.
 *
 * A session-held key has no base URL recorded against it, only a provider, so it can mark the
 * three native rows and not the presets. Overstating that would put "Connected" on a row whose
 * key might be pointing somewhere else entirely.
 *
 * @param {{provider: string, baseUrl?: string}[]} keys   every saved key for this person
 * @param {Set<string>} sessionProviders                  providers holding a tab-only key
 * @returns {Set<string>} entry ids
 */
export function connectedEntryIds(keys, sessionProviders) {
  const out = new Set();
  const held = sessionProviders || new Set();
  for (const e of PROVIDER_DIRECTORY) {
    if (e.via !== 'custom') {
      if (keys.some(k => k.provider === e.via) || held.has(e.via)) out.add(e.id);
    } else if (keys.some(k => k.provider === 'custom' && sameEndpoint(k.baseUrl, e.baseUrl))) {
      out.add(e.id);
    }
  }
  if (keys.some(k => k.provider === 'custom' && k.baseUrl && !PRESET_URLS.some(u => sameEndpoint(u, k.baseUrl)))) {
    out.add('custom');
  }
  return out;
}
