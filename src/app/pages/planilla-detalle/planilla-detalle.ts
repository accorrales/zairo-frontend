import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { Sidebar } from '../../layout/sidebar/sidebar';
import { Header } from '../../layout/header/header';
import { PlanillasService } from '../../core/services/planillas.service';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-planilla-detalle',
  standalone: true,
  imports: [CommonModule, Sidebar, Header, RouterLink],
  templateUrl: './planilla-detalle.html',
  styleUrl: './planilla-detalle.css'
})
export class PlanillaDetalle implements OnInit {
  private route = inject(ActivatedRoute);
  private planillasService = inject(PlanillasService);

  idPlanilla!: number;
  planilla: any = null;
  detalle: any[] = [];
  cargando = true;
  error = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.error = 'No se recibió el ID de la planilla';
      this.cargando = false;
      return;
    }

    this.idPlanilla = Number(id);
    this.cargarDetalle();
  }

  cargarDetalle(): void {
    this.planillasService.obtenerDetallePlanilla(this.idPlanilla).subscribe({
      next: (response) => {
        this.planilla = response.planilla;
        this.detalle = response.detalle;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar detalle', err);
        this.error = err?.error?.error || 'Error al cargar detalle de planilla';
        this.cargando = false;
      }
    });
  }

  getTotalBruto(): number {
    return Number(this.planilla?.total_bruto || 0);
  }

  getTotalDeducciones(): number {
    return Number(this.planilla?.total_deducciones || 0);
  }

  getTotalNeto(): number {
    return Number(this.planilla?.total_neto || 0);
  }

  formatearMoneda(valor: number): string {
    return `CRC ${Number(valor || 0).toLocaleString('es-CR', { minimumFractionDigits: 2 })}`;
  }

  exportarPDF(): void {
    if (!this.planilla || this.detalle.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Reporte de Planilla', 14, 15);

    doc.setFontSize(11);
    doc.text(`ID Planilla: ${this.planilla.id_planilla}`, 14, 25);
    doc.text(`Periodo: ${this.planilla.nombre_periodo}`, 14, 32);
    doc.text(`Estado: ${this.planilla.estado}`, 14, 39);
    doc.text(`Fecha inicio: ${this.formatearFecha(this.planilla.fecha_inicio)}`, 14, 46);
    doc.text(`Fecha fin: ${this.formatearFecha(this.planilla.fecha_fin)}`, 14, 53);

    doc.text(`Total bruto: CRC ${this.getTotalBruto().toFixed(2)}`, 120, 25);
    doc.text(`Total deducciones: CRC ${this.getTotalDeducciones().toFixed(2)}`, 120, 32);
    doc.text(`Total neto: CRC ${this.getTotalNeto().toFixed(2)}`, 120, 39);

   const filas = this.detalle.map((d) => [
      d.cedula,
      `${d.nombre} ${d.apellido}`,
      d.puesto,
      d.departamento,
      this.formatearMoneda(d.salario_base),
      this.formatearMoneda(d.total_ingresos),
      this.formatearMoneda(d.total_deducciones),
      this.formatearMoneda(d.salario_neto)
    ]);

    autoTable(doc, {
      startY: 62,
      head: [[
        'Cédula',
        'Empleado',
        'Puesto',
        'Departamento',
        'Salario Base',
        'Ingresos',
        'Deducciones',
        'Neto'
      ]],
      body: filas,
      styles: {
        fontSize: 8
      },
      headStyles: {
        fillColor: [31, 34, 53]
      }
    });

    doc.save(`planilla_${this.planilla.id_planilla}.pdf`);
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-CR');
  }
}