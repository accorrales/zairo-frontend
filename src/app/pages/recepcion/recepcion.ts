import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, Injector, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { Header } from '../../layout/header/header';
import { GrupoOperativo } from '../../shared/operacion/grupo-operativo';
import { OperationalDetail } from '../../shared/operacion/operational-detail';
import { PendingOperations, ResolvedOperation } from '../../shared/operacion/pending-operations';
import { RequestEpoch, tableLabel, acknowledgeVisible } from '../../shared/operacion/operation-context';
import { OperacionService } from '../../core/services/operacion.service';
import { AuthService } from '../../core/services/auth.service';
@Component({ selector: 'app-recepcion', standalone: true, imports: [CommonModule, FormsModule, Sidebar, Header, GrupoOperativo, OperationalDetail, PendingOperations], host: { class: 'zairo-screen z-admin zairo-ui operational-screen' }, templateUrl: './recepcion.html' })
export class Recepcion implements OnInit, OnDestroy {
    private cdr = inject(ChangeDetectorRef);
    private injector = inject(Injector);
    api = inject(OperacionService);
    private auth = inject(AuthService);
    private alive = true;
    private reads = new RequestEpoch();
    private details = new RequestEpoch();
    events: any[] = [];
    event: number | null = null;
    data: any = { mesas: [], paquetes: [] };
    grupo: any = null;
    busy = false;
    detailBusy = false;
    groupBusy = false;
    detail = false;
    config = false;
    pendingPanel = false;
    error = '';
    detailError = '';
    notice = '';
    search = '';
    position = 0;
    selected: number | null = null;
    table = { identificador: '', zona: 'VIP', tipo: 'COCTEL', capacidad: 6 };
    editId: number | null = null;
    tableLabel = tableLabel;
    get admin() { return this.auth.getRole() === 'admin'; }
    get pending() { return this.api.hasPending(); }
    get packages() { const s = this.search.toLowerCase(); return this.data.paquetes.filter((p: any) => [p.id_paquete, p.promocion, tableLabel(p), p.id_compra].join(' ').toLowerCase().includes(s)); }
    async ngOnInit() { const context = this.api.context('recepcion', { event: null, search: '', position: 0 }); this.event = context.event; this.search = context.search; this.position = context.position; try {
        const events = await this.api.get('/eventos');
        if (!this.alive)
            return;
        this.events = events;
        if (this.event) {
            await this.load();
            afterNextRender(() => window.scrollTo(0, this.position), { injector: this.injector });
        }
    }
    catch {
        if (this.alive)
            this.error = 'No se pudieron cargar eventos. Reintentá.';
    }
    finally {
        if (this.alive)
            this.cdr.markForCheck();
    } }
    ngOnDestroy() { this.alive = false; this.reads.next(); this.details.next(); this.remember(); }
    remember() { this.api.remember('recepcion', { event: this.event, search: this.search, position: this.detail ? this.position : window.scrollY }); }
    eventChange() { this.details.next(); this.detail = false; this.grupo = null; this.data = { mesas: [], paquetes: [] }; this.search = ''; this.position = 0; this.remember(); this.load(); }
    async load() { if (!this.event)
        return; const token = this.reads.next(), event = this.event; this.busy = true; this.error = ''; try {
        const data = await this.api.get('/recepcion?id_evento=' + event);
        if (this.alive && this.reads.current(token) && event === this.event)
            this.data = data;
    }
    catch {
        if (this.alive && this.reads.current(token))
            this.error = 'No se pudo consultar recepción. Reintentá.';
    }
    finally {
        if (this.alive && this.reads.current(token)) {
            this.busy = false;
            this.cdr.markForCheck();
        }
    } }
    async select(id: number) { this.position = window.scrollY; this.selected = id; this.detail = true; this.grupo = null; this.detailBusy = true; this.detailError = ''; this.remember(); const token = this.details.next(), event = this.event; try {
        const group = await this.api.get('/paquetes/' + id + '?id_evento=' + event);
        if (this.alive && this.details.current(token) && event === this.event)
            this.grupo = group;
    }
    catch {
        if (this.alive && this.details.current(token))
            this.detailError = 'No se pudo consultar el grupo. Esta consulta no registra ingresos.';
    }
    finally {
        if (this.alive && this.details.current(token)) {
            this.detailBusy = false;
            this.cdr.markForCheck();
        }
    } }
    close() { if (this.groupBusy)
        return; this.details.next(); this.detail = false; this.grupo = null; afterNextRender(() => {
            // A confirmed group update can replace its list row, or a viewport change
            // can hide the original trigger. Restore the logical, visible trigger.
            const trigger = [...document.querySelectorAll<HTMLElement>('[data-package-id="' + this.selected + '"]')].find(e => e.getClientRects().length > 0);
            trigger?.focus({preventScroll:true});
            window.scrollTo(0, this.position);
        }, { injector: this.injector }); }
    updated(group: any) { this.grupo = group; this.data.paquetes = this.data.paquetes.map((p: any) => p.id_paquete === group.id_paquete ? { ...p, ...group } : p); this.data.mesas = this.data.mesas.map((t: any) => ({ ...t, reserva: t.id_mesa === group.id_mesa ? group.id_paquete : t.reserva === group.id_paquete ? null : t.reserva })); }
    edit(t: any) { this.editId = t.id_mesa; this.table = { identificador: t.identificador, zona: t.zona, tipo: t.tipo, capacidad: t.capacidad }; }
    async save() { if (this.busy || this.pending)
        return; this.busy = true; this.error = ''; try {
        const r = await this.api.perform('mesa-config', '/mesas' + (this.editId ? '/' + this.editId : ''), { id_evento: this.event, ...this.table });
        if (!this.alive)
            return;
        this.handle(r);
        if (r.status === 200)
            await this.load();
        if (this.alive)
            acknowledgeVisible(this.api, 'mesa-config', r, this.injector, () => this.alive);
    }
    catch (e: any) {
        if (this.alive)
            this.error = e.message;
    }
    finally {
        if (this.alive) {
            this.busy = false;
            this.cdr.markForCheck();
        }
    } }
    private handle(r: any) { if (r.status === 200) {
        this.notice = r.body.message;
        this.editId = null;
        this.table = { identificador: '', zona: 'VIP', tipo: 'COCTEL', capacidad: 6 };
    }
    else
        this.error = r.body?.message || 'Operación rechazada'; }
    async resolved(e: ResolvedOperation) { if (e.pending.scope === 'mesa-config')
        this.handle(e.result);
    else
        this.notice = e.result.body?.message || 'Resultado recuperado'; if (e.result.status === 200 && e.pending.event === this.event)
        await this.load(); if (this.alive)
        acknowledgeVisible(this.api, e.pending.scope, e.result, this.injector, () => this.alive); this.cdr.markForCheck(); }
}
