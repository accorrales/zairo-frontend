import {
  Component,
  OnDestroy,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
  NgZone,
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
  private zone = inject(NgZone);

  @ViewChild('scrollSequence') scrollSequenceEl?: ElementRef<HTMLElement>;
  @ViewChild('sequenceCanvas') sequenceCanvasEl?: ElementRef<HTMLCanvasElement>;

  private sequenceImages: HTMLImageElement[] = [];
  private sequenceCtx?: CanvasRenderingContext2D | null;

  private sequenceTargetProgress = 0;
  private sequenceCurrentProgress = 0;
  private sequenceRaf = 0;

  // Banderas para arrancar/detener el render loop (no corre en vacío)
  private sequenceRunning = false;
  private sequenceVisible = false;
  private sequenceReady = false;

  // Cache de DOM para no consultar/escribir en cada frame
  private progressCountEl: HTMLElement | null = null;
  private lastRenderedFrame = -1;
  private lastProgressVar = -1;
  private lastDeep = false;
  private lastEnding = false;

  private prefersReducedMotion = false;

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
  private sequenceObserver?: IntersectionObserver;

  ngOnInit(): void {
    this.prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

    this.preloadIntroAssets();

    // Failsafe: el loader nunca se queda pegado, pero si la secuencia
    // carga antes, se oculta de inmediato (ver onPrimerFrameListo()).
    this.introTimer = setTimeout(() => {
      this.loadingIntro = false;
    }, 3500);

    this.eventosService.obtenerEventosActivos().subscribe({
      next: (data: any) => {
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

        setTimeout(() => this.iniciarScrollReveal(), 300);
      },
      error: (error) => {
        console.error('ERROR CARGANDO EVENTOS:', error);
        this.eventos = [];
        this.cargando = false;

        setTimeout(() => this.iniciarScrollReveal(), 300);
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
    this.sequenceObserver?.disconnect();

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
            // Una vez revelado, dejamos de observarlo.
            this.observer?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
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
    const section = this.scrollSequenceEl?.nativeElement;

    if (!canvas || !section) {
      return;
    }

    /*
      Importante:
      No usamos { alpha: false } para que el fallback no se tape con negro
      mientras cargan los frames.
    */
    this.sequenceCtx = canvas.getContext('2d');
    this.progressCountEl = section.querySelector('.sequence-progress-count');

    this.resizeSequenceCanvas();
    this.precargarFramesSecuencia();

    // Los listeners y el rAF viven FUERA de Angular: no disparan
    // change detection en cada scroll/frame (clave para que vaya fluido).
    this.zone.runOutsideAngular(() => {
      window.addEventListener('resize', this.sequenceResizeHandler, { passive: true });
      window.addEventListener('scroll', this.sequenceScrollHandler, { passive: true });

      // Solo animamos cuando la sección está realmente en pantalla.
      this.sequenceObserver = new IntersectionObserver(
        (entries) => {
          this.sequenceVisible = entries[0]?.isIntersecting ?? false;

          if (this.sequenceVisible) {
            this.onSequenceScroll();
            this.startSequenceLoop();
          }
        },
        { threshold: 0 }
      );

      this.sequenceObserver.observe(section);
      this.onSequenceScroll();
    });
  }

  private precargarFramesSecuencia(): void {
    this.sequenceImages = [];

    // Soporte WebP con fallback automático a JPG (ambos sets sirven).
    const supportsWebp =
      typeof document !== 'undefined' &&
      document
        .createElement('canvas')
        .toDataURL('image/webp')
        .startsWith('data:image/webp');

    const ext = supportsWebp ? 'webp' : 'jpg';

    for (let i = 1; i <= SEQUENCE_FRAME_COUNT; i++) {
      const index = i - 1;
      const name = `frame-${String(i).padStart(3, '0')}`;
      const img = new Image();

      img.decoding = 'async';
      img.loading = 'eager';

      // Si el .webp no existe en el server, caemos a .jpg sin romper la secuencia.
      img.onerror = () => {
        if (img.src.endsWith('.webp')) {
          img.src = `/secuencia/${name}.jpg`;
        }
      };

      img.onload = () => {
        if (index === 0) {
          this.onPrimerFrameListo();
        }
      };

      img.src = `/secuencia/${name}.${ext}`;
      this.sequenceImages.push(img);
    }
  }

  private onPrimerFrameListo(): void {
    this.sequenceReady = true;
    this.drawSequenceFrame(this.sequenceCurrentProgress);

    // El loader se oculta apenas el primer frame está listo (no esperamos 3.5s).
    if (this.loadingIntro) {
      this.zone.run(() => {
        this.loadingIntro = false;
      });
    }

    if (this.sequenceVisible) {
      this.startSequenceLoop();
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

    // Si el loop estaba dormido, lo despertamos para seguir el scroll.
    if (this.sequenceVisible) {
      this.startSequenceLoop();
    }
  }

  private startSequenceLoop(): void {
    if (this.sequenceRunning || !this.sequenceReady) {
      return;
    }

    // Con reduced-motion no animamos: pintamos el frame destino y listo.
    if (this.prefersReducedMotion) {
      this.sequenceCurrentProgress = this.sequenceTargetProgress;
      this.drawSequenceFrame(this.sequenceCurrentProgress);
      this.updateSequenceVisualState(this.sequenceCurrentProgress);
      return;
    }

    this.sequenceRunning = true;
    this.sequenceRaf = requestAnimationFrame(() => this.renderSequenceLoop());
  }

  private renderSequenceLoop(): void {
    /*
      Entre menor el número, más pesado/cinemático.
      Entre mayor, más rápido responde al scroll.
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

    // Cuando ya alcanzó el destino (o la sección salió de pantalla),
    // dormimos el loop. El scroll/observer lo vuelven a despertar.
    const settled = this.sequenceCurrentProgress === this.sequenceTargetProgress;

    if (settled || !this.sequenceVisible) {
      this.sequenceRunning = false;
      return;
    }

    this.sequenceRaf = requestAnimationFrame(() => this.renderSequenceLoop());
  }

  private resizeSequenceCanvas(): void {
    const canvas = this.sequenceCanvasEl?.nativeElement;

    if (!canvas) {
      return;
    }

    // Cap del DPR a 1.5: el lienzo es un fondo estilizado, no necesita 2x/3x.
    // Baja muchísimo el fill-rate en móviles de gama media/baja.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
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

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    // 'medium' rinde casi igual que 'high' pero cuesta bastante menos por frame.
    ctx.imageSmoothingQuality = 'medium';

    this.drawImageCover(ctx, currentImage, width, height, safeProgress, 1);

    if (
      nextImage &&
      nextImage.complete &&
      nextImage.naturalWidth > 0 &&
      nextIndex !== currentIndex
    ) {
      this.drawImageCover(ctx, nextImage, width, height, safeProgress, blend);
    }
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

    // Solo tocamos el DOM cuando el valor realmente cambió.
    // Evita recalcular estilos en cada uno de los 60 frames por segundo.
    const progressVar = Math.round(safeProgress * 1000) / 1000;

    if (progressVar !== this.lastProgressVar) {
      this.lastProgressVar = progressVar;
      section.style.setProperty('--sequence-progress', progressVar.toFixed(3));
    }

    const deep = safeProgress > 0.52;
    const ending = safeProgress > 0.82;

    if (deep !== this.lastDeep) {
      this.lastDeep = deep;
      section.classList.toggle('sequence-deep', deep);
    }

    if (ending !== this.lastEnding) {
      this.lastEnding = ending;
      section.classList.toggle('sequence-ending', ending);
    }

    const currentFrame = Math.round(easedProgress * (SEQUENCE_FRAME_COUNT - 1)) + 1;

    if (currentFrame !== this.lastRenderedFrame && this.progressCountEl) {
      this.lastRenderedFrame = currentFrame;
      this.progressCountEl.textContent =
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
