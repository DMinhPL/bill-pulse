import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import app, { GEMINI_MODEL } from './server/app';
import { PAGE_ROUTE_PATTERNS } from './src/routes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const NOT_FOUND_PAGE = `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>404 - Không tìm thấy trang</title>
  </head>
  <body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#020617;color:#cbd5e1;font-family:Inter,system-ui,sans-serif;text-align:center">
    <main>
      <p style="font-size:48px;font-weight:800;margin:0;color:#f8fafc">404</p>
      <p style="margin:8px 0 24px">Không tìm thấy trang bạn yêu cầu.</p>
      <a href="/" style="color:#34d399;font-weight:600;text-decoration:none">← Về trang chủ BillPulse</a>
    </main>
  </body>
</html>`;

// Local Node entry point. Vercel imports server/app.ts through api/index.ts
// instead, so no listener or static-file middleware runs inside the Function.
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      // 'custom' disables Vite's own index.html fallback; page URLs are served explicitly below
      appType: 'custom',
    });
    app.use(vite.middlewares); // module/asset requests only (/src, /@vite, /node_modules)

    app.get(PAGE_ROUTE_PATTERNS, async (req, res, next) => {
      try {
        const template = await fs.readFile(path.resolve(__dirname, 'index.html'), 'utf8');
        const html = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).type('html').send(html);
      } catch (err: any) {
        vite.ssrFixStacktrace(err);
        next(err);
      }
    });
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    // This branch is for a conventional Node deployment. Vercel serves dist itself.
    app.use('/assets', express.static(path.join(distDir, 'assets'), { immutable: true, maxAge: '1y' }));
    app.get(PAGE_ROUTE_PATTERNS, (req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.use((req, res) => {
    res.status(404).type('html').send(NOT_FOUND_PAGE);
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT} (Gemini model: ${GEMINI_MODEL})`);
  });
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exitCode = 1;
});
