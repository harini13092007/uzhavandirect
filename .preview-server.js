// Temporary static server used only to preview the app locally. Safe to delete.
const http = require('http'), fs = require('fs'), path = require('path');
const root = __dirname;
const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.webp':'image/webp','.md':'text/markdown','.json':'application/json'};
http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(root, urlPath === '/' ? 'index.html' : urlPath);
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, {'Content-Type': types[path.extname(file)] || 'application/octet-stream'});
    res.end(data);
  });
}).listen(8931, '127.0.0.1', () => console.log('serving on 8931'));
