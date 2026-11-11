import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {of,throwError} from 'rxjs';
import {PublicEventos} from './public-eventos';
import {EventosService} from '../../core/services/eventos.service';
describe('Zairo permanent home',()=>{
 const event={id_evento:71,nombre:'Evento de prueba',fecha:'2099-12-01',publicacion:'PUBLICADO',estado:true,ventas_abiertas:true};
 function create(data:any,fail=false){TestBed.configureTestingModule({imports:[PublicEventos],providers:[provideRouter([]),{provide:EventosService,useValue:{obtenerEventosActivos:()=>fail?throwError(()=>new Error('offline')):of(data)}}]});const f=TestBed.createComponent(PublicEventos);f.detectChanges();return f;}
 afterEach(()=>TestBed.resetTestingModule());
 it('has a real empty state without invented event dates, images or a checkout',()=>{const f=create([]);expect(f.nativeElement.textContent).toContain('No hay eventos anunciados');expect(f.nativeElement.textContent).not.toContain('INFAMOUS');expect(f.nativeElement.querySelector('a[href*="/evento/"]')).toBeNull();});
 it('gives one configured event prominence and links to its page even when sales are closed',()=>{const f=create([{...event,estado:false,ventas_abiertas:false}]);expect(f.nativeElement.querySelector('h1').textContent).toContain(event.nombre);expect(f.nativeElement.querySelector('a[href="/evento/71"]')).not.toBeNull();expect(f.nativeElement.textContent).toContain('Ventas cerradas');});
 it('respects the designated featured event instead of re-sorting by date or dropping selected past events',()=>{const f=create([{...event,id_evento:1,fecha:'2000-01-01'},{...event,id_evento:2,nombre:'Destacado',destacado:true}]);expect(f.componentInstance.destacado.id_evento).toBe(2);expect(f.componentInstance.otros[0].id_evento).toBe(1);expect(f.nativeElement.querySelector('h1').textContent).toContain('Destacado');expect(f.nativeElement.querySelectorAll('.event-card').length).toBe(1);});
 it('never links an announcement to a private detail or checkout',()=>{const f=create([{...event,publicacion:'PROXIMAMENTE',estado:false,ventas_abiertas:false}]);expect(f.nativeElement.textContent).toContain('Próximamente');expect(f.nativeElement.querySelector('a[href*="/evento/"]')).toBeNull();});
 it('shows a distinct retryable error rather than the empty state',()=>{const f=create([],true);expect(f.nativeElement.querySelector('[role="alert"]')).not.toBeNull();expect(f.nativeElement.textContent).toContain('Reintentar');expect(f.nativeElement.textContent).not.toContain('No hay eventos anunciados');});
});
