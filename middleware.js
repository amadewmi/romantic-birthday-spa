import { next } from '@vercel/functions';
import { isValidSession } from './lib/session.js';

const PUBLIC_PATHS = new Set(['/login.html', '/api/auth/login']);

export const config = {
  runtime: 'nodejs',
};

export default async function middleware(request) {
  const { pathname } = new URL(request.url);

  if (PUBLIC_PATHS.has(pathname)) return next();

  if (isValidSession(request.headers.get('cookie'))) return next();

  if (request.method === 'GET' || request.method === 'HEAD') {
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/login.html',
        'Cache-Control': 'private, no-store',
      },
    });
  }

  return Response.json(
    { error: 'Authentication required.' },
    { status: 401, headers: { 'Cache-Control': 'private, no-store' } }
  );
}
