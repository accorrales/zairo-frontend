import {TestBed} from '@angular/core/testing';import {provideRouter} from '@angular/router';import {of} from 'rxjs';
import {Reportes} from './reportes';import {AuthService} from '../../core/services/auth.service';import {PlanillasService} from '../../core/services/planillas.service';
describe('Reports preserve financial filtering and backend role boundary',()=>{
 const rows=[{id_planilla:1,estado:'PROCESADA',total_bruto:33000,total_deducciones:2000,total_neto:31000},{id_planilla:2,estado:'CONFIRMADA',total_bruto:1000,total_deducciones:0,total_neto:1000}];
 function create(role:string){const get=vi.fn(()=>of(rows));TestBed.configureTestingModule({imports:[Reportes],providers:[provideRouter([]),{provide:AuthService,useValue:{getRole:()=>role,getUser:()=>({nombre:'Prueba',rol:role})}},{provide:PlanillasService,useValue:{getPlanillas:get}}]});const f=TestBed.createComponent(Reportes);f.detectChanges();return {f,get};}
 afterEach(()=>TestBed.resetTestingModule());
 it('sums the existing response and filters without changing source amounts',()=>{const {f}=create('contabilidad');expect(f.componentInstance.getTotalBruto()).toBe(34000);f.componentInstance.filtroEstado='PROCESADA';f.componentInstance.aplicarFiltro();expect(f.componentInstance.getTotalBruto()).toBe(33000);expect(f.componentInstance.getTotalDeducciones()).toBe(2000);expect(f.componentInstance.getTotalNeto()).toBe(31000);expect(rows[0].total_neto).toBe(31000);});
 it('does not request forbidden planillas or render zero-filled financial cards for visor',()=>{const {f,get}=create('visor');expect(get).not.toHaveBeenCalled();expect(f.nativeElement.querySelector('.cards')).toBeNull();expect(f.nativeElement.querySelector('[role=alert]').textContent).toContain('Tu rol no tiene acceso');});
});
