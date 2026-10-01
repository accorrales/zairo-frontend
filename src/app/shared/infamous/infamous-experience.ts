import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

export const INFAMOUS_ASSETS = '/assets/infamous/v2/';
export function isInfamous(event: any): boolean {
  return !!event && /infamous/i.test(event.nombre || '');
}

@Component({
  selector: 'app-infamous-film',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="film">
      <img [src]="assets + 'portal.webp'" alt="Un portal de cristal rojo se abre en una catedral oscura" fetchpriority="high">
      <video #film *ngIf="playVideo && !failed" [src]="assets + 'hero.mp4'" [poster]="assets + 'portal.webp'" autoplay muted loop playsinline preload="metadata" [muted]="true" (playing)="playing = true" (pause)="playing = false" (error)="failed = true; playing = false" aria-label="Película visual de INFAMOUS"></video>
      <button type="button" (click)="toggle()" [attr.aria-pressed]="playing">{{ playing ? 'Pausar visual' : failed ? 'Reintentar visual' : 'Reproducir visual' }}</button>
    </div>`,
  styles: [`:host{display:block;height:100%}.film{height:100%;position:relative;background:#09090b;overflow:hidden}.film img,.film video{width:100%;height:100%;object-fit:cover;position:absolute;inset:0}.film button{position:absolute;bottom:24px;right:24px;z-index:3;color:#fff;border:1px solid #ffffff60;background:#09090bd9;padding:12px 18px;border-radius:30px;font:inherit;font-size:12px;cursor:pointer}.film button:focus-visible{outline:3px solid #ff667e;outline-offset:4px}`]
})
export class InfamousFilm implements OnInit {
  readonly assets = INFAMOUS_ASSETS;
  playVideo = false;
  playing = false;
  failed = false;
  @ViewChild('film') film?: ElementRef<HTMLVideoElement>;
  ngOnInit(): void {
    this.playVideo = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  toggle(): void {
    if (this.playing) {
      this.playVideo = false;
      this.playing = false;
      return;
    }
    this.failed = false;
    this.playVideo = true;
    // If autoplay was blocked, reuse the element during this user gesture.
    this.film?.nativeElement.play()?.catch(() => { this.playing = false; });
  }
}

@Component({
  selector: 'app-infamous-intro',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="intro-film" aria-labelledby="intro-film-title">
      <div class="intro-copy"><span>LA PRIMERA SEÑAL / FILM OFICIAL</span><h2 id="intro-film-title">Todo empieza<br>con un despertar.</h2><p>Entrá al universo de INFAMOUS. Mirá la introducción y dejá que la noche tome forma.</p><small>EL DESPERTAR DE LAS ALMAS</small></div>
      <div class="intro-screen">
        <video #intro [src]="assets + 'intro.mp4'" [poster]="assets + 'intro-poster.webp'" playsinline controls preload="none" (playing)="started = true; failed = false" (error)="failed = true" aria-label="Introducción oficial de INFAMOUS, El despertar de las almas"></video>
        <button *ngIf="!started" type="button" (click)="play(intro)">{{ failed ? 'Reintentar intro' : 'Ver intro' }} <span aria-hidden="true">▶</span></button>
        <p *ngIf="failed" class="intro-error" role="status">No se pudo reproducir el intro. Tocá Reintentar intro para volver a cargarlo.</p>
      </div>
    </section>`,
  styleUrl: './infamous-intro.css'
})
export class InfamousIntro {
  readonly assets = INFAMOUS_ASSETS;
  started = false;
  failed = false;
  play(video: HTMLVideoElement): void {
    if (this.failed) video.load();
    this.failed = false;
    video.play()?.catch(() => { this.failed = true; });
  }
}

@Component({
  selector: 'app-infamous-experience',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="lineup" id="lineup" aria-labelledby="lineup-title">
      <div class="heading"><span>01 / FRECUENCIAS</span><h2 id="lineup-title">Las almas del sonido.</h2><p>Una misma noche. Distintas formas de sentirla.</p></div>
      <div class="artists">
        <article *ngFor="let artist of artists; let i = index">
          <img *ngIf="artist.image; else pending" [src]="assets + artist.image" [alt]="artist.name" loading="lazy" decoding="async">
          <ng-template #pending><div class="pending" aria-label="Foto de JUNE por revelar"><span>J</span><small>RETRATO POR REVELAR</small></div></ng-template>
          <div class="artist-caption"><small>0{{ i + 1 }} / LINEUP</small><h3>{{ artist.name }}</h3></div>
        </article>
      </div>
    </section>
    <section class="story" aria-labelledby="story-title">
      <div class="story-copy"><span>02 / EL UMBRAL</span><h2 id="story-title">El despertar<br>de las almas.</h2><p>Cuando cae la noche, el cristal refleja otra versión de vos. Cruzá el umbral: música, sombras y una energía que se queda después del amanecer.</p><small>INFAMOUS / HALLOWEEN 2026</small></div>
      <figure><img [src]="assets + 'awakening.webp'" alt="Una luz roja atraviesa el portal de una catedral" loading="lazy" decoding="async"><figcaption>La señal. El umbral. El despertar.</figcaption></figure>
      <figure class="second"><img [src]="assets + 'ritual.webp'" alt="Almas reunidas frente a una catedral de cristal y reflejos rojos" loading="lazy" decoding="async"><figcaption>Una noche para dejar tu huella.</figcaption></figure>
    </section>`,
  styleUrl: './infamous-experience.css'
})
export class InfamousExperience {
  readonly assets = INFAMOUS_ASSETS;
  readonly artists = [
    { name: '4BES', image: '4bes.webp' }, { name: 'JUNNO', image: 'junno.webp' },
    { name: 'VARGAS', image: 'vargas.webp' }, { name: 'BARU', image: 'baru.webp' },
    { name: 'JOAO', image: 'joao.webp' }, { name: 'JUNE', image: null }
  ];
}
