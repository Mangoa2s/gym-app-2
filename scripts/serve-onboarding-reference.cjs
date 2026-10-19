// Read-only local server for the approved browser reference.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(process.argv[2]);
http
  .createServer((req, res) => {
    const target = path.resolve(
      root,
      "." +
        decodeURIComponent(
          req.url.split("?")[0] === "/" ? "/index.html" : req.url.split("?")[0],
        ),
    );
    if (!target.startsWith(root + path.sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    fs.readFile(target, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end();
        return;
      }
      res.setHeader(
        "Content-Type",
        target.endsWith(".css")
          ? "text/css"
          : target.endsWith(".js")
            ? "text/javascript"
            : target.endsWith(".ttf")
              ? "font/ttf"
              : "text/html",
      );
      res.end(data);
    });
  })
  .listen(8765, "127.0.0.1");
