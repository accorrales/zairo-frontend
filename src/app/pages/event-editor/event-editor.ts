import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { Header } from '../../layout/header/header';
import { PublicVideo } from '../../shared/public-event/public-media';
import { environment } from '../../../environments/environment';

@Component({
  selector:'app-event-editor', standalone:true, host:{class:'zairo-screen'},
  imports:[CommonModule,FormsModule,RouterLink,Sidebar,Header,PublicVideo],
  templateUrl:'./event-editor.html', styleUrls:['../eventos/eventos.css','./event-editor.css']
})
export class EventEditor implements OnInit {
  private http=inject(HttpClient); private route=inject(ActivatedRoute);
  private id=this.route.snapshot.paramMap.get('id');
  private url=`${environment.apiUrl}/eventos/${this.id}`;
  content:any=null; revision=0; loading=true; busy=false; dirty=false; preview=false;
  error=''; message=''; publication='BORRADOR'; sales=false; home=false; featured=false;
  currentPublication='BORRADOR'; currentSales=false;
  ngOnInit(){this.load();}
  load(){
    this.loading=true;this.error='';
    this.http.get<any>(this.url+'/contenido').subscribe({next:r=>{
      this.content=r.contenido;
      this.content.fecha=this.localDate(this.content.fecha);
      this.revision=r.revision;this.publication=this.currentPublication=r.publicacion;
      this.sales=this.currentSales=r.ventas_abiertas;this.home=r.mostrar_en_home;this.featured=r.destacado;
      this.dirty=false;this.loading=false;
    },error:()=>{this.loading=false;this.error='No pudimos cargar el borrador. Verificá tu acceso y reintentá.';}});
  }
  localDate(value:string){
    const d=new Date(value);if(!Number.isFinite(d.getTime()))return '';
    const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Costa_Rica',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d).map(p=>[p.type,p.value]));
    return `${parts['year']}-${parts['month']}-${parts['day']}T${parts['hour']}:${parts['minute']}`;
  }
  formatDate(value:string){
    const d=new Date(value+'-06:00');return Number.isFinite(d.getTime())?d.toLocaleString('es-CR',{timeZone:'America/Costa_Rica',dateStyle:'full',timeStyle:'short'})+' (Costa Rica)':'';
  }
  changed(){this.dirty=true;this.message='';}
  addArtist(){if(this.content.artistas.length<30){this.content.artistas.push({nombre:'',descripcion:'',imagen:''});this.changed();}}
  addImage(){if(this.content.imagenes.length<20){this.content.imagenes.push({url:'',alt:''});this.changed();}}
  addVideo(){if(this.content.videos.length<3){this.content.videos.push({url:'',poster:'',titulo:''});this.changed();}}
  move(index:number,delta:number){const a=this.content.secciones;const target=index+delta;if(target<0||target>=a.length)return;[a[index],a[target]]=[a[target],a[index]];this.changed();}
  save(){
    this.busy=true;this.error='';this.message='';
    const contenido={...this.content,fecha:new Date(this.content.fecha+'-06:00').toISOString()};
    this.http.put<any>(this.url+'/contenido',{contenido,revision:this.revision}).subscribe({next:r=>{this.revision=r.revision;this.dirty=false;this.busy=false;this.message='Borrador guardado. El contenido público no cambió.';},error:e=>{this.busy=false;this.error=e.error?.error||'No se pudo guardar.';}});
  }
  publicationChanged(){if(this.publication!=='PUBLICADO')this.sales=false;if(this.publication==='BORRADOR'){this.home=false;this.featured=false;}if(!this.home)this.featured=false;}
  publish(){
    if(this.dirty||this.busy)return;
    this.busy=true;this.error='';this.message='';
    this.http.post<any>(this.url+'/publicacion',{publicacion:this.publication,ventas_abiertas:this.sales,mostrar_en_home:this.home,destacado:this.featured,revision:this.revision}).subscribe({next:r=>{this.revision=r.revision;this.currentPublication=r.publicacion;this.currentSales=r.ventas_abiertas;this.busy=false;this.message='Publicación actualizada. '+(r.ventas_abiertas?'Ventas abiertas.':'Ventas cerradas.');},error:e=>{this.busy=false;this.error=e.error?.error||'No se pudo actualizar la publicación.';}});
  }
}
