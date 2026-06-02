import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { Header } from '../../layout/header/header';
import { DashboardService } from '../../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, Sidebar, Header],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private dashboardService = inject(DashboardService);

  cargando = true;
  error = '';

  resumen = {
    totalEmpleados: 0,
    empleadosActivos: 0,
    totalDepartamentos: 0,
    promedioSalario: 0
  };

  ultimosEmpleados: any[] = [];
  empleadosPorDepartamento: any[] = [];

  ngOnInit(): void {
    this.cargarDashboard();
  }

  cargarDashboard(): void {
    this.cargando = true;
    this.error = '';

    this.dashboardService.getDashboardData().subscribe({
      next: (data) => {
        this.resumen = {
          totalEmpleados: data.totalEmpleados,
          empleadosActivos: data.empleadosActivos,
          totalDepartamentos: data.totalDepartamentos,
          promedioSalario: data.promedioSalario
        };

        this.ultimosEmpleados = data.ultimosEmpleados;
        this.empleadosPorDepartamento = data.empleadosPorDepartamento;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando dashboard:', err);
        this.error = 'No se pudo cargar el dashboard.';
        this.cargando = false;
      }
    });
  }
}