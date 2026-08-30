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
  private timer: ReturnType<typeof setInterval> | null = null;

  eventos: any[] = [];
  cargando = true;

  readonly infamousFlyer = '/assets/infamous/infamous-flyer.webp';

  readonly halloween = {
    titulo: 'INFAMOUS',
    subtitulo: 'EL DESPERTAR DEL INFIERNO',
    fecha: '2026-10-31T20:00:00-06:00',
    frase: 'Una noche donde los pecados serán permitidos.'
  };

  countdown = {
    dias: '00',
    horas: '00',
    minutos: '00',
    segundos: '00'
  };

  ngOnInit(): void {
    this.eventosService.obtenerEventosActivos().subscribe({
      next: (data: any) => {
        const lista = this.normalizarEventos(data);
        const inicioHoy = new Date();
        inicioHoy.setHours(0, 0, 0, 0);

        this.eventos = lista
          .filter((evento) => {
            if (!evento?.fecha) return true;
            const fecha = new Date(evento.fecha).getTime();
            return Number.isFinite(fecha) && fecha >= inicioHoy.getTime();
          })
          .sort((a, b) => {
            const fechaA = new Date(a?.fecha || this.halloween.fecha).getTime();
            const fechaB = new Date(b?.fecha || this.halloween.fecha).getTime();
            return fechaA - fechaB;
          });

        this.cargando = false;
        this.iniciarCountdown();
      },
      error: (error) => {
        console.error('ERROR CARGANDO EVENTOS:', error);
        this.eventos = [];
        this.cargando = false;
        this.iniciarCountdown();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  get proximoEvento(): any {
    return this.eventos[0] || null;
  }

  get ventaAbierta(): boolean {
    return this.proximoEvento?.estado === true;
  }

  get imagenPrincipal(): string {
    if (!this.ventaAbierta) {
      return this.infamousFlyer;
    }

    return this.proximoEvento?.imagen || this.infamousFlyer;
  }

  get fechaPrincipal(): string {
    return this.proximoEvento?.fecha || this.halloween.fecha;
  }

  get nombreEventoActivo(): string {
    return this.proximoEvento?.nombre || this.halloween.titulo;
  }

  get eventosAdicionales(): any[] {
    return this.eventos.slice(1);
  }

  private normalizarEventos(data: any): any[] {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.eventos)) return data.eventos;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  }

  iniciarCountdown(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }

    this.actualizarCountdown();
    this.timer = setInterval(() => this.actualizarCountdown(), 1000);
  }

  actualizarCountdown(): void {
    const fechaEvento = new Date(this.fechaPrincipal).getTime();
    const ahora = Date.now();
    const diferencia = fechaEvento - ahora;

    if (!Number.isFinite(fechaEvento) || diferencia <= 0) {
      this.countdown = {
        dias: '00',
        horas: '00',
        minutos: '00',
        segundos: '00'
      };
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
      month: '2-digit',
      year: '2-digit'
    });
  }

  formatearFechaLarga(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-CR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  formatearMoneda(valor: number): string {
    return `₡${Number(valor || 0).toLocaleString('es-CR')}`;
  }

  trackByEventoId(index: number, evento: any): unknown {
    return evento?.id_evento ?? index;
  }
}
