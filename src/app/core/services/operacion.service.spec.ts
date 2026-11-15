import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { OperacionService, operationalQR } from './operacion.service';
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
        const result = await retry;
        expect(result.status).toBe(200);
        expect(api.pending('scan')).not.toBeNull();
        api.acknowledge('scan', result);
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
        const result = await recovery;
        expect(result.body.message).toBe('Entrega confirmada');
        expect(api.pending('delivery')).not.toBeNull();
        api.acknowledge('delivery', result);
        expect(api.pending('delivery')).toBeNull();
    });
    it('keeps an explicit rejection distinct from a connection failure', async () => { const request = api.perform('scan', '/escanear', { id_evento: 1 }); const req = http.expectOne(x => x.url.endsWith('/escanear')); req.flush({ message: 'Entrada usada' }, { status: 409, statusText: 'Conflict', headers: { 'X-Zairo-Operation-Id': req.request.body.operation_id } }); const result = await request; expect(result.status).toBe(409); api.acknowledge('scan', result); expect(api.pending('scan')).toBeNull(); });
    it('blocks other scopes and retains a completed request until its live view consumes it', async () => {
        const first = api.perform('grupo-1', '/paquetes/1/entrega', { id_evento: 2, cantidad: 1 });
        const r = http.expectOne(x => x.url.endsWith('/entrega'));
        const key = r.request.body.operation_id;
        await expect(api.perform('scan', '/escanear', { id_evento: 2 })).rejects.toMatchObject({ uncertain: true });
        r.flush({ message: 'Confirmada' });
        const result = await first;
        expect(api.pendingList()[0]).toMatchObject({ scope: 'grupo-1', event: 2, packageId: 1 });
        api.acknowledge('grupo-1', { ...result, operationId: 'incorrecta' });
        expect(api.hasPending()).toBe(true);
        // Destroyed panels do not acknowledge; another view can recover the original receipt.
        const recovery = api.recover('grupo-1');
        http.expectOne(x => x.url.endsWith('/operaciones/' + key)).flush({ status: 200, body: { message: 'Confirmada' } });
        api.acknowledge('grupo-1', await recovery);
        expect(api.hasPending()).toBe(false);
    });
    it('refuses a duplicate retry while the original request is in flight', async () => {
        const first = api.perform('scan', '/escanear', { id_evento: 1 });
        const request = http.expectOne(x => x.url.endsWith('/escanear'));
        await expect(api.retry('scan')).rejects.toMatchObject({ uncertain: true });
        request.flush({ valido: true });
        api.acknowledge('scan', await first);
    });
    it('does not discard an uncertain request on an unreceipted authorization or proxy rejection', async () => {
        const initial = api.perform('scan', '/escanear', { id_evento: 1 });
        http.expectOne(x => x.url.endsWith('/escanear')).flush({}, { status: 503, statusText: 'Unavailable' });
        await expect(initial).rejects.toMatchObject({ uncertain: true });
        const key = api.pending('scan')!.body.operation_id;
        const retry = api.retry('scan');
        http.expectOne(x => x.url.endsWith('/escanear')).flush({ message: 'Sesión expirada' }, { status: 401, statusText: 'Unauthorized' });
        await expect(retry).rejects.toMatchObject({ uncertain: true });
        expect(api.pending('scan')!.body.operation_id).toBe(key);
    });
    it('stores only a canonical QR identifier, never names or extra personal fields', () => {
        const uuid = '00000000-0000-4000-8000-000000000001';
        expect(operationalQR(JSON.stringify({ tipo: 'ZAIRO_TICKET', uuid, nombre: 'Dato que no debe guardarse' }))).toBe(uuid);
        expect(operationalQR('https://example.invalid/t/' + uuid + '?nombre=privado')).toBe(uuid);
        expect(operationalQR('Texto personal inválido')).toBe('QR_INVALIDO');
    });
});
