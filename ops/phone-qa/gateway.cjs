// QA-only static/same-origin proxy. Public networking is supplied separately, only after approval.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
function createGateway({root,api,qrFile}) {
  const upstream=new URL(api);
  if(upstream.protocol!=='http:'||!['127.0.0.1','localhost','api'].includes(upstream.hostname))throw Error('Only the isolated QA API is allowed');
  return http.createServer((req,res)=>{
    res.setHeader('Cache-Control','no-store');
    res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Permissions-Policy','camera=(self), microphone=(), geolocation=()');
    res.setHeader('Content-Security-Policy',"default-src 'self'; connect-src 'self'; img-src 'self' data: blob:; font-src 'self' data:; media-src 'self' blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; worker-src 'self' blob:; frame-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
    const url=new URL(req.url,'http://qa.invalid');
    if(url.pathname.startsWith('/api/')){
      if(url.pathname.startsWith('/api/whatsapp')){res.writeHead(404);return res.end('Disabled for rehearsal');}
      const headers={...req.headers,host:upstream.host};
      const proxy=http.request({hostname:upstream.hostname,port:upstream.port,path:url.pathname+url.search,method:req.method,headers},response=>{
        for(const [name,value] of Object.entries(response.headers))if(!['connection','transfer-encoding','content-security-policy','cache-control'].includes(name)&&value!==undefined)res.setHeader(name,value);
        res.writeHead(response.statusCode);response.pipe(res);
      });
      proxy.on('error',()=>{if(!res.headersSent){res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({message:'No se pudo verificar la operación. Recuperá el resultado.'}));}else res.destroy();});
      req.pipe(proxy);return;
    }
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
    let file;
    if(url.pathname==='/ensayo/qr')file=qrFile;
    else{
      let decoded;try{decoded=decodeURIComponent(url.pathname);}catch{res.writeHead(400);return res.end();}
      if(decoded.split('/').some(part=>part.startsWith('.'))){res.writeHead(404);return res.end();}
      file=path.resolve(root,'.'+decoded);
      if(!file.startsWith(path.resolve(root)+path.sep)){file=path.join(root,'index.html');}
      if(!fs.existsSync(file)||!fs.statSync(file).isFile())file=path.join(root,'index.html');
    }
    if(!file||!fs.existsSync(file)){res.writeHead(404);return res.end('QR todavía no preparados');}
    const type={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.woff2':'font/woff2','.ico':'image/x-icon','.mp4':'video/mp4'}[path.extname(file)]||'application/octet-stream';
    res.writeHead(200,{'Content-Type':type});if(req.method==='HEAD')return res.end();fs.createReadStream(file).pipe(res);
  });
}
module.exports={createGateway};
if(require.main===module)createGateway({root:process.env.PHONE_QA_WEB_ROOT||path.join(__dirname,'public'),api:process.env.PHONE_QA_API||'http://127.0.0.1:3006',qrFile:process.env.PHONE_QA_QR_FILE}).listen(Number(process.env.PHONE_QA_WEB_PORT)||8080,process.env.PHONE_QA_BIND||'127.0.0.1',()=>console.log('QA gateway listening; this is not a phone-accessible HTTPS URL.'));
