import {
  Component,
  OnDestroy,
  OnInit,
  NgZone,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { environment } from '../../../environments/environment';

type EstadoScanner = 'idle' | 'validating' | 'success' | 'error';

@Component({
  selector: 'app-admin-kiosk',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-kiosk.html',
  styleUrl: './admin-kiosk.css'
})
export class AdminKiosk implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private zone = inject(NgZone);

  scanner: Html5Qrcode | null = null;

  estado: EstadoScanner = 'idle';
  mensaje = 'Esperando QR...';
  entrada: any = null;

  procesando = false;
  ultimoQr = '';
  ultimoEscaneo = 0;

  historial: any[] = [];

  flashDisponible = false;
  flashActivo = false;

  async ngOnInit(): Promise<void> {
    setTimeout(() => {
      this.iniciarScanner();
    }, 300);
  }

  async ngOnDestroy(): Promise<void> {
    await this.detenerScanner();
  }

  async iniciarScanner(): Promise<void> {
    try {
      this.estado = 'idle';
      this.mensaje = 'Iniciando cámara...';
      this.entrada = null;

      await this.detenerScanner();

      this.scanner = new Html5Qrcode('qr-reader', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false
      });

      const config = {
        fps: 15,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const boxSize = Math.floor(minEdge * 0.68);

          return {
            width: boxSize,
            height: boxSize
          };
        },
        aspectRatio: 1.0,
        disableFlip: true,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      };

      await this.scanner.start(
        { facingMode: 'environment' },
        config,
        async (decodedText: string) => {
          await this.procesarQr(decodedText);
        },
        () => {}
      );

      this.zone.run(() => {
        this.mensaje = 'Esperando QR...';
        this.estado = 'idle';
      });

      this.mensaje = 'Esperando QR...';

      setTimeout(() => {
        this.detectarFlash();
      }, 800);

    } catch (error) {
      console.error('Error iniciando scanner:', error);
      this.estado = 'error';
      this.mensaje = 'No se pudo iniciar la cámara. Revisá permisos o reiniciá.';
    }
  }

  async procesarQr(qrData: string): Promise<void> {
    console.log('======================');
  console.log('QR LEIDO:', qrData);
  console.log('======================');
    const ahora = Date.now();

    if (this.procesando) return;

    if (qrData === this.ultimoQr && ahora - this.ultimoEscaneo < 9000) {
      return;
    }

    this.procesando = true;
    this.ultimoQr = qrData;
    this.ultimoEscaneo = ahora;

    this.zone.run(() => {
      this.estado = 'validating';
      this.mensaje = 'Validando entrada...';
      this.entrada = null;
    });

    try {
      this.scanner?.pause(true);
console.log('ENVIANDO AL BACKEND:', {
  qr_data: qrData
});
      const response: any = await this.http.post(
        `${environment.apiUrl}/compras-entradas/validar-qr`,
        { qr_data: qrData }
      ).toPromise();

      this.zone.run(() => {
        this.estado = 'success';
        this.mensaje = response.message || 'Entrada válida';
        this.entrada = response.entrada;
        this.agregarHistorial('success', this.mensaje, this.entrada);
      });
      this.vibrar([120]);
      this.playSuccess();

    } catch (error: any) {
      console.error('Error validando QR:', error);
      console.log('MENSAJE BACKEND:', error?.error);

      this.zone.run(() => {
        this.estado = 'error';
        this.mensaje = error?.error?.message || 'QR inválido';
        this.entrada = error?.error?.entrada || null;
        this.agregarHistorial('error', this.mensaje, this.entrada);
      });
      this.vibrar([250, 100, 250]);
      this.playError();
    }

    setTimeout(() => {
      this.zone.run(() => {
        this.estado = 'idle';
        this.mensaje = 'Esperando QR...';
        this.entrada = null;
        this.procesando = false;
      });

      try {
        this.scanner?.resume();
      } catch {}
    }, 4500);
  }

  async reiniciarScanner(): Promise<void> {
    this.estado = 'idle';
    this.mensaje = 'Reiniciando cámara...';
    this.entrada = null;
    this.procesando = false;
    this.ultimoQr = '';
    this.ultimoEscaneo = 0;
    this.flashActivo = false;
    this.flashDisponible = false;

    await this.detenerScanner();

    setTimeout(() => {
      this.iniciarScanner();
    }, 500);
  }

  async detenerScanner(): Promise<void> {
    try {
      if (this.scanner?.isScanning) {
        await this.scanner.stop();
      }

      await this.scanner?.clear();
      this.scanner = null;
    } catch {
      this.scanner = null;
    }
  }

  async detectarFlash(): Promise<void> {
    try {
      const video = document.querySelector('#qr-reader video') as HTMLVideoElement;

      const stream = video?.srcObject as MediaStream;
      const track = stream?.getVideoTracks?.()[0];

      if (!track) {
        this.flashDisponible = false;
        return;
      }

      const capabilities: any = track.getCapabilities?.();

      this.flashDisponible = !!capabilities?.torch;

    } catch {
      this.flashDisponible = false;
    }
  }

  async toggleFlash(): Promise<void> {
    try {
      const video = document.querySelector('#qr-reader video') as HTMLVideoElement;

      const stream = video?.srcObject as MediaStream;
      const track = stream?.getVideoTracks?.()[0];

      if (!track) return;

      this.flashActivo = !this.flashActivo;

      await track.applyConstraints({
        advanced: [
          {
            torch: this.flashActivo
          } as any
        ]
      });

    } catch (error) {
      console.warn('Flash no disponible en este dispositivo:', error);
      this.flashDisponible = false;
      this.flashActivo = false;
    }
  }

  agregarHistorial(tipo: 'success' | 'error', mensaje: string, entrada: any): void {
    this.historial.unshift({
      tipo,
      mensaje,
      entrada,
      hora: new Date()
    });

    this.historial = this.historial.slice(0, 6);
  }

  vibrar(pattern: number[]): void {
    try {
      navigator.vibrate?.(pattern);
    } catch {}
  }

  playSuccess(): void {
    try {
      const audio = new Audio('/sounds/success.mp3');
      audio.volume = 1;
      audio.play();
    } catch {}
  }

  playError(): void {
    try {
      const audio = new Audio('/sounds/error.mp3');
      audio.volume = 1;
      audio.play();
    } catch {}
  }
}