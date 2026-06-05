import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ComprasEntradasService } from '../../core/services/compras-entradas.service';

@Component({
  selector: 'app-admin-compras',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-compras.html',
  styleUrl: './admin-compras.css'
})
export class AdminCompras implements OnInit {
  private comprasService = inject(ComprasEntradasService);

  compras: any[] = [];
  compraSeleccionada: any = null;
  cargando = true;
  mensaje = '';

  ngOnInit(): void {
    this.cargarPendientes();
  }

  cargarPendientes(): void {
    this.cargando = true;

    this.comprasService.listarPendientes().subscribe({
      next: (data) => {
        this.compras = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando compras pendientes', err);
        this.cargando = false;
        this.mensaje = 'Error cargando compras pendientes.';
      }
    });
  }

  verDetalle(id: number): void {
    this.comprasService.obtenerCompraPorId(id).subscribe({
      next: (data) => {
        this.compraSeleccionada = data;
      },
      error: (err) => {
        console.error('Error cargando detalle', err);
        this.mensaje = 'Error cargando detalle de compra.';
      }
    });
  }

  confirmar(id: number): void {
  const confirmar = window.confirm('¿Confirmar esta compra como pagada?');

  if (!confirmar) return;

  this.mensaje = 'Confirmando compra...';

  this.comprasService.confirmarCompra(id).subscribe({
    next: () => {
      this.mensaje = 'Compra confirmada correctamente.';
      this.compraSeleccionada = null;
      this.cargarPendientes();
    },
    error: (err) => {
      console.error('Error confirmando compra', err);

      const detalle =
        err.error?.error ||
        err.error?.message ||
        'Error confirmando compra.';

      this.mensaje = detalle;
    }
  });
}

  rechazar(id: number): void {
    const confirmar = window.confirm('¿Rechazar esta compra?');

    if (!confirmar) return;

    this.comprasService.rechazarCompra(id).subscribe({
      next: () => {
        this.mensaje = 'Compra rechazada correctamente.';
        this.compraSeleccionada = null;
        this.cargarPendientes();
      },
      error: (err) => {
        console.error('Error rechazando compra', err);
        this.mensaje = 'Error rechazando compra.';
      }
    });
  }

  cerrarDetalle(): void {
    this.compraSeleccionada = null;
  }

  formatearMoneda(valor: number): string {
    return `CRC ${Number(valor || 0).toLocaleString('es-CR')}`;
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-CR');
  }
}