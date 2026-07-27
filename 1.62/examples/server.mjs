// Zero-dependency static server for the examples.
// Serves ./site so the component-testing gallery and the network examples
// have a real origin to talk to.
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

  // A tiny JSON API so apiResponse.timing() has something real to measure.
  if (url.pathname === '/api/items') {
    const delay = Number(url.searchParams.get('delay') || 0);
    await new Promise(resolve => setTimeout(resolve, delay));
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ items: ['alpha', 'beta', 'gamma'], delay }));
    return;
  }

  // An endpoint that never responds, for the AbortSignal example.
  if (url.pathname === '/api/never') return;

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
