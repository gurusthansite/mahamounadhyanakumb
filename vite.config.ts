import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// Local dev middleware to run Vercel serverless functions in /api
const apiDevMiddleware = () => ({
  name: 'api-dev-middleware',
  configureServer(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      if (req.url && req.url.startsWith('/api/')) {
        const urlObj = new URL(req.url, 'http://localhost');
        const apiPath = urlObj.pathname.replace('/api/', '');
        const filePath = path.resolve(process.cwd(), 'api', `${apiPath}.js`);
        
        try {
          // Read request body if present
          let body = {};
          if (req.method === 'POST') {
            const buffers = [];
            for await (const chunk of req) {
              buffers.push(chunk);
            }
            const dataStr = Buffer.concat(buffers).toString();
            try {
              body = JSON.parse(dataStr);
            } catch {
              body = Object.fromEntries(new URLSearchParams(dataStr));
            }
          }

          const mod = await import(`${filePath}?t=${Date.now()}`);
          const handler = mod.default || mod;

          const customReq = {
            method: req.method,
            headers: req.headers,
            body,
            query: Object.fromEntries(urlObj.searchParams.entries())
          };

          const customRes = {
            statusCode: 200,
            setHeader: (k: string, v: string) => res.setHeader(k, v),
            status: function (code: number) {
              this.statusCode = code;
              res.statusCode = code;
              return this;
            },
            json: (data: any) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            },
            end: (data?: any) => res.end(data)
          };

          await handler(customReq, customRes);
          return;
        } catch (err: any) {
          console.error(`Dev API Error (${req.url}):`, err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message || 'API handler failed' }));
          return;
        }
      }
      next();
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    apiDevMiddleware(),
  ],
})
