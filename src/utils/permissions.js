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
const PERMISSIONS = {
  Owner: {
    brandBible: ['view', 'create', 'edit', 'delete'],
    assets: ['view', 'download', 'upload', 'edit', 'delete'],
    tokens: ['view', 'create', 'edit', 'delete'],
    components: ['view', 'create', 'edit', 'delete'],
    collaboration: ['manageMembers', 'inviteMembers', 'removeMembers', 'assignRoles', 'assignOwner'],
    projectManagement: ['updateSettings', 'deleteProject', 'transferOwnership'],
  },
  Admin: {
    brandBible: ['view', 'create', 'edit', 'delete'],
    assets: ['view', 'download', 'upload', 'edit', 'delete'],
    tokens: ['view', 'create', 'edit', 'delete'],
    components: ['view', 'create', 'edit', 'delete'],
    collaboration: ['inviteMembers', 'removeMembers', 'assignRoles'],
    projectManagement: ['updateSettings'],
  },
  Designer: {
    brandBible: ['view', 'edit'],
    assets: ['view', 'download', 'upload', 'edit'],
    tokens: ['view', 'create', 'edit', 'delete'],
    components: ['view', 'create', 'edit', 'delete'],
    collaboration: [],
    projectManagement: [],
  },
  Developer: {
    brandBible: ['view'],
    assets: ['view', 'download'],
    tokens: ['view', 'export'],
    components: ['view', 'inspect'],
    collaboration: [],
    projectManagement: [],
  },
  'Brand Editor': {
    brandBible: ['view', 'create', 'edit', 'delete'],
    assets: ['view', 'download', 'upload', 'edit', 'delete'],
    tokens: ['view'],
    components: ['view'],
    collaboration: [],
    projectManagement: [],
  },
  Viewer: {
    brandBible: ['view'],
    assets: ['view', 'download'],
    tokens: ['view'],
    components: ['view'],
    collaboration: [],
    projectManagement: [],
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
  if (members.length === 0) return 'Owner';
  return 'Viewer';
}
