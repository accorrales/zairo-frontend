import {TestBed} from '@angular/core/testing';
import {ActivatedRoute,convertToParamMap,provideRouter} from '@angular/router';
import {of,throwError} from 'rxjs';
import {PublicEventPage} from './public-event-page';
import {EventosService} from '../../core/services/eventos.service';
import {EntradaTiersService} from '../../core/services/entrada-tiers.service';
describe('Public event editorial and sales separation',()=>{
 const content={historia:'Historia pública',concepto:'Concepto propio',artistas:[{nombre:'Artista ficticia'}],imagenes:[],videos:[],colores:{fondo:'#080b0a',texto:'#f3f6ef',acento:'#c6ff57'},secciones:[{tipo:'artistas',titulo:'Lineup',visible:true},{tipo:'historia',titulo:'Nuestra historia',visible:true},{tipo:'galeria',titulo:'Galería privada',visible:false},{tipo:'informacion',titulo:'Información',visible:true}]};
 const event={id_evento:71,nombre:'AURORA',fecha:'2099-12-01',publicacion:'PUBLICADO',estado:false,ventas_abiertas:false,contenido:content};
 const tiers=[{id_tier:5,nombre:'Seis VIP',precio:75000,entradas_por_paquete:6,zona:'VIP',beneficios_paquete:'Mesa y bebidas',estado:true,disponibilidad:'DISPONIBLE'}];
 function create(open=false,fail=false){const getTiers=vi.fn(()=>of(tiers));TestBed.configureTestingModule({imports:[PublicEventPage],providers:[provideRouter([]),{provide:ActivatedRoute,useValue:{paramMap:of(convertToParamMap({id:'71'}))}},{provide:EventosService,useValue:{obtenerEventoPorId:()=>fail?throwError(()=>({status:404})):of({...event,estado:open,ventas_abiertas:open})}},{provide:EntradaTiersService,useValue:{obtenerTiersPorEvento:getTiers}}]});const f=TestBed.createComponent(PublicEventPage);f.detectChanges();return {f,getTiers};}
 afterEach(()=>TestBed.resetTestingModule());
 it('presents published content and promotions with closed sales and no buying link',()=>{const {f,getTiers}=create();expect(getTiers).toHaveBeenCalled();expect(f.nativeElement.textContent).toContain('Historia pública');expect(f.nativeElement.textContent).toContain('Seis VIP');expect(f.nativeElement.textContent).toContain('Ventas cerradas');expect(f.nativeElement.querySelector('a[href*="/comprar"]')).toBeNull();expect(f.nativeElement.querySelector('[data-section="galeria"]')).toBeNull();expect(f.nativeElement.querySelectorAll('[data-section]')[0].dataset.section).toBe('artistas');});
 it('links an available promotional package to the existing checkout and its real tier',()=>{const {f}=create(true);expect(f.nativeElement.querySelector('a[href="/evento/71/comprar?tier=5"]')).not.toBeNull();expect(f.nativeElement.textContent).toContain('Mesa y bebidas');});
 it('never renders details or tiers after a draft/unavailable response',()=>{const {f,getTiers}=create(false,true);expect(f.nativeElement.textContent).toContain('Este evento no está disponible');expect(getTiers).not.toHaveBeenCalled();expect(f.nativeElement.querySelector('app-event-sections')).toBeNull();});
});
