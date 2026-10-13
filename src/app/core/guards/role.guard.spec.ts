import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { roleGuard } from './role.guard';
import { routes } from '../../app.routes';

describe('role navigation', () => {
  let role: string | null;
  beforeEach(() => {
    role = 'contabilidad';
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: AuthService, useValue: { getRole: () => role } }] });
  });
  function check(path: string) {
    const config = routes.find(r => r.path === path)!;
    const route = { data: config.data, routeConfig: config } as ActivatedRouteSnapshot;
    return TestBed.runInInjectionContext(() => roleGuard(route, {} as RouterStateSnapshot));
  }
  it('allows accounting to enter every financial module', () => {
    for (const path of ['dashboard', 'empleados', 'departamentos', 'conceptos', 'novedades', 'planillas', 'planillas/:id/detalle', 'reportes', 'dashboard-entradas']) expect(check(path)).toBe(true);
  });
  it('redirects accounting away from users to an allowed route', () => {
    expect(TestBed.inject(Router).serializeUrl(check('usuarios') as UrlTree)).toBe('/dashboard');
    expect(check('dashboard')).toBe(true);
    expect(TestBed.inject(Router).serializeUrl(check('admin/compras') as UrlTree)).toBe('/dashboard');
  });
  it('does not loop for viewers or unknown roles', () => {
    role = 'visor';
    expect(TestBed.inject(Router).serializeUrl(check('dashboard') as UrlTree)).toBe('/reportes');
    expect(check('reportes')).toBe(true);
    role = 'unknown';
    expect(TestBed.inject(Router).serializeUrl(check('dashboard') as UrlTree)).toBe('/home');
  });
  it('preserves kiosk access and normalizes accounting roles', () => {
    role = 'entrada';
    expect(check('admin/kiosk')).toBe(true);
    expect(TestBed.inject(Router).serializeUrl(check('usuarios') as UrlTree)).toBe('/admin/kiosk');
    role = ' CONTABILIDAD ';
    expect(check('dashboard')).toBe(true);
  });
});
