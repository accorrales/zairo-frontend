import {TestBed} from '@angular/core/testing';
import {vi} from 'vitest';
import {PendingOperations} from './pending-operations';
import {OperacionService} from '../../core/services/operacion.service';
it('embeds recovery controls without duplicating the ingress heading/explanation, even after failed recovery',async()=>{
 const api={pendingList:()=>[{scope:'scan',path:'/escanear',body:{id_evento:1,operation_id:'original'},packageId:null}],isActive:()=>false,recover:vi.fn().mockRejectedValue(new Error('No pudimos confirmar el ingreso.'))};
 TestBed.configureTestingModule({providers:[{provide:OperacionService,useValue:api}]});const fixture=TestBed.createComponent(PendingOperations);fixture.componentRef.setInput('controlsOnly',true);fixture.detectChanges();
 expect(fixture.nativeElement.querySelectorAll('.pending-operation,h3').length).toBe(0);expect(fixture.nativeElement.textContent).not.toContain('No pudimos confirmar el ingreso');
 await fixture.componentInstance.resolve(api.pendingList()[0] as any,false);fixture.detectChanges();expect(api.recover).toHaveBeenCalledWith('scan');expect(fixture.nativeElement.textContent).toContain('La operación original sigue pendiente');expect(fixture.nativeElement.textContent).not.toContain('No pudimos confirmar el ingreso');expect(fixture.nativeElement.querySelectorAll('button').length).toBe(2);
});
