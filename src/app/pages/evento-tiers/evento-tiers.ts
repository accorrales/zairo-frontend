import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { Sidebar } from '../../layout/sidebar/sidebar';
import { Header } from '../../layout/header/header';
import { EntradaTiersService } from '../../core/services/entrada-tiers.service';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-evento-tiers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Sidebar, Header, ConfirmDialog],
  templateUrl: './evento-tiers.html',
  styleUrl: './evento-tiers.css'
})
export class EventoTiers implements OnInit {
  private route = inject(ActivatedRoute);
  private tiersService = inject(EntradaTiersService);

  idEvento!: number;
  tiers: any[] = [];

  nuevoTier = {
    id_evento: null as number | null,
    nombre: '',
    descripcion: '',
    precio: null as number | null,
    fecha_inicio: '',
    fecha_fin: '',
    cantidad_disponible: null as number | null,
    zona: 'GENERAL',
    beneficios_paquete: '',
    entradas_por_paquete: 1,
    estado: true
  };

  editando = false;
  tierEditandoId: number | null = null;

  modalVisible = false;
  tituloModal = '';
  mensajeModal = '';
  accionActual: (() => void) | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      alert('No se recibió el ID del evento');
      return;
    }

    this.idEvento = Number(id);
    this.nuevoTier.id_evento = this.idEvento;
    this.cargarTiers();
  }

  cargarTiers(): void {
    this.tiersService.obtenerTiersAdmin(this.idEvento).subscribe({
      next: (data) => {
        this.tiers = data;
      },
      error: (err) => {
        console.error('Error al cargar tiers', err);
        alert(err?.error?.error || 'Error al cargar tiers');
      }
    });
  }

  guardarTier(): void {
    if (!this.nuevoTier.nombre || !this.nuevoTier.precio) {
      alert('Nombre y precio son obligatorios');
      return;
    }

    const size = Number(this.nuevoTier.entradas_por_paquete);
    const stock = this.nuevoTier.cantidad_disponible;
    if (!Number.isInteger(size) || size < 1 || size > 10 || (size > 1 && stock === null) || (stock !== null && (!Number.isInteger(Number(stock)) || Number(stock) < 0))) { alert('Revisá las entradas por paquete (1 a 10) y el límite de paquetes de la promoción.'); return; }
    const payload = {
      id_evento: this.idEvento,
      nombre: this.nuevoTier.nombre,
      descripcion: this.nuevoTier.descripcion,
      precio: Number(this.nuevoTier.precio),
      fecha_inicio: this.nuevoTier.fecha_inicio || null,
      fecha_fin: this.nuevoTier.fecha_fin || null,
      cantidad_disponible: this.nuevoTier.cantidad_disponible,
      zona: this.nuevoTier.zona,
      beneficios_paquete: this.nuevoTier.beneficios_paquete,
      entradas_por_paquete: Number(this.nuevoTier.entradas_por_paquete),
      estado: this.nuevoTier.estado
    };

    if (this.editando && this.tierEditandoId !== null) {
      this.tiersService.actualizarTier(this.tierEditandoId, payload).subscribe({
        next: () => {
          this.cargarTiers();
          this.resetFormulario();
        },
        error: (err) => {
          console.error('Error al actualizar tier', err);
          alert(err?.error?.error || 'Error al actualizar tier');
        }
      });

      return;
    }

    this.tiersService.crearTier(payload).subscribe({
      next: () => {
        this.cargarTiers();
        this.resetFormulario();
      },
      error: (err) => {
        console.error('Error al crear tier', err);
        alert(err?.error?.error || 'Error al crear tier');
      }
    });
  }

  usarPromoVip(): void {
    this.resetFormulario();
    this.nuevoTier.nombre = 'INFAMOUS · Mesa Red Bull · 6 entradas VIP';
    this.nuevoTier.descripcion = 'EL LLAMADO DE LAS ALMAS · 31 octubre 2026';
    this.nuevoTier.zona = 'VIP';
    this.nuevoTier.beneficios_paquete = "1 mesa Red Bull tipo cóctel, 1 litro de Jägermeister y 4 Red Bulls";
    this.nuevoTier.entradas_por_paquete = 6;
    this.nuevoTier.precio = 75000;
    this.nuevoTier.cantidad_disponible = 5;
    this.nuevoTier.estado = false;
  }

  usarPromoCuatro(): void {
    this.resetFormulario();
    this.nuevoTier.nombre = 'Promo General · 4 entradas';
    this.nuevoTier.descripcion = 'Paquete de 4 entradas generales por ₡20.000';
    this.nuevoTier.entradas_por_paquete = 4;
    this.nuevoTier.precio = 20000;
    this.nuevoTier.estado = false;
  }

  editarTier(tier: any): void {
    this.nuevoTier = {
      id_evento: tier.id_evento,
      nombre: tier.nombre,
      descripcion: tier.descripcion || '',
      precio: Number(tier.precio || 0),
      fecha_inicio: this.formatoInputFecha(tier.fecha_inicio),
      fecha_fin: this.formatoInputFecha(tier.fecha_fin),
      cantidad_disponible: tier.cantidad_disponible,
      zona: tier.zona || 'GENERAL',
      beneficios_paquete: tier.beneficios_paquete || '',
      entradas_por_paquete: Number(tier.entradas_por_paquete || 1),
      estado: tier.estado
    };

    this.editando = true;
    this.tierEditandoId = tier.id_tier;
  }

  eliminarTier(id: number): void {
    this.abrirConfirmacion(
      'Eliminar tier',
      '¿Deseas eliminar este tier? Esta acción no se puede deshacer.',
      () => {
        this.tiersService.eliminarTier(id).subscribe({
          next: () => this.cargarTiers(),
          error: (err) => {
            console.error('Error al eliminar tier', err);
            alert(err?.error?.error || 'Error al eliminar tier');
          }
        });
      }
    );
  }

  abrirConfirmacion(titulo: string, mensaje: string, accion: () => void): void {
    this.tituloModal = titulo;
    this.mensajeModal = mensaje;
    this.accionActual = accion;
    this.modalVisible = true;
  }

  confirmarAccion(): void {
    if (this.accionActual) {
      this.accionActual();
    }

    this.cerrarModal();
  }

  cancelarAccion(): void {
    this.cerrarModal();
  }

  cerrarModal(): void {
    this.modalVisible = false;
    this.tituloModal = '';
    this.mensajeModal = '';
    this.accionActual = null;
  }

  resetFormulario(): void {
    this.nuevoTier = {
      id_evento: this.idEvento,
      nombre: '',
      descripcion: '',
      precio: null,
      fecha_inicio: '',
      fecha_fin: '',
      cantidad_disponible: null,
      zona: 'GENERAL',
    beneficios_paquete: '',
    entradas_por_paquete: 1,
    estado: true
    };

    this.editando = false;
    this.tierEditandoId = null;
  }

  formatoInputFecha(fecha: string): string {
    if (!fecha) return '';

    // El backend ya devuelve la fecha en hora de Costa Rica con formato
    // datetime-local (YYYY-MM-DDTHH:mm), así que se usa tal cual sin
    // convertir zonas horarias (evita el desfase de horas al editar).
    return fecha.slice(0, 16);
  }

  formatearMoneda(valor: number): string {
    return `CRC ${Number(valor || 0).toLocaleString('es-CR', {
      minimumFractionDigits: 2
    })}`;
  }
}