import { ChangeDetectorRef } from '@angular/core';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { Header } from '../../layout/header/header';
import { GrupoOperativo } from '../../shared/operacion/grupo-operativo';
import { OperacionService } from '../../core/services/operacion.service';
import { AuthService } from '../../core/services/auth.service';
@Component({ selector: 'app-recepcion', standalone: true, imports: [CommonModule, FormsModule, Sidebar, Header, GrupoOperativo], host: { class: 'zairo-screen z-admin zairo-ui' }, templateUrl: './recepcion.html' })
export class Recepcion implements OnInit {
    private cdr = inject(ChangeDetectorRef);
    api = inject(OperacionService);
    private auth = inject(AuthService);
    events: any[] = [];
    event: number | null = null;
    data: any = { mesas: [], paquetes: [] };
    grupo: any = null;
    busy = false;
    error = '';
    notice = '';
    search = '';
    table = { identificador: '', zona: 'VIP', tipo: 'COCTEL', capacidad: 6 };
    editId: number | null = null;
    get admin() { return this.auth.getRole() === 'admin'; }
    get pending() { return !!this.api.pending('mesa-config'); }
    get packages() { const s = this.search.toLowerCase(); return this.data.paquetes.filter((p: any) => [p.id_paquete, p.promocion, p.mesa || 'Pendiente de asignación', p.id_compra].join(' ').toLowerCase().includes(s)); }
    async ngOnInit() { try {
        this.events = await this.api.get('/eventos');
    }
    catch {
        this.error = 'No se pudieron cargar eventos. Reintentá.';
    }
    finally {
        this.cdr.markForCheck();
    } }
    async load() { if (!this.event)
        return; this.busy = true; this.error = ''; try {
        this.data = await this.api.get('/recepcion?id_evento=' + this.event);
    }
    catch {
        this.error = 'No se pudo consultar recepción. Reintentá.';
    }
    finally {
        this.busy = false;
        this.cdr.markForCheck();
    } }
    async select(id: number) { this.busy = true; this.error = ''; try {
        this.grupo = await this.api.get('/paquetes/' + id + '?id_evento=' + this.event);
    }
    catch {
        this.error = 'No se pudo consultar el paquete. Reintentá.';
    }
    finally {
        this.busy = false;
        this.cdr.markForCheck();
    } }
    edit(t: any) { this.editId = t.id_mesa; this.table = { identificador: t.identificador, zona: t.zona, tipo: t.tipo, capacidad: t.capacidad }; }
    async save() { if (this.busy || this.pending)
        return; this.busy = true; this.error = ''; try {
        const r = await this.api.perform('mesa-config', '/mesas' + (this.editId ? '/' + this.editId : ''), { id_evento: this.event, ...this.table });
        this.handle(r);
        if (r.status === 200)
            await this.load();
    }
    catch (e: any) {
        this.error = e.message;
    }
    finally {
        this.busy = false;
        this.cdr.markForCheck();
    } }
    private handle(r: any) { if (r.status === 200) {
        this.notice = r.body.message;
        this.editId = null;
        this.table = { identificador: '', zona: 'VIP', tipo: 'COCTEL', capacidad: 6 };
    }
    else
        this.error = r.body?.message || 'Operación rechazada'; }
    async resolve(retry: boolean) { if (this.busy)
        return; this.busy = true; try {
        const r = await (retry ? this.api.retry('mesa-config') : this.api.recover('mesa-config'));
        this.handle(r);
        if (r.status === 200)
            await this.load();
    }
    catch (e: any) {
        this.error = e.message;
    }
    finally {
        this.busy = false;
        this.cdr.markForCheck();
    } }
}
