import { createSessionToken, SESSION_COOKIE, SESSION_TTL_SECONDS, verifyPuzzleAnswer } from '../../lib/session.js';

export default {
  async fetch(request) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed.', {
        status: 405,
        headers: { Allow: 'POST', 'Cache-Control': 'no-store' },
      });
    }

    const requestUrl = new URL(request.url);
    const origin = request.headers.get('origin');
    if (origin && origin !== requestUrl.origin) {
      return Response.json({ error: 'Request rejected.' }, { status: 403 });
    }

    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
      return Response.json({ error: 'Invalid request.' }, { status: 415 });
    }

    let body;
    try {
      const text = await request.text();
      if (text.length > 2048) return Response.json({ error: 'Invalid request.' }, { status: 413 });
      body = JSON.parse(text);
    } catch {
      return Response.json({ error: 'Invalid request.' }, { status: 400 });
    }

    const configured = typeof process.env.VAULT_PUZZLE_ANSWER === 'string' &&
      process.env.VAULT_PUZZLE_ANSWER.replace(/[^a-z0-9]/gi, '').length >= 12 &&
      typeof process.env.SESSION_SECRET === 'string' &&
      Buffer.byteLength(process.env.SESSION_SECRET) >= 32;
    if (!configured) {
      return Response.json({ error: 'The private entrance is not configured yet.' }, {
        status: 503,
        headers: { 'Cache-Control': 'no-store' },
      });
    }

    if (!verifyPuzzleAnswer(body?.answer)) {
      return Response.json({ error: 'Not quite, my love. Try another clue and give it another go. 💗' }, {
        status: 401,
        headers: { 'Cache-Control': 'no-store' },
      });
    }

    const token = createSessionToken();
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    return Response.json({ ok: true }, {
      headers: {
        'Cache-Control': 'no-store',
        'Set-Cookie': `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}${secure}`,
      },
    });
  },
};
