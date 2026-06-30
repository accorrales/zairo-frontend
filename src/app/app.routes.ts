import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Empleados } from './pages/empleados/empleados';
import { Planillas } from './pages/planillas/planillas';
import { Eventos } from './pages/eventos/eventos';
import { Reportes } from './pages/reportes/reportes';
import { PlanillaDetalle } from './pages/planilla-detalle/planilla-detalle';
import { Conceptos } from './pages/conceptos/conceptos';
import { Novedades } from './pages/novedades/novedades';
import { Departamentos } from './pages/departamentos/departamentos';
import { Usuarios } from './pages/usuarios/usuarios';
import { EventoTiers } from './pages/evento-tiers/evento-tiers';
import { PublicEventos } from './pages/public-eventos/public-eventos';
import { PublicEventoDetalle } from './pages/public-evento-detalle/public-evento-detalle';
import { AdminCompras } from './pages/admin-compras/admin-compras';
import { AdminKiosk } from './pages/admin-kiosk/admin-kiosk';
import { CodigosDescuento } from './pages/codigos-descuento/codigos-descuento';
import { DashboardEntradas } from './pages/dashboard-entradas/dashboard-entradas';

import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';


export const routes: Routes = [
  { path: 'login', component: Login },

  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard]
  },

  {
    path: 'empleados',
    component: Empleados,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'rrhh'] }
  },

  {
    path: 'conceptos',
    component: Conceptos,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'rrhh'] }
  },

  {
    path: 'novedades',
    component: Novedades,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'rrhh'] }
  },

  {
    path: 'planillas',
    component: Planillas,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'rrhh', 'contabilidad'] }
  },

  {
    path: 'planillas/:id/detalle',
    component: PlanillaDetalle,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'rrhh', 'contabilidad'] }
  },

  {
    path: 'reportes',
    component: Reportes,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'rrhh', 'contabilidad', 'visor'] }
  },

  {
    path: 'eventos',
    component: Eventos,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] }
  },

  {
    path: 'departamentos',
    component: Departamentos,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'rrhh'] }
  },
  
  {
    path: 'usuarios',
    component: Usuarios,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'eventos/:id/tiers',
    component: EventoTiers,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'codigos-descuento',
    component: CodigosDescuento,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'dashboard-entradas',
    component: DashboardEntradas,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'evento/:id',
    component: PublicEventoDetalle
  },
  {
    path: 'home',
    component: PublicEventos
  },
  
  {
    path: 'admin/compras',
    component: AdminCompras
  },
  {
    path: 'admin/kiosk',
    component: AdminKiosk
  },
    
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' }
];