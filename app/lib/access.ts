import type { NextRequest } from 'next/server';
import type { PledgeRecord } from './db';

export type ViewerRole = 'user' | 'referee' | 'admin';

export type Viewer = {
  email: string;
  role: ViewerRole;
};

/**
 * The current demo authentication is browser-session based.  Every API call
 * carries that session identity explicitly so records can be scoped on the
 * server instead of filtering a global list after it reaches the browser.
 */
export function getViewer(request: NextRequest | Request): Viewer | null {
  const email = request.headers.get('x-stake-account')?.trim().toLowerCase();
  const suppliedRole = request.headers.get('x-stake-role');
  if (!email) return null;
  return {
    email,
    role: suppliedRole === 'admin' || suppliedRole === 'referee' ? suppliedRole : 'user',
  };
}

export function viewerAccess(pledge: PledgeRecord, viewer: Viewer | null): 'owner' | 'referee' | 'admin' | null {
  if (!viewer) return null;
  if (viewer.role === 'admin') return 'admin';
  if (pledge.user_id.toLowerCase() === viewer.email) return 'owner';
  if (pledge.referee_email.toLowerCase() === viewer.email) return 'referee';
  return null;
}

export function requirePledgeAccess(
  pledge: PledgeRecord,
  viewer: Viewer | null,
  allowed: Array<'owner' | 'referee' | 'admin'>
): { allowed: boolean; access: ReturnType<typeof viewerAccess> } {
  const access = viewerAccess(pledge, viewer);
  return { allowed: access !== null && allowed.includes(access), access };
}

export function accountRequestHeaders(user: { email: string; role: ViewerRole } | null | undefined): HeadersInit {
  return user
    ? { 'x-stake-account': user.email, 'x-stake-role': user.role }
    : {};
}
