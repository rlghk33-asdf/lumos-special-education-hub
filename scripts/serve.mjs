import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist');const port=Number(process.env.PORT||4173);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json; charset=utf-8'};
http.createServer(async(req,res)=>{try{const requested=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let file=path.resolve(root,'.'+requested);if(file!==root&&!file.startsWith(root+path.sep))throw new Error();if((await stat(file)).isDirectory())file=path.join(file,'index.html');const content=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':'no-store'});res.end(content);}catch{res.writeHead(404);res.end('Not found');}}).listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}`));
