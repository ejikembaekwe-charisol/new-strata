// Strata Project Roles & Permissions
//
// Pure role-based access control: User -> Project Role -> Permissions.
// There is no backend, so "members"/"roles" are a local simulation stored
// directly on the project object (see ProjectContext.addProject).

export const ROLES = ['Owner', 'Admin', 'Designer', 'Developer', 'Brand Editor', 'Viewer'];

// Areas map onto Strata's actual tabs:
//   brandBible        -> Brand Bible tab (Visual Identity + Manifesto & Voice)
//   assets            -> Brand Bible tab > Brand Assets & Documents sub-tab
//   tokens            -> Tokens tab
//   components        -> Components tab
//   collaboration     -> Collaboration tab
//   projectManagement -> Settings tab
//   releases          -> Branch & Publish tab, plus the visibility controls in
//                        Handoff > Publish & Sync and in Settings
const PERMISSIONS = {
  Owner: {
    brandBible: ['view', 'create', 'edit', 'delete'],
    assets: ['view', 'download', 'upload', 'edit', 'delete'],
    tokens: ['view', 'create', 'edit', 'delete'],
    components: ['view', 'create', 'edit', 'delete'],
    collaboration: ['manageMembers', 'inviteMembers', 'removeMembers', 'assignRoles', 'assignOwner'],
    projectManagement: ['updateSettings', 'deleteProject', 'transferOwnership'],
    releases: ['publish', 'restore', 'setLive', 'branch', 'merge', 'deleteBranch', 'setVisibility'],
  },
  Admin: {
    brandBible: ['view', 'create', 'edit', 'delete'],
    assets: ['view', 'download', 'upload', 'edit', 'delete'],
    tokens: ['view', 'create', 'edit', 'delete'],
    components: ['view', 'create', 'edit', 'delete'],
    collaboration: ['inviteMembers', 'removeMembers', 'assignRoles'],
    projectManagement: ['updateSettings'],
    releases: ['publish', 'restore', 'setLive', 'branch', 'merge', 'deleteBranch', 'setVisibility'],
  },
  Designer: {
    brandBible: ['view', 'edit'],
    assets: ['view', 'download', 'upload', 'edit'],
    tokens: ['view', 'create', 'edit', 'delete'],
    components: ['view', 'create', 'edit', 'delete'],
    collaboration: [],
    projectManagement: [],
    releases: ['publish', 'restore', 'setLive', 'branch', 'merge'],
  },
  Developer: {
    brandBible: ['view'],
    assets: ['view', 'download'],
    tokens: ['view', 'export'],
    components: ['view', 'inspect'],
    collaboration: [],
    projectManagement: [],
    releases: [],
  },
  'Brand Editor': {
    brandBible: ['view', 'create', 'edit', 'delete'],
    assets: ['view', 'download', 'upload', 'edit', 'delete'],
    tokens: ['view'],
    components: ['view'],
    collaboration: [],
    projectManagement: [],
    releases: [],
  },
  Viewer: {
    brandBible: ['view'],
    assets: ['view', 'download'],
    tokens: ['view'],
    components: ['view'],
    collaboration: [],
    projectManagement: [],
    releases: [],
  },
};

// Which tabs a role gets to see at all. Everything not listed here is
// universally visible (Brand Bible, Tokens, Components, Handoff) per the
// "everyone can view the complete design system" principle — only the two
// administrative tabs are hidden from roles with no permissions in them.
export function canViewTab(role, tabId) {
  if (tabId === 'settings') {
    return can(role, 'projectManagement', 'updateSettings');
  }
  if (tabId === 'collaboration') {
    const perms = PERMISSIONS[role]?.collaboration || [];
    return perms.length > 0;
  }
  return true;
}

export function can(role, area, action) {
  return PERMISSIONS[role]?.[area]?.includes(action) ?? false;
}

export function isOwner(role) {
  return role === 'Owner';
}

/**
 * A member entry whose email is this marker stands for whoever is using this device,
 * rather than a named person.
 *
 * The demo project ships with one. It is seeded at app boot, before anyone has logged in,
 * so there is no real identity to write down — and without this its teammate list would
 * make the person opening it a stranger to their own worked example, resolving to Viewer
 * and locking them out of editing it.
 */
export const LOCAL_OWNER_EMAIL = '__local__';

// Resolve the current user's role for a given project. Falls back to Owner
// when no team has been set up yet (members: []) so every existing/new
// project remains fully usable by its creator with zero migration.
export function resolveMyRole(project, user) {
  if (!project || !user) return 'Viewer';
  const members = project.members || [];
  const match = members.find(
    (m) => m.email && user.email && m.email.toLowerCase() === user.email.toLowerCase()
  );
  if (match) return match.role;
  // Only projects carrying the marker are affected; a real invited project still resolves
  // to Viewer for someone who is not on its list.
  const localOwner = members.find((m) => m.email === LOCAL_OWNER_EMAIL);
  if (localOwner) return localOwner.role;
  if (members.length === 0) return 'Owner';
  return 'Viewer';
}

// ── Describing a role in the UI ──────────────────────────────────────────────
//
// Derived from PERMISSIONS above rather than written out separately, so what the
// invite dialog promises cannot drift from what `can()` actually enforces.

export const PERMISSION_AREAS = [
  { key: 'brandBible', label: 'Brand Bible' },
  { key: 'assets', label: 'Brand assets' },
  { key: 'tokens', label: 'Tokens' },
  { key: 'components', label: 'Components' },
  { key: 'collaboration', label: 'Team' },
  { key: 'projectManagement', label: 'Project settings' },
  { key: 'releases', label: 'Releases & branches' },
];

/** Collapses one area's action list into a single word for display. */
export function accessLevel(role, area) {
  const perms = PERMISSIONS[role]?.[area] || [];
  if (perms.length === 0) return 'No access';

  if (area === 'collaboration') {
    if (perms.includes('assignOwner')) return 'Full control';
    if (perms.includes('assignRoles')) return 'Manage members';
    return 'Invite only';
  }
  if (area === 'projectManagement') {
    if (perms.includes('deleteProject')) return 'Full control';
    if (perms.includes('updateSettings')) return 'Edit settings';
    return 'No access';
  }
  if (area === 'releases') {
    if (perms.includes('setVisibility')) return 'Full control';
    if (perms.includes('merge')) return 'Publish & branch';
    if (perms.includes('publish')) return 'Publish';
    return 'No access';
  }
  if (perms.includes('delete')) return 'Full edit';
  if (perms.includes('edit')) return 'Edit';
  if (perms.includes('upload')) return 'Upload';
  // Developer differs from Viewer only by export/inspect, so name those rather than
  // collapsing both to "View only" and implying the two roles are equivalent.
  if (perms.includes('export')) return 'View & export';
  if (perms.includes('inspect')) return 'View & inspect';
  if (perms.includes('download')) return 'View & download';
  return 'View only';
}

/** @returns {Array<{ key: string, label: string, level: string }>} */
export function describeRole(role) {
  return PERMISSION_AREAS.map(a => ({ ...a, level: accessLevel(role, a.key) }));
}

/** A one-line gist, also derived: the widest thing the role can actually do. */
export function roleSummary(role) {
  if (!PERMISSIONS[role]) return '';
  const canManageTeam = (PERMISSIONS[role].collaboration || []).length > 0;
  const editAreas = ['brandBible', 'tokens', 'components', 'assets']
    .filter(a => can(role, a, 'edit'));
  if (editAreas.length === 0) {
    const extras = [];
    if (can(role, 'tokens', 'export')) extras.push('export tokens');
    if (can(role, 'components', 'inspect')) extras.push('inspect components');
    const tail = extras.length ? ' Can also ' + extras.join(' and ') + '.' : '';
    if (canManageTeam) return 'Read-only on the system, can manage the team.' + tail;
    return 'Can view everything but change nothing.' + tail;
  }
  const names = { brandBible: 'the Brand Bible', tokens: 'tokens', components: 'components', assets: 'assets' };
  const list = editAreas.map(a => names[a]);
  const joined = list.length > 1 ? list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1] : list[0];
  return 'Can edit ' + joined + (canManageTeam ? ', and manage the team.' : '.');
}
