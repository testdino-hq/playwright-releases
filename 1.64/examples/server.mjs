// Zero-dependency static server for the examples.
// Serves ./site so the examples have a real, secure (localhost) origin.
// WebMCP and WebAuthn both refuse to run on data: or file: URLs.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), 'site');
const PORT = Number(process.env.PORT || 5173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // Echoes the cookies the client sent, so APIRequestContext cookie methods
  // have something real to talk to.
  if (url.pathname === '/api/whoami') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ cookie: req.headers.cookie || '' }));
    return;
  }

  // Logs in by setting a session cookie, the way a real auth endpoint would.
  if (url.pathname === '/api/login') {
    res.writeHead(200, {
      'content-type': 'application/json',
      'set-cookie': 'session=abc123; Path=/; HttpOnly',
    });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  let pathname = normalize(url.pathname);
  if (pathname.endsWith('/')) pathname += 'index.html';
  try {
    const body = await readFile(join(root, pathname));
    res.writeHead(200, { 'content-type': MIME[extname(pathname)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('Not found');
  }
}).listen(PORT, () => console.log(`examples site on http://localhost:${PORT}`));
