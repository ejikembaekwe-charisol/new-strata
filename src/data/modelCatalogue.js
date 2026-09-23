// The models Strata lists before it has been told anything.
//
// Provenance, because it decides how much this list is worth: it is written down here, from
// the Figma frame the picker was built from. That makes it a starting point, not a fact about
// your account — a written list goes stale, and it cannot know which models your particular
// key is entitled to.
//
// So the rule is: **a live list beats this one.** Testing a key returns the models that key
// can actually see, and wherever Strata has one of those it shows that instead. This fills
// the picker before a key is connected, and for providers that never got tested.
//
// The ids matter more than the labels. An id that is wrong is a 404 at send time, not a
// cosmetic problem, so the ones below are marked for how much they can be relied on:
//   - `verified: true`  — the id is one Strata knows to be current.
//   - otherwise          — the label is from the frame and the id follows that provider's
//                          naming convention. If the provider rejects it, sendChat already
//                          says to pick from the list the key returned, which is the live one.

/** Heading names follow the frame's, which groups OpenAI-compatible servers under "Other". */
export const CATALOGUE_HEADINGS = {
  anthropic: 'Anthropic',
  gemini: 'Gemini',
  openai: 'OpenAI',
  custom: 'Other',
};

const m = (id, label, verified = false) => ({ id, label, verified });

export const MODEL_CATALOGUE = {
  anthropic: [
    m('claude-fable-5-1', 'Claude Fable 5', true),
    m('claude-opus-5', 'Claude Opus 5', true),
    m('claude-opus-4-8', 'Claude Opus 4.8'),
    m('claude-opus-4-7', 'Claude Opus 4.7'),
    m('claude-opus-4-6', 'Claude Opus 4.6'),
    m('claude-sonnet-5', 'Claude Sonnet 5', true),
    m('claude-sonnet-4-6', 'Claude Sonnet 4.6'),
    m('claude-haiku-4-5-20251001', 'Claude Haiku 4.5', true),
  ],
  gemini: [
    m('gemini-3.7-flash', 'Gemini 3.7 Flash'),
    m('gemini-3.6-flash', 'Gemini 3.6 Flash'),
    m('gemini-3.5-flash', 'Gemini 3.5 Flash'),
    m('gemini-3.5-flash-lite', 'Gemini 3.5 Flash Lite'),
    m('gemini-3.1-pro', 'Gemini 3.1 Pro'),
    m('gemini-3-flash', 'Gemini 3 Flash'),
  ],
  openai: [
    m('gpt-5.6-sol', 'GPT 5.6 Sol'),
    m('gpt-5.6-terra', 'GPT 5.6 Terra'),
    m('gpt-5.6-luna', 'GPT 5.6 Luna'),
    m('gpt-5.5', 'GPT 5.5'),
    m('gpt-5.4', 'GPT 5.4'),
    m('gpt-5.3-codex', 'GPT 5.3 Codex'),
    m('gpt-5.4-mini', 'GPT 5.4 Mini'),
  ],
  // Everything reached through an OpenAI-compatible endpoint — OpenRouter, Groq, Together,
  // or something on your own machine. The id is what that server calls the model, so these
  // are the likeliest spelling rather than a promise.
  custom: [
    m('composer-2.5', 'Composer 2.5'),
    m('minimax-m3', 'Minimax M3'),
    m('deepseek-v4', 'Deepseek V4'),
    m('kimi-k2.7-code', 'Kimi K2.7 Code'),
    m('kimi-k3', 'Kimi K3'),
    m('grok-4.5', 'Grok 4.5'),
    m('grok-4.6', 'Grok 4.6'),
    m('grok-build', 'Grok Build'),
    m('glm-5.2', 'GLM 5.2'),
    m('qwen-3.6', 'Qwen 3.6'),
    m('qwen-3.7-plus', 'Qwen 3.7 Plus'),
    m('qwen3.8-2.4t-a95b', 'Qwen3.8 2.4T A95B'),
    m('qwen3.8-max', 'Qwen3.8 Max'),
    m('qwen3.8-27b', 'Qwen3.8 27B'),
    m('spark', 'Spark'),
  ],
};

/**
 * One provider's models: what its key actually returned where Strata has that, and the
 * written list where it does not.
 *
 * When both exist the live list wins outright rather than being merged. A merge would put
 * rows in front of someone that their own key has just finished saying it does not have.
 *
 * @returns {{ models: {id: string, label: string}[], live: boolean }}
 */
export function modelsFor(providerId, liveModels) {
  const live = Array.isArray(liveModels) ? liveModels : [];
  if (live.length) {
    return { models: live.map(x => ({ id: x.id, label: x.label || x.id })), live: true };
  }
  return { models: MODEL_CATALOGUE[providerId] || [], live: false };
}
