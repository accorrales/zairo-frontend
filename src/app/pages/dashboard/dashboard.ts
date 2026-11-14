import { CrcMoneyPipe } from '../../shared/admin/crc-money';
import {AdminFeedback} from '../../shared/admin/admin-feedback';
import {PageLoadState} from '../../shared/admin/page-load-state';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { Header } from '../../layout/header/header';
import {RouterLink} from '@angular/router';
import {AuthService} from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  host: { class: 'zairo-screen z-admin zairo-ui' },
  standalone: true,
  imports: [CrcMoneyPipe, RouterLink, AdminFeedback, CommonModule, Sidebar, Header],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  pageState=new PageLoadState();
  private auth=inject(AuthService);
  get shortcuts(){const role=this.auth.getRole();return role==='admin'?[{url:'/eventos',text:'Gestionar eventos'},{url:'/admin/compras',text:'Revisar compras'},{url:'/dashboard-entradas',text:'Consultar ventas'}]:role==='contabilidad'?[{url:'/planillas',text:'Consultar planillas'},{url:'/reportes',text:'Ver reportes'},{url:'/dashboard-entradas',text:'Consultar ventas'}]:[{url:'/empleados',text:'Gestionar empleados'},{url:'/novedades',text:'Revisar novedades'},{url:'/planillas',text:'Consultar planillas'}];}
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

    this.pageState.observe(this.dashboardService.getDashboardData()).subscribe({
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