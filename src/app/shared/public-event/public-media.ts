import {Component, Input, OnChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
@Component({selector:'app-public-image',standalone:true,imports:[CommonModule],template:`
  <img *ngIf="src && !failed; else placeholder" [src]="src" [alt]="alt" [width]="width" [height]="height" [attr.loading]="priority?'eager':'lazy'" [attr.fetchpriority]="priority?'high':'auto'" decoding="async" (error)="failed=true">
  <ng-template #placeholder><div class="image-placeholder" role="img" [attr.aria-label]="alt || 'Imagen por anunciar'"><span aria-hidden="true">Z</span><small>{{failed ? 'Imagen no disponible' : 'Una experiencia Zairo'}}</small></div></ng-template>`,styles:[`:host{display:block;overflow:hidden;aspect-ratio:var(--media-ratio,8/5);background:#18221c}img{width:100%;height:100%;object-fit:cover;display:block}.image-placeholder{height:100%;min-height:160px;display:flex;flex-direction:column;gap:14px;align-items:center;justify-content:center;background:radial-gradient(ellipse at 70% 10%,#c6ff5724,transparent 60%),#101710;color:#d6e3d3}.image-placeholder span{font-size:72px;font-weight:900;line-height:1}.image-placeholder small{font:12px 'Segoe UI',sans-serif;letter-spacing:2px;text-transform:uppercase}`]})
export class PublicImage implements OnChanges {
 @Input() src='';@Input() alt='';@Input() priority=false;@Input() width=1600;@Input() height=1000;failed=false;
 ngOnChanges(){this.failed=false;}
}
@Component({selector:'app-public-video',standalone:true,imports:[CommonModule,PublicImage],template:`
 <button *ngIf="!active" type="button" class="video-poster" (click)="active=true;failed=false" [attr.aria-label]="'Reproducir '+title"><app-public-image [src]="poster" [alt]="title"></app-public-image><span>▶ {{title}}</span></button>
 <video *ngIf="active && !failed" [src]="src" [poster]="poster" controls autoplay playsinline preload="none" [attr.aria-label]="title" (error)="failed=true"></video>
 <p *ngIf="failed" role="status">No se pudo cargar el video. <button type="button" (click)="active=false;failed=false">Reintentar</button></p>`,styles:[`:host{display:block}.video-poster{border:1px solid #ffffff50;background:#111815;color:#f3f6ef;padding:0;position:relative;width:100%;cursor:pointer;border-radius:16px;overflow:hidden}.video-poster span{position:absolute;bottom:18px;left:18px;padding:14px;background:#080b0aed;border-radius:8px;font:600 14px 'Segoe UI',sans-serif;max-width:calc(100% - 36px)}video{width:100%;max-height:600px;border-radius:16px;background:#080b0a}button:focus-visible{outline:3px solid #c6ff57;outline-offset:4px}`]})
export class PublicVideo {@Input() src='';@Input() poster='';@Input() title='Video del evento';active=false;failed=false;}
