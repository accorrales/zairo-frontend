import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { HttpClient } from '@angular/common/http';
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

  @ViewChild('video', { static: true })
  videoRef!: ElementRef<HTMLVideoElement>;

  scanner = new BrowserMultiFormatReader();

  estado: EstadoScanner = 'idle';
  mensaje = 'Esperando QR...';
  entrada: any = null;
  procesando = false;

  ultimoQr = '';
  ultimoEscaneo = 0;

  async ngOnInit(): Promise<void> {
    await this.iniciarScanner();
  }

  ngOnDestroy(): void {
    this.detenerCamara();
  }

  async iniciarScanner(): Promise<void> {
    try {
      this.estado = 'idle';
      this.mensaje = 'Iniciando cámara...';

      const video = this.videoRef.nativeElement;

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      video.muted = true;

      await video.play();

      this.mensaje = 'Esperando QR...';

      this.scanner.decodeFromVideoElement(
        video,
        async (result) => {
          if (!result) return;

          const qrData = result.getText();
          await this.procesarQr(qrData);
        }
      );

    } catch (error) {
      console.error('Error iniciando cámara:', error);
      this.estado = 'error';
      this.mensaje = 'No se pudo iniciar la cámara. Revisá permisos.';
    }
  }

  async procesarQr(qrData: string): Promise<void> {
    const ahora = Date.now();

    if (this.procesando) return;

    if (qrData === this.ultimoQr && ahora - this.ultimoEscaneo < 7000) {
      return;
    }

    this.procesando = true;
    this.ultimoQr = qrData;
    this.ultimoEscaneo = ahora;

    this.estado = 'validating';
    this.mensaje = 'Validando entrada...';
    this.entrada = null;

    try {
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
    }, 4500);
  }

  detenerCamara(): void {
    try {
      const video = this.videoRef?.nativeElement;

      if (video?.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
      }
    } catch (error) {
      console.error('Error deteniendo cámara:', error);
    }
  }

  playSuccess(): void {
    try {
      const audio = new Audio('/sounds/success.mp3');
      audio.volume = 0.8;
      audio.play();
    } catch {}
  }

  playError(): void {
    try {
      const audio = new Audio('/sounds/error.mp3');
      audio.volume = 0.8;
      audio.play();
    } catch {}
  }
}