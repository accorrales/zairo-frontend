const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http');
const {createGateway}=require('./gateway.cjs');
const listen=server=>new Promise(r=>server.listen(0,'127.0.0.1',()=>r('http://127.0.0.1:'+server.address().port)));
test('QA gateway refuses remote API and preserves same-origin operation receipt/auth without public secrets',async()=>{
 assert.throws(()=>createGateway({api:'https://zairoofficial-production.up.railway.app'}));
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'phone-web-'));fs.writeFileSync(path.join(root,'index.html'),'<html>QA</html>');fs.writeFileSync(path.join(root,'.env'),'never serve');
 let auth;const api=http.createServer((req,res)=>{auth=req.headers.authorization;res.writeHead(409,{'Content-Type':'application/json','X-Zairo-Operation-Id':'original'});res.end('{"message":"Entrada utilizada"}');});
 const upstream=await listen(api),gateway=createGateway({root,api:upstream});const base=await listen(gateway);
 try{
  const result=await fetch(base+'/api/operacion/escanear',{method:'POST',headers:{Authorization:'Bearer ficticio'},body:'{}'});assert.equal(result.status,409);assert.equal(result.headers.get('X-Zairo-Operation-Id'),'original');assert.equal(auth,'Bearer ficticio');
  const page=await fetch(base+'/login');assert.equal(page.status,200);assert.match(page.headers.get('Permissions-Policy'),/camera=\(self\)/);assert.match(page.headers.get('Content-Security-Policy'),/connect-src 'self'/);assert.match(page.headers.get('Content-Security-Policy'),/base-uri 'self'/);assert.equal((await fetch(base+'/.env')).status,404);assert.equal((await fetch(base+'/api/whatsapp')).status,404);
  await new Promise(r=>api.close(r));assert.equal((await fetch(base+'/api/health')).status,503);
 }finally{await new Promise(r=>gateway.close(r));api.close();fs.rmSync(root,{recursive:true,force:true});}
});
