
export function edadEnEvento(nacimiento: unknown, fechaEvento: unknown): number | null {
  const dateOnly = (value: unknown, event = false): string => {
    if (!value) return '';
    const text = String(value);
    if (event && /[zZ]|[+-]\d{2}:\d{2}$/.test(text)) {
      const date = new Date(text);
      if (isNaN(date.getTime())) return '';
      const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Costa_Rica',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
      return ['year','month','day'].map(k=>parts.find(p=>p.type===k)?.value).join('-');
    }
    return text.slice(0,10);
  };
  const parse = (text: string): number[] | null => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
    const [y,m,d] = text.split('-').map(Number);
    const dt = new Date(Date.UTC(y,m-1,d));
    return dt.getUTCFullYear()===y && dt.getUTCMonth()===m-1 && dt.getUTCDate()===d ? [y,m,d] : null;
  };
  const birth = parse(dateOnly(nacimiento)), event = parse(dateOnly(fechaEvento,true));
  if (!birth || !event) return null;
  const age = event[0]-birth[0] - (event[1]<birth[1] || (event[1]===birth[1] && event[2]<birth[2]) ? 1 : 0);
  return age>=0 && age<=120 ? age : null;
}
export function analizarEdades(entradas: any[], fechaEvento: unknown, soloIngresos = false) {
  const rangos = [
    {label:'Menos de 16',min:0,max:15}, {label:'16–17',min:16,max:17},
    {label:'18–20',min:18,max:20}, {label:'21–24',min:21,max:24},
    {label:'25–29',min:25,max:29}, {label:'30–34',min:30,max:34},
    {label:'35–44',min:35,max:44}, {label:'45+',min:45,max:120}
  ].map(r=>({...r,cantidad:0}));
  const validas = entradas.filter(e=>!e.fecha_invalidacion && e.estado!=='INVALIDADA' && (!soloIngresos || e.fecha_ingreso || e.estado==='USADA'));
  const edades: number[] = [];
  const counts = new Map<number,number>();
  for (const e of validas) {
    const age = edadEnEvento(e.fecha_nacimiento,fechaEvento);
    if (age===null) continue;
    edades.push(age); counts.set(age,(counts.get(age)||0)+1);
    rangos.find(r=>age>=r.min && age<=r.max)!.cantidad++;
  }
  edades.sort((a,b)=>a-b);
  const menores = edades.filter(a=>a<18).length;
  const mayores = edades.length-menores;
  const sinEdad = validas.length-edades.length;
  return {total:validas.length,menores,mayores,sinEdad,
    promedio:edades.length ? edades.reduce((a,b)=>a+b,0)/edades.length : null,
    mediana:edades.length ? (edades[Math.floor((edades.length-1)/2)]+edades[Math.floor(edades.length/2)])/2 : null,
    rangos, edades:Array.from(counts,([edad,cantidad])=>({label:String(edad),cantidad})).sort((a,b)=>Number(a.label)-Number(b.label)),
    grupos:[{label:'Menores de 18',cantidad:menores},{label:'18 o más',cantidad:mayores},{label:'Sin edad',cantidad:sinEdad}]
  };
}
