import {AdminFeedback} from '../../shared/admin/admin-feedback';
import {PageLoadState} from '../../shared/admin/page-load-state';
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
  host: { class: 'zairo-screen z-admin zairo-ui' },
  standalone: true,
  imports: [AdminFeedback, CommonModule, FormsModule, RouterLink, Sidebar, Header, ConfirmDialog],
  templateUrl: './planillas.html',
  styleUrl: './planillas.css'
})
export class Planillas implements OnInit {
  pageState=new PageLoadState();
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

    this.pageState.observe(this.planillasService.getPlanillas()).subscribe({
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
      this.pageState.notify('Todos los campos son obligatorios');
      return;
    }

    this.planillasService.crearPlanilla(this.nuevaPlanilla).subscribe({
      next: () => {
        this.pageState.notify('Planilla creada correctamente');
        this.cargarPlanillas();
        this.resetFormulario();
      },
      error: (err) => {
        console.error('Error al crear planilla', err);
        this.pageState.notify(err?.error?.error || 'Error al crear planilla');
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
            this.pageState.notify('Planilla procesada correctamente');
            this.cargarPlanillas();
          },
          error: (err) => {
            console.error('Error al procesar planilla', err);
            this.pageState.notify(err?.error?.error || 'Error al procesar planilla');
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
            this.pageState.notify('Planilla confirmada correctamente');
            this.cargarPlanillas();
          },
          error: (err) => {
            console.error('Error al confirmar planilla', err);
            this.pageState.notify(err?.error?.error || 'Error al confirmar planilla');
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
            this.pageState.notify('Planilla eliminada correctamente');
            this.cargarPlanillas();
          },
          error: (err) => {
            console.error('Error al eliminar planilla', err);
            this.pageState.notify(err?.error?.error || 'Error al eliminar planilla');
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