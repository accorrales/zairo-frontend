import { ChangeDetectorRef } from '@angular/core';
import { Component, OnInit, OnDestroy, inject, NgZone, ViewChild, ElementRef, Injector, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { Html5Qrcode } from 'html5-qrcode';
import { AuthService } from '../../core/services/auth.service';
import { OperacionService } from '../../core/services/operacion.service';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { Header } from '../../layout/header/header';
import { OperationalDetail } from '../../shared/operacion/operational-detail';
import { PendingOperations, ResolvedOperation } from '../../shared/operacion/pending-operations';
import { RequestEpoch, tableLabel, acknowledgeVisible } from '../../shared/operacion/operation-context';
import { GrupoOperativo } from '../../shared/operacion/grupo-operativo';
@Component({ selector: 'app-admin-kiosk', standalone: true, imports: [CommonModule, FormsModule, Sidebar, Header, GrupoOperativo, OperationalDetail, PendingOperations], host: { class: 'zairo-screen z-admin zairo-ui operational-screen' }, templateUrl: './admin-kiosk.html', styleUrl: './admin-kiosk.css' })
export class AdminKiosk implements OnInit, OnDestroy {
    @ViewChild('manualPanel')
    manualPanel?: ElementRef<HTMLDetailsElement>;
    @ViewChild('resultPanel')
    resultPanel?: ElementRef<HTMLElement>;
    @ViewChild('cameraPanel')
    cameraPanel?: ElementRef<HTMLElement>;
    @ViewChild('qrInput')
    qrInput?: ElementRef<HTMLInputElement>;
    private injector = inject(Injector);
    private cdr = inject(ChangeDetectorRef);
    api = inject(OperacionService);
    private auth=inject(AuthService);
    private tablesEvent:number|null=null;
    private zone = inject(NgZone);
    private alive = true;
    private reads = new RequestEpoch();
    detail = false;
    detailBusy = false;
    pendingPanel = false;
    groupBusy = false;
    tableLabel = tableLabel;
    events: any[] = [];
    event: number | null = null;
    tables: any[] = [];
    scanner: Html5Qrcode | null = null;
    estado: 'idle' | 'validating' | 'success' | 'rejected' | 'unknown' = 'idle';
    message = 'Seleccioná el evento para validar.';
    entrada: any = null;
    grupo: any = null;
    review = false;
    manual = '';
    busy = false;
    cameraBusy = false;
    cameraError = '';
    blockedQr = '';
    cameraReady = false;
    pageError = '';
    notice = '';
    private audio?: AudioContext;
    flashDisponible = false;
    flashActivo = false;
    sonido = true;
    historial: {
        tipo: string;
        mensaje: string;
        nombre: string;
        hora: Date;
    }[] = [];
    metrics: {
        initialMs?: number;
        cameraMs?: number;
        validationMs?: number;
    } = {};
    get eventName() { return this.events.find(e => e.id_evento === Number(this.event))?.nombre || 'Evento seleccionado'; }
    get pending() { return !!this.api.pending('scan'); }
    get courtesyPending() { return !!this.api.pending('courtesy'); }
    async ngOnInit() { const start = performance.now(); await this.load(); this.event = this.api.pendingList()[0]?.event || this.api.context('scanner', { event: null }).event; if (this.pending) {
        this.estado = 'unknown';
        this.message = 'Recuperá el ingreso pendiente antes de continuar.';
    } this.metrics.initialMs = performance.now() - start; this.cdr.markForCheck(); }
    async load() { this.pageError = ''; try {
        const events = await this.api.get('/eventos');
        if (this.alive)
            this.events = events;
    }
    catch {
        if (this.alive)
            this.pageError = 'No se pudieron cargar los eventos. Reintentá.';
    }
    finally {
        if (this.alive)
            this.cdr.markForCheck();
    } }
    eventChange() { this.reads.next(); this.detail = false; this.grupo = null; this.entrada = null; this.estado = 'idle'; this.blockedQr = ''; this.tables = []; this.tablesEvent=null; this.api.remember('scanner', { event: this.event }); }
    async startCamera() {
        this.prepareSound();
        if (!this.event || this.cameraBusy || this.cameraReady || this.api.hasPending() || this.estado !== 'idle')
            return;
        this.cameraBusy = true;
        this.cameraError = '';
        const start = performance.now();
        try {
            await this.stopCamera();
            const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
            if (!this.alive)
                return;
            this.scanner = new Html5Qrcode('qr-reader', { formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE], verbose: false });
            await this.scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 220, height: 220 } }, text => this.zone.run(() => {
                if (text !== this.blockedQr)
                    this.scan(text);
            }), () => { });
            if (!this.alive) {
                await this.stopCamera();
                return;
            }
            this.cameraReady = true;
            await this.detectarFlash();
            this.metrics.cameraMs = performance.now() - start;
            performance.measure('zairo.camera-ready', { start, end: performance.now() });
        }
        catch {
            this.cameraError = 'No se pudo iniciar la cámara. Revisá permisos o usá el ingreso manual de QR.';
        }
        finally {
            this.cameraBusy = false;
            this.cdr.markForCheck();
        }
    }
    async stopCamera() {
        try {
            if (this.scanner?.isScanning)
                await this.scanner.stop();
            this.scanner?.clear();
        }
        catch { }
        this.scanner = null;
        this.cameraReady = false;
        this.flashDisponible = false;
        this.flashActivo = false;
        this.cdr.markForCheck();
    }
    ngOnDestroy() { this.alive = false; this.reads.next(); this.stopCamera(); this.audio?.close().catch(() => { }); }
    async scan(qr = this.manual) {
        this.prepareSound();
        if (this.busy || this.api.hasPending() || this.estado !== 'idle' || !this.event || !qr.trim())
            return;
        this.busy = true;
        this.estado = 'validating';
        this.message = 'Pendiente de validación: esperando confirmación del servidor.';
        this.showResult();
        this.blockedQr = qr;
        this.entrada = null;
        this.grupo = null;
        this.review = false;
        try {
            this.scanner?.pause(true);
        }
        catch { }
        const start = performance.now();
        try {
            const r = await this.api.perform('scan', '/escanear', { id_evento: this.event, qr_data: qr });
            if (!this.alive)
                return;
            this.apply(r);
            acknowledgeVisible(this.api, 'scan', r, this.injector, () => this.alive);
        }
        catch (e: any) {
            if (!this.alive)
                return;
            this.estado = 'unknown';
            this.message = e.message;
            this.showResult();
        }
        finally {
            if (this.alive) {
                this.metrics.validationMs = performance.now() - start;
                this.busy = false;
                this.cdr.markForCheck();
            }
        }
    }
    private apply(r: any) {
        this.estado = r.status === 200 && r.body.valido ? 'success' : 'rejected';
        this.message = r.body.message || 'Acceso rechazado';
        this.entrada = r.body.entrada || null;
        this.grupo = r.body.grupo || null;
        this.review = !!r.body.requiere_revision;
        this.historial.unshift({ tipo: this.estado, mensaje: this.message, nombre: this.entrada?.nombre_completo || '', hora: new Date() });
        this.historial = this.historial.slice(0, 6);
        this.vibrar(this.estado === 'success' ? [120] : [250, 100, 250]);
        if (this.sonido)
            this.playFeedback(this.estado === 'success');
        if (this.manualPanel)
            this.manualPanel.nativeElement.open = false;
        this.showResult();
    }
    async resolved(e: ResolvedOperation) { if (!this.alive)
        return; if (e.pending.scope === 'scan') {
        this.event = e.pending.event;
        this.blockedQr = e.pending.body.qr_data;
        this.apply(e.result);
    }
    else {
        this.notice = e.result.body?.message || 'Resultado recuperado';
        if (e.result.status === 200 && e.pending.scope === 'courtesy' && this.entrada)
            this.entrada.cortesia_tiquete_entregado = true;
        if (this.grupo && e.pending.packageId === this.grupo.id_paquete) {
            try {
                this.grupo = await this.api.get('/paquetes/' + this.grupo.id_paquete + '?id_evento=' + this.event);
            }
            catch {
                this.detail = false;
                this.grupo = null;
            }
        }
    } if (this.alive)
        acknowledgeVisible(this.api, e.pending.scope, e.result, this.injector, () => this.alive); this.cdr.markForCheck(); }
    private showResult() { afterNextRender(() => { this.resultPanel?.nativeElement.focus(); this.resultPanel?.nativeElement.scrollIntoView({ block: 'start' }); }, { injector: this.injector }); }
    next() {
        if (this.busy || this.api.hasPending())
            return;
        this.detail = false;
        this.notice = '';
        this.pageError = '';
        this.estado = 'idle';
        this.message = 'Listo para el siguiente QR';
        this.entrada = null;
        this.grupo = null;
        this.manual = '';
        afterNextRender(() => {
            try {
                this.scanner?.resume();
            }
            catch { }
            if (!this.cameraReady && this.qrInput?.nativeElement.offsetParent)
                this.qrInput.nativeElement.focus();
            else
                this.cameraPanel?.nativeElement.scrollIntoView({ block: 'start' });
        }, { injector: this.injector });
    }
    async lookup() { if (!this.event || !this.blockedQr || this.busy)
        return; this.detail = true; this.detailBusy = true; const token = this.reads.next(), event = this.event; try {
        if (!this.grupo) {
            const r = await this.api.lookup({ id_evento: event, qr_data: this.blockedQr });
            if (!this.alive || !this.reads.current(token))
                return;
            this.grupo = r.grupo;
            this.review = !!r.requiere_revision;
        }
        if (this.grupo && this.auth.getRole()==='admin' && this.tablesEvent!==event) {
            const data = await this.api.get('/mesas?id_evento=' + event);
            if (this.alive && this.reads.current(token))
                {this.tables = data;this.tablesEvent=event;}
        }
    }
    catch {
        if (this.alive && this.reads.current(token))
            this.pageError = 'No se pudo consultar el grupo. Esta consulta no registra ingresos.';
    }
    finally {
        if (this.alive && this.reads.current(token)) {
            this.detailBusy = false;
            this.cdr.markForCheck();
        }
    } }
    closeDetail() { if (this.groupBusy)
        return; this.reads.next(); this.detail = false; this.detailBusy = false; }
    async courtesy(recover = false, retry = false) {
        if (this.busy || (!this.entrada && !recover && !retry))
            return;
        if (!recover && !retry && !window.confirm('¿Confirmás la entrega del tiquete de cortesía individual?'))
            return;
        this.busy = true;
        try {
            const r = await (recover ? this.api.recover('courtesy') : retry ? this.api.retry('courtesy') : this.api.perform('courtesy', '/entradas/' + this.entrada.id_detalle + '/cortesia', { id_evento: this.event }));
            if (!this.alive)
                return;
            acknowledgeVisible(this.api, 'courtesy', r, this.injector, () => this.alive);
            if (r.status === 200) {
                this.notice = r.body.message;
                this.pageError = '';
            }
            else
                this.pageError = r.body.message;
            if (r.status === 200 && this.entrada)
                this.entrada.cortesia_tiquete_entregado = true;
        }
        catch (e: any) {
            this.pageError = e.message;
        }
        finally {
            this.busy = false;
            this.cdr.markForCheck();
        }
    }
    async detectarFlash(): Promise<void> {
        try {
            const video = document.querySelector('#qr-reader video') as HTMLVideoElement;
            const track = (video?.srcObject as MediaStream)?.getVideoTracks?.()[0];
            this.flashDisponible = !!(track?.getCapabilities?.() as any)?.torch;
        }
        catch {
            this.flashDisponible = false;
        }
    }
    async toggleFlash(): Promise<void> {
        if (!this.cameraReady || this.cameraBusy)
            return;
        try {
            const video = document.querySelector('#qr-reader video') as HTMLVideoElement;
            const track = (video?.srcObject as MediaStream)?.getVideoTracks?.()[0];
            if (!track)
                return;
            const next = !this.flashActivo;
            await track.applyConstraints({ advanced: [{ torch: next } as any] });
            this.flashActivo = next;
        }
        catch {
            this.flashDisponible = false;
            this.flashActivo = false;
            this.cameraError = 'La linterna no está disponible en este dispositivo.';
        }
        finally {
            this.cdr.markForCheck();
        }
    }
    private vibrar(pattern: number[]) { try {
        navigator.vibrate?.(pattern);
    }
    catch { } }
    private prepareSound() { if (!this.sonido)
        return; try {
        const Context = window.AudioContext || (window as any).webkitAudioContext;
        if (!Context)
            return;
        this.audio ||= new Context();
        this.audio?.resume().catch(() => { });
    }
    catch { } }
    private playFeedback(success: boolean) { try {
        const ctx = this.audio;
        if (!ctx || ctx.state !== 'running')
            return;
        const tone = ctx.createOscillator(), gain = ctx.createGain();
        const now = ctx.currentTime;
        tone.frequency.setValueAtTime(success ? 880 : 220, now);
        gain.gain.setValueAtTime(.08, now);
        gain.gain.exponentialRampToValueAtTime(.001, now + .16);
        tone.connect(gain);
        gain.connect(ctx.destination);
        tone.onended = () => { tone.disconnect(); gain.disconnect(); };
        tone.start(now);
        tone.stop(now + .17);
    }
    catch { } }
}
