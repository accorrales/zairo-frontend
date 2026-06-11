import {
  Component,
  OnDestroy,
  OnInit,
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

  scanner: Html5Qrcode | null = null;

  estado: EstadoScanner = 'idle';
  mensaje = 'Esperando QR...';
  entrada: any = null;

  procesando = false;
  ultimoQr = '';
  ultimoEscaneo = 0;

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

      await this.detenerScanner();

      this.scanner = new Html5Qrcode('qr-reader', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false
      });

      const config = {
        fps: 12,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const boxSize = Math.floor(minEdge * 0.72);

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
        () => {
          // Ignoramos errores normales de lectura mientras busca QR.
        }
      );

      this.mensaje = 'Esperando QR...';

    } catch (error) {
      console.error('Error iniciando scanner:', error);

      this.estado = 'error';
      this.mensaje = 'No se pudo iniciar la cámara. Revisá permisos o reiniciá.';
    }
  }

  async procesarQr(qrData: string): Promise<void> {
    const ahora = Date.now();

    if (this.procesando) return;

    if (qrData === this.ultimoQr && ahora - this.ultimoEscaneo < 8000) {
      return;
    }

    this.procesando = true;
    this.ultimoQr = qrData;
    this.ultimoEscaneo = ahora;

    this.estado = 'validating';
    this.mensaje = 'Validando entrada...';
    this.entrada = null;

    try {
      this.scanner?.pause(true);

      const response: any = await this.http.post(
        `${environment.apiUrl}/compras-entradas/validar-qr`,
        { qr_data: qrData }
      ).toPromise();

      this.estado = 'success';
      this.mensaje = response.message || 'Entrada válida';
      this.entrada = response.entrada;

      this.playSuccess();

    } catch (error: any) {
      console.error('Error validando QR:', error);

      this.estado = 'error';
      this.mensaje =
        error?.error?.message ||
        'QR inválido';

      this.entrada = error?.error?.entrada || null;

      this.playError();
    }

    setTimeout(() => {
      this.estado = 'idle';
      this.mensaje = 'Esperando QR...';
      this.entrada = null;
      this.procesando = false;

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
    } catch (error) {
      console.warn('Scanner ya detenido o no inicializado:', error);
      this.scanner = null;
    }
  }

  playSuccess(): void {
    try {
      const audio = new Audio('/sounds/success.mp3');
      audio.volume = 0.9;
      audio.play();
    } catch {}
  }

  playError(): void {
    try {
      const audio = new Audio('/sounds/error.mp3');
      audio.volume = 0.9;
      audio.play();
    } catch {}
  }
}