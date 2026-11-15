import { Component, Input, Output, EventEmitter, OnChanges, OnDestroy, inject, ChangeDetectorRef, Injector, ViewChild, ElementRef, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OperacionService, OperationResult, PendingOperation, uncertainMessage } from '../../core/services/operacion.service';
import { AuthService } from '../../core/services/auth.service';
import { PendingOperations, ResolvedOperation } from './pending-operations';
import { RequestEpoch, tableLabel, memberStatus, acknowledgeVisible, recordedBalances, movementEffect } from './operation-context';
interface Confirmation {
    label: string;
    path: string;
    body: any;
}
@Component({ selector: 'app-grupo-operativo', standalone: true, imports: [CommonModule, FormsModule, PendingOperations], templateUrl: './grupo-operativo.html' })
export class GrupoOperativo implements OnChanges, OnDestroy {
    @ViewChild('pendingFeedback', { read: ElementRef })
    pendingFeedback?: ElementRef<HTMLElement>;
    @ViewChild('confirmArea')
    confirmArea?: ElementRef<HTMLElement>;
    @Input()
    grupo: any;
    @Input()
    tables: any[] = [];
    @Input()
    event!: number;
    @Input()
    admissionConfirmed = false;
    @Output()
    grupoChange = new EventEmitter<any>();
    @Output()
    busyChange = new EventEmitter<boolean>();
    api = inject(OperacionService);
    private auth = inject(AuthService);
    private cdr = inject(ChangeDetectorRef);
    private injector = inject(Injector);
    private previousFocus: HTMLElement | null = null;
    private alive = true;
    private reads = new RequestEpoch();
    private identity = '';
    amounts: Record<number, number> = {};
    corrections: Record<number, number> = {};
    reasons: Record<number, string> = {};
    mesa: number | null = null;
    tableReason = '';
    notice = '';
    error = '';
    busy = false;
    fresh = true;
    confirmation: Confirmation | null = null;
    recordedBalances = recordedBalances;
    movementEffect = movementEffect;
    tableLabel = tableLabel;
    memberStatus = memberStatus;
    get admin() { return this.auth.getRole()?.trim().toLowerCase() === 'admin'; }
    get scope() { return 'grupo-' + this.grupo?.id_paquete; }
    get pending() { return !!this.api.pending(this.scope); }
    get blocked() { return this.busy || this.api.hasPending() || !this.fresh; }
    ngOnChanges() { const key = this.event + ':' + this.grupo?.id_paquete; if (key !== this.identity) {
        this.reads.next();
        this.identity = key;
        this.amounts = {};
        this.corrections = {};
        this.reasons = {};
        this.tableReason = '';
        this.notice = '';
        this.error = '';
        this.fresh = true;
        this.confirmation = null;
    } this.mesa = this.grupo?.id_mesa ?? null; }
    ngOnDestroy() { this.alive = false; this.reads.next(); }
    private setBusy(value: boolean) { this.busy = value; this.busyChange.emit(value); this.cdr.markForCheck(); }
    private current(key: string, token: number) { return this.alive && key === this.identity && this.reads.current(token); }
    async refresh() { if (this.busy)
        return; this.setBusy(true); try {
        await this.readFresh();
    }
    finally {
        if (this.alive)
            this.setBusy(false);
    } }
    private async readFresh() { const key = this.identity, token = this.reads.next(), id = this.grupo.id_paquete, event = this.event; try {
        const group = await this.api.get('/paquetes/' + id + '?id_evento=' + event);
        if (!this.current(key, token))
            return;
        this.grupo = group;
        this.mesa = group.id_mesa ?? null;
        this.fresh = true;
        this.grupoChange.emit(group);
    }
    catch {
        if (this.current(key, token)) {
            this.fresh = false;
            this.error = 'No se pudieron actualizar los saldos. Actualizá el grupo antes de registrar otra operación.';
        }
    } }
    prepareDelivery(b: any, correction = false) {
        if (this.blocked || this.confirmation)
            return;
        this.error = '';
        const quantity = Number(correction ? this.corrections[b.id_beneficio] : this.amounts[b.id_beneficio]);
        const limit = correction ? b.entregada : b.pendiente;
        if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > limit) {
            this.error = 'Ingresá una cantidad entera entre 1 y ' + limit + '.';
            return;
        }
        const motive = (this.reasons[b.id_beneficio] || '').trim();
        if (correction && (!this.admin || motive.length < 3)) {
            this.error = 'La corrección requiere permiso de administración y un motivo de al menos tres caracteres.';
            return;
        }
        this.confirmation = { label: correction ? `Corregir ${quantity} de ${b.nombre}` : `Registrar entrega: ${quantity} × ${b.nombre}`, path: '/paquetes/' + this.grupo.id_paquete + '/entrega', body: { id_evento: this.event, id_beneficio: b.id_beneficio, cantidad: correction ? -quantity : quantity, motivo: motive } };
        this.focusConfirmation();
    }
    prepareAssignment() {
        if (this.blocked || this.confirmation)
            return;
        if (this.tableReason.trim().length < 3) {
            this.error = 'Escribí el motivo del cambio de reserva.';
            return;
        }
        const table = this.tables.find(t => t.id_mesa === this.mesa);
        this.confirmation = { label: this.mesa ? `Reservar mesa ${table?.identificador || ''}` : 'Quitar la reserva de mesa', path: '/paquetes/' + this.grupo.id_paquete + '/mesa', body: { id_evento: this.event, id_mesa: this.mesa, motivo: this.tableReason.trim() } };
        this.focusConfirmation();
    }
    private focusConfirmation() { this.previousFocus = document.activeElement as HTMLElement; afterNextRender(() => { this.confirmArea?.nativeElement.focus(); this.confirmArea?.nativeElement.scrollIntoView({ block: 'nearest' }); }, { injector: this.injector }); }
    cancel() { this.confirmation = null; afterNextRender(() => { if (this.previousFocus?.isConnected)
        this.previousFocus.focus(); }, { injector: this.injector }); }
    async confirm() {
        const action = this.confirmation;
        if (!action || this.blocked)
            return;
        const key = this.identity, scope = this.scope;
        this.setBusy(true);
        this.error = '';
        this.notice = '';
        this.confirmation = null;
        try {
            const result = await this.api.perform(scope, action.path, action.body);
            if (!this.alive || key !== this.identity)
                return;
            await this.consume(result, { path: action.path, body: action.body });
            if (this.alive && key === this.identity)
                acknowledgeVisible(this.api, scope, result, this.injector, () => this.alive && key === this.identity);
        }
        catch (e: any) {
            if (this.alive && key === this.identity) {
                this.error = this.pending ? uncertainMessage(this.api.pending(scope)!, this.admissionConfirmed) : e.message;
                if (this.pending) {
                    this.fresh = false;
                    afterNextRender(() => { this.pendingFeedback?.nativeElement.focus(); this.pendingFeedback?.nativeElement.scrollIntoView({ block: 'start' }); }, { injector: this.injector });
                }
            }
        }
        finally {
            if (this.alive && key === this.identity)
                this.setBusy(false);
        }
    }
    async recovered(e: ResolvedOperation) { if (this.busy)
        return; const key = this.identity; this.setBusy(true); try {
        await this.consume(e.result, e.pending);
        if (this.alive && key === this.identity)
            acknowledgeVisible(this.api, e.pending.scope, e.result, this.injector, () => this.alive && key === this.identity);
    }
    finally {
        if (this.alive && key === this.identity)
            this.setBusy(false);
    } }
    private async consume(result: OperationResult, op: PendingOperation) {
        if (result.status === 200) {
            this.notice = result.body.message;
            this.error = '';
            if (op.path.endsWith('/entrega')) {
                delete this.amounts[op.body.id_beneficio];
                delete this.corrections[op.body.id_beneficio];
                delete this.reasons[op.body.id_beneficio];
            }
            else
                this.tableReason = '';
        }
        else
            this.error = result.body?.message || 'La operación fue rechazada.';
        this.fresh = false;
        await this.readFresh();
    }
}
