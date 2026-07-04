import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Sidebar } from '../../layout/sidebar/sidebar';
import { Header } from '../../layout/header/header';
import { EventosService } from '../../core/services/eventos.service';
import { EntradasConfirmadasService } from '../../core/services/entradas-confirmadas.service';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-dashboard-entradas',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, Header, ConfirmDialog],
  templateUrl: './dashboard-entradas.html',
  styleUrl: './dashboard-entradas.css'
})
export class DashboardEntradas implements OnInit {
  private eventosService = inject(EventosService);
  private entradasService = inject(EntradasConfirmadasService);

  eventos: any[] = [];
  eventoSeleccionado: number | null = null;

  entradas: any[] = [];
  totales: { total_entradas: number; total_dinero: number; total_invalidadas: number } = {
    total_entradas: 0,
    total_dinero: 0,
    total_invalidadas: 0
  };
  porTier: any[] = [];

  cargando = false;
  mensaje = '';

  modalVisible = false;
  tituloModal = '';
  mensajeModal = '';
  accionActual: (() => void) | null = null;

  ngOnInit(): void {
    this.cargarEventos();
  }

  cargarEventos(): void {
    this.eventosService.obtenerEventos().subscribe({
      next: (data) => (this.eventos = data || []),
      error: (err) => {
        console.error('Error al cargar eventos', err);
        this.mensaje = 'Error al cargar eventos.';
      }
    });
  }

  onCambioEvento(): void {
    if (!this.eventoSeleccionado) {
      this.limpiar();
      return;
    }
    this.cargarEntradas();
  }

  cargarEntradas(): void {
    if (!this.eventoSeleccionado) return;

    this.cargando = true;
    this.mensaje = '';

    this.entradasService.obtenerPorEvento(this.eventoSeleccionado).subscribe({
      next: (data) => {
        this.entradas = data.entradas || [];
        this.totales = data.totales || {
          total_entradas: 0,
          total_dinero: 0,
          total_invalidadas: 0
        };
        this.porTier = data.por_tier || [];
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar entradas', err);
        this.cargando = false;
        this.mensaje = err?.error?.error || 'Error al cargar entradas.';
      }
    });
  }

  invalidarEntrada(entrada: any): void {
    this.abrirConfirmacion(
      'Invalidar entrada',
      `¿Invalidar la entrada de "${entrada.nombre_completo}"? No podrá usarse para ingresar al evento.`,
      () => {
        this.entradasService.invalidarEntrada(entrada.id_detalle).subscribe({
          next: () => this.cargarEntradas(),
          error: (err) => {
            console.error('Error al invalidar', err);
            alert(err?.error?.error || 'Error al invalidar la entrada');
          }
        });
      }
    );
  }

  revalidarEntrada(entrada: any): void {
    this.abrirConfirmacion(
      'Reactivar entrada',
      `¿Reactivar la entrada de "${entrada.nombre_completo}"? Volverá a permitir el ingreso.`,
      () => {
        this.entradasService.revalidarEntrada(entrada.id_detalle).subscribe({
          next: () => this.cargarEntradas(),
          error: (err) => {
            console.error('Error al reactivar', err);
            alert(err?.error?.error || 'Error al reactivar la entrada');
          }
        });
      }
    );
  }

  descargarReporte(): void {
    if (!this.eventoSeleccionado) return;
    window.open(
      this.entradasService.urlReporteCsv(this.eventoSeleccionado),
      '_blank'
    );
  }

  abrirConfirmacion(titulo: string, mensaje: string, accion: () => void): void {
    this.tituloModal = titulo;
    this.mensajeModal = mensaje;
    this.accionActual = accion;
    this.modalVisible = true;
  }

  confirmarAccion(): void {
    if (this.accionActual) {
      this.accionActual();
    }
    this.cerrarModal();
  }

  cancelarAccion(): void {
    this.cerrarModal();
  }

  cerrarModal(): void {
    this.modalVisible = false;
    this.tituloModal = '';
    this.mensajeModal = '';
    this.accionActual = null;
  }

  limpiar(): void {
    this.entradas = [];
    this.totales = { total_entradas: 0, total_dinero: 0, total_invalidadas: 0 };
    this.porTier = [];
    this.mensaje = '';
  }

  formatearMoneda(valor: number): string {
    return `CRC ${Number(valor || 0).toLocaleString('es-CR', {
      minimumFractionDigits: 2
    })}`;
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleString('es-CR');
  }
}
