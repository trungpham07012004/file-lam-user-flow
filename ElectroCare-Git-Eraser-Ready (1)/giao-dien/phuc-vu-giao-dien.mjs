import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.FRONTEND_PORT || 5173);
const mime = {
  '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8',
  '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.svg':'image/svg+xml',
  '.ico':'image/x-icon'
};

const server=http.createServer((req,res)=>{
  const raw = decodeURIComponent((req.url||'/').split('?')[0]);
  const rel = raw === '/' ? '/trang-chu.html' : raw;
  const file = path.normalize(path.join(root, rel));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.stat(file,(err,st)=>{
    if (!err && st.isFile()) { res.writeHead(200, {'Content-Type': mime[path.extname(file).toLowerCase()] || 'application/octet-stream'}); fs.createReadStream(file).pipe(res); }
    else { const index=path.join(root,'trang-chu.html'); res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'}); fs.createReadStream(index).pipe(res); }
  });
});
server.on('error',err=>{console.error('ElectroCare frontend khong khoi dong duoc:',err);process.exitCode=1;});
server.listen(port,'0.0.0.0',()=>console.log(`ElectroCare frontend running at http://localhost:${port}`));
