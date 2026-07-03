import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Sidebar } from '../../layout/sidebar/sidebar';
import { Header } from '../../layout/header/header';
import { EventosService } from '../../core/services/eventos.service';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Sidebar, Header, ConfirmDialog],
  templateUrl: './eventos.html',
  styleUrl: './eventos.css'
})
export class Eventos implements OnInit {
  private eventosService = inject(EventosService);

  eventos: any[] = [];

  nuevoEvento = {
    nombre: '',
    descripcion: '',
    fecha: '',
    ubicacion: '',
    precio: null as number | null,
    imagen: '',
    estado: true
  };

  editando = false;
  eventoEditandoId: number | null = null;

  modalVisible = false;
  tituloModal = '';
  mensajeModal = '';
  accionActual: (() => void) | null = null;

  // ===== Ubicación secreta =====
  panelUbicacionVisible = false;
  eventoUbicacion: any = null;
  cargandoUbicacion = false;
  guardandoUbicacion = false;
  enviandoUbicacion = false;
  mensajeUbicacion = '';
  previewUbicacion: any = null;
  historialUbicacion: any[] = [];

  formUbicacion = {
    ubicacion_secreta_nombre: '',
    ubicacion_secreta_direccion: '',
    ubicacion_secreta_google_maps_url: '',
    ubicacion_secreta_waze_url: '',
    ubicacion_envio_habilitado: false,
    ubicacion_visible_publicamente: false
  };

  ngOnInit(): void {
    this.cargarEventos();
  }

  cargarEventos(): void {
    this.eventosService.obtenerEventos().subscribe({
      next: (data) => {
        this.eventos = data;
      },
      error: (err) => {
        console.error('Error al cargar eventos', err);
        alert(err?.error?.error || 'Error al cargar eventos');
      }
    });
  }

  guardarEvento(): void {
    if (!this.nuevoEvento.nombre || !this.nuevoEvento.fecha) {
      alert('Nombre y fecha son obligatorios');
      return;
    }

    const payload = {
      nombre: this.nuevoEvento.nombre,
      descripcion: this.nuevoEvento.descripcion,
      fecha: this.nuevoEvento.fecha,
      ubicacion: this.nuevoEvento.ubicacion,
      precio: this.nuevoEvento.precio || 0,
      imagen: this.nuevoEvento.imagen,
      estado: this.nuevoEvento.estado
    };

    if (this.editando && this.eventoEditandoId !== null) {
      this.eventosService.actualizarEvento(this.eventoEditandoId, payload).subscribe({
        next: () => {
          this.cargarEventos();
          this.resetFormulario();
        },
        error: (err) => {
          console.error('Error al actualizar evento', err);
          alert(err?.error?.error || 'Error al actualizar evento');
        }
      });

      return;
    }

    this.eventosService.crearEvento(payload).subscribe({
      next: () => {
        this.cargarEventos();
        this.resetFormulario();
      },
      error: (err) => {
        console.error('Error al crear evento', err);
        alert(err?.error?.error || 'Error al crear evento');
      }
    });
  }

  editarEvento(evento: any): void {
    this.nuevoEvento = {
      nombre: evento.nombre,
      descripcion: evento.descripcion || '',
      fecha: this.formatoInputFecha(evento.fecha),
      ubicacion: evento.ubicacion || '',
      precio: Number(evento.precio || 0),
      imagen: evento.imagen || '',
      estado: evento.estado
    };

    this.editando = true;
    this.eventoEditandoId = evento.id_evento;
  }

  desactivarEvento(evento: any): void {
    this.abrirConfirmacion(
      'Desactivar evento',
      `¿Deseas desactivar el evento "${evento.nombre}"?`,
      () => {
        this.eventosService.desactivarEvento(evento.id_evento).subscribe({
          next: () => this.cargarEventos(),
          error: (err) => {
            console.error('Error al desactivar evento', err);
            alert(err?.error?.error || 'Error al desactivar evento');
          }
        });
      }
    );
  }

  reactivarEvento(evento: any): void {
    this.abrirConfirmacion(
      'Reactivar evento',
      `¿Deseas reactivar el evento "${evento.nombre}"?`,
      () => {
        this.eventosService.reactivarEvento(evento.id_evento).subscribe({
          next: () => this.cargarEventos(),
          error: (err) => {
            console.error('Error al reactivar evento', err);
            alert(err?.error?.error || 'Error al reactivar evento');
          }
        });
      }
    );
  }

  eliminarEvento(evento: any): void {
    this.abrirConfirmacion(
      'Eliminar evento',
      `¿Eliminar por completo el evento "${evento.nombre}"? Se borrarán también sus tiers. Si el evento ya tiene compras, no se podrá eliminar y deberás desactivarlo.`,
      () => {
        this.eventosService.eliminarEvento(evento.id_evento).subscribe({
          next: () => this.cargarEventos(),
          error: (err) => {
            console.error('Error al eliminar evento', err);
            alert(err?.error?.error || 'Error al eliminar evento');
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
    this.nuevoEvento = {
      nombre: '',
      descripcion: '',
      fecha: '',
      ubicacion: '',
      precio: null,
      imagen: '',
      estado: true
    };

    this.editando = false;
    this.eventoEditandoId = null;
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

  // ===========================================================
  //  Ubicación secreta (ZAIRO LOST TRIP)
  // ===========================================================

  abrirUbicacion(evento: any): void {
    this.eventoUbicacion = evento;
    this.panelUbicacionVisible = true;
    this.mensajeUbicacion = '';
    this.previewUbicacion = null;
    this.historialUbicacion = [];
    this.cargarUbicacion();
  }

  cerrarUbicacion(): void {
    this.panelUbicacionVisible = false;
    this.eventoUbicacion = null;
  }

  cargarUbicacion(): void {
    if (!this.eventoUbicacion) return;

    this.cargandoUbicacion = true;

    this.eventosService.obtenerUbicacionPreview(this.eventoUbicacion.id_evento).subscribe({
      next: (data) => {
        this.previewUbicacion = data;

        this.formUbicacion = {
          ubicacion_secreta_nombre: data.ubicacion.ubicacion_secreta_nombre || '',
          ubicacion_secreta_direccion: data.ubicacion.ubicacion_secreta_direccion || '',
          ubicacion_secreta_google_maps_url: data.ubicacion.ubicacion_secreta_google_maps_url || '',
          ubicacion_secreta_waze_url: data.ubicacion.ubicacion_secreta_waze_url || '',
          ubicacion_envio_habilitado: !!data.ubicacion.ubicacion_envio_habilitado,
          ubicacion_visible_publicamente: !!data.ubicacion.ubicacion_visible_publicamente
        };

        this.cargandoUbicacion = false;
        this.cargarHistorialUbicacion();
      },
      error: (err) => {
        console.error('Error al cargar ubicación', err);
        this.cargandoUbicacion = false;
        this.mensajeUbicacion = err?.error?.message || 'Error al cargar la ubicación';
      }
    });
  }

  cargarHistorialUbicacion(): void {
    if (!this.eventoUbicacion) return;

    this.eventosService.obtenerNotificacionesUbicacion(this.eventoUbicacion.id_evento).subscribe({
      next: (data) => {
        this.historialUbicacion = data;
      },
      error: (err) => {
        console.error('Error al cargar historial de ubicación', err);
      }
    });
  }

  guardarUbicacion(): void {
    if (!this.eventoUbicacion) return;

    if (!this.formUbicacion.ubicacion_secreta_nombre.trim() || !this.formUbicacion.ubicacion_secreta_direccion.trim()) {
      this.mensajeUbicacion = 'El nombre y la dirección del lugar son obligatorios.';
      return;
    }

    this.guardandoUbicacion = true;
    this.mensajeUbicacion = '';

    this.eventosService.actualizarUbicacionSecreta(this.eventoUbicacion.id_evento, this.formUbicacion).subscribe({
      next: () => {
        this.guardandoUbicacion = false;
        this.mensajeUbicacion = 'Ubicación secreta guardada correctamente.';
        this.cargarUbicacion();
      },
      error: (err) => {
        console.error('Error al guardar ubicación', err);
        this.guardandoUbicacion = false;
        this.mensajeUbicacion = err?.error?.message || 'Error al guardar la ubicación';
      }
    });
  }

  confirmarEnvioUbicacion(): void {
    this.abrirConfirmacion(
      'Enviar ubicación ahora',
      `¿Enviar la ubicación secreta de "${this.eventoUbicacion?.nombre}" a todos los compradores con entrada PAGADA que aún no la hayan recibido?`,
      () => this.enviarUbicacionAhora()
    );
  }

  enviarUbicacionAhora(): void {
    if (!this.eventoUbicacion) return;

    this.enviandoUbicacion = true;
    this.mensajeUbicacion = '';

    this.eventosService.enviarUbicacionManual(this.eventoUbicacion.id_evento).subscribe({
      next: (res) => {
        this.enviandoUbicacion = false;
        const r = res.resumen;
        this.mensajeUbicacion = `Envío procesado: ${r.enviados} enviados, ${r.omitidos} ya la tenían, ${r.errores} con error.`;
        this.cargarUbicacion();
      },
      error: (err) => {
        console.error('Error al enviar ubicación', err);
        this.enviandoUbicacion = false;
        this.mensajeUbicacion = err?.error?.message || 'Error al enviar la ubicación';
      }
    });
  }

  exportarTelefonos(): void {
    if (!this.eventoUbicacion) return;

    this.eventosService.exportarCompradores(this.eventoUbicacion.id_evento).subscribe({
      next: (compradores) => {
        this.descargarCsvCompradores(compradores);
      },
      error: (err) => {
        console.error('Error al exportar compradores', err);
        this.mensajeUbicacion = err?.error?.message || 'Error al exportar la lista de compradores';
      }
    });
  }

  private descargarCsvCompradores(compradores: any[]): void {
    const encabezado = 'id_compra,correo,telefono,cantidad,total,fecha_compra';

    const filas = compradores.map((c) =>
      [c.id_compra, c.correo_comprador, c.telefono_comprador, c.cantidad, c.total, c.fecha_creacion]
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
        .join(',')
    );

    const csv = [encabezado, ...filas].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `compradores-evento-${this.eventoUbicacion?.id_evento}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }

  formatearFechaHora(fecha: string | null): string {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleString('es-CR');
  }
}