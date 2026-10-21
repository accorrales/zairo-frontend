const {test}=require('node:test');
const assert=require('node:assert/strict');
const ts=require('typescript'),fs=require('node:fs'),vm=require('node:vm');
const mod={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/pages/dashboard-entradas/analisis-edades.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:mod.exports,module:mod,Intl,Date,Map});
const {edadEnEvento,analizarEdades}=mod.exports;
test('age at event birthday and Costa Rica midnight',()=>{
assert.equal(edadEnEvento('2008-10-31','2026-10-31'),18);
assert.equal(edadEnEvento('2008-11-01','2026-10-31'),17);
assert.equal(edadEnEvento('2008-10-31','2026-10-31T03:00:00Z'),17);
assert.equal(edadEnEvento('2008-02-30','2026-10-31'),null);
assert.equal(edadEnEvento(null,'2026-10-31'),null);
assert.equal(edadEnEvento('2027-01-01','2026-10-31'),null);
assert.equal(edadEnEvento('2000-01-01',null),null);
});
test('counts valid tickets, unknown ages, check-ins, boundaries and empty events',()=>{
const ages=[15,16,17,18,20,21,24,25,29,30,34,35,44,45];
const rows=ages.map(a=>({fecha_nacimiento:(2026-a)+'-01-01',estado:'CONFIRMADA'}));
rows[0].estado='USADA';
rows.push({fecha_nacimiento:null,estado:'CONFIRMADA'});
rows.push({fecha_nacimiento:'2000-01-01',estado:'INVALIDADA'});
rows.push({fecha_nacimiento:'2000-01-01',fecha_invalidacion:'2026-01-01'});
const a=analizarEdades(rows,'2026-10-31');
assert.equal(a.total,15);assert.equal(a.menores,3);assert.equal(a.mayores,11);assert.equal(a.sinEdad,1);
assert.deepEqual(Array.from(a.rangos,r=>r.cantidad),[1,2,2,2,2,2,2,1]);
assert.equal(analizarEdades(rows,'2026-10-31',true).total,1);
assert.equal(analizarEdades([],'2026-10-31').promedio,null);
assert.equal(analizarEdades(rows,null).sinEdad,15);
});
