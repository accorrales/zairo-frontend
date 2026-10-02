import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PublicEventoDetalle } from './public-evento-detalle';
import { EventosService } from '../../core/services/eventos.service';
import { EntradaTiersService } from '../../core/services/entrada-tiers.service';
import { ComprasEntradasService } from '../../core/services/compras-entradas.service';
import { CodigosDescuentoService } from '../../core/services/codigos-descuento.service';

describe('PublicEventoDetalle zone and purchase integration', () => {
  const event = { id_evento: 71, nombre: 'INFAMOUS', fecha: '2099-10-31T20:00:00-06:00', estado: true };
  const tiers = [
    { id_tier: 1, nombre: 'General Fase 1', precio: 5000, disponibilidad: 'AGOTADO' },
    { id_tier: 2, nombre: 'General Fase 2', precio: 7000, disponibilidad: 'DISPONIBLE' },
    { id_tier: 3, nombre: 'VIP Fase 1', precio: 12000, disponibilidad: 'PROXIMAMENTE' },
    { id_tier: 4, nombre: 'Backstage', precio: 15000, disponibilidad: 'DESACTIVADO' },
    { id_tier: 5, nombre: 'Palco', precio: 16000, disponibilidad: 'DISPONIBLE', estado: false },
    { id_tier: 6, nombre: 'Experiencia Cristal', precio: 20000, disponibilidad: 'DISPONIBLE' }
  ];
  const createPurchase = vi.fn(() => of({ compra: {} }));
  function create(closed = false, failTiers = false) {
    TestBed.configureTestingModule({ imports: [PublicEventoDetalle], providers: [provideRouter([]),
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '71' }) } } },
      { provide: EventosService, useValue: { obtenerEventoPorId: () => of({ ...event, estado: !closed }) } },
      { provide: EntradaTiersService, useValue: { obtenerTiersPorEvento: () => failTiers ? throwError(() => new Error('offline')) : of(tiers) } },
      { provide: ComprasEntradasService, useValue: { crearCompra: createPurchase } },
      { provide: CodigosDescuentoService, useValue: {} }
    ] });
    const fixture = TestBed.createComponent(PublicEventoDetalle);
    fixture.detectChanges();
    vi.spyOn(fixture.componentInstance, 'irA').mockImplementation(() => {});
    return fixture;
  }
  afterEach(() => { vi.restoreAllMocks(); createPurchase.mockClear(); TestBed.resetTestingModule(); });
  it('keeps sold out and future phases while excluding disabled tiers', () => {
    const fixture = create();
    expect(fixture.componentInstance.tiers.map(t => t.id_tier)).toEqual([1, 2, 3, 6]);
    const general = fixture.componentInstance.zonas.find(z => z.clave === 'general');
    expect(general.fases.length).toBe(2);
    expect(general.faseActual.id_tier).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('PLANO DEL EVENTO');
  }, 15000);
  it('selects a real tier through the reusable selector and clears it for an unavailable zone', () => {
    const fixture = create();
    const buttons = fixture.nativeElement.querySelectorAll('app-event-zone-selector .zones button');
    buttons[0].click(); fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.tierSeleccionado.id_tier).toBe(2);
    expect(fixture.nativeElement.querySelector('#checkout')).not.toBeNull();
    component.codigoAplicado = true; component.descuentoAplicado = 1000;
    buttons[1].click(); fixture.detectChanges();
    expect(component.tierSeleccionado).toBeNull();
    expect(component.codigoAplicado).toBe(false);
    expect(fixture.nativeElement.querySelector('#checkout')).toBeNull();
  });
  it('supports an unknown backend zone without requiring invented map coordinates', () => {
    const fixture = create();
    const zone = fixture.componentInstance.zonas.find(z => z.nombre === 'Experiencia Cristal');
    fixture.componentInstance.seleccionarZona(zone);
    expect(fixture.componentInstance.tierSeleccionado.id_tier).toBe(6);
  });
  it('does not select a purchasable tier or create a purchase for a closed event', () => {
    const fixture = create(true);
    fixture.componentInstance.seleccionarZona(fixture.componentInstance.zonas[0]);
    expect(fixture.componentInstance.tierSeleccionado).toBeNull();
    fixture.componentInstance.crearCompraPendiente();
    expect(createPurchase).not.toHaveBeenCalled();
  });
  it('shows a recoverable error when tiers cannot load', () => {
    const fixture = create(false, true);
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('entradas');
  });
  it('invalidates the selected tier when refreshed availability changes', () => {
    const fixture = create(); const component = fixture.componentInstance;
    component.seleccionarZona(component.zonas[0]);
    component.tiers = component.tiers.map(t => ({ ...t, disponibilidad: 'AGOTADO' }));
    component.agruparPorZona();
    expect(component.tierSeleccionado).toBeNull();
  });
  it('shows one current price per zone and updates the same zone to its next available tier', () => {
    const fixture = create(); const component = fixture.componentInstance;
    component.seleccionarZona(component.zonas.find(z => z.clave === 'general'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.phase-track')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.zones button').length).toBe(3);
    component.codigoAplicado = true;
    component.tiers = [
      { id_tier: 2, nombre: 'General Tier 2', precio: 7000, disponibilidad: 'CERRADO' },
      { id_tier: 7, nombre: 'General Tier 3', precio: 8000, disponibilidad: 'DISPONIBLE' }
    ];
    component.agruparPorZona(); fixture.detectChanges();
    expect(component.zonaSeleccionada.clave).toBe('general');
    expect(component.tierSeleccionado.id_tier).toBe(7);
    expect(component.zonaSeleccionada.precioActual).toBe(8000);
    expect(component.codigoAplicado).toBe(false);
    expect(fixture.nativeElement.querySelectorAll('.zones button').length).toBe(1);
    expect(fixture.nativeElement.querySelector('.zones').textContent).not.toContain('7.000');
  });
  it('selects the live General tier directly from the supplied map', () => {
    const fixture = create();
    expect(fixture.nativeElement.querySelector('.venue img').getAttribute('src')).toContain('event-map.webp');
    fixture.nativeElement.querySelector('.map-zone.general').click(); fixture.detectChanges();
    expect(fixture.componentInstance.tierSeleccionado.id_tier).toBe(2);
    expect(fixture.nativeElement.querySelector('.map-zone.general').getAttribute('aria-pressed')).toBe('true');
  });
});
