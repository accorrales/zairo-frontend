import { ChangeDetectorRef } from '@angular/core';
import { Component, OnInit, OnDestroy, inject, NgZone, ViewChild, ElementRef, Injector, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { Html5Qrcode } from 'html5-qrcode';
import { OperacionService } from '../../core/services/operacion.service';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { Header } from '../../layout/header/header';
import { GrupoOperativo } from '../../shared/operacion/grupo-operativo';
@Component({ selector: 'app-admin-kiosk', standalone: true, imports: [CommonModule, FormsModule, Sidebar, Header, GrupoOperativo], host: { class: 'zairo-screen z-admin zairo-ui' }, templateUrl: './admin-kiosk.html', styleUrl: './admin-kiosk.css' })
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
    private api = inject(OperacionService);
    private zone = inject(NgZone);
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
    private audio?:AudioContext;
    flashDisponible=false;flashActivo=false;sonido=true;
    historial:{tipo:string,mensaje:string,nombre:string,hora:Date}[]=[];
    metrics: {
        initialMs?: number;
        cameraMs?: number;
        validationMs?: number;
    } = {};
    get pending() { return !!this.api.pending('scan'); }
    get courtesyPending() { return !!this.api.pending('courtesy'); }
    async ngOnInit() { const start = performance.now(); await this.load(); this.metrics.initialMs = performance.now() - start; if (this.pending || this.courtesyPending) {
        const op = this.api.pending('scan') || this.api.pending('courtesy');
        this.event = op?.body.id_evento;
        this.estado = 'unknown';
        this.message = 'Hay una operación sin resultado confirmado. Recuperala antes de continuar.';
    } this.cdr.markForCheck(); }
    async load() { this.pageError = ''; try {
        this.events = await this.api.get('/eventos');
    }
    catch {
        this.pageError = 'No se pudieron cargar los eventos. Reintentá.';
    }
    finally {
        this.cdr.markForCheck();
    } }
    async eventChange() { this.grupo = null; this.entrada = null; this.estado = 'idle'; this.blockedQr = ''; this.tables = []; if (this.event)
        try {
            this.tables = (await this.api.get('/recepcion?id_evento=' + this.event)).mesas;
        }
        catch {
            this.pageError = 'No se pudieron consultar mesas. Reintentá la consulta.';
        }
        finally {
            this.cdr.markForCheck();
        } }
    async startCamera() { this.prepareSound();if (!this.event || this.cameraBusy)
        return; this.cameraBusy = true; this.cameraError = ''; const start = performance.now(); try {
        await this.stopCamera();
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
        this.scanner = new Html5Qrcode('qr-reader', { formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE], verbose: false });
        await this.scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 220, height: 220 } }, text => this.zone.run(() => { if (text !== this.blockedQr)
            this.scan(text); }), () => { });
        this.cameraReady = true;await this.detectarFlash();
        this.metrics.cameraMs = performance.now() - start;
    }
    catch {
        this.cameraError = 'No se pudo iniciar la cámara. Revisá permisos o usá el ingreso manual de QR.';
    }
    finally {
        this.cameraBusy = false;
        this.cdr.markForCheck();
    } }
    async stopCamera() { try {
        if (this.scanner?.isScanning)
            await this.scanner.stop();
        this.scanner?.clear();
    }
    catch { } this.scanner = null; this.cameraReady = false;this.flashDisponible=false;this.flashActivo=false; this.cdr.markForCheck(); }
    ngOnDestroy() { this.stopCamera();this.audio?.close().catch(()=>{}); }
    async scan(qr = this.manual) { this.prepareSound();if (this.busy || this.pending || this.courtesyPending || this.estado !== 'idle' || !this.event || !qr.trim())
        return; this.busy = true; this.estado = 'validating'; this.message = 'Pendiente de validación: esperando confirmación del servidor.'; this.showResult(); this.blockedQr = qr; this.entrada = null; this.grupo = null; this.review = false; try {
        this.scanner?.pause(true);
    }
    catch { } const start = performance.now(); try {
        this.apply(await this.api.perform('scan', '/escanear', { id_evento: this.event, qr_data: qr }));
    }
    catch (e: any) {
        this.estado = 'unknown';
        this.message = e.message;
        this.showResult();
    }
    finally {
        this.metrics.validationMs = performance.now() - start;
        this.busy = false;
        this.cdr.markForCheck();
    } }
    private apply(r: any) { this.estado = r.status === 200 && r.body.valido ? 'success' : 'rejected'; this.message = r.body.message || 'Acceso rechazado'; this.entrada = r.body.entrada || null; this.grupo = r.body.grupo || null; this.review = !!r.body.requiere_revision;this.historial.unshift({tipo:this.estado,mensaje:this.message,nombre:this.entrada?.nombre_completo||'',hora:new Date()});this.historial=this.historial.slice(0,6);this.vibrar(this.estado==='success'?[120]:[250,100,250]);if(this.sonido)this.playFeedback(this.estado==='success'); if (this.manualPanel)
        this.manualPanel.nativeElement.open = false; this.showResult(); }
    async resolve(retry: boolean) { if (this.busy)
        return; this.busy = true; try {
        this.apply(await (retry ? this.api.retry('scan') : this.api.recover('scan')));
    }
    catch (e: any) {
        this.estado = 'unknown';
        this.message = e.message;
        this.showResult();
    }
    finally {
        this.busy = false;
        this.cdr.markForCheck();
    } }
    private showResult() { afterNextRender(() => { this.resultPanel?.nativeElement.focus(); this.resultPanel?.nativeElement.scrollIntoView({ block: 'start' }); }, { injector: this.injector }); }
    next() { if (this.busy || this.pending)
        return; this.estado = 'idle'; this.message = 'Listo para el siguiente QR'; this.entrada = null; this.grupo = null; this.manual = ''; try {
        this.scanner?.resume();
    }
    catch { } afterNextRender(() => { if (!this.cameraReady && this.qrInput?.nativeElement.offsetParent)
        this.qrInput.nativeElement.focus();
    else
        this.cameraPanel?.nativeElement.scrollIntoView({ block: 'start' }); }, { injector: this.injector }); }
    async lookup() { if (!this.event || !this.blockedQr || this.busy)
        return; this.busy = true; try {
        const r = await this.api.lookup({ id_evento: this.event, qr_data: this.blockedQr });
        this.grupo = r.grupo;
        this.review = !!r.requiere_revision;
    }
    catch {
        this.pageError = 'No se pudo consultar el grupo. Esta consulta no registra ingresos.';
    }
    finally {
        this.busy = false;
        this.cdr.markForCheck();
    } }
    async courtesy(recover = false, retry = false) { if (this.busy || (!this.entrada && !recover && !retry))
        return; if (!recover && !retry && !window.confirm('¿Confirmás la entrega del tiquete de cortesía individual?'))
        return; this.busy = true; try {
        const r = await (recover ? this.api.recover('courtesy') : retry ? this.api.retry('courtesy') : this.api.perform('courtesy', '/entradas/' + this.entrada.id_detalle + '/cortesia', { id_evento: this.event }));
        if(r.status===200){this.notice=r.body.message;this.pageError='';}else this.pageError=r.body.message;
        if (r.status === 200 && this.entrada)
            this.entrada.cortesia_tiquete_entregado = true;
    }
    catch (e: any) {
        this.pageError = e.message;
    }
    finally {
        this.busy = false;
        this.cdr.markForCheck();
    } }
    async detectarFlash():Promise<void>{
        try{const video=document.querySelector('#qr-reader video') as HTMLVideoElement;const track=(video?.srcObject as MediaStream)?.getVideoTracks?.()[0];this.flashDisponible=!!(track?.getCapabilities?.() as any)?.torch;}catch{this.flashDisponible=false;}
    }
    async toggleFlash():Promise<void>{
        if(!this.cameraReady||this.cameraBusy)return;
        try{const video=document.querySelector('#qr-reader video') as HTMLVideoElement;const track=(video?.srcObject as MediaStream)?.getVideoTracks?.()[0];if(!track)return;const next=!this.flashActivo;await track.applyConstraints({advanced:[{torch:next} as any]});this.flashActivo=next;}
        catch{this.flashDisponible=false;this.flashActivo=false;this.cameraError='La linterna no está disponible en este dispositivo.';}
        finally{this.cdr.markForCheck();}
    }
    private vibrar(pattern:number[]){try{navigator.vibrate?.(pattern);}catch{}}
    private prepareSound(){if(!this.sonido)return;try{const Context=window.AudioContext||(window as any).webkitAudioContext;if(!Context)return;this.audio ||= new Context();this.audio?.resume().catch(()=>{});}catch{}}
    private playFeedback(success:boolean){try{const ctx=this.audio;if(!ctx||ctx.state!=='running')return;const tone=ctx.createOscillator(),gain=ctx.createGain();const now=ctx.currentTime;tone.frequency.setValueAtTime(success?880:220,now);gain.gain.setValueAtTime(.08,now);gain.gain.exponentialRampToValueAtTime(.001,now+.16);tone.connect(gain);gain.connect(ctx.destination);tone.onended=()=>{tone.disconnect();gain.disconnect();};tone.start(now);tone.stop(now+.17);}catch{}}
}
