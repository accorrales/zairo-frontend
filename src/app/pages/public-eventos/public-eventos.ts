import {
  Component,
  OnDestroy,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EventosService } from '../../core/services/eventos.service';

const SEQUENCE_FRAME_COUNT = 16;

@Component({
  selector: 'app-public-eventos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './public-eventos.html',
  styleUrl: './public-eventos.css'
})
export class PublicEventos implements OnInit, AfterViewInit, OnDestroy {
  private eventosService = inject(EventosService);

  @ViewChild('scrollSequence') scrollSequenceEl?: ElementRef<HTMLElement>;
  @ViewChild('sequenceCanvas') sequenceCanvasEl?: ElementRef<HTMLCanvasElement>;

  private sequenceImages: HTMLImageElement[] = [];
  private sequenceCtx?: CanvasRenderingContext2D | null;
  private sequenceFrame = 0;
  private sequenceScrollHandler = () => this.onSequenceScroll();
  private sequenceResizeHandler = () => this.drawSequenceFrame(this.sequenceFrame);

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
      next: (data: any) => {
        console.log('EVENTOS RECIBIDOS:', data);

        if (Array.isArray(data)) {
          this.eventos = data;
        } else if (Array.isArray(data?.eventos)) {
          this.eventos = data.eventos;
        } else if (Array.isArray(data?.data)) {
          this.eventos = data.data;
        } else {
          this.eventos = [];
        }

        this.cargando = false;
        this.iniciarCountdown();

        setTimeout(() => {
          this.iniciarScrollReveal();
        }, 300);
      },
      error: (error) => {
        console.error('ERROR CARGANDO EVENTOS:', error);
        this.eventos = [];
        this.cargando = false;

        setTimeout(() => {
          this.iniciarScrollReveal();
        }, 300);
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.iniciarScrollReveal(), 600);
    this.iniciarSecuenciaScroll();
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
    clearTimeout(this.introTimer);
    this.observer?.disconnect();
    window.removeEventListener('scroll', this.sequenceScrollHandler);
    window.removeEventListener('resize', this.sequenceResizeHandler);
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
    clearInterval(this.timer);

    this.actualizarCountdown();
    this.timer = setInterval(() => this.actualizarCountdown(), 1000);
  }

  actualizarCountdown(): void {
    if (!this.proximoEvento?.fecha) return;

    const fechaEvento = new Date(this.proximoEvento.fecha).getTime();
    const ahora = new Date().getTime();
    const diferencia = fechaEvento - ahora;

    if (diferencia <= 0) {
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

  iniciarScrollReveal(): void {
    this.observer?.disconnect();

    const elementos = document.querySelectorAll('.reveal');

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.12 }
    );

    elementos.forEach((el) => {
      this.observer?.observe(el);
    });
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

  private iniciarSecuenciaScroll(): void {
    const canvas = this.sequenceCanvasEl?.nativeElement;
    if (!canvas) return;

    this.sequenceCtx = canvas.getContext('2d');

    for (let i = 1; i <= SEQUENCE_FRAME_COUNT; i++) {
      const img = new Image();
      img.src = `/secuencia/frame-${String(i).padStart(3, '0')}.jpg`;
      if (i === 1) {
        img.onload = () => this.drawSequenceFrame(0);
      }
      this.sequenceImages.push(img);
    }

    window.addEventListener('resize', this.sequenceResizeHandler);
    window.addEventListener('scroll', this.sequenceScrollHandler, { passive: true });
    this.onSequenceScroll();
  }

  private onSequenceScroll(): void {
    const section = this.scrollSequenceEl?.nativeElement;
    if (!section) return;

    const rect = section.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight;
    const progress = scrollable > 0 ? -rect.top / scrollable : 0;
    const clamped = Math.min(1, Math.max(0, progress));

    const frame = Math.min(
      SEQUENCE_FRAME_COUNT - 1,
      Math.floor(clamped * SEQUENCE_FRAME_COUNT)
    );

    if (frame !== this.sequenceFrame) {
      this.drawSequenceFrame(frame);
    }
  }

  private drawSequenceFrame(frame: number): void {
    const canvas = this.sequenceCanvasEl?.nativeElement;
    const ctx = this.sequenceCtx;
    const img = this.sequenceImages[frame];
    if (!canvas || !ctx || !img || !img.complete || img.naturalWidth === 0) return;

    this.sequenceFrame = frame;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const canvasRatio = width / height;
    const imgRatio = img.naturalWidth / img.naturalHeight;

    let drawWidth = width;
    let drawHeight = height;
    let offsetX = 0;
    let offsetY = 0;

    if (imgRatio > canvasRatio) {
      drawHeight = height;
      drawWidth = height * imgRatio;
      offsetX = (width - drawWidth) / 2;
    } else {
      drawWidth = width;
      drawHeight = width / imgRatio;
      offsetY = (height - drawHeight) / 2;
    }

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  }
}