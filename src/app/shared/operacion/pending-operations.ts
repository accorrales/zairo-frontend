import { Component, Input, Output, EventEmitter, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OperacionService, PendingSummary, OperationResult, uncertainMessage } from '../../core/services/operacion.service';
export interface ResolvedOperation {
    pending: PendingSummary;
    result: OperationResult;
}
@Component({ selector: 'app-pending-operations', standalone: true, imports: [CommonModule], template: `
<section *ngFor="let op of operations" [class.pending-operation]="!controlsOnly" [attr.role]="controlsOnly?'group':'status'" [attr.aria-busy]="api.isActive(op.scope)">
 <h3 *ngIf="!controlsOnly">{{api.isActive(op.scope)?'Procesando con el servidor…':'Resultado sin confirmar'}}</h3>
 <p *ngIf="!controlsOnly">{{message(op)}}</p><p *ngIf="op.packageId && !controlsOnly">Paquete #{{op.packageId}}</p>
 <p class="operation-error" role="alert" *ngIf="errors[op.scope]">{{errors[op.scope]}}</p>
 <div class="operation-actions"><button type="button" [disabled]="api.isActive(op.scope)" (click)="resolve(op,false)">Recuperar resultado</button><button type="button" [disabled]="api.isActive(op.scope)" (click)="resolve(op,true)">Reintentar la misma operación</button></div>
</section>` })
export class PendingOperations implements OnDestroy {
    api = inject(OperacionService);
    private cdr = inject(ChangeDetectorRef);
    private alive = true;
    @Input() controlsOnly = false;
    @Input()
    scope: string | null = null;
    @Input()
    excludeScope: string | null = null;
    @Input()
    admissionGroup: number | null = null;
    @Output()
    resolved = new EventEmitter<ResolvedOperation>();
    errors: Record<string, string> = {};
    get operations() { return this.api.pendingList().filter(op => (!this.scope || op.scope === this.scope) && op.scope !== this.excludeScope); }
    message(op: PendingSummary) { return uncertainMessage(op, op.packageId === this.admissionGroup); }
    async resolve(op: PendingSummary, retry: boolean) { if (this.api.isActive(op.scope))
        return; this.errors[op.scope] = ''; try {
        const result = await (retry ? this.api.retry(op.scope) : this.api.recover(op.scope));
        if (!this.alive)
            return;
        this.resolved.emit({ pending: op, result });
    }
    catch (e: any) {
        if (this.alive)
            this.errors[op.scope] = this.controlsOnly ? 'El resultado todavía no está disponible. La operación original sigue pendiente.' : e.message;
    }
    finally {
        if (this.alive)
            this.cdr.markForCheck();
    } }
    ngOnDestroy() { this.alive = false; }
}
