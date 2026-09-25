// Local-only validation of the generated Netlify handler. Never use as production hosting.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { Readable } from 'node:stream';
import { createHandler } from '../.netlify/build/entry.mjs';
const handler = createHandler({});
const root = resolve('dist');
const mime = {
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://127.0.0.1:4322');
    const path = resolve(root, '.' + decodeURIComponent(url.pathname));
    if (
      path.startsWith(root + '/') &&
      (await stat(path)
        .then((s) => s.isFile())
        .catch(() => false))
    ) {
      res.writeHead(200, {
        'Content-Type': mime[extname(path)] || 'application/octet-stream',
      });
      res.end(await readFile(path));
      return;
    }
    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      ...(!['GET', 'HEAD'].includes(req.method)
        ? { body: Readable.toWeb(req), duplex: 'half' }
        : {}),
    });
    const response = await handler(request, { ip: '127.0.0.1' });
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error(error);
    res.writeHead(500);
    res.end('Local preview error');
  }
}).listen(4322, '127.0.0.1', () =>
  console.log('Built preview: http://127.0.0.1:4322'),
);
