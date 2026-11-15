import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { GrupoOperativo } from './grupo-operativo';
import { OperacionService } from '../../core/services/operacion.service';
import { AuthService } from '../../core/services/auth.service';
const group = () => ({ id_paquete: 1, id_compra: 1, numero: 1, zona: 'VIP', promocion: 'Prueba', integrantes: 6, ingresados: 3, beneficios: [{ id_beneficio: 4, nombre: 'Bebida', cantidad: 4, entregada: 1, pendiente: 3 }], miembros: [], historial_mesas: [], entregas: [] });
describe('explicit benefit actions', () => {
    let page: GrupoOperativo, api: any;
    beforeEach(() => { api = { hasPending: () => false, pending: () => null, pendingList: () => [], perform: vi.fn(), get: vi.fn(), acknowledge: vi.fn() }; TestBed.configureTestingModule({ providers: [{ provide: OperacionService, useValue: api }, { provide: AuthService, useValue: { getRole: () => 'admin' } }] }); page = TestBed.createComponent(GrupoOperativo).componentInstance; page.event = 1; page.grupo = group(); page.ngOnChanges(); });
    it('rejects zero, fractions, negatives, and amounts above the actual pending balance before any request', () => { for (const n of [0, -1, .5, 4]) {
        page.amounts[4] = n;
        page.prepareDelivery(page.grupo.beneficios[0]);
        expect(page.confirmation).toBeNull();
        expect(page.error).toContain('entera');
    } expect(api.perform).not.toHaveBeenCalled(); });
    it('requires explicit quantity-specific confirmation and never delivers on consultation', () => { page.amounts[4] = 2; page.prepareDelivery(page.grupo.beneficios[0]); expect(page.confirmation?.label).toBe('Registrar entrega: 2 × Bebida'); expect(api.perform).not.toHaveBeenCalled(); page.cancel(); expect(page.confirmation).toBeNull(); });
    it('requires an audit reason for a correction', () => { page.corrections[4] = 1; page.reasons[4] = ''; page.prepareDelivery(page.grupo.beneficios[0], true); expect(page.confirmation).toBeNull(); page.reasons[4] = 'Registro equivocado'; page.prepareDelivery(page.grupo.beneficios[0], true); expect(page.confirmation?.body).toMatchObject({ cantidad: -1, motivo: 'Registro equivocado' }); });
    it('clears the affected quantity and refreshes once after a confirmed delivery', async () => { api.perform.mockResolvedValue({ status: 200, body: { message: 'Confirmada' }, operationId: 'key' }); api.get.mockResolvedValue({ ...group(), beneficios: [{ id_beneficio: 4, nombre: 'Bebida', cantidad: 4, entregada: 4, pendiente: 0 }] }); page.amounts[4] = 3; page.prepareDelivery(page.grupo.beneficios[0]); await page.confirm(); expect(page.amounts[4]).toBeUndefined(); expect(page.grupo.beneficios[0].pendiente).toBe(0); expect(api.get).toHaveBeenCalledTimes(1); expect(api.perform).toHaveBeenCalledTimes(1); });
    it('does not replace a new package with a late group response', async () => { let resolve: any; api.get.mockReturnValue(new Promise(r => resolve = r)); const request = page.refresh(); page.grupo = { ...group(), id_paquete: 2 }; page.ngOnChanges(); resolve(group()); await request; expect(page.grupo.id_paquete).toBe(2); });
});
