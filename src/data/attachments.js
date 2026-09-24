// What can be attached to a message, and what happens to it.
//
// Two kinds, because the providers take them differently and because only one of them is safe
// to paste into a prompt:
//
//   - **text** — read as text and appended to the message inside a fenced block that names the
//     file. Nothing interprets it; it is characters in a prompt.
//   - **image** — sent as the provider's own image part, base64 in the request body. It never
//     touches the page's DOM and is never rendered by Strata as HTML.
//
// A file that is neither is refused with the reason, rather than attached as a name with no
// contents. A PDF or a .docx is the common case: reading either one needs a parser this app
// does not have, and attaching the filename alone would tell the model nothing while looking
// like it had worked.
//
// The caps are not arbitrary. Every attachment is re-sent with every subsequent message in the
// conversation, on the person's own key, and base64 inflates bytes by a third — so a casually
// attached photo is a recurring charge. 4MB per image is also just under Anthropic's own 5MB
// limit, which is the tightest of the four providers.

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_TEXT_BYTES = 256 * 1024;
export const MAX_TOTAL_BYTES = 8 * 1024 * 1024;

/** The intersection of what the four providers accept. */
export const IMAGE_TYPES = Object.freeze(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);

/** Read as text: the extension decides, because a browser reports half of these as empty. */
const TEXT_EXTENSIONS = Object.freeze([
  'txt', 'md', 'markdown', 'css', 'scss', 'json', 'jsonc', 'svg', 'html', 'htm',
  'js', 'jsx', 'ts', 'tsx', 'csv', 'yml', 'yaml', 'toml', 'xml',
]);

export const FILE_ACCEPT = IMAGE_TYPES.join(',') + ',' + TEXT_EXTENSIONS.map(e => '.' + e).join(',');

const extensionOf = (name) => String(name || '').split('.').pop().toLowerCase();

export const formatBytes = (n) => (n < 1024 ? n + ' B'
  : n < 1024 * 1024 ? (n / 1024).toFixed(1) + ' KB'
    : (n / (1024 * 1024)).toFixed(1) + ' MB');

let counter = 0;
const nextId = () => 'att-' + Date.now().toString(36) + '-' + (counter += 1);

/** base64 of an ArrayBuffer, chunked — spreading a large array into fromCharCode throws. */
const toBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
};

/**
 * Turns one picked file into an attachment.
 *
 * **Never rejects.** A refusal is a result with `ok: false` and a reason worth showing, for the
 * same reason the provider calls work that way: a catch in the UI would have to invent wording
 * for something it cannot see the shape of.
 *
 * @returns {Promise<{ok: true, attachment: object}|{ok: false, name: string, reason: string}>}
 */
export async function readAttachment(file) {
  const name = file?.name || 'file';
  const ext = extensionOf(name);
  const isImage = IMAGE_TYPES.includes(file?.type);
  const isText = TEXT_EXTENSIONS.includes(ext);

  if (!isImage && !isText) {
    const why = ext === 'pdf' || ext === 'doc' || ext === 'docx'
      ? 'Strata cannot read a ' + ext.toUpperCase() + ' in the browser, and attaching the name alone would tell the model nothing.'
      : 'Strata can attach images and text files. This is neither.';
    return { ok: false, name, reason: why };
  }
  if (isImage && file.size > MAX_IMAGE_BYTES) {
    return { ok: false, name, reason: 'Images are capped at ' + formatBytes(MAX_IMAGE_BYTES) + ' — this one is ' + formatBytes(file.size) + '.' };
  }
  if (isText && file.size > MAX_TEXT_BYTES) {
    return { ok: false, name, reason: 'Text files are capped at ' + formatBytes(MAX_TEXT_BYTES) + ' — this one is ' + formatBytes(file.size) + ', and every message would carry it again.' };
  }

  try {
    if (isImage) {
      const data = toBase64(await file.arrayBuffer());
      return { ok: true, attachment: { id: nextId(), kind: 'image', name, bytes: file.size, mediaType: file.type, data } };
    }
    const text = await file.text();
    return { ok: true, attachment: { id: nextId(), kind: 'text', name, bytes: file.size, text, language: ext } };
  } catch {
    return { ok: false, name, reason: 'The browser could not read that file.' };
  }
}

/** The page in the preview, attached as source. Not in the system prompt — it is a reply. */
export const pageAttachment = (html, label = 'the page on screen') => ({
  id: nextId(),
  kind: 'text',
  name: label,
  bytes: html.length,
  text: html,
  language: 'html',
  fromWorkspace: true,
});

export const totalBytes = (list) => list.reduce((n, a) => n + (a.bytes || 0), 0);

/**
 * The text attachments, as they are appended to the message.
 *
 * Fenced and named, so the model can tell the person's own words from a file's contents. The
 * fences are built from a variable rather than written inline: a literal triple backtick inside
 * this project's template literals has ended a build before now.
 */
export function attachmentText(list) {
  const fence = '`'.repeat(3);
  const parts = [];
  for (const a of list) {
    if (a.kind !== 'text') continue;
    parts.push('\n\n--- Attached: ' + a.name + ' ---\n' + fence + (a.language || '') + '\n' + a.text + '\n' + fence);
  }
  return parts.join('');
}

/** The image attachments, in the shape buildChatRequest expects. */
export const attachmentImages = (list) => list
  .filter(a => a.kind === 'image')
  .map(a => ({ mediaType: a.mediaType, data: a.data }));
