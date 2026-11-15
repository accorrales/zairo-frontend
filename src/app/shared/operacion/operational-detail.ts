import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { OperacionService } from '../../core/services/operacion.service';
import { tableLabel } from './operation-context';
import { CommonModule } from '@angular/common';
import { DialogAccessibility } from '../admin/dialog-accessibility';
let sequence = 0;
@Component({ selector: 'app-operational-detail', standalone: true, imports: [DialogAccessibility, CommonModule], template: `
<div class="operational-overlay" zairoDialog dialogInitialFocus="[data-dialog-close]" (dialogClose)="requestClose()">
 <section class="operational-dialog" role="dialog" aria-modal="true" [attr.aria-labelledby]="titleId">
  <header class="operational-dialog-heading"><div class="operational-dialog-context"><h2 [id]="titleId">{{title}}</h2><p *ngIf="grupo" class="package-reference" aria-live="polite">{{reference}}</p></div><button type="button" data-dialog-close [disabled]="closeDisabled" (click)="requestClose()">{{closeDisabled?'Procesando…':returnLabel}}</button></header>
  <div class="operational-dialog-body"><ng-content></ng-content></div>
 </section>
</div>` })
export class OperationalDetail {
    private api = inject(OperacionService);
    @Input() grupo: any = null;
    get reference() {
        const pending = this.api.pending('grupo-' + this.grupo?.id_paquete);
        const table = pending?.path.endsWith('/mesa') ? 'Cambio de mesa sin confirmar' : tableLabel(this.grupo);
        return 'Paquete #' + this.grupo.id_paquete + ' · ' + table;
    }
    @Input()
    title = 'Grupo y beneficios';
    @Input()
    returnLabel = 'Cerrar detalle';
    @Input()
    closeDisabled = false;
    @Output()
    closed = new EventEmitter<void>();
    titleId = 'operational-detail-' + (++sequence);
    requestClose() { if (!this.closeDisabled)
        this.closed.emit(); }
}
