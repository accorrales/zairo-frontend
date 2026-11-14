import { CrcMoneyPipe } from '../../shared/admin/crc-money';
import {AdminFeedback} from '../../shared/admin/admin-feedback';
import {PageLoadState} from '../../shared/admin/page-load-state';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Sidebar } from '../../layout/sidebar/sidebar';
import { Header } from '../../layout/header/header';

import {AuthService} from '../../core/services/auth.service';
import { PlanillasService } from '../../core/services/planillas.service';

@Component({
  selector: 'app-reportes',
  host: { class: 'zairo-screen z-admin zairo-ui' },
  standalone: true,
  imports: [CrcMoneyPipe, AdminFeedback, CommonModule, FormsModule, RouterLink, Sidebar, Header],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css'
})
export class Reportes implements OnInit {
  pageState=new PageLoadState();
  private auth=inject(AuthService);
  get puedeConsultar(){return ['admin','rrhh','contabilidad'].includes(this.auth.getRole()?.trim().toLowerCase()||'');}
  private planillasService = inject(PlanillasService);

  planillas: any[] = [];
  planillasFiltradas: any[] = [];

  filtroEstado = '';

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    if(!this.puedeConsultar){this.pageState.retryable.set(false);this.pageState.error.set('Tu rol no tiene acceso a las planillas de este reporte. Consultá con administración.');return;}
    this.pageState.observe(this.planillasService.getPlanillas()).subscribe({
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