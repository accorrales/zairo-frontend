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
  // Fotograma "objetivo" (segun scroll) y el actual (animado): el lerp entre
  // ambos es lo que da la sensacion fluida y cara, sin saltos.
  private sequenceTargetFrame = 0;
  private sequenceCurrentFrame = 0;
  private sequenceProgress = 0;
  private sequenceRaf = 0;
  private sequenceScrollHandler = () => this.onSequenceScroll();
  private sequenceResizeHandler = () => {
    this.resizeSequenceCanvas();
    this.drawSequenceFrame(this.sequenceCurrentFrame);
  };

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
    cancelAnimationFrame(this.sequenceRaf);
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

    // alpha:false = compositing mas rapido (no necesitamos transparencia).
    this.sequenceCtx = canvas.getContext('2d', { alpha: false });

    for (let i = 1; i <= SEQUENCE_FRAME_COUNT; i++) {
      const index = i - 1;
      const img = new Image();
      img.decoding = 'async';
      img.src = `/secuencia/frame-${String(i).padStart(3, '0')}.jpg`;
      img.onload = () => {
        if (Math.round(this.sequenceCurrentFrame) === index) {
          this.drawSequenceFrame(this.sequenceCurrentFrame);
        }
      };
      this.sequenceImages.push(img);
    }

    this.resizeSequenceCanvas();
    window.addEventListener('resize', this.sequenceResizeHandler);
    window.addEventListener('scroll', this.sequenceScrollHandler, { passive: true });
    this.onSequenceScroll();
    this.sequenceRaf = requestAnimationFrame(() => this.renderSequenceLoop());
  }

  private onSequenceScroll(): void {
    const section = this.scrollSequenceEl?.nativeElement;
    if (!section) return;

    const rect = section.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight;
    const progress = scrollable > 0 ? -rect.top / scrollable : 0;
    const clamped = Math.min(1, Math.max(0, progress));

    this.sequenceProgress = clamped;
    // Suavizado tipo "ease" sobre el progreso para arranque/cierre mas elegante.
    const eased = clamped * clamped * (3 - 2 * clamped);
    this.sequenceTargetFrame = eased * (SEQUENCE_FRAME_COUNT - 1);
  }

  // Bucle continuo: interpola el frame actual hacia el objetivo (lerp).
  // El resultado es una animacion fluida y pesada, sin saltos de fotograma.
  private renderSequenceLoop(): void {
    const diff = this.sequenceTargetFrame - this.sequenceCurrentFrame;

    if (Math.abs(diff) > 0.001) {
      this.sequenceCurrentFrame += diff * 0.12;
      this.drawSequenceFrame(this.sequenceCurrentFrame);
    }

    this.sequenceRaf = requestAnimationFrame(() => this.renderSequenceLoop());
  }

  private resizeSequenceCanvas(): void {
    const canvas = this.sequenceCanvasEl?.nativeElement;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  }

  scrollToSection(sectionId: string, event?: Event): void {
    event?.preventDefault();

    const element = document.getElementById(sectionId);

    if (!element) {
      return;
    }

    const navbarOffset = 92;

    const y =
      element.getBoundingClientRect().top +
      window.pageYOffset -
      navbarOffset;

    window.scrollTo({
      top: y,
      behavior: 'smooth'
    });
  }

  private drawSequenceFrame(frameValue: number): void {
    const canvas = this.sequenceCanvasEl?.nativeElement;
    const ctx = this.sequenceCtx;
    if (!canvas || !ctx) return;

    const frame = Math.round(frameValue);
    const img = this.sequenceImages[frame];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    this.sequenceFrame = frame;
    this.sequenceCurrentFrame = frameValue;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const canvasRatio = width / height;
    const imgRatio = img.naturalWidth / img.naturalHeight;

    // Zoom sutil que se relaja con el scroll: da sensacion cinematografica.
    const scale = 1.06 - this.sequenceProgress * 0.06;

    let drawWidth: number;
    let drawHeight: number;

    if (imgRatio > canvasRatio) {
      drawHeight = height * scale;
      drawWidth = drawHeight * imgRatio;
    } else {
      drawWidth = width * scale;
      drawHeight = drawWidth / imgRatio;
    }

    const offsetX = (width - drawWidth) / 2;
    const offsetY = (height - drawHeight) / 2;

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  }
}