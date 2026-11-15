import { ChangeDetectorRef } from '@angular/core';
import { Component, Input, OnChanges, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OperacionService } from '../../core/services/operacion.service';
import { AuthService } from '../../core/services/auth.service';
@Component({ selector: 'app-grupo-operativo', standalone: true, imports: [CommonModule, FormsModule], template: `
<section class="panel group-panel" *ngIf="grupo">
 <div class="panel-top"><div><span class="zone-tag" [class.vip]="grupo.zona==='VIP'">{{grupo.zona==='VIP'?'VIP':'GENERAL'}}</span><h2>{{grupo.promocion}}</h2></div><button type="button" [disabled]="busy" (click)="refresh()">Actualizar grupo</button></div>
 <p>Paquete <strong>#{{grupo.id_paquete}}</strong> · {{grupo.numero}} de la compra #{{grupo.id_compra}}</p>
 <p class="group-count"><strong>{{grupo.ingresados}} / {{grupo.integrantes}}</strong> integrantes ingresados</p>
 <p><strong>Mesa: {{grupo.mesa || (grupo.requiere_revision ? 'Requiere revisión' : grupo.mesa_tipo ? 'Pendiente de asignación':'No incluida')}}</strong></p>
 <p *ngIf="grupo.mesa">Reserva registrada · ocupación física no verificada</p>
 <p *ngIf="grupo.beneficios_descripcion">Incluido al comprar: {{grupo.beneficios_descripcion}}</p>
 <p class="z-status" role="status" *ngIf="notice">{{notice}}</p>
 <div class="z-status z-status-error" role="alert" *ngIf="error">{{error}}</div>
 <div class="z-status" *ngIf="pending"><strong>Resultado sin confirmar</strong><button [disabled]="busy" (click)="resolve(false)">Recuperar resultado</button><button [disabled]="busy" (click)="resolve(true)">Reintentar misma operación</button></div>
 <div class="z-status" *ngIf="grupo.requiere_revision">Beneficios descriptivos sin cantidades verificadas. Requiere revisión; no se inventan entregas ni derechos de mesa.</div><h3>Beneficios compartidos</h3><p>El escaneo no entrega beneficios. Confirmá cada entrega física explícitamente.</p>
 <p *ngIf="!grupo.beneficios.length && !grupo.requiere_revision">Sin beneficios compartidos incluidos.</p>
 <article class="benefit-row" *ngFor="let b of grupo.beneficios">
   <strong>{{b.nombre}}</strong><p>{{b.entregada}} entregados · {{b.pendiente}} pendientes de {{b.cantidad}}</p>
   <label class="z-field">Cantidad a entregar<input type="number" min="1" [max]="b.pendiente" step="1" [(ngModel)]="amounts[b.id_beneficio]" [disabled]="busy || pending || !b.pendiente"></label>
   <button type="button" [disabled]="busy || pending || !b.pendiente" (click)="deliver(b,false)">Confirmar entrega de {{b.nombre}}</button>
   <div *ngIf="admin && b.entregada>0"><label class="z-field">Cantidad a corregir<input type="number" min="1" [max]="b.entregada" [(ngModel)]="corrections[b.id_beneficio]"></label><label class="z-field">Motivo de corrección<input maxlength="500" [(ngModel)]="reasons[b.id_beneficio]"></label><button [disabled]="busy || pending" (click)="deliver(b,true)">Registrar corrección</button></div>
 </article>
 <section *ngIf="admin && grupo.mesa_tipo"><h3>Asignar reserva · tipo {{grupo.mesa_tipo}}</h3><label class="z-field">Mesa<select aria-label="Mesa" [(ngModel)]="mesa"><option [ngValue]="null">Sin asignación</option><option *ngFor="let t of tables" [ngValue]="t.id_mesa">{{t.identificador}} · {{t.zona}} · {{t.tipo}} · {{t.capacidad}} personas</option></select></label><label class="z-field">Motivo de asignación o cambio<input maxlength="500" [(ngModel)]="tableReason"></label><button [disabled]="busy || pending" (click)="assign()">Confirmar reserva</button></section>
 <details><summary>Integrantes del paquete</summary><ul><li *ngFor="let m of grupo.miembros">{{m.nombre_completo}} · {{m.fecha_ingreso?'Ingresó':'Sin ingreso'}} · {{m.estado}}</li></ul></details>
 <details><summary>Historial de reservas y entregas</summary><ul><li *ngFor="let h of grupo.historial_mesas">{{h.fecha | date:'short'}} · {{h.responsable}} · {{h.anterior || 'Sin mesa'}} → {{h.nueva || 'Sin mesa'}} · {{h.motivo}}</li><li *ngFor="let h of grupo.entregas">{{h.fecha | date:'short'}} · {{h.responsable}} · Beneficio #{{h.id_beneficio}} · {{h.cantidad}} · {{h.motivo}}</li></ul></details>
</section>` })
export class GrupoOperativo implements OnChanges {
    @Output()
    grupoChange = new EventEmitter<any>();
    @Input()
    grupo: any;
    @Input()
    tables: any[] = [];
    @Input()
    event!: number;
    private cdr = inject(ChangeDetectorRef);
    private api = inject(OperacionService);
    private auth = inject(AuthService);
    amounts: Record<number, number> = {};
    corrections: Record<number, number> = {};
    reasons: Record<number, string> = {};
    mesa: number | null = null;
    tableReason = '';
    notice = '';
    error = '';
    busy = false;
    get admin() { return this.auth.getRole() === 'admin'; }
    get scope() { return 'grupo-' + this.grupo?.id_paquete; }
    get pending() { return !!this.api.pending(this.scope); }
    ngOnChanges() { this.mesa = this.grupo?.id_mesa || null; }
    async refresh() { this.busy = true; this.error = ''; try {
        this.grupo = await this.api.get('/paquetes/' + this.grupo.id_paquete + '?id_evento=' + this.event);
        this.grupoChange.emit(this.grupo);
    }
    catch {
        this.error = 'No se pudo consultar el grupo. Reintentá; no se registró otro ingreso.';
    }
    finally {
        this.busy = false;
        this.cdr.markForCheck();
    } }
    async act(path: string, body: any) { if (this.busy || this.pending)
        return; this.busy = true; this.error = ''; try {
        await this.handle(await this.api.perform(this.scope, path, body));
    }
    catch (e: any) {
        this.error = e.message;
    }
    finally {
        this.busy = false;
        this.cdr.markForCheck();
    } }
    private async handle(r: any) { if (r.status !== 200) {
        this.error = r.body?.message || 'Operación rechazada';
        return;
    } this.notice = r.body.message; await this.refresh(); }
    deliver(b: any, correction: boolean) { const quantity = Number(correction ? this.corrections[b.id_beneficio] : this.amounts[b.id_beneficio]); const max = correction ? b.entregada : b.pendiente; if (!Number.isInteger(quantity) || quantity < 1 || quantity > max) {
        this.error = 'Revisá la cantidad disponible';
        return;
    } const reason = this.reasons[b.id_beneficio] || ''; if (correction && reason.trim().length < 3) {
        this.error = 'Escribí un motivo para la corrección';
        return;
    } if (!window.confirm(correction ? '¿Registrar esta corrección con historial?' : `¿Confirmás la entrega física de ${quantity} × ${b.nombre}?`))
        return; this.act('/paquetes/' + this.grupo.id_paquete + '/entrega', { id_evento: this.event, id_beneficio: b.id_beneficio, cantidad: correction ? -quantity : quantity, motivo: reason }); }
    assign() { if (this.tableReason.trim().length < 3) {
        this.error = 'Escribí un motivo';
        return;
    } this.act('/paquetes/' + this.grupo.id_paquete + '/mesa', { id_evento: this.event, id_mesa: this.mesa, motivo: this.tableReason }); }
    async resolve(retry: boolean) { if (this.busy)
        return; this.busy = true; this.error = ''; try {
        await this.handle(await (retry ? this.api.retry(this.scope) : this.api.recover(this.scope)));
    }
    catch (e: any) {
        this.error = e.message;
    }
    finally {
        this.busy = false;
        this.cdr.markForCheck();
    } }
}
