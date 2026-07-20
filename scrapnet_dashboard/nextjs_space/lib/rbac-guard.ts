/**
 * RBAC API Guard — wraps Next.js API route handlers with permission checks.
 * Uses the custom JWT auth pattern (auth-token cookie / Bearer header).
 *
 * Usage:
 *   import { withRbac } from '@/lib/rbac-guard';
 *   export const POST = withRbac('submissions:create', async (req, user) => { ... });
 */

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { hasAnyPermission, Permission } from '@/lib/rbac';

const JWT_SECRET = process.env.JWT_SECRET || 'bedrockEsg-secret-key-change-in-production';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

/**
 * Extract and verify the JWT from cookie or Authorization header.
 */
export function extractUser(req: NextRequest): AuthUser | null {
  const token =
    req.cookies.get('auth-token')?.value ||
    req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as Record<string, unknown>;
    return {
      id: (decoded.userId || decoded.id || decoded.sub) as string,
      email: (decoded.email || '') as string,
      name: (decoded.name || '') as string,
      role: (decoded.role || 'CLIENT_OWNER') as string,
    };
  } catch {
    return null;
  }
}

/**
 * Wrap a route handler with RBAC permission check.
 * Accepts a single permission or an array (any match = allowed).
 */
export function withRbac(
  requiredPermission: Permission | Permission[],
  handler: (req: NextRequest, user: AuthUser) => Promise<Response>
) {
  return async (req: NextRequest) => {
    try {
      const user = extractUser(req);
      if (!user) {
        return NextResponse.json(
          { error: 'UNAUTHORIZED', message: 'Authentication required' },
          { status: 401 }
        );
      }

      const perms = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
      const allowed = hasAnyPermission(user.role, perms);

      if (!allowed) {
        return NextResponse.json(
          {
            error: 'FORBIDDEN',
            message: `Insufficient permissions. Required: ${perms.join(' | ')}`,
            role: user.role,
          },
          { status: 403 }
        );
      }

      return handler(req, user);
    } catch (error) {
      console.error('[RBAC Guard] Error:', error);
      return NextResponse.json(
        { error: 'INTERNAL_ERROR', message: 'Permission check failed' },
        { status: 500 }
      );
    }
  };
}
