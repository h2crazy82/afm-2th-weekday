const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;

function getSecret() {
  const secretPath = path.join(__dirname, "secret.md");
  return fs.readFileSync(secretPath, "utf-8").trim();
}

const server = http.createServer((req, res) => {
  // POST /check-password
  if (req.method === "POST" && req.url === "/check-password") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        const { password } = JSON.parse(body);
        const secret = getSecret();

        res.setHeader("Content-Type", "application/json");

        if (password === secret) {
          res.writeHead(200);
          res.end(JSON.stringify({ success: true, message: "💕 사랑해요 💕" }));
        } else {
          res.writeHead(401);
          res.end(JSON.stringify({ success: false, message: "틀렸어요! 다시 시도하세요 😢" }));
        }
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, message: "잘못된 요청입니다" }));
      }
    });
    return;
  }

  // Serve static files
  let filePath = req.url === "/" ? "/index.html" : req.url;
  filePath = path.join(__dirname, filePath);

  const ext = path.extname(filePath);
  const mimeTypes = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
  };

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }
    res.setHeader("Content-Type", mimeTypes[ext] || "text/plain");
    res.writeHead(200);
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
