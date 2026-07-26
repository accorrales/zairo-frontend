import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { EventosService } from '../../core/services/eventos.service';
import { ComprasEntradasService } from '../../core/services/compras-entradas.service';

type BebidaCortesiaId = 'PUNCH_CLUB' | 'SOLEO';

interface BebidaCortesia {
  id: BebidaCortesiaId;
  nombre: string;
  detalle: string;
  imagen: string;
  clase: string;
}

const CORTESIA_STORAGE_KEY = 'zairo_cortesia_seleccion';
const CORTESIA_DURACION_MS = 2 * 60 * 60 * 1000;

@Component({
  selector: 'app-public-bebida-cortesia',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './public-bebida-cortesia.html',
  styleUrl: './public-bebida-cortesia.css'
})
export class PublicBebidaCortesia implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventosService = inject(EventosService);
  private comprasService = inject(ComprasEntradasService);

  idEvento = 0;
  codigoActivacion = '';
  evento: any = null;
  cargando = true;
  mensajeError = '';
  seleccionando: BebidaCortesiaId | null = null;

  bebidas: BebidaCortesia[] = [
    {
      id: 'PUNCH_CLUB',
      nombre: 'Punch Club',
      detalle: 'Orange Black Tea Collins con gin orgánico',
      imagen: '/assets/cortesias/punch-club-cortesia.png',
      clase: 'punch'
    },
    {
      id: 'SOLEO',
      nombre: 'Soleo',
      detalle: 'Sangría frizzante, fresca y lista para brindar',
      imagen: '/assets/cortesias/soleo-cortesia.png',
      clase: 'soleo'
    }
  ];

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const codigo = (this.route.snapshot.paramMap.get('codigo') || '').trim();

    if (!Number.isFinite(id) || id <= 0 || !codigo) {
      this.cargando = false;
      this.mensajeError = 'Este acceso de cortesía no es válido.';
      return;
    }

    this.idEvento = id;
    this.codigoActivacion = codigo;
    this.validarAccesoPrivado();
  }

  seleccionarBebida(bebida: BebidaCortesia): void {
    if (this.seleccionando) return;

    this.seleccionando = bebida.id;
    this.guardarSeleccion(bebida.id);

    setTimeout(() => {
      this.router.navigate(['/evento', this.idEvento], {
        queryParams: { activacion: 'cortesia' }
      });
    }, 520);
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';

    return new Date(fecha).toLocaleDateString('es-CR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  private validarAccesoPrivado(): void {
    this.comprasService
      .validarCodigoCortesia(this.idEvento, this.codigoActivacion)
      .subscribe({
        next: (respuesta) => {
          if (!respuesta?.valido) {
            this.cargando = false;
            this.mensajeError = 'Este acceso de cortesía no es válido o ya no está disponible.';
            return;
          }

          this.cargarEvento();
        },
        error: (error) => {
          console.error('Error validando el acceso privado de cortesía', error);
          this.cargando = false;
          this.mensajeError = 'Este acceso de cortesía no es válido o ya no está disponible.';
        }
      });
  }

  private cargarEvento(): void {
    this.eventosService.obtenerEventoPorId(this.idEvento).subscribe({
      next: (evento) => {
        this.evento = evento;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error cargando el evento para la cortesía', error);
        this.cargando = false;
        this.mensajeError = 'No pudimos cargar el evento. Intentá nuevamente.';
      }
    });
  }

  private guardarSeleccion(bebida: BebidaCortesiaId): void {
    if (typeof window === 'undefined') return;

    window.sessionStorage.setItem(
      CORTESIA_STORAGE_KEY,
      JSON.stringify({
        id_evento: this.idEvento,
        bebida,
        codigo: this.codigoActivacion,
        expira_en: Date.now() + CORTESIA_DURACION_MS
      })
    );
  }
}
