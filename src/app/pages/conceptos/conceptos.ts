import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { Header } from '../../layout/header/header';
import { ConceptosService } from '../../core/services/conceptos.service';

@Component({
  selector: 'app-conceptos',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, Header],
  templateUrl: './conceptos.html',
  styleUrls: ['./conceptos.css']
})
export class Conceptos implements OnInit {
  private conceptosService = inject(ConceptosService);

  conceptos: any[] = [];

  nuevoConcepto = {
    nombre: '',
    tipo: 'PAGO',
    descripcion: '',
    porcentaje: null as number | null,
    monto_fijo: null as number | null
  };

  editando = false;
  conceptoEditandoId: number | null = null;

  ngOnInit(): void {
    this.cargarConceptos();
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

  guardarConcepto(): void {
    if (
      !this.nuevoConcepto.nombre ||
      !this.nuevoConcepto.tipo
    ) {
      alert('Nombre y tipo son obligatorios');
      return;
    }

    const payload = {
      ...this.nuevoConcepto,
      porcentaje: this.nuevoConcepto.porcentaje || 0,
      monto_fijo: this.nuevoConcepto.monto_fijo || 0
    };

    if (this.editando && this.conceptoEditandoId !== null) {
      this.conceptosService.actualizarConcepto(this.conceptoEditandoId, {
        ...payload,
        estado: true
      }).subscribe({
        next: () => {
          this.cargarConceptos();
          this.resetFormulario();
        },
        error: (err) => {
          console.error('Error al actualizar concepto', err);
        }
      });
    } else {
      this.conceptosService.crearConcepto(payload).subscribe({
        next: () => {
          this.cargarConceptos();
          this.resetFormulario();
        },
        error: (err) => {
          console.error('Error al crear concepto', err);
        }
      });
    }
  }

  editarConcepto(concepto: any): void {
    this.nuevoConcepto = {
      nombre: concepto.nombre,
      tipo: concepto.tipo,
      descripcion: concepto.descripcion || '',
      porcentaje: concepto.porcentaje,
      monto_fijo: concepto.monto_fijo
    };

    this.editando = true;
    this.conceptoEditandoId = concepto.id_concepto;
  }

  eliminarConcepto(id: number): void {
    const confirmado = confirm('¿Deseas eliminar este concepto?');

    if (!confirmado) return;

    this.conceptosService.eliminarConcepto(id).subscribe({
      next: () => {
        this.cargarConceptos();
      },
      error: (err) => {
        console.error('Error al eliminar concepto', err);
      }
    });
  }

  resetFormulario(): void {
    this.nuevoConcepto = {
      nombre: '',
      tipo: 'PAGO',
      descripcion: '',
      porcentaje: null,
      monto_fijo: null
    };

    this.editando = false;
    this.conceptoEditandoId = null;
  }
}