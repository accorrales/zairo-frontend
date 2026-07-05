import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';


export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login)
  },

  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
    canActivate: [authGuard]
  },

  {
    path: 'empleados',
    loadComponent: () => import('./pages/empleados/empleados').then((m) => m.Empleados),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'rrhh'] }
  },

  {
    path: 'conceptos',
    loadComponent: () => import('./pages/conceptos/conceptos').then((m) => m.Conceptos),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'rrhh'] }
  },

  {
    path: 'novedades',
    loadComponent: () => import('./pages/novedades/novedades').then((m) => m.Novedades),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'rrhh'] }
  },

  {
    path: 'planillas',
    loadComponent: () => import('./pages/planillas/planillas').then((m) => m.Planillas),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'rrhh', 'contabilidad'] }
  },

  {
    path: 'planillas/:id/detalle',
    loadComponent: () =>
      import('./pages/planilla-detalle/planilla-detalle').then((m) => m.PlanillaDetalle),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'rrhh', 'contabilidad'] }
  },

  {
    path: 'reportes',
    loadComponent: () => import('./pages/reportes/reportes').then((m) => m.Reportes),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'rrhh', 'contabilidad', 'visor'] }
  },

  {
    path: 'eventos',
    loadComponent: () => import('./pages/eventos/eventos').then((m) => m.Eventos),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] }
  },

  {
    path: 'departamentos',
    loadComponent: () =>
      import('./pages/departamentos/departamentos').then((m) => m.Departamentos),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'rrhh'] }
  },

  {
    path: 'usuarios',
    loadComponent: () => import('./pages/usuarios/usuarios').then((m) => m.Usuarios),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'eventos/:id/tiers',
    loadComponent: () => import('./pages/evento-tiers/evento-tiers').then((m) => m.EventoTiers),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'codigos-descuento',
    loadComponent: () =>
      import('./pages/codigos-descuento/codigos-descuento').then((m) => m.CodigosDescuento),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'dashboard-entradas',
    loadComponent: () =>
      import('./pages/dashboard-entradas/dashboard-entradas').then((m) => m.DashboardEntradas),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'evento/:id',
    loadComponent: () =>
      import('./pages/public-evento-detalle/public-evento-detalle').then(
        (m) => m.PublicEventoDetalle
      )
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./pages/public-eventos/public-eventos').then((m) => m.PublicEventos)
  },

  {
    path: 'admin/compras',
    loadComponent: () => import('./pages/admin-compras/admin-compras').then((m) => m.AdminCompras)
  },
  {
    path: 'admin/kiosk',
    loadComponent: () => import('./pages/admin-kiosk/admin-kiosk').then((m) => m.AdminKiosk)
  },
  {
    path: 'whatsapp-comprobantes',
    loadComponent: () =>
      import('./pages/whatsapp-comprobantes/whatsapp-comprobantes').then(
        (m) => m.WhatsappComprobantes
      ),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] }
  },

  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' }
];
