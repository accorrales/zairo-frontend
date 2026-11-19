import { formatCRC } from '../../shared/admin/crc-money';
import {AdminFeedback} from '../../shared/admin/admin-feedback';
import {PageLoadState} from '../../shared/admin/page-load-state';
import { analizarEdades } from './analisis-edades';
import { finalize } from 'rxjs';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Sidebar } from '../../layout/sidebar/sidebar';
import { Header } from '../../layout/header/header';
import { EventosService } from '../../core/services/eventos.service';
import { EntradasConfirmadasService } from '../../core/services/entradas-confirmadas.service';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-dashboard-entradas',
  host: { class: 'zairo-screen z-admin zairo-ui' },
  standalone: true,
  imports: [AdminFeedback, CommonModule, FormsModule, Sidebar, Header, ConfirmDialog],
  templateUrl: './dashboard-entradas.html',
  styleUrl: './dashboard-entradas.css'
})
export class DashboardEntradas implements OnInit {
  pageState=new PageLoadState();
  private eventosService = inject(EventosService);
  private entradasService = inject(EntradasConfirmadasService);

  private authService = inject(AuthService);
  get puedeModificarEntradas(): boolean { return this.authService.getRole()?.trim().toLowerCase() === 'admin'; }

  eventos: any[] = [];
  descargandoReporte = false;
  eventoSeleccionado: number | null = null;

  entradas: any[] = [];
  totales: { total_entradas: number; total_dinero: number; total_invalidadas: number } = {
    total_entradas: 0,
    total_dinero: 0,
    total_invalidadas: 0
  };
  paquetes: any[] = [];
  porTier: any[] = [];

  soloIngresos = false;
  analisis = analizarEdades([], null);
  recalcularEdades(): void {
    const evento = this.eventos.find(e=>Number(e.id_evento)===Number(this.eventoSeleccionado));
    this.analisis = analizarEdades(this.entradas, evento?.fecha, this.soloIngresos);
  }
  porcentaje(cantidad: number): number {
    return this.analisis.total ? cantidad*100/this.analisis.total : 0;
  }
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
    this.pageState.observe(this.eventosService.obtenerEventos()).subscribe({
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

    const solicitado = this.eventoSeleccionado;
    this.limpiar();
    this.cargando = true;
    this.mensaje = '';

    this.pageState.observe(this.entradasService.obtenerPorEvento(this.eventoSeleccionado)).subscribe({
      next: (data) => {
        if (this.eventoSeleccionado !== solicitado) return;
        this.paquetes = data.paquetes || [];
        this.entradas = data.entradas || [];
        this.totales = data.totales || {
          total_entradas: 0,
          total_dinero: 0,
          total_invalidadas: 0
        };
        this.porTier = data.por_tier || [];
        this.recalcularEdades();
        this.cargando = false;
      },
      error: (err) => {
        if (this.eventoSeleccionado !== solicitado) return;
        console.error('Error al cargar entradas', err);
        this.cargando = false;
        this.mensaje = err?.error?.error || 'Error al cargar entradas.';
      }
    });
  }

  invalidarEntrada(entrada: any): void {
    if (!this.puedeModificarEntradas) return;
    this.abrirConfirmacion(
      'Invalidar entrada',
      `¿Invalidar la entrada de "${entrada.nombre_completo}"? No podrá usarse para ingresar al evento.`,
      () => {
        this.entradasService.invalidarEntrada(entrada.id_detalle).subscribe({
          next: () => this.cargarEntradas(),
          error: (err) => {
            console.error('Error al invalidar', err);
            this.pageState.notify(err?.error?.error || 'Error al invalidar la entrada');
          }
        });
      }
    );
  }

  revalidarEntrada(entrada: any): void {
    if (!this.puedeModificarEntradas) return;
    this.abrirConfirmacion(
      'Reactivar entrada',
      `¿Reactivar la entrada de "${entrada.nombre_completo}"? Volverá a permitir el ingreso.`,
      () => {
        this.entradasService.revalidarEntrada(entrada.id_detalle).subscribe({
          next: () => this.cargarEntradas(),
          error: (err) => {
            console.error('Error al reactivar', err);
            this.pageState.notify(err?.error?.error || 'Error al reactivar la entrada');
          }
        });
      }
    );
  }

  descargarReporte(formato: 'xlsx' | 'csv' = 'xlsx'): void {
    if (!this.eventoSeleccionado || this.descargandoReporte) return;
    const id = this.eventoSeleccionado;
    this.descargandoReporte = true;
    const solicitud = formato === 'xlsx' ? this.entradasService.descargarReporteExcel(id) : this.entradasService.descargarReporteCsv(id);
    solicitud.pipe(finalize(() => this.descargandoReporte = false)).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `entradas-${id}.${formato}`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      error: async (error) => {
        if (error.error instanceof Blob) {
          try { error = {...error, error: JSON.parse(await error.error.text())}; } catch { /* Keep the safe fallback. */ }
        }
        if (this.eventoSeleccionado === id) this.pageState.fail(error, 'No se pudo descargar el reporte de entradas.', false);
      }
    });
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
    this.analisis = analizarEdades([], null);
    this.cargando = false;
    this.totales = { total_entradas: 0, total_dinero: 0, total_invalidadas: 0 };
    this.paquetes = [];
    this.porTier = [];
    this.mensaje = '';
  }

  formatearMoneda(valor: number): string {
    return formatCRC(valor);
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleString('es-CR');
  }
}
