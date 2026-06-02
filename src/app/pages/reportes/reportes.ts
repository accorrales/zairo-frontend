import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Sidebar } from '../../layout/sidebar/sidebar';
import { Header } from '../../layout/header/header';

import { PlanillasService } from '../../core/services/planillas.service';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Sidebar, Header],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css'
})
export class Reportes implements OnInit {
  private planillasService = inject(PlanillasService);

  planillas: any[] = [];
  planillasFiltradas: any[] = [];

  filtroEstado = '';

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.planillasService.getPlanillas().subscribe({
      next: (data) => {
        this.planillas = data;
        this.aplicarFiltro();
      },
      error: (err) => {
        console.error('Error cargando reportes', err);
      }
    });
  }

  aplicarFiltro(): void {
    if (!this.filtroEstado) {
      this.planillasFiltradas = this.planillas;
      return;
    }

    this.planillasFiltradas = this.planillas.filter(
      p => p.estado === this.filtroEstado
    );
  }

  getTotalBruto(): number {
    return this.planillasFiltradas.reduce(
      (sum, p) => sum + Number(p.total_bruto || 0),
      0
    );
  }

  getTotalDeducciones(): number {
    return this.planillasFiltradas.reduce(
      (sum, p) => sum + Number(p.total_deducciones || 0),
      0
    );
  }

  getTotalNeto(): number {
    return this.planillasFiltradas.reduce(
      (sum, p) => sum + Number(p.total_neto || 0),
      0
    );
  }
}