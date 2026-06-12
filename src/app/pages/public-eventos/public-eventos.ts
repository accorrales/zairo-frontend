import {
  Component,
  OnDestroy,
  OnInit,
  AfterViewInit,
  inject
} from '@angular/core';
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
export class PublicEventos implements OnInit, AfterViewInit, OnDestroy {
  private eventosService = inject(EventosService);

  eventos: any[] = [];
  cargando = true;
  loadingIntro = true;

  whatsapp = '50688888888';

  countdown = {
    dias: '00',
    horas: '00',
    minutos: '00',
    segundos: '00'
  };

  ticketTransform = 'perspective(900px) rotateX(6deg) rotateY(-10deg)';

  private timer: any;
  private introTimer: any;
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    this.introTimer = setTimeout(() => {
      this.loadingIntro = false;
    }, 2300);

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

  ngAfterViewInit(): void {
    setTimeout(() => this.iniciarScrollReveal(), 300);
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
    clearTimeout(this.introTimer);
    this.observer?.disconnect();
  }

  get proximoEvento(): any {
    return this.eventos?.[0] || null;
  }

  get whatsappUrl(): string {
    const evento = this.proximoEvento?.nombre || 'Lost Trip: Welcome to the Jungle';
    const msg = `Hola ZAIRO, quiero información para comprar entrada para ${evento}.`;
    return `https://wa.me/${this.whatsapp}?text=${encodeURIComponent(msg)}`;
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

  iniciarScrollReveal(): void {
    const elementos = document.querySelectorAll('.reveal');

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.15 }
    );

    elementos.forEach((el) => this.observer?.observe(el));
  }

  moverTicket(event: MouseEvent): void {
    const card = event.currentTarget as HTMLElement;
    const rect = card.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const rotateY = ((x / rect.width) - 0.5) * 18;
    const rotateX = -((y / rect.height) - 0.5) * 18;

    this.ticketTransform =
      `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
  }

  resetTicket(): void {
    this.ticketTransform = 'perspective(900px) rotateX(6deg) rotateY(-10deg)';
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