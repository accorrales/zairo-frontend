import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { Header } from '../../layout/header/header';
import { EmpleadosService } from '../../core/services/empleados.service';
import { Empleado } from '../../core/models/empleado.model';
import { FormsModule } from '@angular/forms';
import { DepartamentosService } from '../../core/services/departamentos.service';
import { Departamento } from '../../core/models/departamento.model';

@Component({
  selector: 'app-empleados',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, Header],
  templateUrl: './empleados.html',
  styleUrl: './empleados.css'
  
})
export class Empleados implements OnInit {
  private empleadosService = inject(EmpleadosService);
  private departamentosService = inject(DepartamentosService);

  modoEdicion = false;
  empleadoEditandoId: number | null = null;
  departamentos: Departamento[] = [];
  empleados: Empleado[] = [];
  cargando = true;
  error = '';

  ngOnInit(): void {
    this.cargarEmpleados();
    this.cargarDepartamentos();
  }

  cargarDepartamentos() {
    this.departamentosService.getDepartamentos().subscribe({
      next: (data) => {
        this.departamentos = data;
      },
      error: (err) => {
        console.error('Error cargando departamentos', err);
      }
    });
  }

  cargarEmpleados(): void {
    this.cargando = true;
    this.error = '';

    this.empleadosService.getEmpleados().subscribe({
      next: (data) => {
        this.empleados = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar empleados:', err);
        this.error = 'No se pudieron cargar los empleados.';
        this.cargando = false;
      }
    });
  }
  mostrarModal = false;

 nuevoEmpleado: any = {
  cedula: '',
  nombre: '',
  apellido: '',
  correo: '',
  telefono: '',
  direccion: '',
  puesto: '',
  salario_base: '',
  fecha_ingreso: '',
  id_departamento: null
};

  abrirModal() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }
  resetModal() {
    this.mostrarModal = false;
    this.modoEdicion = false;
    this.empleadoEditandoId = null;

    this.nuevoEmpleado = {
      cedula: '',
      nombre: '',
      apellido: '',
      correo: '',
      telefono: '',
      direccion: '',
      puesto: '',
      salario_base: '',
      fecha_ingreso: '',
      id_departamento: null
    };
  }
  guardarEmpleado() {
    const payload = {
      cedula: this.nuevoEmpleado.cedula?.trim(),
      nombre: this.nuevoEmpleado.nombre?.trim(),
      apellido: this.nuevoEmpleado.apellido?.trim(),
      correo: this.nuevoEmpleado.correo?.trim(),
      telefono: this.nuevoEmpleado.telefono?.trim(),
      direccion: this.nuevoEmpleado.direccion?.trim(),
      puesto: this.nuevoEmpleado.puesto?.trim(),
      salario_base: Number(this.nuevoEmpleado.salario_base),
      fecha_ingreso: this.nuevoEmpleado.fecha_ingreso,
      estado: true,
      id_departamento: Number(this.nuevoEmpleado.id_departamento)
    };

    if (this.modoEdicion && this.empleadoEditandoId) {
      this.empleadosService.updateEmpleado(this.empleadoEditandoId, payload).subscribe({
        next: () => {
          this.resetModal();
          this.cargarEmpleados();
        },
        error: (err) => {
          console.error(err);
          alert('Error al actualizar empleado');
        }
      });
    } else {
      this.empleadosService.createEmpleado(payload).subscribe({
        next: () => {
          this.resetModal();
          this.cargarEmpleados();
        },
        error: (err) => {
          console.error(err);
          alert('Error al crear empleado');
        }
      });
    }
  }

  editarEmpleado(emp: any) {
    this.modoEdicion = true;
    this.empleadoEditandoId = emp.id_empleado;

    this.nuevoEmpleado = {
      cedula: emp.cedula,
      nombre: emp.nombre,
      apellido: emp.apellido,
      correo: emp.correo,
      telefono: emp.telefono,
      direccion: emp.direccion,
      puesto: emp.puesto,
      salario_base: emp.salario_base,
      fecha_ingreso: emp.fecha_ingreso?.split('T')[0],
      id_departamento: emp.id_departamento
    };

    this.mostrarModal = true;
  }

  eliminarEmpleado(id: number) {
    const confirmado = confirm('¿Seguro que deseas eliminar este empleado?');

    if (!confirmado) return;

    this.empleadosService.deleteEmpleado(id).subscribe({
      next: () => {
        this.cargarEmpleados();
      },
      error: (err) => {
        console.error('Error al eliminar empleado:', err);
        alert('Error al eliminar empleado');
      }
    });
  }
}