import {TestBed} from '@angular/core/testing';
import {of,throwError} from 'rxjs';
import {Conceptos} from './conceptos';
import {ConceptosService} from '../../core/services/conceptos.service';

describe('Conceptos operation messages',()=>{
 it('shows duplicate/create, validation/update and history/delete errors while retaining the form and list',async()=>{
  const conflict=(codigo:string,error:string,status=409)=>throwError(()=>({status,error:{codigo,error}}));
  const service={obtenerConceptos:vi.fn(()=>of([{id_concepto:1,nombre:'Concepto ficticio',tipo:'PAGO'}])),
   crearConcepto:vi.fn(()=>conflict('ADMIN_DUPLICADO','Ya existe un concepto con ese nombre.')),
   actualizarConcepto:vi.fn(()=>conflict('ADMIN_VALIDACION','El tipo debe ser Pago o Deducción.',422)),
   eliminarConcepto:vi.fn(()=>conflict('ADMIN_REGISTRO_VINCULADO','Tiene novedades asociadas. Conservá el historial.'))};
  await TestBed.configureTestingModule({imports:[Conceptos],providers:[{provide:ConceptosService,useValue:service}]}).compileComponents();
  const fixture=TestBed.createComponent(Conceptos);await fixture.whenStable();const component=fixture.componentInstance;
  component.nuevoConcepto.nombre='Concepto ficticio';component.guardarConcepto();expect(component.pageState.notice()).toContain('Ya existe');expect(component.nuevoConcepto.nombre).toBe('Concepto ficticio');
  component.editarConcepto(component.conceptos[0]);component.guardarConcepto();expect(component.pageState.notice()).toContain('Pago o Deducción');expect(component.editando).toBe(true);
  const confirm=vi.spyOn(window,'confirm').mockReturnValue(true);
  try{component.eliminarConcepto(1);expect(component.pageState.notice()).toContain('historial');expect(component.conceptos.length).toBe(1);expect(service.obtenerConceptos).toHaveBeenCalledTimes(1);}finally{confirm.mockRestore();}
 });
});
