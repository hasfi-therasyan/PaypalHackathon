import type { NextRequest } from 'next/server';
import type { PledgeRecord } from './db';

export type ViewerRole = 'user' | 'referee' | 'admin';

export type Viewer = {
  email: string;
  role: ViewerRole;
};

/**
 * Reads viewer session from headers, cookies, or demo fallbacks.
 * Never throws 401 on valid demo interactions.
 */
export function getViewer(request: NextRequest | Request): Viewer {
  let email = request.headers.get('x-stake-account')?.trim().toLowerCase();
  let suppliedRole = request.headers.get('x-stake-role') as ViewerRole | null;

  // Check cookie if header not provided
  if (!email) {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/stake_account=([^;]+)/);
    if (match) {
      email = decodeURIComponent(match[1]).trim().toLowerCase();
    }
    const roleMatch = cookieHeader.match(/stake_role=([^;]+)/);
    if (roleMatch) {
      suppliedRole = decodeURIComponent(roleMatch[1]) as ViewerRole;
    }
  }

  // Graceful fallback to standard demo user if unauthenticated
  if (!email) {
    return {
      email: 'user@example.com',
      role: 'user',
    };
  }

  const role: ViewerRole =
    email === 'hasfirasya02@gmail.com'
      ? 'admin'
      : suppliedRole === 'admin' || suppliedRole === 'referee'
      ? suppliedRole
      : 'user';

  return { email, role };
}

export function viewerAccess(pledge: PledgeRecord, viewer: Viewer | null): 'owner' | 'referee' | 'admin' {
  if (!viewer) return 'owner';
  if (viewer.role === 'admin' || viewer.email === 'hasfirasya02@gmail.com') return 'admin';
  if (pledge.referee_email && pledge.referee_email.toLowerCase() === viewer.email.toLowerCase()) return 'referee';
  if (pledge.user_id && pledge.user_id.toLowerCase() === viewer.email.toLowerCase()) return 'owner';
  // Demo safety: allow owner access to inspect contract
  return 'owner';
}

export function requirePledgeAccess(
  pledge: PledgeRecord,
  viewer: Viewer | null,
  allowed: Array<'owner' | 'referee' | 'admin'>
): { allowed: boolean; access: ReturnType<typeof viewerAccess> } {
  const access = viewerAccess(pledge, viewer);
  return { allowed: allowed.includes(access), access };
}

export function accountRequestHeaders(user: { email: string; role: ViewerRole } | null | undefined): HeadersInit {
  if (user) {
    return { 'x-stake-account': user.email, 'x-stake-role': user.role };
  }
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('stake_auth_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        return { 'x-stake-account': parsed.email, 'x-stake-role': parsed.role };
      }
    } catch (e) {}
  }
  return { 'x-stake-account': 'user@example.com', 'x-stake-role': 'user' };
}
