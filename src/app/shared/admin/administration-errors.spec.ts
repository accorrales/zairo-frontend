import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {of,throwError} from 'rxjs';
import {Novedades} from '../../pages/novedades/novedades';
import {Planillas} from '../../pages/planillas/planillas';
import {Reportes} from '../../pages/reportes/reportes';
import {Dashboard} from '../../pages/dashboard/dashboard';
import {NovedadesService} from '../../core/services/novedades.service';
import {EmpleadosService} from '../../core/services/empleados.service';
import {ConceptosService} from '../../core/services/conceptos.service';
import {PlanillasService} from '../../core/services/planillas.service';
import {DashboardService} from '../../core/services/dashboard.service';
import {AuthService} from '../../core/services/auth.service';

describe('Operation-specific feedback across administration',()=>{
 afterEach(()=>TestBed.resetTestingModule());
 it('keeps the novedad form when its selected concept no longer exists',async()=>{
  const create=vi.fn(()=>throwError(()=>({status:409,error:{codigo:'ADMIN_REFERENCIA_NO_DISPONIBLE',error:'El concepto seleccionado ya no existe. Actualizá las opciones.'}})));
  await TestBed.configureTestingModule({imports:[Novedades],providers:[provideRouter([]),
   {provide:NovedadesService,useValue:{obtenerNovedades:()=>of([]),crearNovedad:create}},
   {provide:EmpleadosService,useValue:{obtenerEmpleados:()=>of([])}},
   {provide:ConceptosService,useValue:{obtenerConceptos:()=>of([])}},
   {provide:PlanillasService,useValue:{getPlanillas:()=>of([])}}
  ]}).compileComponents();
  const f=TestBed.createComponent(Novedades);await f.whenStable();const c=f.componentInstance;
  Object.assign(c.nuevaNovedad,{id_empleado:1,id_planilla:1,id_concepto:99,monto:100});c.guardarNovedad();
  expect(c.pageState.notice()).toContain('concepto seleccionado');expect(c.nuevaNovedad.monto).toBe(100);expect(create).toHaveBeenCalledTimes(1);
 });
 it('shows why confirmation is blocked and preserves existing planilla totals',async()=>{
  const rows=[{id_planilla:1,estado:'PENDIENTE',total_neto:31000}];
  const confirm=vi.fn(()=>throwError(()=>({status:400,error:{codigo:'ADMIN_PLANILLA_PENDIENTE',error:'No se puede confirmar una planilla pendiente. Primero debe procesarse.'}})));
  await TestBed.configureTestingModule({imports:[Planillas],providers:[provideRouter([]),{provide:PlanillasService,useValue:{getPlanillas:()=>of(rows),confirmarPlanilla:confirm}}]}).compileComponents();
  const f=TestBed.createComponent(Planillas);await f.whenStable();const c=f.componentInstance;
  c.confirmar(1);c.confirmarAccion();expect(c.pageState.notice()).toContain('Primero debe procesarse');expect(c.planillas[0].total_neto).toBe(31000);expect(confirm).toHaveBeenCalledTimes(1);
 });
 it('shows report permission failure instead of rendering financial cards with zeros',async()=>{
  await TestBed.configureTestingModule({imports:[Reportes],providers:[provideRouter([]),
   {provide:AuthService,useValue:{getRole:()=> 'contabilidad',getUser:()=>({nombre:'Prueba',rol:'contabilidad'})}},
   {provide:PlanillasService,useValue:{getPlanillas:()=>throwError(()=>({status:403}))}}
  ]}).compileComponents();
  const f=TestBed.createComponent(Reportes);await f.whenStable();
  expect(f.componentInstance.pageState.error()).toContain('permiso');expect(f.nativeElement.querySelector('.cards')).toBeNull();
 });
 it('explains summary network failure while retaining previously loaded values',async()=>{
  const loaded={totalEmpleados:2,empleadosActivos:1,totalDepartamentos:1,promedioSalario:100,ultimosEmpleados:[],empleadosPorDepartamento:[]};
  const get=vi.fn(()=>of(loaded));
  await TestBed.configureTestingModule({imports:[Dashboard],providers:[provideRouter([]),{provide:DashboardService,useValue:{getDashboardData:get}}]}).compileComponents();
  const f=TestBed.createComponent(Dashboard);await f.whenStable();const c=f.componentInstance;
  get.mockReturnValue(throwError(()=>({status:0})));c.cargarDashboard();
  expect(c.pageState.error()).toContain('conectar');expect(c.resumen.promedioSalario).toBe(100);expect(c.pageState.retryable()).toBe(true);
 });
});
