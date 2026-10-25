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
    fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    vi.spyOn(fixture.componentInstance, 'irA').mockImplementation(() => {});
    return fixture;
  }
  afterEach(() => { vi.restoreAllMocks(); createPurchase.mockClear(); TestBed.resetTestingModule(); });
  it('places the age-access notice only at the end and labels the available purchase action', () => {
    const fixture = create();
    const component = fixture.componentInstance;
    component.seleccionarZona(component.zonas.find(z => z.clave === 'general'));
    fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const notices = element.querySelectorAll('.access-rules--footer');
    expect(notices.length).toBe(1);
    expect(element.querySelector('.hero .access-rule strong')?.textContent).toContain('Horarios');
    expect(element.querySelector('.hero')?.textContent).not.toContain('Ingreso de menores de edad');
    expect(element.querySelector('.select-btn')?.textContent?.trim()).toBe('Comprar entrada');
    expect(element.querySelector('.lost-detail')?.lastElementChild?.classList.contains('access-rules--footer')).toBe(true);
  });
  it('requires the SINPE payer name and includes their name and payment instructions in WhatsApp', () => {
    const fixture = create();
    const component = fixture.componentInstance;
    component.seleccionarZona(component.zonas.find(z => z.clave === 'general'));
    component.correoComprador = 'test@example.com';
    component.telefonoComprador = '88888888';
    component.personas = [{ nombre_completo: 'Persona Ejemplo', fecha_nacimiento: '2000-01-01' }];
    expect(component.validarCompra()).toContain('nombre de quien realizará el SINPE');
    component.nombreComprador = 'Cliente Prueba';
    expect(component.validarCompra()).toBeNull();
    const redirect = vi.spyOn(component as any, 'redireccionarAWhatsapp').mockImplementation(() => {});
    component.abrirWhatsapp({ id_compra: 123 }, null);
    const message = decodeURIComponent((redirect.mock.calls[0][0] as string).split('?text=')[1]);
    expect(message).toContain('Número: 61518701');
    expect(message).toContain('A nombre de: Ander Baruc Corrales Araya');
    expect(message).toContain('Detalle del comprobante: Cliente Prueba');
  });
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
    buttons[0].click(); fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.tierSeleccionado.id_tier).toBe(2);
    expect(fixture.nativeElement.querySelector('#checkout')).not.toBeNull();
    component.codigoAplicado = true; component.descuentoAplicado = 1000;
    buttons[1].click(); fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
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
    fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.phase-track')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.zones button').length).toBe(3);
    component.codigoAplicado = true;
    component.tiers = [
      { id_tier: 2, nombre: 'General Tier 2', precio: 7000, disponibilidad: 'CERRADO' },
      { id_tier: 7, nombre: 'General Tier 3', precio: 8000, disponibilidad: 'DISPONIBLE' }
    ];
    component.agruparPorZona(); fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
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
    fixture.nativeElement.querySelector('.map-zone.general').click(); fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    expect(fixture.componentInstance.tierSeleccionado.id_tier).toBe(2);
    expect(fixture.nativeElement.querySelector('.map-zone.general').getAttribute('aria-pressed')).toBe('true');
  });
  it('prices six VIP once and displays shared package benefits without coupons', () => {
    const fixture=create();const c=fixture.componentInstance;
    const promo={id_tier:25,zona:'VIP',nombre:'VIP Red Bull',beneficios_paquete:'1 mesa, 1 litro Jack y 4 Red Bulls',precio:75000,entradas_por_paquete:6,estado:true,disponibilidad:'DISPONIBLE'};
    c.tiers.push(promo);c.seleccionarPromocion(promo);fixture.changeDetectorRef.markForCheck();fixture.detectChanges();
    expect(c.calcularSubtotal()).toBe(75000);expect(c.personas.length).toBe(6);expect(c.opcionesCantidad).toEqual([6]);
    expect(fixture.nativeElement.textContent).toContain(promo.beneficios_paquete);expect(fixture.nativeElement.querySelector('#discount-code')).toBeNull();
  });
  it('prices a four-person package once, maintains person fields and hides inventory', () => {
    const fixture = create(); const component = fixture.componentInstance;
    const promo = {id_tier:20,nombre:'Promo General 4',precio:20000,entradas_por_paquete:4,estado:true,disponibilidad:'DISPONIBLE',cantidad_disponible:123};
    component.tiers.push(promo); component.agruparPorZona();
    expect(component.zonas.find(z=>z.clave==='general').fases.map((t:any)=>t.id_tier)).not.toContain(20);
    component.seleccionarPromocion(promo); fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    expect(component.cantidad).toBe(4); expect(component.personas.length).toBe(4);
    expect(component.calcularSubtotal()).toBe(20000);
    expect(component.opcionesCantidad).toEqual([4,8]);
    expect(fixture.nativeElement.querySelector('#discount-code')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('123');
    component.cantidad=8;component.actualizarPersonas();
    expect(component.personas.length).toBe(8);expect(component.calcularSubtotal()).toBe(40000);
    component.agruparPorZona();expect(component.tierSeleccionado.id_tier).toBe(20);
    component.seleccionarZona(component.zonas.find(z=>z.clave==='general'));
    expect(component.cantidad).toBe(1);expect(component.calcularSubtotal()).toBe(7000);
  });
});
