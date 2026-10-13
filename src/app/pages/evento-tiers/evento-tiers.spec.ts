import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { EventoTiers } from './evento-tiers';
import { EntradaTiersService } from '../../core/services/entrada-tiers.service';
import { AuthService } from '../../core/services/auth.service';

describe('event package configuration', () => {
  it('presets four tickets for 20000, requires a limit and saves an inactive event-specific promotion', () => {
    const create = vi.fn(() => of({}));
    const list = vi.fn(() => of([]));
    TestBed.configureTestingModule({imports:[EventoTiers],providers:[provideRouter([]),
      {provide:ActivatedRoute,useValue:{snapshot:{paramMap:convertToParamMap({id:'71'})}}},
      {provide:AuthService,useValue:{getRole:()=> 'admin',getUser:()=>({nombre:'Admin',rol:'admin'})}},
      {provide:EntradaTiersService,useValue:{obtenerTiersAdmin:list,crearTier:create}}
    ]});
    const fixture=TestBed.createComponent(EventoTiers);fixture.detectChanges();
    const c=fixture.componentInstance;c.usarPromoCuatro();
    expect(c.nuevoTier.entradas_por_paquete).toBe(4);expect(c.nuevoTier.precio).toBe(20000);expect(c.nuevoTier.estado).toBe(false);
    const alert=vi.spyOn(window,'alert').mockImplementation(()=>{});
    c.guardarTier();expect(create).not.toHaveBeenCalled();expect(alert).toHaveBeenCalled();
    c.nuevoTier.cantidad_disponible=12;c.guardarTier();
    expect(create).toHaveBeenCalledWith(expect.objectContaining({id_evento:71,entradas_por_paquete:4,precio:20000,cantidad_disponible:12,estado:false}));
    expect(list).toHaveBeenCalledWith(71);alert.mockRestore();
  });
});
