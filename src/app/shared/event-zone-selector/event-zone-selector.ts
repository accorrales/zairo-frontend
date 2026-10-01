import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface EventZone {
  clave: string;
  nombre: string;
  estado: string;
  precioActual: number;
  faseActual?: any;
}

@Component({
  selector: 'app-event-zone-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-shell">
      <div class="map-header"><span>{{ imageUrl && !imageFailed ? 'PLANO DEL EVENTO' : 'VISTA CONCEPTUAL' }}</span><small>01 / Zona · 02 / Tarifa · 03 / Tus datos</small></div>
      <div class="venue" [class.with-image]="imageUrl && !imageFailed">
        <img *ngIf="imageUrl && !imageFailed" [src]="imageUrl" (error)="imageFailed = true" alt="Plano del evento" loading="lazy">
        <ng-container *ngIf="!imageUrl || imageFailed"><div class="stage">ESCENARIO<span>THE PORTAL</span></div><div class="floor"><span>PISTA</span><div class="floor-lines" aria-hidden="true"></div></div><div class="side side-a">LOUNGE</div><div class="side side-b">LOUNGE</div><div class="entry">ACCESO</div></ng-container>
      </div>
      <p class="notice">{{ imageUrl && !imageFailed ? 'Consultá las zonas y tarifas disponibles debajo del plano.' : 'Distribución ilustrativa. El plano y la ubicación exacta de cada zona se revelarán próximamente.' }}</p>
      <div class="zones" aria-label="Zonas y tarifas del evento">
        <button type="button" *ngFor="let zone of zones" (click)="zoneSelected.emit(zone)" [class.selected]="selectedKey === zone.clave" [attr.aria-pressed]="selectedKey === zone.clave">
          <span class="zone-name">{{ zone.nombre }}</span><strong>{{ money(zone.precioActual) }}</strong><span class="status" [class.available]="zone.estado === 'DISPONIBLE'">{{ zone.estado }}</span><small>{{ zone.estado === 'DISPONIBLE' ? 'Ver tarifa y continuar ↗' : 'Consultar estado' }}</small>
        </button>
        <div class="placeholder" *ngIf="!zones.length"><span>GENERAL / VIP / EXPERIENCIAS</span><p>Zonas por confirmar. Las entradas aparecerán cuando se habilite la venta.</p></div>
      </div>
    </div>`,
  styleUrl: './event-zone-selector.css'
})
export class EventZoneSelector {
  @Input() zones: EventZone[] = [];
  @Input() selectedKey: string | null = null;
  @Input() imageUrl: string | null = null;
  @Output() zoneSelected = new EventEmitter<EventZone>();
  imageFailed = false;
  money(value: number): string { return `₡${Number(value || 0).toLocaleString('es-CR')}`; }
}
