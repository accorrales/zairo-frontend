import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AdminCompras } from './admin-compras';
import { ComprasEntradasService } from '../../core/services/compras-entradas.service';

it('refresh sends one request while pending and allows retry after failure', () => {
  const request = new Subject<any[]>();
  const listarPendientes = vi.fn(() => request);
  TestBed.configureTestingModule({ providers: [{ provide: ComprasEntradasService, useValue: { listarPendientes } }] });
  const page = TestBed.runInInjectionContext(() => new AdminCompras());
  page.cargarPendientes(); page.cargarPendientes();
  expect(listarPendientes).toHaveBeenCalledTimes(1);
  expect(page.cargando).toBe(true);
  request.error({ status: 503 });
  expect(page.cargando).toBe(false);
  expect(page.pageState.retryable()).toBe(true);
  listarPendientes.mockReturnValue(new Subject<any[]>());
  page.cargarPendientes();
  expect(listarPendientes).toHaveBeenCalledTimes(2);
});
