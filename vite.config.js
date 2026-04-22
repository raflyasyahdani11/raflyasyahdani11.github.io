import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    {
      name: 'json-admin-api',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url === '/_admin/save-json' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const products = JSON.parse(body);
                const filePath = path.resolve(__dirname, 'src/lib/products.json');
                fs.writeFileSync(filePath, JSON.stringify(products, null, 2));
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true }));
              } catch (e) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: e.message }));
              }
            });
          } else if (req.url?.startsWith('/_admin/download-image') && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', async () => {
              try {
                const { url, filename } = JSON.parse(body);
                const response = await fetch(url);
                const buffer = await response.arrayBuffer();
                
                const dirPath = path.resolve(__dirname, 'public/images/products');
                if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
                
                // Clean filename
                const safeName = (filename || 'image').replace(/[^a-z0-9]/gi, '_').toLowerCase();
                const finalName = `${safeName}_${Date.now()}.jpg`;
                const filePath = path.join(dirPath, finalName);
                
                fs.writeFileSync(filePath, Buffer.from(buffer));
                
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ path: `/images/products/${finalName}` }));
              } catch (e) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: e.message }));
              }
            });
          } else if (req.url === '/_admin/delete-image' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const { path: imgPath } = JSON.parse(body);
                if (imgPath && imgPath.startsWith('/images/products/')) {
                  const fullPath = path.resolve(__dirname, 'public', imgPath.slice(1));
                  if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                  }
                }
                res.end(JSON.stringify({ success: true }));
              } catch (e) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: e.message }));
              }
            });
          } else if (req.url === '/_admin/cleanup-images' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const { activeImages } = JSON.parse(body);
                const dirPath = path.resolve(__dirname, 'public/images/products');
                if (fs.existsSync(dirPath)) {
                  const files = fs.readdirSync(dirPath);
                  let deletedCount = 0;
                  files.forEach(file => {
                    const relativePath = `/images/products/${file}`;
                    if (!activeImages.includes(relativePath)) {
                      fs.unlinkSync(path.join(dirPath, file));
                      deletedCount++;
                    }
                  });
                  res.end(JSON.stringify({ success: true, deletedCount }));
                } else {
                  res.end(JSON.stringify({ success: true, deletedCount: 0 }));
                }
              } catch (e) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: e.message }));
              }
            });
          } else {
            next();
          }
        });
      }
    }
  ],
  base: '/',
})
