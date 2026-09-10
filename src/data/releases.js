// Published releases: what one is, how many we keep, and how much room they take.
//
// A release is a snapshot of the design system plus who cut it and why. The snapshot is
// exactly the shape `designSnapshot()` produces in ProjectDetail — tokens, components,
// brandData, uploadedAssets — so `applyDesignSnapshot` can restore one with no adapter
// between them. Keeping those two shapes identical is the whole reason rollback is four
// lines rather than a migration.
//
// Storage is the constraint that shapes everything here. localStorage holds a few megabytes
// for every project a person owns, and a component built from an uploaded screenshot carries
// its crop as a base64 data URL (see cropImageRegionToDataUrl), so a components array is not
// always small. Metadata for every release is cheap and worth keeping forever; payloads are
// not, so only the most recent few keep theirs.

export const RELEASE_LIMIT = 50;
export const PAYLOAD_KEEP = 10;

/** A stored project read into the snapshot shape, for a project that is not the open one. */
export const snapshotOf = (project) => ({
  tokens: (project && project.tokens) || {},
  components: (project && project.components) || [],
  brandData: (project && project.brand) || {},
  uploadedAssets: (project && project.uploadedAssets) || [],
});

const countTokens = (store) =>
  Object.values(store || {}).reduce((n, list) => n + ((list && list.length) || 0), 0);

/** The person a release is attributed to. Falls back the way the team list does. */
export const releaseAuthor = (user) => ({
  name: (user && user.name) || '',
  email: (user && user.email) || '',
  initials: (user && user.initials) || '',
});

/** How an author reads on a release row: their name, or their email, or an honest blank. */
export const authorLabel = (author) => {
  if (!author) return '';
  return author.name || author.email || '';
};

let seq = 0;

/**
 * A new release record.
 *
 * `number` comes from the caller rather than the list length, because a release is never
 * renumbered and the list is trimmed — length would start repeating numbers as soon as the
 * fifty-first release pushed the first one off.
 */
export const buildRelease = ({ snapshot, name, notes, author, branchName, number }) => {
  seq += 1;
  return {
    id: 'rel-' + Date.now() + '-' + seq,
    number,
    name: String(name || '').trim(),
    notes: String(notes || '').trim(),
    author,
    branchName: branchName || 'main',
    publishedAt: new Date().toISOString(),
    counts: {
      tokens: countTokens(snapshot && snapshot.tokens),
      components: ((snapshot && snapshot.components) || []).length,
    },
    payload: {
      tokens: (snapshot && snapshot.tokens) || {},
      components: (snapshot && snapshot.components) || [],
      brandData: (snapshot && snapshot.brandData) || {},
      uploadedAssets: (snapshot && snapshot.uploadedAssets) || [],
    },
  };
};

/** The next release number for a project, counting up and never reusing. */
export const nextReleaseNumber = (releases) =>
  (releases || []).reduce((max, r) => Math.max(max, Number(r.number) || 0), 0) + 1;

/**
 * Trims a release list to fit: the newest `RELEASE_LIMIT` records survive, and only the
 * newest `PAYLOAD_KEEP` of those keep their snapshot.
 *
 * The live release always keeps its payload whatever its age, because it is the one
 * `/explore` serves — dropping it would take the public view down.
 *
 * A record whose payload has gone keeps its name, notes, author, date and counts, so the
 * history stays readable. `payload: null` is what the UI reads to disable Restore and say
 * why, rather than offering a button that cannot work.
 */
export const pruneReleases = (releases, liveId) => {
  const kept = (releases || []).slice(0, RELEASE_LIMIT);
  return kept.map((r, i) => {
    if (i < PAYLOAD_KEEP || r.id === liveId || !r.payload) return r;
    return { ...r, payload: null };
  });
};

export const releasesOf = (project) =>
  (project && Array.isArray(project.releases)) ? project.releases : [];

/** The release currently being served, or null when nothing has been published. */
export const liveReleaseOf = (project) => {
  const id = project && project.liveReleaseId;
  if (!id) return null;
  return releasesOf(project).find(r => r.id === id) || null;
};

/**
 * How much room the stored projects are taking.
 *
 * Reported in characters, because characters are what we can actually count — the bytes a
 * browser charges for depend on how it encodes the string. The 5M figure is the common
 * limit, not a promise, and it is labelled that way wherever it is shown.
 */
export const storageUsage = (projects) => {
  let chars;
  try {
    chars = JSON.stringify(projects || []).length;
  } catch {
    // A structure that will not serialise cannot be measured, and guessing a number would
    // be worse than showing none.
    return null;
  }
  const typicalLimit = 5 * 1024 * 1024;
  return { chars, typicalLimit, percent: Math.min(100, Math.round((chars / typicalLimit) * 100)) };
};

/** "1.3M of about 5M" — for the storage line, in the units it was measured in. */
export const formatChars = (n) => {
  if (n >= 1024 * 1024) return (n / (1024 * 1024)).toFixed(2) + 'M';
  if (n >= 1024) return Math.round(n / 1024) + 'K';
  return String(n);
};

/**
 * A short, absolute date — "22 Jun 2026, 4:26 pm".
 *
 * The app had no formatter that produced a date and a time together; the only one it has is
 * `relativeTime`, which is right for a row you read at a glance and wrong for a release,
 * where "which one was that" needs an actual date. Both are shown: relative first, absolute
 * on hover.
 */
export const formatStamp = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString([], {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
};
