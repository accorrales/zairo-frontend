import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { EventosService } from '../../core/services/eventos.service';
import { EntradaTiersService } from '../../core/services/entrada-tiers.service';

@Component({
  selector: 'app-public-evento-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './public-evento-detalle.html',
  styleUrl: './public-evento-detalle.css'
})
export class PublicEventoDetalle implements OnInit {
  private route = inject(ActivatedRoute);
  private eventosService = inject(EventosService);
  private tiersService = inject(EntradaTiersService);

  idEvento!: number;
  evento: any = null;
  tiers: any[] = [];
  cargando = true;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.cargando = false;
      return;
    }

    this.idEvento = Number(id);
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.eventosService.obtenerEventoPorId(this.idEvento).subscribe({
      next: (evento) => {
        this.evento = evento;
        this.cargarTiers();
      },
      error: (err) => {
        console.error('Error al cargar evento', err);
        this.cargando = false;
      }
    });
  }

  cargarTiers(): void {
    this.tiersService.obtenerTiersPorEvento(this.idEvento).subscribe({
      next: (data) => {
        this.tiers = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar tiers', err);
        this.cargando = false;
      }
    });
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-CR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  formatearMoneda(valor: number): string {
    return `CRC ${Number(valor || 0).toLocaleString('es-CR')}`;
  }

  comprarWhatsapp(tier: any): void {
    const mensaje = `Hola, quiero comprar una entrada para ${this.evento.nombre}. Tipo: ${tier.nombre}. Precio: ${this.formatearMoneda(tier.precio)}.`;
    const url = `https://wa.me/50661518701?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  }
}