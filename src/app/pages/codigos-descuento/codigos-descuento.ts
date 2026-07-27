import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Sidebar } from '../../layout/sidebar/sidebar';
import { Header } from '../../layout/header/header';
import { CodigosDescuentoService } from '../../core/services/codigos-descuento.service';
import { EventosService } from '../../core/services/eventos.service';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-codigos-descuento',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, Header, ConfirmDialog],
  templateUrl: './codigos-descuento.html',
  styleUrl: './codigos-descuento.css'
})
export class CodigosDescuento implements OnInit {
  private codigosService = inject(CodigosDescuentoService);
  private eventosService = inject(EventosService);

  codigos: any[] = [];
  eventos: any[] = [];

  nuevoCodigo = this.formularioVacio();

  editando = false;
  codigoEditandoId: number | null = null;

  modalVisible = false;
  tituloModal = '';
  mensajeModal = '';
  accionActual: (() => void) | null = null;

  ngOnInit(): void {
    this.cargarEventos();
    this.cargarCodigos();
  }

  get topVendedores(): any[] {
    return [...this.codigos]
      .filter((c) => this.entradasVendidas(c) > 0)
      .sort((a, b) => this.entradasVendidas(b) - this.entradasVendidas(a))
      .slice(0, 3);
  }

  formularioVacio() {
    return {
      codigo: '',
      descripcion: '',
      tipo_descuento: 'PORCENTAJE',
      valor: null as number | null,
      id_evento: null as number | null,
      fecha_inicio: '',
      fecha_fin: '',
      usos_maximos: null as number | null,
      estado: true
    };
  }

  cargarEventos(): void {
    this.eventosService.obtenerEventos().subscribe({
      next: (data) => (this.eventos = data || []),
      error: (err) => console.error('Error al cargar eventos', err)
    });
  }

  cargarCodigos(): void {
    this.codigosService.listar().subscribe({
      next: (data) => (this.codigos = data || []),
      error: (err) => {
        console.error('Error al cargar códigos', err);
        alert(err?.error?.error || 'Error al cargar códigos');
      }
    });
  }

  guardarCodigo(): void {
    if (!this.nuevoCodigo.codigo?.trim()) {
      alert('El código es obligatorio');
      return;
    }

    if (!this.nuevoCodigo.valor || Number(this.nuevoCodigo.valor) <= 0) {
      alert('El valor del descuento debe ser mayor a 0');
      return;
    }

    if (
      this.nuevoCodigo.tipo_descuento === 'PORCENTAJE' &&
      Number(this.nuevoCodigo.valor) > 100
    ) {
      alert('El porcentaje no puede ser mayor a 100');
      return;
    }

    const payload = {
      codigo: this.nuevoCodigo.codigo.trim().toUpperCase(),
      descripcion: this.nuevoCodigo.descripcion?.trim() || null,
      tipo_descuento: this.nuevoCodigo.tipo_descuento,
      valor: Number(this.nuevoCodigo.valor),
      id_evento: this.nuevoCodigo.id_evento || null,
      fecha_inicio: this.nuevoCodigo.fecha_inicio || null,
      fecha_fin: this.nuevoCodigo.fecha_fin || null,
      usos_maximos: this.nuevoCodigo.usos_maximos || null,
      estado: this.nuevoCodigo.estado
    };

    if (this.editando && this.codigoEditandoId !== null) {
      this.codigosService.actualizar(this.codigoEditandoId, payload).subscribe({
        next: () => {
          this.cargarCodigos();
          this.resetFormulario();
        },
        error: (err) => {
          console.error('Error al actualizar código', err);
          alert(err?.error?.error || 'Error al actualizar código');
        }
      });
      return;
    }

    this.codigosService.crear(payload).subscribe({
      next: () => {
        this.cargarCodigos();
        this.resetFormulario();
      },
      error: (err) => {
        console.error('Error al crear código', err);
        alert(err?.error?.error || 'Error al crear código');
      }
    });
  }

  editarCodigo(c: any): void {
    this.nuevoCodigo = {
      codigo: c.codigo,
      descripcion: c.descripcion || '',
      tipo_descuento: c.tipo_descuento,
      valor: Number(c.valor || 0),
      id_evento: c.id_evento || null,
      fecha_inicio: this.formatoInputFecha(c.fecha_inicio),
      fecha_fin: this.formatoInputFecha(c.fecha_fin),
      usos_maximos: c.usos_maximos,
      estado: c.estado
    };

    this.editando = true;
    this.codigoEditandoId = c.id_codigo;
  }

  toggleEstado(c: any): void {
    const accion = c.estado
      ? this.codigosService.desactivar(c.id_codigo)
      : this.codigosService.reactivar(c.id_codigo);

    accion.subscribe({
      next: () => this.cargarCodigos(),
      error: (err) => {
        console.error('Error al cambiar estado', err);
        alert(err?.error?.error || 'Error al cambiar estado');
      }
    });
  }

  eliminarCodigo(id: number): void {
    this.abrirConfirmacion(
      'Eliminar código',
      '¿Deseas eliminar este código? Esta acción no se puede deshacer.',
      () => {
        this.codigosService.eliminar(id).subscribe({
          next: () => this.cargarCodigos(),
          error: (err) => {
            console.error('Error al eliminar código', err);
            alert(err?.error?.error || 'Error al eliminar código');
          }
        });
      }
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

  resetFormulario(): void {
    this.nuevoCodigo = this.formularioVacio();
    this.editando = false;
    this.codigoEditandoId = null;
  }

  nombreEvento(idEvento: number | null): string {
    if (!idEvento) return 'Todos los eventos';
    const evento = this.eventos.find((e) => e.id_evento === idEvento);
    return evento ? evento.nombre : `Evento #${idEvento}`;
  }

  descuentoTexto(c: any): string {
    if (c.tipo_descuento === 'PORCENTAJE') {
      return `${Number(c.valor)}%`;
    }
    return this.formatearMoneda(c.valor);
  }

  entradasVendidas(c: any): number {
    return Number(c.entradas_vendidas ?? c.usos_actuales ?? 0);
  }

  nombreVendedor(c: any): string {
    return c.descripcion || c.codigo;
  }

  porcentajeTop(c: any): number {
    const mayor = Math.max(...this.topVendedores.map((v) => this.entradasVendidas(v)), 1);
    return Math.max(8, Math.round((this.entradasVendidas(c) / mayor) * 100));
  }

  usosTexto(c: any): string {
    const usos = this.entradasVendidas(c);

    if (c.usos_maximos === null || c.usos_maximos === undefined) {
      return `${usos} / ∞`;
    }
    return `${usos} / ${c.usos_maximos}`;
  }

  formatoInputFecha(fecha: string): string {
    if (!fecha) return '';
    const date = new Date(fecha);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16);
  }

  formatearMoneda(valor: number): string {
    return `CRC ${Number(valor || 0).toLocaleString('es-CR', {
      minimumFractionDigits: 2
    })}`;
  }
}
