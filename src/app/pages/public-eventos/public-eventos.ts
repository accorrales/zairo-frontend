import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EventosService } from '../../core/services/eventos.service';

@Component({
  selector: 'app-public-eventos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './public-eventos.html',
  styleUrl: './public-eventos.css'
})
export class PublicEventos implements OnInit, OnDestroy {
  private eventosService = inject(EventosService);

  eventos: any[] = [];
  cargando = true;

  countdown = {
    dias: '00',
    horas: '00',
    minutos: '00',
    segundos: '00'
  };

  private timer: any;

  ngOnInit(): void {
    this.eventosService.obtenerEventosActivos().subscribe({
      next: (data) => {
        this.eventos = data || [];
        this.cargando = false;
        this.iniciarCountdown();
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  get proximoEvento(): any {
    return this.eventos?.[0] || null;
  }

  iniciarCountdown(): void {
    this.actualizarCountdown();
    this.timer = setInterval(() => this.actualizarCountdown(), 1000);
  }

  actualizarCountdown(): void {
    if (!this.proximoEvento?.fecha) return;

    const fechaEvento = new Date(this.proximoEvento.fecha).getTime();
    const ahora = new Date().getTime();
    const diferencia = fechaEvento - ahora;

    if (diferencia <= 0) {
      this.countdown = { dias: '00', horas: '00', minutos: '00', segundos: '00' };
      return;
    }

    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferencia / (1000 * 60 * 60)) % 24);
    const minutos = Math.floor((diferencia / (1000 * 60)) % 60);
    const segundos = Math.floor((diferencia / 1000) % 60);

    this.countdown = {
      dias: String(dias).padStart(2, '0'),
      horas: String(horas).padStart(2, '0'),
      minutos: String(minutos).padStart(2, '0'),
      segundos: String(segundos).padStart(2, '0')
    };
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-CR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatearMoneda(valor: number): string {
    return `CRC ${Number(valor || 0).toLocaleString('es-CR')}`;
  }
}