import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { EventosService } from '../../core/services/eventos.service';
import { EntradaTiersService } from '../../core/services/entrada-tiers.service';
import { ComprasEntradasService } from '../../core/services/compras-entradas.service';

@Component({
  selector: 'app-public-evento-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './public-evento-detalle.html',
  styleUrl: './public-evento-detalle.css'
})
export class PublicEventoDetalle implements OnInit {
  private route = inject(ActivatedRoute);
  private eventosService = inject(EventosService);
  private tiersService = inject(EntradaTiersService);
  private comprasService = inject(ComprasEntradasService);

  idEvento!: number;
  evento: any = null;
  tiers: any[] = [];
  cargando = true;

  tierSeleccionado: any = null;
  cantidad = 1;
  correoComprador = '';
  telefonoComprador = '';

  personas: any[] = [
    {
      nombre_completo: '',
      fecha_nacimiento: ''
    }
  ];

  procesandoCompra = false;
  mensajeCompra = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.cargando = false;
      return;
    }

    this.idEvento = Number(id);
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.eventosService.obtenerEventoPorId(this.idEvento).subscribe({
      next: (evento) => {
        this.evento = evento;
        this.cargarTiers();
      },
      error: (err) => {
        console.error('Error al cargar evento', err);
        this.cargando = false;
      }
    });
  }

  cargarTiers(): void {
    this.tiersService.obtenerTiersPorEvento(this.idEvento).subscribe({
      next: (data) => {
        this.tiers = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar tiers', err);
        this.cargando = false;
      }
    });
  }

  seleccionarTier(tier: any): void {
    if (tier.disponibilidad !== 'DISPONIBLE') return;

    this.tierSeleccionado = tier;
    this.actualizarPersonas();
    this.mensajeCompra = '';
  }

  actualizarPersonas(): void {
    const nuevaCantidad = Number(this.cantidad || 1);

    if (nuevaCantidad < 1) {
      this.cantidad = 1;
      return;
    }

    while (this.personas.length < nuevaCantidad) {
      this.personas.push({
        nombre_completo: '',
        fecha_nacimiento: ''
      });
    }

    while (this.personas.length > nuevaCantidad) {
      this.personas.pop();
    }

    this.mensajeCompra = '';
  }

  cumpleEdadMinima(fechaNacimiento: string): boolean {
    if (!fechaNacimiento || !this.evento?.fecha) return false;

    const nacimiento = new Date(fechaNacimiento);
    const fechaEvento = new Date(this.evento.fecha);

    const fechaCumple17 = new Date(nacimiento);
    fechaCumple17.setFullYear(fechaCumple17.getFullYear() + 17);

    fechaCumple17.setHours(0, 0, 0, 0);
    fechaEvento.setHours(0, 0, 0, 0);

    return fechaCumple17 <= fechaEvento;
  }

  calcularTotal(): number {
    if (!this.tierSeleccionado) return 0;
    return Number(this.tierSeleccionado.precio || 0) * Number(this.cantidad || 1);
  }

  validarCompra(): string | null {
    if (!this.tierSeleccionado) return 'Seleccioná un tipo de entrada.';
    if (!this.correoComprador.trim()) return 'Ingresá un correo electrónico.';
    if (!this.telefonoComprador.trim()) return 'Ingresá un número de teléfono.';
    if (!this.personas.length) return 'Agregá al menos una persona.';

    for (let i = 0; i < this.personas.length; i++) {
      const p = this.personas[i];

      if (!p.nombre_completo?.trim()) {
        return `Ingresá el nombre completo de la persona ${i + 1}.`;
      }

      if (!p.fecha_nacimiento) {
        return `Ingresá la fecha de nacimiento de la persona ${i + 1}.`;
      }

      if (!this.cumpleEdadMinima(p.fecha_nacimiento)) {
        return `La persona ${i + 1} debe tener 17 años cumplidos para la fecha del evento.`;
      }
    }

    return null;
  }

  crearCompraPendiente(): void {
    const error = this.validarCompra();

    if (error) {
      this.mensajeCompra = error;
      return;
    }

    this.procesandoCompra = true;
    this.mensajeCompra = '';

    const personasLimpias = this.personas.map((p) => ({
      nombre_completo: p.nombre_completo.trim(),
      fecha_nacimiento: p.fecha_nacimiento
    }));

    const data = {
      id_evento: this.evento.id_evento,
      id_tier: this.tierSeleccionado.id_tier,
      correo_comprador: this.correoComprador.trim(),
      telefono_comprador: this.telefonoComprador.trim(),
      personas: personasLimpias
    };

    this.comprasService.crearCompra(data).subscribe({
      next: (response) => {
        this.procesandoCompra = false;
        this.mensajeCompra = 'Compra creada correctamente. Continuá por WhatsApp para enviar el SINPE.';
        this.abrirWhatsapp(response.compra);
      },
      error: (err) => {
        console.error('Error creando compra', err);
        this.procesandoCompra = false;
        this.mensajeCompra = err.error?.message || 'Ocurrió un error creando la compra.';
      }
    });
  }

  abrirWhatsapp(compra: any): void {
    const personasTexto = this.personas
      .map((p, index) => {
        return `${index + 1}. ${p.nombre_completo.trim()} - Nacimiento: ${p.fecha_nacimiento}`;
      })
      .join('\n');

    const mensaje = `
Hola ZAIRO, quiero confirmar mi compra.

Código de compra: ${compra.id_compra}
Evento: ${this.evento.nombre}
Entrada: ${this.tierSeleccionado.nombre}
Cantidad: ${this.cantidad}
Total: ${this.formatearMoneda(this.calcularTotal())}
Correo: ${this.correoComprador.trim()}
Teléfono: ${this.telefonoComprador.trim()}

Personas:
${personasTexto}

Voy a realizar el SINPE y enviar el comprobante por este chat.
    `.trim();

    const url = `https://wa.me/50661518701?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-CR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  formatearMoneda(valor: number): string {
    return `CRC ${Number(valor || 0).toLocaleString('es-CR')}`;
  }
}