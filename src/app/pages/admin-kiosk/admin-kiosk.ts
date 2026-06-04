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

  estado: 'idle' | 'success' | 'error' = 'idle';

  mensaje = 'Esperando QR...';

  entrada: any = null;

  procesando = false;

  ngOnInit(): void {
    this.iniciarScanner();
  }

  ngOnDestroy(): void {
    }

  async iniciarScanner() {

    const video = this.videoRef.nativeElement;

    const devices = await BrowserMultiFormatReader.listVideoInputDevices();

    if (!devices.length) {
      this.mensaje = 'No se encontró cámara.';
      return;
    }

    this.scanner.decodeFromVideoDevice(
      devices[0].deviceId,
      video,
      async (result) => {

        if (!result || this.procesando) return;

        this.procesando = true;

        try {

          const qrData = result.getText();
            alert(qrData);
            
          const response: any = await this.http.post(
            `${environment.apiUrl}/compras-entradas/validar-qr`,
            {
              qr_data: qrData
            }
          ).toPromise();

          this.estado = 'success';

          this.mensaje = response.message;

          this.entrada = response.entrada;

          this.playSuccess();

        } catch (error: any) {

          this.estado = 'error';

          this.mensaje =
            error?.error?.message ||
            'QR inválido';

          this.entrada = null;

          this.playError();

        }

        setTimeout(() => {
          this.estado = 'idle';
          this.mensaje = 'Esperando QR...';
          this.entrada = null;
          this.procesando = false;
        }, 4000);

      }
    );

  }

  playSuccess() {
    const audio = new Audio('/sounds/success.mp3');
    audio.play();
  }

  playError() {
    const audio = new Audio('/sounds/error.mp3');
    audio.play();
  }

}