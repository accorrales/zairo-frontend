import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { Empleados } from './empleados';
import { EmpleadosService } from '../../core/services/empleados.service';
import { DepartamentosService } from '../../core/services/departamentos.service';

describe('Empleados', () => {
 let component: Empleados;
 let fixture: ComponentFixture<Empleados>;
 let service: {getEmpleados: ReturnType<typeof vi.fn>,deleteEmpleado: ReturnType<typeof vi.fn>,updateEmpleado: ReturnType<typeof vi.fn>,createEmpleado: ReturnType<typeof vi.fn>};
 beforeEach(async () => {
  service={getEmpleados:vi.fn(()=>of([])),deleteEmpleado:vi.fn(()=>of({})),updateEmpleado:vi.fn(()=>of({})),createEmpleado:vi.fn(()=>of({}))};
  await TestBed.configureTestingModule({imports:[Empleados],providers:[
   {provide:EmpleadosService,useValue:service},
   {provide:DepartamentosService,useValue:{getDepartamentos:()=>of([])}}
  ]}).compileComponents();
  fixture=TestBed.createComponent(Empleados);component=fixture.componentInstance;await fixture.whenStable();
  vi.spyOn(window,'confirm').mockReturnValue(true);
 });
 afterEach(()=>vi.restoreAllMocks());
 it('should create',()=>expect(component).toBeTruthy());
 it('explains linked-history rejection without removing employees',()=>{
  const list=[{id_empleado:1}] as any;component.empleados=list;
  service.deleteEmpleado.mockReturnValue(throwError(()=>({status:409,error:{codigo:'EMPLEADO_CON_HISTORIAL'}})));
  component.eliminarEmpleado(1);
  expect(component.pageState.notice()).toContain('planillas');expect(component.pageState.notice()).toContain('Inactivo');
  expect(component.empleados).toBe(list);expect(component.eliminandoId).toBeNull();
 });
 it('prevents duplicate deletes and refreshes only after confirmation',()=>{
  const result=new Subject<any>();service.deleteEmpleado.mockReturnValue(result);
  const before=service.getEmpleados.mock.calls.length;
  component.eliminarEmpleado(1);component.eliminarEmpleado(1);
  expect(service.deleteEmpleado).toHaveBeenCalledTimes(1);expect(service.getEmpleados).toHaveBeenCalledTimes(before);
  result.next({});result.complete();expect(component.eliminandoId).toBeNull();expect(service.getEmpleados).toHaveBeenCalledTimes(before+1);
 });
 it('does not delete when confirmation is cancelled',()=>{
  vi.mocked(window.confirm).mockReturnValue(false);component.eliminarEmpleado(1);expect(service.deleteEmpleado).not.toHaveBeenCalled();
 });
 it('distinguishes authorization, missing employee and uncertain connection',()=>{
  for(const [status,message] of [[403,'permiso'],[404,'ya no existe'],[0,'No pudimos confirmar']] as const){
   service.deleteEmpleado.mockReturnValue(throwError(()=>({status})));component.eliminarEmpleado(1);expect(component.pageState.notice()).toContain(message);
  }
 });
 it('preserves inactive state when saving and exposes the state field',async()=>{
  component.editarEmpleado({id_empleado:1,estado:false,fecha_ingreso:'2026-01-01',salario_base:100,id_departamento:1});
  fixture.changeDetectorRef.markForCheck();await fixture.whenStable();
  expect(fixture.nativeElement.textContent).toContain('Inactivo conserva sus planillas');
  component.guardarEmpleado();expect(service.updateEmpleado).toHaveBeenCalledWith(1,expect.objectContaining({estado:false}));
 });
 it('new employee action clears a cancelled edit target',()=>{
  component.editarEmpleado({id_empleado:1,estado:false});component.cerrarModal();component.abrirModal();
  expect(component.modoEdicion).toBe(false);expect(component.empleadoEditandoId).toBeNull();
 });
});
