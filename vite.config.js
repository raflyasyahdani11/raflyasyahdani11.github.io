import { defineConfig, loadEnv } from "vite"
import { svelte } from "@sveltejs/vite-plugin-svelte"
import fs from "fs"
import path from "path"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const siteUrl = env.VITE_SITE_URL || "";

  return {
    plugins: [
      svelte(),
      {
        name: "transform-public-files",
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url === "/sitemap.xml" || req.url === "/robots.txt") {
              const filePath = path.resolve(__dirname, "public", req.url.slice(1));
              if (fs.existsSync(filePath)) {
                let content = fs.readFileSync(filePath, "utf-8");
                content = content.replace(/%VITE_SITE_URL%/g, siteUrl);
                res.setHeader("Content-Type", req.url.endsWith(".xml") ? "application/xml" : "text/plain");
                res.end(content);
                return;
              }
            }
            next();
          });
        },
        closeBundle() {
          const files = ["sitemap.xml", "robots.txt"];
          if (!siteUrl) return;
          files.forEach(file => {
            const filePath = path.resolve(__dirname, "dist", file);
            if (fs.existsSync(filePath)) {
              let content = fs.readFileSync(filePath, "utf-8");
              content = content.replace(/%VITE_SITE_URL%/g, siteUrl);
              fs.writeFileSync(filePath, content);
            }
          });

          // Generate static product pages for SEO
          try {
            const productsPath = path.resolve(__dirname, "src/lib/products.json");
            if (fs.existsSync(productsPath)) {
              const products = JSON.parse(fs.readFileSync(productsPath, "utf-8"));
              const indexPath = path.resolve(__dirname, "dist/index.html");
              if (fs.existsSync(indexPath)) {
                const originalIndexHtml = fs.readFileSync(indexPath, "utf-8");
                
                products.forEach(product => {
                  const productNo = product.no || product.title;
                  if (!productNo) return;
                  
                  const safeNo = encodeURIComponent(productNo);
                  const productDir = path.resolve(__dirname, "dist/p", safeNo);
                  if (!fs.existsSync(productDir)) {
                    fs.mkdirSync(productDir, { recursive: true });
                  }
                  
                  const pTitle = `${product.title} | The Fate of Affiliate`;
                  const pDesc = product.desc || "Temukan katalog produk pilihan terbaik.";
                  let pImg = product.img || "";
                  if (pImg && !pImg.startsWith("http")) {
                    // Normalize relative path
                    pImg = `${siteUrl.endsWith("/") ? siteUrl : siteUrl + "/"}${pImg.startsWith("/") ? pImg.slice(1) : pImg}`;
                  }
                  const pUrl = `${siteUrl.endsWith("/") ? siteUrl : siteUrl + "/"}p/${safeNo}/`;
                  
                  let indexHtml = originalIndexHtml;
                  
                  // 1. Replace <title>
                  indexHtml = indexHtml.replace(/<title>.*?<\/title>/gi, `<title>${pTitle}</title>`);
                  
                  // 2. Replace description meta
                  indexHtml = indexHtml.replace(/<meta\s+name=["']description["']\s+content=["'].*?["']\s*\/?>/gi, `<meta name="description" content="${pDesc}" />`);
                  
                  // 3. Replace Open Graph
                  indexHtml = indexHtml.replace(/<meta\s+property=["']og:type["']\s+content=["'].*?["']\s*\/?>/gi, `<meta property="og:type" content="product" />`);
                  indexHtml = indexHtml.replace(/<meta\s+property=["']og:title["']\s+content=["'].*?["']\s*\/?>/gi, `<meta property="og:title" content="${pTitle}" />`);
                  indexHtml = indexHtml.replace(/<meta\s+property=["']og:description["']\s+content=["'].*?["']\s*\/?>/gi, `<meta property="og:description" content="${pDesc}" />`);
                  indexHtml = indexHtml.replace(/<meta\s+property=["']og:image["']\s+content=["'].*?["']\s*\/?>/gi, `<meta property="og:image" content="${pImg}" />`);
                  indexHtml = indexHtml.replace(/<meta\s+property=["']og:url["']\s+content=["'].*?["']\s*\/?>/gi, `<meta property="og:url" content="${pUrl}" />`);
                  
                  // 4. Replace Twitter
                  indexHtml = indexHtml.replace(/<meta\s+property=["']twitter:title["']\s+content=["'].*?["']\s*\/?>/gi, `<meta property="twitter:title" content="${pTitle}" />`);
                  indexHtml = indexHtml.replace(/<meta\s+property=["']twitter:description["']\s+content=["'].*?["']\s*\/?>/gi, `<meta property="twitter:description" content="${pDesc}" />`);
                  indexHtml = indexHtml.replace(/<meta\s+property=["']twitter:image["']\s+content=["'].*?["']\s*\/?>/gi, `<meta property="twitter:image" content="${pImg}" />`);
                  indexHtml = indexHtml.replace(/<meta\s+property=["']twitter:url["']\s+content=["'].*?["']\s*\/?>/gi, `<meta property="twitter:url" content="${pUrl}" />`);
                  
                  // 5. Replace Canonical URL
                  indexHtml = indexHtml.replace(/<link\s+rel=["']canonical["']\s+href=["'].*?["']\s*\/?>/gi, `<link rel="canonical" href="${pUrl}" />`);
                  
                  fs.writeFileSync(path.join(productDir, "index.html"), indexHtml);
                });
                console.log(`[SEO-Generator] Generated ${products.length} product pages in dist/p/`);
              }
            }
          } catch (err) {
            console.error("[SEO-Generator] Error generating product SEO pages:", err);
          }
        }
      },
      {
        name: "json-admin-api",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url === "/_admin/save-json" && req.method === "POST") {
              let body = "";
              req.on("data", chunk => { body += chunk; });
              req.on("end", () => {
                try {
                  const products = JSON.parse(body);
                  const filePath = path.resolve(__dirname, "src/lib/products.json");
                  fs.writeFileSync(filePath, JSON.stringify(products, null, 2));
                  res.setHeader("Content-Type", "application/json");
                  res.statusCode = 200;
                  res.end(JSON.stringify({ success: true }));
                } catch (e) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: e.message }));
                }
              });
            } else if (req.url?.startsWith("/_admin/download-image") && req.method === "POST") {
              let body = "";
              req.on("data", chunk => { body += chunk; });
              req.on("end", async () => {
                try {
                  const { url, filename, no } = JSON.parse(body);
                  const response = await fetch(url);
                  const buffer = await response.arrayBuffer();
                  
                  const dirPath = path.resolve(__dirname, "public/images/products");
                  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
                  
                  // New format: ${no}_${firstWord}_${timestamp}.jpg
                  const prefix = no ? `${no}_` : "";
                  const firstWord = (filename || "product")
                    .trim()
                    .split(/\s+/)[0]
                    .replace(/[^a-z0-9]/gi, "")
                    .toLowerCase();
                  
                  const finalName = `${prefix}${firstWord}_${Date.now()}.jpg`;
                  const filePath = path.join(dirPath, finalName);
                  
                  fs.writeFileSync(filePath, Buffer.from(buffer));
                  
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify({ path: `/images/products/${finalName}` }));
                } catch (e) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: e.message }));
                }
              });
            } else if (req.url === "/_admin/delete-image" && req.method === "POST") {
              let body = "";
              req.on("data", chunk => { body += chunk; });
              req.on("end", () => {
                try {
                  const { path: imgPath } = JSON.parse(body);
                  if (imgPath && imgPath.startsWith("/images/products/")) {
                    const fullPath = path.resolve(__dirname, "public", imgPath.slice(1));
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
            } else if (req.url === "/_admin/rename-image" && req.method === "POST") {
              let body = "";
              req.on("data", chunk => { body += chunk; });
              req.on("end", () => {
                try {
                  const { oldPath, newName } = JSON.parse(body);
                  if (oldPath && oldPath.startsWith("/images/products/") && newName) {
                    const dirPath = path.resolve(__dirname, "public/images/products");
                    const oldFullPath = path.resolve(__dirname, "public", oldPath.slice(1));
                    
                    const safeName = newName.replace(/[^a-z0-9]/gi, "_").replace(/_{2,}/g, "_").toLowerCase().substring(0, 30);
                    const newFileName = `${safeName}_${Date.now()}.jpg`;
                    const newFullPath = path.join(dirPath, newFileName);

                    if (fs.existsSync(oldFullPath)) {
                      fs.renameSync(oldFullPath, newFullPath);
                      res.end(JSON.stringify({ success: true, newPath: `/images/products/${newFileName}` }));
                    } else {
                      res.statusCode = 404;
                      res.end(JSON.stringify({ error: "File not found" }));
                    }
                  } else {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ error: "Invalid data" }));
                  }
                } catch (e) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: e.message }));
                }
              });
            } else if (req.url === "/_admin/cleanup-images" && req.method === "POST") {
              let body = "";
              req.on("data", chunk => { body += chunk; });
              req.on("end", () => {
                try {
                  const { activeImages } = JSON.parse(body);
                  const dirPath = path.resolve(__dirname, "public/images/products");
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
    base: "/",
  }
})
