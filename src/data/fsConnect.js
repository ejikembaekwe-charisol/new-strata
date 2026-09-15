// Connecting a design system to a codebase, without a backend.
//
// The honest version of "connect": the developer picks a folder in their own repo and Strata
// writes real files into it, then rewrites them on demand. No server, no API key, no polling —
// the browser's own File System Access API does the whole job.
//
// What this is NOT: live sync. Nothing here watches, pushes or reconnects by itself. A write
// happens when someone asks for one, and the UI says when the last one was.
//
// The directory handle is kept in IndexedDB rather than localStorage because a
// FileSystemDirectoryHandle is structured-cloneable but not serialisable to a string. It
// survives a reload, but the browser deliberately does not carry the *permission* across
// sessions: `queryPermission` returns 'prompt' and the next write has to ask again. That
// distinction is surfaced rather than hidden, because a panel claiming to be connected while
// the next write will throw is worse than one that says what it needs.
//
// Firefox and Safari implement none of this. `isSupported()` is false there and the caller
// offers downloads instead — a stated limitation, not a control that quietly does nothing.

const DB = 'strata-fs';
const STORE = 'handles';
const KEY = (projectId) => 'dir:' + projectId;

export const isSupported = () => typeof window !== 'undefined'
  && typeof window.showDirectoryPicker === 'function';

const openDb = () => new Promise((resolve, reject) => {
  const req = indexedDB.open(DB, 1);
  req.onupgradeneeded = () => {
    if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
  };
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

const idb = async (mode, fn) => {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const out = fn(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(out.result !== undefined ? out.result : undefined);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
};

/** The stored handle for this project, or null. Never throws — a missing DB is just null. */
export const loadHandle = async (projectId) => {
  if (!isSupported()) return null;
  try {
    return (await idb('readonly', (s) => s.get(KEY(projectId)))) || null;
  } catch {
    return null;
  }
};

const saveHandle = (projectId, handle) =>
  idb('readwrite', (s) => s.put(handle, KEY(projectId)));

export const forgetHandle = async (projectId) => {
  try { await idb('readwrite', (s) => s.delete(KEY(projectId))); } catch { /* nothing to forget */ }
};

/**
 * 'granted' | 'prompt' | 'denied' | 'unsupported'.
 *
 * `queryPermission` only reports; it never shows a dialog. That is what lets the panel say
 * "permission needed" on load without interrupting anyone.
 */
export const permissionState = async (handle) => {
  if (!handle || typeof handle.queryPermission !== 'function') return 'unsupported';
  try {
    return await handle.queryPermission({ mode: 'readwrite' });
  } catch {
    return 'denied';
  }
};

/** Asks for write permission. Must be called from a user gesture or the browser refuses. */
export const requestPermission = async (handle) => {
  if (!handle || typeof handle.requestPermission !== 'function') return 'unsupported';
  try {
    return await handle.requestPermission({ mode: 'readwrite' });
  } catch {
    return 'denied';
  }
};

/**
 * Opens the folder picker and remembers the choice.
 *
 * Returns null when the developer cancels — an AbortError is someone changing their mind, not
 * a failure, and it must not surface as an error.
 */
export const pickFolder = async (projectId) => {
  if (!isSupported()) return null;
  let handle;
  try {
    handle = await window.showDirectoryPicker({ id: 'strata-' + projectId, mode: 'readwrite' });
  } catch (e) {
    if (e && e.name === 'AbortError') return null;
    throw e;
  }
  try { await saveHandle(projectId, handle); } catch { /* usable this session regardless */ }
  return handle;
};

/**
 * Writes files into the connected folder.
 *
 * `files` is [{ name, text }]. Each result carries its own error rather than one failure
 * abandoning the rest: a folder where one file is locked should still receive the others, and
 * the panel should be able to say which one did not land.
 */
export const writeFiles = async (handle, files) => {
  const results = [];
  for (const f of files || []) {
    try {
      const fh = await handle.getFileHandle(f.name, { create: true });
      const w = await fh.createWritable();
      await w.write(f.text);
      await w.close();
      results.push({ name: f.name, bytes: new Blob([f.text]).size, ok: true });
    } catch (e) {
      results.push({ name: f.name, ok: false, error: (e && e.message) || 'could not write' });
    }
  }
  return results;
};

/** Browser download, for everyone without the folder API — and for anyone who prefers it. */
export const downloadText = (filename, text, mime = 'text/plain') => {
  const url = URL.createObjectURL(new Blob([text], { type: mime + ';charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoked, unlike the version this replaces, which leaked one object URL per download.
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

/** The MIME type for a generated filename, so a download is not labelled text/plain. */
export const mimeFor = (filename) => {
  const ext = String(filename).split('.').pop().toLowerCase();
  return { css: 'text/css', json: 'application/json', js: 'text/javascript',
    jsx: 'text/javascript', md: 'text/markdown' }[ext] || 'text/plain';
};
