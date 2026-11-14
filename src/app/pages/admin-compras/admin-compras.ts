import { formatCRC } from '../../shared/admin/crc-money';
import {Sidebar} from '../../layout/sidebar/sidebar';
import {Header} from '../../layout/header/header';
import {AdminFeedback} from '../../shared/admin/admin-feedback';
import {PageLoadState} from '../../shared/admin/page-load-state';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ComprasEntradasService } from '../../core/services/compras-entradas.service';

@Component({
  selector: 'app-admin-compras',
  host: { class: 'zairo-screen z-admin zairo-ui' },
  standalone: true,
  imports: [AdminFeedback, Sidebar, Header, CommonModule],
  templateUrl: './admin-compras.html',
  styleUrl: './admin-compras.css'
})
export class AdminCompras implements OnInit {
  pageState=new PageLoadState();
  private comprasService = inject(ComprasEntradasService);

  compras: any[] = [];
  compraSeleccionada: any = null;
  cargando = false;
  mensaje = '';

  ngOnInit(): void {
    this.cargarPendientes();
  }

  cargarPendientes(): void {
    if (this.cargando) return;
    if(this.mensaje==='Error cargando compras pendientes.')this.mensaje='';
    this.cargando = true;

    this.pageState.observe(this.comprasService.listarPendientes()).subscribe({
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
    this.pageState.observe(this.comprasService.obtenerCompraPorId(id)).subscribe({
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
    return formatCRC(valor);
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-CR');
  }
}