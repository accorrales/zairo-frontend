import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DialogAccessibility } from '../admin/dialog-accessibility';
let sequence = 0;
@Component({ selector: 'app-operational-detail', standalone: true, imports: [DialogAccessibility], template: `
<div class="operational-overlay" zairoDialog dialogInitialFocus="[data-dialog-close]" (dialogClose)="requestClose()">
 <section class="operational-dialog" role="dialog" aria-modal="true" [attr.aria-labelledby]="titleId">
  <header class="operational-dialog-heading"><h2 [id]="titleId">{{title}}</h2><button type="button" data-dialog-close [disabled]="closeDisabled" (click)="requestClose()">{{closeDisabled?'Procesando…':returnLabel}}</button></header>
  <div class="operational-dialog-body"><ng-content></ng-content></div>
 </section>
</div>` })
export class OperationalDetail {
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
