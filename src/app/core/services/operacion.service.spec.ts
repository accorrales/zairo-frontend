import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { OperacionService } from './operacion.service';
import { AuthService } from './auth.service';
describe('recoverable operational requests', () => {
    let api: OperacionService, http: HttpTestingController;
    beforeEach(() => { localStorage.clear(); TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: AuthService, useValue: { getUser: () => ({ correo: 'prueba@example.invalid' }) } }] }); api = TestBed.inject(OperacionService); http = TestBed.inject(HttpTestingController); });
    afterEach(() => { http.verify(); localStorage.clear(); });
    it('retains the same key after an uncertain response and never creates a second operation', async () => {
        const request = api.perform('scan', '/escanear', { id_evento: 1, qr_data: 'ficticio' });
        const first = http.expectOne(r => r.url.endsWith('/escanear'));
        const key = first.request.body.operation_id;
        first.flush({}, { status: 503, statusText: 'Unavailable' });
        await expect(request).rejects.toMatchObject({ uncertain: true });
        expect(api.pending('scan')?.body.operation_id).toBe(key);
        await expect(api.perform('scan', '/escanear', { id_evento: 1, qr_data: 'otra' })).rejects.toMatchObject({ uncertain: true });
        const retry = api.retry('scan');
        const next = http.expectOne(r => r.url.endsWith('/escanear'));
        expect(next.request.body.operation_id).toBe(key);
        next.flush({ valido: true });
        expect((await retry).status).toBe(200);
        expect(api.pending('scan')).toBeNull();
    });
    it('recovers a committed operation by reading its result, without another scan', async () => {
        const request = api.perform('delivery', '/paquetes/1/entrega', { cantidad: 1 });
        const r = http.expectOne(x => x.url.includes('/entrega'));
        r.flush({}, { status: 503, statusText: 'Unavailable' });
        await expect(request).rejects.toMatchObject({ uncertain: true });
        const key = api.pending('delivery')!.body.operation_id;
        const recovery = api.recover('delivery');
        http.expectOne(x => x.url.endsWith('/operaciones/' + key)).flush({ status: 200, body: { message: 'Entrega confirmada' } });
        expect((await recovery).body.message).toBe('Entrega confirmada');
        expect(api.pending('delivery')).toBeNull();
    });
    it('keeps an explicit rejection distinct from a connection failure', async () => { const request = api.perform('scan', '/escanear', { id_evento: 1 }); http.expectOne(x => x.url.endsWith('/escanear')).flush({ message: 'Entrada usada' }, { status: 409, statusText: 'Conflict' }); expect((await request).status).toBe(409); expect(api.pending('scan')).toBeNull(); });
});
