import {Component,OnDestroy,OnInit,inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute,RouterLink} from '@angular/router';
import {Title,Meta} from '@angular/platform-browser';
import {Subscription} from 'rxjs';
import {EventosService} from '../../core/services/eventos.service';
import {EntradaTiersService} from '../../core/services/entrada-tiers.service';
import {PublicNav} from '../../shared/public-event/public-nav';
import {PublicImage} from '../../shared/public-event/public-media';
import {heroAccent} from '../../shared/public-event/public-theme';
import {EventSections,eventDate} from '../../shared/public-event/event-sections';
@Component({selector:'app-public-event-page',standalone:true,imports:[CommonModule,RouterLink,PublicNav,PublicImage,EventSections],templateUrl:'./public-event-page.html',styleUrl:'./public-event-page.css'})
export class PublicEventPage implements OnInit,OnDestroy {
 private route=inject(ActivatedRoute);private service=inject(EventosService);private tierService=inject(EntradaTiersService);private title=inject(Title);private meta=inject(Meta);
 private routeRequest?:Subscription;private request?:Subscription;private tierRequest?:Subscription;
 event:any=null;tiers:any[]=[];loading=true;error='';tierError=false;tierLoading=false;shareMessage='';id=0;date=eventDate;heroAccent=heroAccent;
 get open(){return this.event?.publicacion==='PUBLICADO'&&this.event?.ventas_abiertas===true&&this.event?.estado===true;}
 get promotions(){return this.tiers.filter(t=>Number(t.entradas_por_paquete||1)>1);}
 get individual(){return this.tiers.filter(t=>Number(t.entradas_por_paquete||1)===1);}
 ngOnInit(){this.routeRequest=this.route.paramMap.subscribe(params=>{this.id=Number(params.get('id'));this.load();});}
 load(){
  this.request?.unsubscribe();this.tierRequest?.unsubscribe();this.event=null;this.tiers=[];this.loading=true;this.error='';this.tierError=false;this.shareMessage='';this.title.setTitle('ZAIRO CLUB');
  if(!Number.isSafeInteger(this.id)||this.id<=0){this.error='Este evento no está disponible.';this.loading=false;return;}
  this.request=this.service.obtenerEventoPorId(this.id).subscribe({next:event=>{this.event=event;this.loading=false;this.title.setTitle(`${event.nombre} | ZAIRO`);this.meta.updateTag({name:'description',content:event.descripcion||'Descubrí esta experiencia Zairo.'});if(event.publicacion==='PUBLICADO')this.loadTiers();},error:e=>{this.loading=false;this.error=e.status===404?'Este evento no está disponible.':'No pudimos cargar el evento. Revisá la conexión e intentá de nuevo.';}});
 }
 loadTiers(){
  if(this.event?.publicacion!=='PUBLICADO')return;this.tierRequest?.unsubscribe();this.tierLoading=true;this.tierError=false;this.tiers=[];
  this.tierRequest=this.tierService.obtenerTiersPorEvento(this.id).subscribe({next:tiers=>{this.tiers=(tiers||[]).filter(t=>t.estado!==false&&t.disponibilidad!=='DESACTIVADO');this.tierLoading=false;},error:e=>{this.tierLoading=false;if(e.status===404){this.load();}else this.tierError=true;}});
 }
 price(value:any){return `₡${Number(value||0).toLocaleString('es-CR')}`;}
 async share(){
  const url=new URL(`/evento/${this.id}`,window.location.origin).href;
  try{await navigator.clipboard.writeText(url);this.shareMessage='Enlace copiado.';}catch{this.shareMessage=`Copiá el enlace: ${url}`;}
 }
 ngOnDestroy(){this.routeRequest?.unsubscribe();this.request?.unsubscribe();this.tierRequest?.unsubscribe();this.title.setTitle('ZAIRO CLUB');this.meta.updateTag({name:'description',content:'Experiencias Zairo. Occidente, Costa Rica.'});}
}
