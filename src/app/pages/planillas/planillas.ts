import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Sidebar } from '../../layout/sidebar/sidebar';
import { Header } from '../../layout/header/header';

import { PlanillasService } from '../../core/services/planillas.service';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-planillas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Sidebar, Header, ConfirmDialog],
  templateUrl: './planillas.html',
  styleUrl: './planillas.css'
})
export class Planillas implements OnInit {
  private planillasService = inject(PlanillasService);

  planillas: any[] = [];

  nuevaPlanilla = {
    nombre_periodo: '',
    fecha_inicio: '',
    fecha_fin: ''
  };

  cargando = false;
  error = '';

  modalVisible = false;
  accionActual: (() => void) | null = null;
  tituloModal = '';
  mensajeModal = '';

  ngOnInit(): void {
    this.cargarPlanillas();
  }

  cargarPlanillas(): void {
    this.cargando = true;
    this.error = '';

    this.planillasService.getPlanillas().subscribe({
      next: (data) => {
        this.planillas = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar planillas', err);
        this.error = 'No se pudieron cargar las planillas';
        this.cargando = false;
      }
    });
  }

  crearPlanilla(): void {
    if (
      !this.nuevaPlanilla.nombre_periodo ||
      !this.nuevaPlanilla.fecha_inicio ||
      !this.nuevaPlanilla.fecha_fin
    ) {
      alert('Todos los campos son obligatorios');
      return;
    }

    this.planillasService.crearPlanilla(this.nuevaPlanilla).subscribe({
      next: () => {
        alert('Planilla creada correctamente');
        this.cargarPlanillas();
        this.resetFormulario();
      },
      error: (err) => {
        console.error('Error al crear planilla', err);
        alert(err?.error?.error || 'Error al crear planilla');
      }
    });
  }

  procesar(id: number): void {
    this.abrirConfirmacion(
      'Procesar planilla',
      '¿Deseas procesar esta planilla?',
      () => {
        this.planillasService.procesarPlanilla(id).subscribe({
          next: () => {
            alert('Planilla procesada correctamente');
            this.cargarPlanillas();
          },
          error: (err) => {
            console.error('Error al procesar planilla', err);
            alert(err?.error?.error || 'Error al procesar planilla');
          }
        });
      }
    );
  }

  confirmar(id: number): void {
    this.abrirConfirmacion(
      'Confirmar planilla',
      '¿Deseas confirmar esta planilla?',
      () => {
        this.planillasService.confirmarPlanilla(id).subscribe({
          next: () => {
            alert('Planilla confirmada correctamente');
            this.cargarPlanillas();
          },
          error: (err) => {
            console.error('Error al confirmar planilla', err);
            alert(err?.error?.error || 'Error al confirmar planilla');
          }
        });
      }
    );
  }

  eliminar(id: number): void {
    this.abrirConfirmacion(
      'Eliminar planilla',
      'Esta acción no se puede deshacer. ¿Deseas continuar?',
      () => {
        this.planillasService.eliminarPlanilla(id).subscribe({
          next: () => {
            alert('Planilla eliminada correctamente');
            this.cargarPlanillas();
          },
          error: (err) => {
            console.error('Error al eliminar planilla', err);
            alert(err?.error?.error || 'Error al eliminar planilla');
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
    this.accionActual = null;
    this.tituloModal = '';
    this.mensajeModal = '';
  }

  resetFormulario(): void {
    this.nuevaPlanilla = {
      nombre_periodo: '',
      fecha_inicio: '',
      fecha_fin: ''
    };
  }
}