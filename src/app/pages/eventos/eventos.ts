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
}