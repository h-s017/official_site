const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve('.');
http.createServer((req,res)=>{
 let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);return res.end();}
 const file=path.resolve(root,'.'+name+(name.endsWith('/')?'index.html':''));
 if(!file.startsWith(root+path.sep)||file.includes(path.sep+'.git'+path.sep)||file.includes(path.sep+'node_modules'+path.sep)){res.writeHead(403);return res.end();}
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');res.end(data);});
}).listen(4176,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4176/student-tools/'));
