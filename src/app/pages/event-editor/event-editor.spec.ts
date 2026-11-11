import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute, convertToParamMap } from '@angular/router';
import { EventEditor } from './event-editor';

describe('Event editor draft workflow',()=>{
  const url='/api/eventos/73';
  let component:EventEditor;
  let http:HttpTestingController;
  beforeEach(()=>{
    TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting(),provideRouter([]),{provide:ActivatedRoute,useValue:{snapshot:{paramMap:convertToParamMap({id:'73'})}}}]});
    http=TestBed.inject(HttpTestingController);
    component=TestBed.runInInjectionContext(()=>new EventEditor());
    component.ngOnInit();
    http.expectOne(url+'/contenido').flush({revision:4,publicacion:'PUBLICADO',ventas_abiertas:false,mostrar_en_home:true,destacado:false,contenido:{nombre:'Prueba',fecha:'2099-12-01T02:00:00.000Z',historia:'Versión guardada',artistas:[],imagenes:[],colores:{fondo:'#080b0a',texto:'#f3f6ef',acento:'#c6ff57'},secciones:[]}});
  });
  afterEach(()=>http.verify());
  it('saves a private draft with optimistic revision and Costa Rica date without publishing',()=>{
    expect(component.content.fecha).toBe('2099-11-30T20:00');
    component.content.historia='Cambio privado';component.changed();component.save();
    const request=http.expectOne(url+'/contenido');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body.revision).toBe(4);
    expect(request.request.body.contenido.fecha).toBe('2099-12-01T02:00:00.000Z');
    expect(request.request.body.contenido.historia).toBe('Cambio privado');
    request.flush({revision:5});
    expect(component.dirty).toBe(false);
    expect(component.currentPublication).toBe('PUBLICADO');
    expect(component.currentSales).toBe(false);
  });
  it('keeps dirty data on a version conflict instead of claiming it was saved',()=>{
    component.changed();component.save();http.expectOne(url+'/contenido').flush({error:'El evento cambió'},{status:409,statusText:'Conflict'});
    expect(component.dirty).toBe(true);expect(component.busy).toBe(false);expect(component.error).toContain('cambió');
    component.publish();http.expectNone(url+'/publicacion');
  });
  it('teaser and private draft controls close sales and cannot feature an invisible event',()=>{
    component.sales=true;component.publication='PROXIMAMENTE';component.publicationChanged();expect(component.sales).toBe(false);
    component.featured=true;component.publication='BORRADOR';component.publicationChanged();expect(component.home).toBe(false);expect(component.featured).toBe(false);
    component.publish();const request=http.expectOne(url+'/publicacion');expect(request.request.body.ventas_abiertas).toBe(false);expect(request.request.body.publicacion).toBe('BORRADOR');request.flush({revision:5,publicacion:'BORRADOR',ventas_abiertas:false});
    expect(component.currentPublication).toBe('BORRADOR');
  });
});
