import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)));
const envPath = resolve(root, '.env.local');

try {
  const envText = await readFile(envPath, 'utf8');
  for (const line of envText.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2];
  }
} catch {
  console.error('Create .env.local first. Use .env.example as the variable-name guide.');
  process.exit(1);
}

const [{ isValidSession }, { default: loginHandler }] = await Promise.all([
  import('./lib/session.js'),
  import('./api/auth/login.js'),
]);
const port = Number(process.env.PORT) || 3000;
const localOrigin = `http://127.0.0.1:${port}`;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
};

function sendText(response, status, text, extraHeaders = {}) {
  response.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'private, no-store',
    ...extraHeaders,
  });
  response.end(text);
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', localOrigin);

    if (url.pathname === '/api/auth/login') {
      const bodyChunks = [];
      let bodySize = 0;
      for await (const chunk of request) {
        bodySize += chunk.length;
        if (bodySize > 2048) return sendText(response, 413, 'Request too large.');
        bodyChunks.push(chunk);
      }

      const headers = new Headers();
      for (const name of ['content-type', 'origin', 'cookie']) {
        const value = request.headers[name];
        if (typeof value === 'string') headers.set(name, value);
      }
      const webRequest = new Request(url, {
        method: request.method,
        headers,
        body: request.method === 'GET' || request.method === 'HEAD' ? undefined : Buffer.concat(bodyChunks),
      });
      const apiResponse = await loginHandler.fetch(webRequest);
      response.writeHead(apiResponse.status, Object.fromEntries(apiResponse.headers.entries()));
      response.end(Buffer.from(await apiResponse.arrayBuffer()));
      return;
    }

    if (url.pathname === '/login.html' && ['GET', 'HEAD'].includes(request.method)) {
      const loginPath = resolve(root, 'login.html');
      const info = await stat(loginPath);
      response.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': info.size,
        'Cache-Control': 'no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      });
      if (request.method === 'HEAD') return response.end();
      createReadStream(loginPath).pipe(response);
      return;
    }

    if (!isValidSession(request.headers.cookie || '')) {
      if (request.method === 'GET' || request.method === 'HEAD') {
        response.writeHead(302, { Location: '/login.html', 'Cache-Control': 'private, no-store' });
        return response.end();
      }
      return sendText(response, 401, 'Authentication required.');
    }

    if (!['GET', 'HEAD'].includes(request.method)) return sendText(response, 405, 'Method not allowed.', { Allow: 'GET, HEAD' });

    const relativePath = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
    const filePath = resolve(root, relativePath);
    if (filePath !== root && !filePath.startsWith(root + sep)) return sendText(response, 403, 'Forbidden.');

    const info = await stat(filePath);
    if (!info.isFile()) return sendText(response, 404, 'Not found.');

    const headers = {
      'Content-Type': mimeTypes[extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Accept-Ranges': 'bytes',
      'X-Content-Type-Options': 'nosniff',
    };
    const range = request.headers.range?.match(/^bytes=(\d*)-(\d*)$/);
    if (range && info.size > 0) {
      const start = range[1] ? Number(range[1]) : 0;
      const end = range[2] ? Number(range[2]) : info.size - 1;
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || end >= info.size) {
        return sendText(response, 416, 'Range not satisfiable.', { 'Content-Range': `bytes */${info.size}` });
      }
      headers['Content-Length'] = end - start + 1;
      headers['Content-Range'] = `bytes ${start}-${end}/${info.size}`;
      response.writeHead(206, headers);
      if (request.method === 'HEAD') return response.end();
      createReadStream(filePath, { start, end }).pipe(response);
      return;
    }

    headers['Content-Length'] = info.size;
    response.writeHead(200, headers);
    if (request.method === 'HEAD') return response.end();
    createReadStream(filePath).pipe(response);
  } catch (error) {
    if (!response.headersSent) sendText(response, error.code === 'ENOENT' ? 404 : 500, error.code === 'ENOENT' ? 'Not found.' : 'Local server error.');
    else response.destroy(error);
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Local preview running at http://127.0.0.1:${port}`);
});
