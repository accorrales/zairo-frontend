// Brand chrome is always dark, even when the event itself uses a light theme.
export function heroAccent(value:string|undefined):string {
 if(!value||!/^#[a-f\d]{6}$/i.test(value))return '#c6ff57';
 const luminance=(hex:string)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
 const values=[luminance(value),luminance('#080b0a')].sort((a,b)=>a-b);
 return (values[1]+.05)/(values[0]+.05)>=4.5?value:'#c6ff57';
}
