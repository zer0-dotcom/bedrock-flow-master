/**
 * BEDROCK ESG — Role-Based Access Control (v2.4)
 *
 * Canonical role hierarchy:
 *   FOUNDER       → Full system access (sovereign override)
 *   ADMIN         → Full platform access except founder-only settings
 *   SOVEREIGN_AGENT → Field verification, submission approval
 *   CLIENT_OWNER  → Submit assets, view own submissions only
 *
 * Legacy roles (AGENT, FARMER, REALTOR, BUSINESS_OWNER, SOVEREIGN_INDIVIDUAL)
 * are mapped to the nearest v2.4 equivalent for permission checks.
 */

export type V24Role = 'FOUNDER' | 'ADMIN' | 'SOVEREIGN_AGENT' | 'CLIENT_OWNER';

// All DB UserRole values
export type AnyUserRole =
  | 'FOUNDER' | 'ADMIN' | 'SOVEREIGN_AGENT' | 'CLIENT_OWNER'
  | 'AGENT' | 'FARMER' | 'REALTOR' | 'BUSINESS_OWNER' | 'SOVEREIGN_INDIVIDUAL';

/**
 * Map any existing DB role to the v2.4 tier for permission evaluation.
 * Legacy roles fall to the closest safe tier.
 */
export function resolveRole(dbRole: string): V24Role {
  switch (dbRole) {
    case 'FOUNDER': return 'FOUNDER';
    case 'ADMIN': return 'ADMIN';
    case 'SOVEREIGN_AGENT':
    case 'AGENT': return 'SOVEREIGN_AGENT';
    case 'CLIENT_OWNER':
    case 'FARMER':
    case 'REALTOR':
    case 'BUSINESS_OWNER':
    case 'SOVEREIGN_INDIVIDUAL':
    default: return 'CLIENT_OWNER';
  }
}

// ─── Permission Definitions ─────────────────────────────────────────────────

export type Permission =
  | 'system:full'              // Founder-only
  | 'platform:manage'          // Admin+
  | 'submissions:approve'      // Sovereign Agent+
  | 'submissions:verify'       // Sovereign Agent+
  | 'submissions:create'       // Client Owner+
  | 'submissions:view_own'     // Client Owner+
  | 'submissions:view_all'     // Admin+
  | 'settlements:execute'      // Admin+
  | 'settlements:view'         // Sovereign Agent+
  | 'audit_logs:view'          // Admin+
  | 'audit_logs:export'        // Founder only
  | 'roles:manage'             // Founder only
  | 'discovery:manage'         // Admin+
  | 'discovery:view'           // Sovereign Agent+
  | 'users:manage'             // Admin+
  | 'telemetry:ingest'         // Sovereign Agent+
  | 'telemetry:view'           // Client Owner+
  | 'notary:anchor'            // Admin+
  | 'founder:settings';        // Founder only

const ROLE_PERMISSIONS: Record<V24Role, Permission[]> = {
  FOUNDER: [
    'system:full', 'platform:manage',
    'submissions:approve', 'submissions:verify', 'submissions:create',
    'submissions:view_own', 'submissions:view_all',
    'settlements:execute', 'settlements:view',
    'audit_logs:view', 'audit_logs:export',
    'roles:manage', 'discovery:manage', 'discovery:view',
    'users:manage', 'telemetry:ingest', 'telemetry:view',
    'notary:anchor', 'founder:settings',
  ],
  ADMIN: [
    'platform:manage',
    'submissions:approve', 'submissions:verify', 'submissions:create',
    'submissions:view_own', 'submissions:view_all',
    'settlements:execute', 'settlements:view',
    'audit_logs:view',
    'discovery:manage', 'discovery:view',
    'users:manage', 'telemetry:ingest', 'telemetry:view',
    'notary:anchor',
  ],
  SOVEREIGN_AGENT: [
    'submissions:approve', 'submissions:verify', 'submissions:create',
    'submissions:view_own', 'submissions:view_all',
    'settlements:view',
    'discovery:view',
    'telemetry:ingest', 'telemetry:view',
  ],
  CLIENT_OWNER: [
    'submissions:create',
    'submissions:view_own',
    'telemetry:view',
  ],
};

// ─── Permission Checks ──────────────────────────────────────────────────────

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(dbRole: string, permission: Permission): boolean {
  const resolved = resolveRole(dbRole);
  return ROLE_PERMISSIONS[resolved].includes(permission);
}

/**
 * Check if a role has ALL of the specified permissions.
 */
export function hasAllPermissions(dbRole: string, permissions: Permission[]): boolean {
  const resolved = resolveRole(dbRole);
  const rolePerms = ROLE_PERMISSIONS[resolved];
  return permissions.every((p) => rolePerms.includes(p));
}

/**
 * Check if a role has ANY of the specified permissions.
 */
export function hasAnyPermission(dbRole: string, permissions: Permission[]): boolean {
  const resolved = resolveRole(dbRole);
  const rolePerms = ROLE_PERMISSIONS[resolved];
  return permissions.some((p) => rolePerms.includes(p));
}

/**
 * Get all permissions for a role.
 */
export function getPermissions(dbRole: string): Permission[] {
  return ROLE_PERMISSIONS[resolveRole(dbRole)];
}

/**
 * Role hierarchy level (higher = more powerful).
 */
export function roleLevel(dbRole: string): number {
  switch (resolveRole(dbRole)) {
    case 'FOUNDER': return 100;
    case 'ADMIN': return 75;
    case 'SOVEREIGN_AGENT': return 50;
    case 'CLIENT_OWNER': return 25;
    default: return 0;
  }
}

/**
 * Check if actor can modify target’s role (can’t elevate above own level).
 */
export function canModifyRole(actorRole: string, targetCurrentRole: string, targetNewRole: string): boolean {
  const actorLvl = roleLevel(actorRole);
  const targetLvl = roleLevel(targetCurrentRole);
  const newLvl = roleLevel(targetNewRole);
  // Must be higher than both current and new role
  return actorLvl > targetLvl && actorLvl > newLvl;
}
