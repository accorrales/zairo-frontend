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
  gruposTiers: any[] = [];
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

  irAEntradas(): void {
    const section = document.getElementById('entradas');

    if (!section) return;

    const y =
      section.getBoundingClientRect().top +
      window.pageYOffset -
      100;

    window.scrollTo({
      top: y,
      behavior: 'smooth'
    });
  }

  cargarTiers(): void {
    this.tiersService.obtenerTiersPorEvento(this.idEvento).subscribe({
      next: (data) => {
        this.tiers = data || [];
        this.agruparTiers();
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar tiers', err);
        this.cargando = false;
      }
    });
  }

  /**
   * Agrupa los tiers que comparten un mismo nombre base (por ejemplo
   * "General · Tier 1", "General · Tier 2") en una sola entrada con su
   * propio mapa de precios por fases. Los tiers con nombre único quedan
   * como un grupo de una sola fase.
   */
  agruparTiers(): void {
    const regexFase =
      /[\s\-–—·|:]*\(?\s*\b(tier|fase|phase|etapa|stage|preventa|pre-?venta|early\s*-?\s*bird|earlybird)\b[\s.\-]*([ivxlc]+|\d+)?\s*\)?\s*$/i;

    const grupos: any[] = [];
    const indicePorClave = new Map<string, number>();

    for (const tier of this.tiers) {
      const nombre = (tier.nombre || '').trim();
      const match = nombre.match(regexFase);

      let base = nombre;
      let etiquetaFase = '';

      if (match) {
        base = nombre.slice(0, match.index).replace(/[\s\-–—·|:]+$/, '').trim();
        const palabra = match[1] ? this.capitalizar(match[1].trim()) : '';
        const numero = match[2] ? match[2].trim().toUpperCase() : '';
        etiquetaFase = [palabra, numero].filter(Boolean).join(' ');
      }

      if (!base) {
        base = nombre || 'Entrada general';
      }

      const clave = base.toLowerCase();
      let indice = indicePorClave.get(clave);

      if (indice === undefined) {
        indice = grupos.length;
        indicePorClave.set(clave, indice);
        grupos.push({ nombre: base, descripcion: tier.descripcion || '', fases: [] });
      }

      grupos[indice].fases.push({ ...tier, etiquetaFase });
    }

    for (const grupo of grupos) {
      // Las fases escalan en precio: la más barata es la fase actual/temprana.
      grupo.fases.sort((a: any, b: any) => Number(a.precio || 0) - Number(b.precio || 0));

      grupo.fases.forEach((fase: any, i: number) => {
        if (!fase.etiquetaFase) {
          fase.etiquetaFase = `Fase ${i + 1}`;
        }
      });

      const faseActual =
        grupo.fases.find((f: any) => f.disponibilidad === 'DISPONIBLE') || null;

      const precios = grupo.fases.map((f: any) => Number(f.precio || 0));
      grupo.precioMin = Math.min(...precios);
      grupo.precioMax = Math.max(...precios);
      grupo.faseActual = faseActual;

      let indiceActivo: number;

      if (faseActual) {
        grupo.estado = 'DISPONIBLE';
        grupo.precioActual = Number(faseActual.precio || 0);
        indiceActivo = grupo.fases.indexOf(faseActual);
        grupo.siguienteFase =
          grupo.fases
            .slice(indiceActivo + 1)
            .find((f: any) => Number(f.precio || 0) > grupo.precioActual) || null;
      } else {
        const proxima = grupo.fases.find((f: any) => f.disponibilidad === 'PROXIMAMENTE');

        if (proxima) {
          grupo.estado = 'PROXIMAMENTE';
          grupo.precioActual = Number(proxima.precio || 0);
          indiceActivo = 0;
        } else {
          const ultima = grupo.fases[grupo.fases.length - 1];
          grupo.estado = ultima ? ultima.disponibilidad : 'CERRADO';
          grupo.precioActual = Number((ultima && ultima.precio) || 0);
          indiceActivo = grupo.fases.length - 1;
        }

        grupo.siguienteFase = null;
      }

      if (!grupo.descripcion) {
        grupo.descripcion =
          (faseActual && faseActual.descripcion) ||
          (grupo.fases[0] && grupo.fases[0].descripcion) ||
          '';
      }

      grupo.progreso =
        grupo.fases.length > 1
          ? Math.round((indiceActivo / (grupo.fases.length - 1)) * 100)
          : 100;

      grupo.fases.forEach((fase: any) => {
        if (faseActual && fase.id_tier === faseActual.id_tier) {
          fase.estadoMapa = 'active';
        } else if (fase.disponibilidad === 'CERRADO' || fase.disponibilidad === 'AGOTADO') {
          fase.estadoMapa = 'past';
        } else {
          fase.estadoMapa = 'future';
        }
      });
    }

    this.gruposTiers = grupos;
  }

  seleccionarGrupo(grupo: any): void {
    if (!grupo?.faseActual) return;

    this.seleccionarTier(grupo.faseActual);
    setTimeout(() => this.irACheckout(), 60);
  }

  esGrupoSeleccionado(grupo: any): boolean {
    return (
      !!grupo?.faseActual &&
      this.tierSeleccionado?.id_tier === grupo.faseActual.id_tier
    );
  }

  textoBotonGrupo(grupo: any): string {
    if (grupo.faseActual) {
      return this.esGrupoSeleccionado(grupo) ? 'Entrada seleccionada' : 'Comprar a este precio';
    }
    if (grupo.estado === 'PROXIMAMENTE') return 'Próximamente';
    if (grupo.estado === 'AGOTADO') return 'Agotado';
    if (grupo.estado === 'CERRADO') return 'Ventas cerradas';
    return 'No disponible';
  }

  porcentajeAhorro(grupo: any): number {
    if (!grupo?.precioActual || !grupo?.precioMax) return 0;
    if (grupo.precioMax <= grupo.precioActual) return 0;
    return Math.round((1 - grupo.precioActual / grupo.precioMax) * 100);
  }

  etiquetaCuandoFase(fase: any): string {
    if (fase.estadoMapa === 'active') {
      return fase.fecha_fin ? `Hasta ${this.fechaCorta(fase.fecha_fin)}` : 'Precio de hoy';
    }
    if (fase.estadoMapa === 'future') {
      return fase.fecha_inicio ? `Sube el ${this.fechaCorta(fase.fecha_inicio)}` : 'Próximo precio';
    }
    return 'Finalizado';
  }

  fechaCorta(fecha: string): string {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-CR', { day: '2-digit', month: 'short' });
  }

  capitalizar(texto: string): string {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
  }

  irACheckout(): void {
    const el = document.getElementById('checkout');

    if (!el) return;

    const y = el.getBoundingClientRect().top + window.pageYOffset - 90;
    window.scrollTo({ top: y, behavior: 'smooth' });
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