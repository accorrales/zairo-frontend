import {Component,OnDestroy,OnInit,inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink} from '@angular/router';
import {Subscription} from 'rxjs';
import {EventosService} from '../../core/services/eventos.service';
import {PublicNav} from '../../shared/public-event/public-nav';
import {PublicImage} from '../../shared/public-event/public-media';
import {heroAccent} from '../../shared/public-event/public-theme';
import {eventDate} from '../../shared/public-event/event-sections';
@Component({selector:'app-public-eventos',standalone:true,imports:[CommonModule,RouterLink,PublicNav,PublicImage],templateUrl:'./public-eventos.html',styleUrl:'./public-eventos.css'})
export class PublicEventos implements OnInit,OnDestroy {
 private service=inject(EventosService);private request?:Subscription;
 eventos:any[]=[];cargando=true;errorCarga=false;date=eventDate;heroAccent=heroAccent;
 get destacado(){return this.eventos.find(e=>e.destacado)||this.eventos[0]||null;}
 get otros(){return this.eventos.filter(e=>e!==this.destacado);}
 ngOnInit(){this.cargarEventos();}
 cargarEventos(){this.request?.unsubscribe();this.cargando=true;this.errorCarga=false;this.eventos=[];this.request=this.service.obtenerEventosActivos().subscribe({next:(data:any)=>{this.eventos=Array.isArray(data)?data:[];this.cargando=false;},error:()=>{this.cargando=false;this.errorCarga=true;}});}
 label(event:any){return event.publicacion==='PROXIMAMENTE'?'Próximamente':event.estado&&event.ventas_abiertas?'Venta abierta':'Ventas cerradas';}
 ngOnDestroy(){this.request?.unsubscribe();}
}
