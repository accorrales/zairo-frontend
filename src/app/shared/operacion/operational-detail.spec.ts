import {TestBed} from '@angular/core/testing';
import {OperationalDetail} from './operational-detail';
import {OperacionService} from '../../core/services/operacion.service';
import {signal} from '@angular/core';
describe('persistent package header',()=>{
 it('updates package, reservation and uncertain state without presenting the former table as the new reservation',()=>{
  const pending=signal<any>(null);
  TestBed.configureTestingModule({providers:[{provide:OperacionService,useValue:{pending:()=>pending()}}]});
  const fixture=TestBed.createComponent(OperationalDetail);
  const text=()=>fixture.nativeElement.querySelector('.package-reference').textContent;
  fixture.componentRef.setInput('grupo',{id_paquete:131,mesa:'VIP A'});fixture.detectChanges();expect(text()).toContain('Paquete #131 · Mesa reservada: VIP A');
  pending.set({path:'/paquetes/131/mesa'});fixture.detectChanges();expect(text()).toContain('Cambio de mesa sin confirmar');expect(text()).not.toContain('VIP A');
  pending.set(null);fixture.componentRef.setInput('grupo',{id_paquete:131,mesa:'VIP B'});fixture.detectChanges();expect(text()).toContain('VIP B');
  fixture.componentRef.setInput('grupo',{id_paquete:132,mesa_tipo:'COCTEL'});fixture.detectChanges();expect(text()).toContain('#132 · Pendiente de asignación');
  fixture.componentRef.setInput('grupo',{id_paquete:133});fixture.detectChanges();expect(text()).toContain('#133 · Sin mesa incluida');
  expect(fixture.nativeElement.querySelector('[data-dialog-close]').textContent.trim()).toBe('Cerrar detalle');
 });
});
