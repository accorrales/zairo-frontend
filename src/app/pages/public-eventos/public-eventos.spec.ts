import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PublicEventos } from './public-eventos';
import { EventosService } from '../../core/services/eventos.service';

describe('PublicEventos dynamic experience', () => {
  const event = { id_evento: 71, nombre: 'INFAMOUS', fecha: '2099-10-31T20:00:00-06:00', estado: true, ubicacion: 'Occidente' };
  function create(data: any, fail = false) {
    TestBed.configureTestingModule({ imports: [PublicEventos], providers: [provideRouter([]), { provide: EventosService, useValue: { obtenerEventosActivos: () => fail ? throwError(() => new Error('offline')) : of(data) } }] });
    const fixture = TestBed.createComponent(PublicEventos);
    fixture.detectChanges();
    return fixture;
  }
  afterEach(() => TestBed.resetTestingModule());
  it('uses Angular route fragments for the two section links', () => {
    const fixture = create([event]);
    const links = fixture.nativeElement.querySelectorAll('nav a');
    expect(links[0].getAttribute('href')).toBe('/home#lineup');
    expect(links[1].getAttribute('href')).toBe('/home#experiencia');
  });
  it('normalizes the backend envelope, filters old events and links to the real event', () => {
    const fixture = create({ data: [{ ...event, id_evento: 1, fecha: '2000-01-01' }, event] });
    expect(fixture.componentInstance.eventos.length).toBe(1);
    expect(fixture.nativeElement.querySelector('.primary-cta').getAttribute('href')).toBe('/evento/71');
    expect(fixture.nativeElement.textContent).toContain('El despertar de las almas');
  });
  it('does not attach the INFAMOUS lineup to the next unrelated event', () => {
    const fixture = create([{ ...event, nombre: 'Nueva experiencia' }]);
    expect(fixture.componentInstance.esInfamous).toBe(false);
    expect(fixture.nativeElement.querySelector('app-infamous-experience')).toBeNull();
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Nueva experiencia');
  });
  it('does not offer a purchase link for a closed event', () => {
    const fixture = create([{ ...event, estado: false }]);
    expect(fixture.nativeElement.querySelector('.primary-cta')).toBeNull();
    expect(fixture.componentInstance.ventaAbierta).toBe(false);
  });
  it('handles empty events and an API failure without inventing an available sale', () => {
    const fixture = create([], true);
    expect(fixture.componentInstance.errorCarga).toBe(true);
    expect(fixture.componentInstance.ventaAbierta).toBe(false);
    expect(fixture.nativeElement.querySelector('.primary-cta')).toBeNull();
  });
  it('clamps expired and invalid countdowns to zero', () => {
    const fixture = create([{ ...event, fecha: '2000-01-01' }]);
    const component = fixture.componentInstance;
    component.eventos = [{ ...event, fecha: 'invalid' }];
    component.actualizarCountdown();
    expect(component.countdown).toEqual({ dias: '00', horas: '00', minutos: '00', segundos: '00' });
    component.ngOnDestroy();
  });
});
