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
  private sequenceTargetProgress = 0;
  private sequenceCurrentProgress = 0;
  private sequenceRaf = 0;

  private sequenceScrollHandler = () => this.onSequenceScroll();

  private sequenceResizeHandler = () => {
    this.resizeSequenceCanvas();
    this.drawSequenceFrame(this.sequenceCurrentProgress);
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
    this.preloadIntroAssets();

    this.introTimer = setTimeout(() => {
      this.loadingIntro = false;
    }, 5000);

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

  private preloadIntroAssets(): void {
    const assets = [
      '/assets/zairo-loader-ring.png',
      '/assets/zairo-loader-logo.png'
    ];

    assets.forEach((src) => {
      const img = new Image();

      img.decoding = 'async';
      img.loading = 'eager';
      img.src = src;
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.iniciarScrollReveal(), 600);
    setTimeout(() => this.iniciarSecuenciaScroll(), 100);
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }

    if (this.introTimer) {
      clearTimeout(this.introTimer);
    }

    this.observer?.disconnect();

    window.removeEventListener('scroll', this.sequenceScrollHandler);
    window.removeEventListener('resize', this.sequenceResizeHandler);

    if (this.sequenceRaf) {
      cancelAnimationFrame(this.sequenceRaf);
    }
  }

  get proximoEvento(): any {
    return this.eventos?.[0] || null;
  }

  get whatsappUrl(): string {
    const evento = this.proximoEvento?.nombre || 'Lost Trip';
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

  private iniciarSecuenciaScroll(): void {
    const canvas = this.sequenceCanvasEl?.nativeElement;

    if (!canvas) {
      return;
    }

    /*
      Importante:
      No usamos { alpha: false } para que el fallback no se tape con negro
      mientras cargan los frames.
    */
    this.sequenceCtx = canvas.getContext('2d');

    this.resizeSequenceCanvas();
    this.precargarFramesSecuencia();

    window.addEventListener('resize', this.sequenceResizeHandler, { passive: true });
    window.addEventListener('scroll', this.sequenceScrollHandler, { passive: true });

    this.onSequenceScroll();
    this.updateSequenceVisualState(0);
    this.sequenceRaf = requestAnimationFrame(() => this.renderSequenceLoop());
  }

  private precargarFramesSecuencia(): void {
    this.sequenceImages = [];

    for (let i = 1; i <= SEQUENCE_FRAME_COUNT; i++) {
      const index = i - 1;
      const img = new Image();

      img.decoding = 'async';
      img.loading = 'eager';
      img.src = `/secuencia/frame-${String(i).padStart(3, '0')}.jpg`;

      img.onload = () => {
        if (index === 0) {
          this.drawSequenceFrame(0);
        }
      };

      this.sequenceImages.push(img);
    }
  }

  private onSequenceScroll(): void {
    const section = this.scrollSequenceEl?.nativeElement;

    if (!section) {
      return;
    }

    const rect = section.getBoundingClientRect();
    const scrollable = section.offsetHeight - window.innerHeight;

    if (scrollable <= 0) {
      this.sequenceTargetProgress = 0;
      return;
    }

    const rawProgress = -rect.top / scrollable;
    this.sequenceTargetProgress = this.clamp(rawProgress, 0, 1);
  }

  private renderSequenceLoop(): void {
    /*
      Entre menor el número, más pesado/cinemático.
      Entre mayor, más rápido responde al scroll.
      0.075 - 0.095 es el punto fino.
    */
    const smoothness = 0.085;

    const diff = this.sequenceTargetProgress - this.sequenceCurrentProgress;

    if (Math.abs(diff) > 0.0006) {
      this.sequenceCurrentProgress += diff * smoothness;
    } else {
      this.sequenceCurrentProgress = this.sequenceTargetProgress;
    }

    this.drawSequenceFrame(this.sequenceCurrentProgress);
    this.updateSequenceVisualState(this.sequenceCurrentProgress);

    this.sequenceRaf = requestAnimationFrame(() => this.renderSequenceLoop());
  }

  private resizeSequenceCanvas(): void {
    const canvas = this.sequenceCanvasEl?.nativeElement;

    if (!canvas) {
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }

  private drawSequenceFrame(progress: number): void {
    const canvas = this.sequenceCanvasEl?.nativeElement;
    const ctx = this.sequenceCtx;

    if (!canvas || !ctx || this.sequenceImages.length === 0) {
      return;
    }

    const safeProgress = this.clamp(progress, 0, 1);

    /*
      Smoothstep:
      Hace que el inicio y el final se sientan más elegantes,
      pero mantiene el centro del scroll con buen movimiento.
    */
    const easedProgress = this.smoothstep(safeProgress);

    const maxIndex = SEQUENCE_FRAME_COUNT - 1;
    const exactFrame = easedProgress * maxIndex;

    const currentIndex = Math.floor(exactFrame);
    const nextIndex = Math.min(currentIndex + 1, maxIndex);
    const blend = exactFrame - currentIndex;

    const currentImage = this.sequenceImages[currentIndex];
    const nextImage = this.sequenceImages[nextIndex];

    if (!currentImage || !currentImage.complete || currentImage.naturalWidth === 0) {
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    this.drawImageCover(ctx, currentImage, width, height, safeProgress, 1);

    if (
      nextImage &&
      nextImage.complete &&
      nextImage.naturalWidth > 0 &&
      nextIndex !== currentIndex
    ) {
      this.drawImageCover(ctx, nextImage, width, height, safeProgress, blend);
    }

    this.sequenceFrame = currentIndex;
  }

  private drawImageCover(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    canvasWidth: number,
    canvasHeight: number,
    progress: number,
    alpha: number
  ): void {
    const imageRatio = image.naturalWidth / image.naturalHeight;
    const canvasRatio = canvasWidth / canvasHeight;

    /*
      Zoom cinematográfico:
      Arranca un poquito más cerrado y se abre suavemente.
    */
    const scale = 1.055 - progress * 0.045;

    let drawWidth: number;
    let drawHeight: number;

    if (imageRatio > canvasRatio) {
      drawHeight = canvasHeight * scale;
      drawWidth = drawHeight * imageRatio;
    } else {
      drawWidth = canvasWidth * scale;
      drawHeight = drawWidth / imageRatio;
    }

    /*
      Movimiento mínimo tipo cámara.
      No es exagerado para que la gente pueda ver bien las imágenes.
    */
    const driftX = (progress - 0.5) * 18;
    const driftY = (0.5 - progress) * 10;

    const offsetX = (canvasWidth - drawWidth) / 2 + driftX;
    const offsetY = (canvasHeight - drawHeight) / 2 + driftY;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    ctx.restore();
  }

  private updateSequenceVisualState(progress: number): void {
    const section = this.scrollSequenceEl?.nativeElement;

    if (!section) {
      return;
    }

    const safeProgress = this.clamp(progress, 0, 1);
    const easedProgress = this.smoothstep(safeProgress);

    const currentFrame =
      Math.round(easedProgress * (SEQUENCE_FRAME_COUNT - 1)) + 1;

    section.style.setProperty('--sequence-progress', safeProgress.toFixed(4));

    section.classList.toggle('sequence-deep', safeProgress > 0.52);
    section.classList.toggle('sequence-ending', safeProgress > 0.82);

    const progressCount = section.querySelector('.sequence-progress-count');

    if (progressCount) {
      progressCount.textContent =
        `${String(currentFrame).padStart(2, '0')} / ${SEQUENCE_FRAME_COUNT}`;
    }
  }

  private smoothstep(value: number): number {
    const x = this.clamp(value, 0, 1);
    return x * x * (3 - 2 * x);
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
}