import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
export interface PendingOperation {
    path: string;
    body: any;
}
@Injectable({ providedIn: 'root' })
export class OperacionService {
    private http = inject(HttpClient);
    private auth = inject(AuthService);
    private root = environment.apiUrl + '/operacion';
    private key(scope: string) { return 'zairo-operation:' + this.auth.getUser()?.correo + ':' + scope; }
    pending(scope: string): PendingOperation | null { try {
        return JSON.parse(localStorage.getItem(this.key(scope)) || 'null');
    }
    catch {
        return null;
    } }
    get(path: string) { return firstValueFrom(this.http.get<any>(this.root + path).pipe(timeout(12000))); }
    lookup(body: any) { return firstValueFrom(this.http.post<any>(this.root + '/consultar-qr', body).pipe(timeout(12000))); }
    async perform(scope: string, path: string, body: any): Promise<any> {
        const old = this.pending(scope);
        if (old)
            throw Object.assign(new Error('Hay una operación pendiente. Recuperá o reintentá su resultado.'), { uncertain: true });
        const op = { path, body: { ...body, operation_id: crypto.randomUUID() } };
        localStorage.setItem(this.key(scope), JSON.stringify(op));
        return this.send(scope, op);
    }
    async retry(scope: string) { const op = this.pending(scope); if (!op)
        throw new Error('No hay operación pendiente'); return this.send(scope, op); }
    private async send(scope: string, op: PendingOperation) { try {
        const r = await firstValueFrom(this.http.post<any>(this.root + op.path, op.body, { observe: 'response' }).pipe(timeout(12000)));
        localStorage.removeItem(this.key(scope));
        return { status: r.status, body: r.body };
    }
    catch (e) {
        const err = e as HttpErrorResponse;
        if (err.status >= 400 && err.status < 500 && err.status !== 408) {
            localStorage.removeItem(this.key(scope));
            return { status: err.status, body: err.error };
        }
        throw Object.assign(new Error('No se pudo verificar. No apruebes ni repitas con otra operación.'), { uncertain: true });
    } }
    async recover(scope: string) { const op = this.pending(scope); if (!op)
        throw new Error('No hay operación pendiente'); try {
        const result = await this.get('/operaciones/' + op.body.operation_id);
        localStorage.removeItem(this.key(scope));
        return result;
    }
    catch {
        throw Object.assign(new Error('Resultado aún no disponible. Reintentá la misma operación, sin duplicarla.'), { uncertain: true });
    } }
}
