import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {of,Subject,throwError} from 'rxjs';
import {DashboardEntradas} from './dashboard-entradas';
import {EventosService} from '../../core/services/eventos.service';
import {EntradasConfirmadasService} from '../../core/services/entradas-confirmadas.service';

describe('Ticket spreadsheet download',()=>{
 let service:any,component:DashboardEntradas;
 beforeEach(async()=>{
  service={descargarReporteExcel:vi.fn(()=>of(new Blob(['xlsx']))),descargarReporteCsv:vi.fn(()=>of(new Blob(['csv'])))};
  await TestBed.configureTestingModule({imports:[DashboardEntradas],providers:[provideRouter([]),
   {provide:EventosService,useValue:{obtenerEventos:()=>of([])}},{provide:EntradasConfirmadasService,useValue:service}
  ]}).compileComponents();
  const fixture=TestBed.createComponent(DashboardEntradas);component=fixture.componentInstance;await fixture.whenStable();
  vi.spyOn(URL,'createObjectURL').mockReturnValue('blob:ficticio');
  vi.spyOn(URL,'revokeObjectURL').mockImplementation(()=>{});
 });
 afterEach(()=>{vi.restoreAllMocks();});
 it('downloads an actual xlsx filename by default and retains optional CSV',()=>{
  const names:string[]=[];vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(function(this:HTMLAnchorElement){names.push(this.download);});
  component.eventoSeleccionado=6;component.descargarReporte();component.descargarReporte('csv');
  expect(names).toEqual(['entradas-6.xlsx','entradas-6.csv']);expect(service.descargarReporteExcel).toHaveBeenCalledWith(6);expect(service.descargarReporteCsv).toHaveBeenCalledWith(6);
 });
 it('prevents duplicate download requests and releases the loading state',()=>{
  const request=new Subject<Blob>();service.descargarReporteExcel.mockReturnValue(request);component.eventoSeleccionado=6;
  component.descargarReporte();component.descargarReporte();expect(service.descargarReporteExcel).toHaveBeenCalledTimes(1);expect(component.descargandoReporte).toBe(true);
  request.error({status:403});expect(component.descargandoReporte).toBe(false);expect(component.pageState.notice()).toContain('permiso');
 });
 it('does not download with no selected event or overwrite a different event with an old error',()=>{
  component.descargarReporte();expect(service.descargarReporteExcel).not.toHaveBeenCalled();
  const request=new Subject<Blob>();service.descargarReporteExcel.mockReturnValue(request);component.eventoSeleccionado=6;component.descargarReporte();component.eventoSeleccionado=7;request.error({status:500});expect(component.pageState.notice()).toBe('');
 });
 it('decodes a report-specific JSON error delivered as a blob',async()=>{
  const body=new Blob([],{type:'application/json'});
  Object.defineProperty(body,'text',{value:async()=>JSON.stringify({codigo:'ADMIN_REPORTE_INVALIDO',error:'El reporte contiene un importe no válido.'})});
  service.descargarReporteExcel.mockReturnValue(throwError(()=>({status:422,error:body})));
  component.eventoSeleccionado=6;component.descargarReporte();await new Promise(r=>setTimeout(r,0));
  expect(component.pageState.notice()).toContain('importe no válido');expect(component.descargandoReporte).toBe(false);
 });
});
