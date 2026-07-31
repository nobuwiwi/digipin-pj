const http = require("http");
const fs = require("fs");
const path = require("path");

const DIST = path.join(__dirname, "dist");
const PORT = process.env.PORT || 3000;
const API_BASE_URL = process.env.API_BASE_URL || "";

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const server = http.createServer((req, res) => {
  // Generate config.js dynamically from the environment on every request.
  if (req.url === "/config.js" || req.url === "/public/config.js") {
    const body = `window.__APP_CONFIG__ = { API_BASE_URL: "${API_BASE_URL}" };`;
    res.writeHead(200, { "Content-Type": "application/javascript" });
    res.end(body);
    return;
  }

  let urlPath = req.url === "/" ? "/index.html" : req.url;
  let filePath = path.join(DIST, urlPath);

  // Prevent directory traversal
  if (!filePath.startsWith(DIST)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA fallback: serve index.html for any unmatched route
      fs.readFile(path.join(DIST, "index.html"), (e2, indexData) => {
        if (e2) {
          res.writeHead(404);
          res.end("Not found");
          return;
        }
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(indexData);
      });
      return;
    }

    const ext = path.extname(filePath);
    const mime = MIME[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": mime });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`API_BASE_URL = "${API_BASE_URL}"`);
  if (!API_BASE_URL) {
    console.warn("WARNING: API_BASE_URL is empty! Set it in Railway Variables.");
  }
});
