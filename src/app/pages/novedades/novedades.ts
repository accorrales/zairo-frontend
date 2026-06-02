import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { Header } from '../../layout/header/header';
import { NovedadesService } from '../../core/services/novedades.service';
import { EmpleadosService } from '../../core/services/empleados.service';
import { PlanillasService } from '../../core/services/planillas.service';
import { ConceptosService } from '../../core/services/conceptos.service';

@Component({
  selector: 'app-novedades',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, Header],
  templateUrl: './novedades.html',
  styleUrl: './novedades.css'
})
export class Novedades implements OnInit {
  private novedadesService = inject(NovedadesService);
  private empleadosService = inject(EmpleadosService);
  private planillasService = inject(PlanillasService);
  private conceptosService = inject(ConceptosService);

  novedades: any[] = [];
  empleados: any[] = [];
  planillas: any[] = [];
  conceptos: any[] = [];

  editando = false;
  novedadEditandoId: number | null = null;

  nuevaNovedad = {
    id_empleado: null as number | null,
    id_planilla: null as number | null,
    id_concepto: null as number | null,
    cantidad: 1,
    monto: 0,
    observacion: ''
  };

  ngOnInit(): void {
    this.cargarTodo();
  }

  cargarTodo(): void {
    this.cargarNovedades();
    this.cargarEmpleados();
    this.cargarPlanillas();
    this.cargarConceptos();
  }

  cargarNovedades(): void {
    this.novedadesService.obtenerNovedades().subscribe({
      next: (data) => {
        this.novedades = data;
      },
      error: (err) => {
        console.error('Error al cargar novedades', err);
      }
    });
  }

  cargarEmpleados(): void {
    this.empleadosService.obtenerEmpleados().subscribe({
      next: (data) => {
        this.empleados = data;
      },
      error: (err) => {
        console.error('Error al cargar empleados', err);
      }
    });
  }

  cargarPlanillas(): void {
    this.planillasService.getPlanillas().subscribe({
      next: (data) => {
        this.planillas = data;
      },
      error: (err) => {
        console.error('Error al cargar planillas', err);
      }
    });
  }

  cargarConceptos(): void {
    this.conceptosService.obtenerConceptos().subscribe({
      next: (data) => {
        this.conceptos = data;
      },
      error: (err) => {
        console.error('Error al cargar conceptos', err);
      }
    });
  }

  guardarNovedad(): void {
    if (
      !this.nuevaNovedad.id_empleado ||
      !this.nuevaNovedad.id_planilla ||
      !this.nuevaNovedad.id_concepto
    ) {
      alert('Empleado, planilla y concepto son obligatorios');
      return;
    }

    const payload = {
      ...this.nuevaNovedad,
      cantidad: Number(this.nuevaNovedad.cantidad) || 1,
      monto: Number(this.nuevaNovedad.monto) || 0
    };

    if (this.editando && this.novedadEditandoId !== null) {
      this.novedadesService.actualizarNovedad(this.novedadEditandoId, {
        cantidad: payload.cantidad,
        monto: payload.monto,
        observacion: payload.observacion
      }).subscribe({
        next: () => {
          this.cargarNovedades();
          this.resetFormulario();
        },
        error: (err) => {
          console.error('Error al actualizar novedad', err);
        }
      });
    } else {
      this.novedadesService.crearNovedad(payload).subscribe({
        next: () => {
          this.cargarNovedades();
          this.resetFormulario();
        },
        error: (err) => {
          console.error('Error al crear novedad', err);
        }
      });
    }
  }

  editarNovedad(novedad: any): void {
    this.nuevaNovedad = {
      id_empleado: novedad.id_empleado,
      id_planilla: novedad.id_planilla,
      id_concepto: novedad.id_concepto,
      cantidad: novedad.cantidad,
      monto: novedad.monto,
      observacion: novedad.observacion || ''
    };

    this.editando = true;
    this.novedadEditandoId = novedad.id_novedad;
  }

  eliminarNovedad(id: number): void {
    if (!confirm('¿Deseas eliminar esta novedad?')) return;

    this.novedadesService.eliminarNovedad(id).subscribe({
      next: () => {
        this.cargarNovedades();
      },
      error: (err) => {
        console.error('Error al eliminar novedad', err);
      }
    });
  }

  resetFormulario(): void {
    this.nuevaNovedad = {
      id_empleado: null,
      id_planilla: null,
      id_concepto: null,
      cantidad: 1,
      monto: 0,
      observacion: ''
    };

    this.editando = false;
    this.novedadEditandoId = null;
  }
}