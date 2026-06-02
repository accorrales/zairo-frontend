import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Sidebar } from '../../layout/sidebar/sidebar';
import { Header } from '../../layout/header/header';
import { DepartamentosService } from '../../core/services/departamentos.service';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-departamentos',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, Header, ConfirmDialog],
  templateUrl: './departamentos.html',
  styleUrl: './departamentos.css'
})
export class Departamentos implements OnInit {
  private departamentosService = inject(DepartamentosService);

  departamentos: any[] = [];

  nuevoDepartamento = {
    nombre: '',
    descripcion: ''
  };

  editando = false;
  departamentoEditandoId: number | null = null;

  modalVisible = false;
  tituloModal = '';
  mensajeModal = '';
  accionActual: (() => void) | null = null;

  ngOnInit(): void {
    this.cargarDepartamentos();
  }

  cargarDepartamentos(): void {
    this.departamentosService.getDepartamentos().subscribe({
      next: (data) => {
        this.departamentos = data;
      },
      error: (err) => {
        console.error('Error al cargar departamentos', err);
      }
    });
  }

  guardarDepartamento(): void {
    if (!this.nuevoDepartamento.nombre.trim()) {
      alert('El nombre del departamento es obligatorio');
      return;
    }

    const payload = {
      nombre: this.nuevoDepartamento.nombre,
      descripcion: this.nuevoDepartamento.descripcion
    };

    if (this.editando && this.departamentoEditandoId !== null) {
      this.departamentosService.actualizarDepartamento(this.departamentoEditandoId, payload).subscribe({
        next: () => {
          this.cargarDepartamentos();
          this.resetFormulario();
        },
        error: (err) => {
          console.error('Error al actualizar departamento', err);
        }
      });
    } else {
      this.departamentosService.crearDepartamento(payload).subscribe({
        next: () => {
          this.cargarDepartamentos();
          this.resetFormulario();
        },
        error: (err) => {
          console.error('Error al crear departamento', err);
        }
      });
    }
  }

  editarDepartamento(departamento: any): void {
    this.nuevoDepartamento = {
      nombre: departamento.nombre,
      descripcion: departamento.descripcion || ''
    };

    this.editando = true;
    this.departamentoEditandoId = departamento.id_departamento;
  }

  eliminarDepartamento(id: number): void {
    this.abrirConfirmacion(
      'Eliminar departamento',
      '¿Deseas eliminar este departamento? Esta acción no se puede deshacer.',
      () => {
        this.departamentosService.eliminarDepartamento(id).subscribe({
          next: () => {
            this.cargarDepartamentos();
          },
          error: (err) => {
            console.error('Error al eliminar departamento', err);
            alert(err?.error?.error || 'Error al eliminar departamento');
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
    this.nuevoDepartamento = {
      nombre: '',
      descripcion: ''
    };

    this.editando = false;
    this.departamentoEditandoId = null;
  }
}