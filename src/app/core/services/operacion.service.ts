import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
export interface PendingOperation {
    path: string;
    body: any;
}
export interface PendingSummary extends PendingOperation {
    scope: string;
    kind: string;
    event: number;
    packageId: number | null;
}
export interface OperationResult {
    status: number;
    body: any;
    operationId: string;
}
/** Persist only the ticket identifier, never personal fields embedded in an older JSON QR. */
export function operationalQR(qr: unknown): string {
    if (typeof qr !== 'string' || qr.length > 4096)
        return 'QR_INVALIDO';
    let value: unknown;
    try {
        const data = JSON.parse(qr);
        value = data?.tipo === 'ZAIRO_TICKET' ? data.uuid : null;
    }
    catch {
        value = qr.match(/\/t\/([a-f0-9-]+)/i)?.[1] || qr;
    }
    return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : 'QR_INVALIDO';
}
export function operationKind(op: PendingOperation): string {
    if (op.path.endsWith('/escanear'))
        return 'ingreso';
    if (op.path.endsWith('/entrega'))
        return Number(op.body.cantidad) < 0 ? 'correccion' : 'entrega';
    if (op.path.endsWith('/mesa'))
        return 'reserva';
    if (op.path.includes('/mesas'))
        return 'configuracion';
    return 'cortesia';
}
export function uncertainMessage(op: PendingOperation, admissionConfirmed = false): string {
    switch (operationKind(op)) {
        case 'ingreso': return 'No pudimos confirmar el ingreso. Recuperá el resultado antes de permitir el acceso o iniciar otra validación.';
        case 'entrega': return (admissionConfirmed ? 'El ingreso está confirmado. ' : '') + 'No pudimos confirmar el registro de esta entrega. Recuperá el resultado antes de registrar otra entrega.';
        case 'correccion': return 'No pudimos confirmar la corrección de esta entrega. Recuperá el resultado antes de realizar otro cambio.';
        case 'reserva': return 'No pudimos confirmar el cambio de mesa. Recuperá el resultado antes de realizar otra asignación.';
        case 'configuracion': return 'No pudimos confirmar la configuración de la mesa. Recuperá el resultado antes de realizar otro cambio.';
        default: return 'No pudimos confirmar el registro del tiquete individual. Recuperá el resultado antes de repetir su entrega.';
    }
}
@Injectable({ providedIn: 'root' })
export class OperacionService {
    private http = inject(HttpClient);
    private auth = inject(AuthService);
    private changed = signal(0);
    private active = new Set<string>();
    private root = environment.apiUrl + '/operacion';
    constructor() { const listener = () => this.changed.update(n => n + 1); window.addEventListener('storage', listener); inject(DestroyRef).onDestroy(() => window.removeEventListener('storage', listener)); }
    private prefix() { return 'zairo-operation:' + this.auth.getUser()?.correo + ':'; }
    private key(scope: string) { return this.prefix() + scope; }
    pending(scope: string): PendingOperation | null { this.changed(); try {
        return JSON.parse(localStorage.getItem(this.key(scope)) || 'null');
    }
    catch {
        return null;
    } }
    pendingList(): PendingSummary[] { this.changed(); const prefix = this.prefix(); return Object.keys(localStorage).filter(k => k.startsWith(prefix)).flatMap(k => { const scope = k.slice(prefix.length), op = this.pending(scope); return op?.path && op.body?.operation_id ? [{ ...op, scope, kind: operationKind(op), event: Number(op.body.id_evento), packageId: Number(op.path.match(/paquetes\/(\d+)/)?.[1]) || null }] : []; }); }
    hasPending() { return this.pendingList().length > 0; }
    isActive(scope: string) { this.changed(); return this.active.has(scope); }
    context<T>(view: string, fallback: T): T { try {
        return JSON.parse(sessionStorage.getItem('zairo-context:' + this.auth.getUser()?.correo + ':' + view) || 'null') || fallback;
    }
    catch {
        return fallback;
    } }
    remember(view: string, value: unknown) { try {
        sessionStorage.setItem('zairo-context:' + this.auth.getUser()?.correo + ':' + view, JSON.stringify(value));
    }
    catch { /* Work context is optional, operation persistence is not. */ } }
    get(path: string) { return firstValueFrom(this.http.get<any>(this.root + path).pipe(timeout(12000))); }
    lookup(body: any) { return firstValueFrom(this.http.post<any>(this.root + '/consultar-qr', body).pipe(timeout(12000))); }
    async perform(scope: string, path: string, body: any): Promise<OperationResult> {
        if (this.hasPending())
            throw Object.assign(new Error('Recuperá la operación pendiente antes de iniciar otra.'), { uncertain: true });
        const op = { path, body: { ...body, ...(path.endsWith('/escanear') ? { qr_data: operationalQR(body.qr_data) } : {}), operation_id: crypto.randomUUID() } };
        try {
            localStorage.setItem(this.key(scope), JSON.stringify(op));
        }
        catch {
            throw new Error('No se pudo guardar la solicitud en este dispositivo. No se envió la operación.');
        }
        this.changed.update(n => n + 1);
        return this.send(scope, op);
    }
    async retry(scope: string) { const op = this.pending(scope); if (!op)
        throw new Error('No hay operación pendiente'); return this.send(scope, op); }
    // Keep the request until the live view has consumed the response. A destroyed
    // panel or route must not silently discard an operation completed by the server.
    acknowledge(scope: string, result: OperationResult) { if (this.pending(scope)?.body.operation_id === result.operationId) {
        localStorage.removeItem(this.key(scope));
        this.changed.update(n => n + 1);
    } }
    private async send(scope: string, op: PendingOperation): Promise<OperationResult> {
        if (this.isActive(scope))
            throw Object.assign(new Error('La operación sigue procesándose.'), { uncertain: true });
        this.active.add(scope);
        this.changed.update(n => n + 1);
        try {
            const r = await firstValueFrom(this.http.post<any>(this.root + op.path, op.body, { observe: 'response' }).pipe(timeout(12000)));
            return { status: r.status, body: r.body, operationId: op.body.operation_id };
        }
        catch (e) {
            const err = e as HttpErrorResponse;
            if (err.status >= 400 && err.status < 500 && err.status !== 408 && err.headers?.get('X-Zairo-Operation-Id') === op.body.operation_id)
                return { status: err.status, body: err.error, operationId: op.body.operation_id };
            throw Object.assign(new Error(uncertainMessage(op)), { uncertain: true });
        }
        finally {
            this.active.delete(scope);
            this.changed.update(n => n + 1);
        }
    }
    async recover(scope: string): Promise<OperationResult> { const op = this.pending(scope); if (!op)
        throw new Error('No hay operación pendiente'); if (this.isActive(scope))
        throw new Error('La operación sigue procesándose.'); this.active.add(scope); this.changed.update(n => n + 1); try {
        const result = await this.get('/operaciones/' + op.body.operation_id);
        return { ...result, operationId: op.body.operation_id };
    }
    catch {
        throw Object.assign(new Error(uncertainMessage(op) + ' El resultado aún no está disponible; podés reintentar la misma operación.'), { uncertain: true });
    }
    finally {
        this.active.delete(scope);
        this.changed.update(n => n + 1);
    } }
}
