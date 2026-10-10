import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const root=resolve('public');
http.createServer(async(req,res)=>{try {const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!path.startsWith(root+'/')&&path!==root)throw Error(); const f=path===root||path.endsWith('/')?path+'/index.html':path; const body=await readFile(f);res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json'})[extname(f)]||'application/octet-stream');res.end(body);}catch{res.writeHead(404);res.end('Not found');}}).listen(3000,'127.0.0.1',()=>console.log('http://localhost:3000'));
