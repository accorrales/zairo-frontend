import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { EventosService } from '../../core/services/eventos.service';
import { EntradaTiersService } from '../../core/services/entrada-tiers.service';
import { ComprasEntradasService } from '../../core/services/compras-entradas.service';
import { CodigosDescuentoService } from '../../core/services/codigos-descuento.service';

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
  private codigosService = inject(CodigosDescuentoService);

  idEvento!: number;
  evento: any = null;
  tiers: any[] = [];

  zonas: any[] = [];
  zonasConMapa: any[] = [];
  zonasSinMapa: any[] = [];
  zonaSeleccionada: any = null;

  /** Imagen del plano del lugar. Guardala en public/assets/ con este nombre. */
  planoImagen = '/assets/plano-lost-trip.jpg';

  /** Se pone en false si la imagen del plano no carga, para mostrar el respaldo. */
  planoDisponible = true;

  cargando = true;

  tierSeleccionado: any = null;
  cantidad = 1;

  /** Máximo de entradas que una persona puede comprar en una sola compra. */
  maxEntradas = 10;
  /** Opciones del selector de cantidad (1..maxEntradas). */
  opcionesCantidad: number[] = Array.from({ length: this.maxEntradas }, (_, i) => i + 1);

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

  // Código de descuento
  codigoDescuento = '';
  codigoAplicado = false;
  descuentoAplicado = 0;
  validandoCodigo = false;
  mensajeCodigo = '';

  /**
   * Zonas conocidas del lugar. Cada tier se asigna a una zona buscando
   * su palabra clave dentro del nombre del tier (ej. un tier llamado
   * "TIER 1 (Entrada General)" cae en la zona "general").
   */
  private zonaDefs = [
    { clave: 'punch',     nombre: 'Zona Punch Club', icono: '🍹', keywords: ['punch'] },
    { clave: 'soleo',     nombre: 'Zona Soleo',      icono: '🍾', keywords: ['soleo'] },
    { clave: 'vip',       nombre: 'Zona VIP',        icono: '⭐', keywords: ['vip'] },
    { clave: 'palco',     nombre: 'Palcos',          icono: '🎭', keywords: ['palco'] },
    { clave: 'backstage', nombre: 'Backstage',       icono: '🎤', keywords: ['backstage', 'back stage'] },
    { clave: 'general',   nombre: 'Zona General',    icono: '🎟️', keywords: ['general'] }
  ];

  /**
   * Posición (en % del plano) del marcador de cada zona. Ajustá x/y si
   * querés mover un punto sobre la imagen (0,0 = arriba-izquierda).
   */
  private posicionesMapa: Record<string, { x: number; y: number }> = {
    general:   { x: 56, y: 58 },
    punch:     { x: 17, y: 41 },
    soleo:     { x: 87, y: 27 },
    vip:       { x: 87, y: 72 },
    palco:     { x: 13, y: 72 },
    backstage: { x: 56, y: 13 }
  };

  private regexFase =
    /\b(tier|fase|phase|etapa|preventa|pre-?venta|early\s*-?\s*bird|earlybird)\b\s*\.?\s*([ivxlc]+|\d+)?/i;

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
        // En la venta pública no se muestran los tiers desactivados
        // (estado = false / disponibilidad = 'DESACTIVADO'). El panel de
        // administración sí los sigue viendo para poder reactivarlos.
        this.tiers = (data || []).filter(
          (t) => t.estado !== false && t.disponibilidad !== 'DESACTIVADO'
        );
        this.agruparPorZona();
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar tiers', err);
        this.cargando = false;
      }
    });
  }

  // ===========================================================
  //  Mapa de zonas
  // ===========================================================

  private normalizar(texto: string): string {
    return (texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  /** Etiqueta corta de la fase (Tier 1, Fase 2, Preventa...) si el nombre la incluye. */
  private etiquetaFaseDe(nombre: string): string {
    const m = (nombre || '').match(this.regexFase);
    if (!m) return '';
    const palabra = this.capitalizar(m[1].trim());
    const numero = m[2] ? m[2].trim().toUpperCase() : '';
    return [palabra, numero].filter(Boolean).join(' ');
  }

  /** Nombre legible de una zona no reconocida (sin fase ni paréntesis). */
  private nombreBase(nombre: string): string {
    const limpio = (nombre || '')
      .replace(this.regexFase, '')
      .replace(/\(.*?\)/g, '')
      .replace(/[\s\-–—·|:]+/g, ' ')
      .trim();
    return limpio || (nombre || '').trim() || 'Zona';
  }

  agruparPorZona(): void {
    const zonasMap = new Map<string, any>();
    const orden: string[] = [];

    for (const tier of this.tiers) {
      const norm = this.normalizar(tier.nombre);
      const def = this.zonaDefs.find((d) => d.keywords.some((k) => norm.includes(k)));

      let clave: string;
      let nombre: string;
      let icono: string;

      if (def) {
        clave = def.clave;
        nombre = def.nombre;
        icono = def.icono;
      } else {
        nombre = this.nombreBase(tier.nombre);
        clave = 'otra-' + this.normalizar(nombre);
        icono = '🎟️';
      }

      if (!zonasMap.has(clave)) {
        zonasMap.set(clave, {
          clave,
          nombre,
          icono,
          descripcion: tier.descripcion || '',
          pos: this.posicionesMapa[clave] || null,
          fases: []
        });
        orden.push(clave);
      }

      zonasMap.get(clave).fases.push({ ...tier, etiquetaFase: this.etiquetaFaseDe(tier.nombre) });
    }

    const zonas = orden.map((c) => zonasMap.get(c));
    zonas.forEach((z) => this.calcularFasesZona(z));

    this.zonas = zonas;
    this.zonasConMapa = zonas.filter((z) => z.pos);
    this.zonasSinMapa = zonas.filter((z) => !z.pos);

    // Mantener la zona seleccionada si todavía existe tras recargar.
    if (this.zonaSeleccionada) {
      this.zonaSeleccionada =
        zonas.find((z) => z.clave === this.zonaSeleccionada.clave) || null;
    }
  }

  private calcularFasesZona(zona: any): void {
    // Las fases escalan en precio: la más barata es la tarifa temprana.
    zona.fases.sort((a: any, b: any) => Number(a.precio || 0) - Number(b.precio || 0));

    zona.fases.forEach((fase: any, i: number) => {
      if (!fase.etiquetaFase) {
        fase.etiquetaFase = `Fase ${i + 1}`;
      }
    });

    const faseActual = zona.fases.find((f: any) => f.disponibilidad === 'DISPONIBLE') || null;
    const precios = zona.fases.map((f: any) => Number(f.precio || 0));

    zona.precioMin = Math.min(...precios);
    zona.precioMax = Math.max(...precios);
    zona.faseActual = faseActual;
    zona.multiFase = zona.fases.length > 1;

    let indiceActivo: number;

    if (faseActual) {
      zona.estado = 'DISPONIBLE';
      zona.precioActual = Number(faseActual.precio || 0);
      indiceActivo = zona.fases.indexOf(faseActual);
      zona.siguienteFase =
        zona.fases
          .slice(indiceActivo + 1)
          .find((f: any) => Number(f.precio || 0) > zona.precioActual) || null;
    } else {
      const proxima = zona.fases.find((f: any) => f.disponibilidad === 'PROXIMAMENTE');

      if (proxima) {
        zona.estado = 'PROXIMAMENTE';
        zona.precioActual = Number(proxima.precio || 0);
        indiceActivo = 0;
      } else {
        const ultima = zona.fases[zona.fases.length - 1];
        zona.estado = ultima ? ultima.disponibilidad : 'CERRADO';
        zona.precioActual = Number((ultima && ultima.precio) || 0);
        indiceActivo = zona.fases.length - 1;
      }

      zona.siguienteFase = null;
    }

    if (!zona.descripcion) {
      zona.descripcion =
        (faseActual && faseActual.descripcion) ||
        (zona.fases[0] && zona.fases[0].descripcion) ||
        '';
    }

    zona.progreso =
      zona.fases.length > 1
        ? Math.round((indiceActivo / (zona.fases.length - 1)) * 100)
        : 100;

    zona.fases.forEach((fase: any) => {
      if (faseActual && fase.id_tier === faseActual.id_tier) {
        fase.estadoMapa = 'active';
      } else if (fase.disponibilidad === 'CERRADO' || fase.disponibilidad === 'AGOTADO') {
        fase.estadoMapa = 'past';
      } else {
        fase.estadoMapa = 'future';
      }
    });
  }

  seleccionarZona(zona: any): void {
    if (!zona) return;

    this.zonaSeleccionada = zona;
    this.mensajeCompra = '';

    if (zona.faseActual) {
      this.seleccionarTier(zona.faseActual);
    } else {
      this.tierSeleccionado = null;
    }

    setTimeout(() => this.irA('zona-detalle'), 60);
  }

  esZonaSeleccionada(zona: any): boolean {
    return !!zona && this.zonaSeleccionada?.clave === zona.clave;
  }

  /** La imagen del plano falló: ocultamos el <img> y mostramos el respaldo. */
  onPlanoError(): void {
    this.planoDisponible = false;
  }

  textoBotonZona(zona: any): string {
    if (zona.estado === 'DISPONIBLE') return 'Comprar a este precio';
    if (zona.estado === 'PROXIMAMENTE') return 'Próximamente';
    if (zona.estado === 'AGOTADO') return 'Agotado';
    if (zona.estado === 'CERRADO') return 'Ventas cerradas';
    return 'No disponible';
  }

  porcentajeAhorro(zona: any): number {
    if (!zona?.precioActual || !zona?.precioMax) return 0;
    if (zona.precioMax <= zona.precioActual) return 0;
    return Math.round((1 - zona.precioActual / zona.precioMax) * 100);
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

  irAEntradas(): void {
    this.irA('entradas');
  }

  irACheckout(): void {
    this.irA('checkout');
  }

  irA(id: string): void {
    const el = document.getElementById(id);

    if (!el) return;

    const y = el.getBoundingClientRect().top + window.pageYOffset - 90;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  // ===========================================================
  //  Compra
  // ===========================================================

  seleccionarTier(tier: any): void {
    if (tier.disponibilidad !== 'DISPONIBLE') return;

    this.tierSeleccionado = tier;
    this.actualizarPersonas();
    this.mensajeCompra = '';
    this.quitarCodigo();
  }

  actualizarPersonas(): void {
    // La cantidad queda siempre entre 1 y maxEntradas.
    let nuevaCantidad = Number(this.cantidad || 1);

    if (nuevaCantidad < 1) nuevaCantidad = 1;
    if (nuevaCantidad > this.maxEntradas) nuevaCantidad = this.maxEntradas;

    this.cantidad = nuevaCantidad;

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

    // El descuento se calculó sobre otro subtotal: hay que volver a aplicarlo.
    if (this.codigoAplicado) {
      this.codigoAplicado = false;
      this.descuentoAplicado = 0;
      this.mensajeCodigo = 'La cantidad cambió. Volvé a aplicar el código.';
    }
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

  calcularSubtotal(): number {
    if (!this.tierSeleccionado) return 0;
    return Number(this.tierSeleccionado.precio || 0) * Number(this.cantidad || 1);
  }

  calcularTotal(): number {
    const total = this.calcularSubtotal() - (this.codigoAplicado ? this.descuentoAplicado : 0);
    return total > 0 ? total : 0;
  }

  /** Al cambiar el texto del código, se descarta cualquier descuento previo. */
  onCodigoChange(): void {
    if (this.codigoAplicado) {
      this.codigoAplicado = false;
      this.descuentoAplicado = 0;
    }
    this.mensajeCodigo = '';
  }

  aplicarCodigo(): void {
    const codigo = this.codigoDescuento.trim();

    if (!codigo) {
      this.mensajeCodigo = 'Ingresá un código.';
      this.codigoAplicado = false;
      return;
    }

    if (!this.tierSeleccionado) {
      this.mensajeCodigo = 'Seleccioná primero una entrada.';
      return;
    }

    this.validandoCodigo = true;
    this.mensajeCodigo = '';

    this.codigosService
      .validar(codigo, this.idEvento, this.calcularSubtotal())
      .subscribe({
        next: (res) => {
          this.validandoCodigo = false;
          this.codigoAplicado = true;
          this.descuentoAplicado = Number(res.descuento || 0);
          this.codigoDescuento = res.codigo || codigo.toUpperCase();
          this.mensajeCodigo = `Código aplicado: ahorrás ${this.formatearMoneda(this.descuentoAplicado)}.`;
        },
        error: (err) => {
          this.validandoCodigo = false;
          this.codigoAplicado = false;
          this.descuentoAplicado = 0;
          this.mensajeCodigo = err.error?.message || 'No se pudo aplicar el código.';
        }
      });
  }

  quitarCodigo(): void {
    this.codigoDescuento = '';
    this.codigoAplicado = false;
    this.descuentoAplicado = 0;
    this.mensajeCodigo = '';
  }

  validarCompra(): string | null {
    if (!this.tierSeleccionado) return 'Seleccioná un tipo de entrada.';
    if (!this.correoComprador.trim()) return 'Ingresá un correo electrónico.';
    if (!this.telefonoComprador.trim()) return 'Ingresá un número de teléfono.';
    if (!this.personas.length) return 'Agregá al menos una persona.';
    if (this.personas.length > this.maxEntradas) {
      return `Solo se pueden comprar hasta ${this.maxEntradas} entradas por compra.`;
    }

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
      personas: personasLimpias,
      codigo_descuento: this.codigoAplicado ? this.codigoDescuento.trim() : null
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
Zona: ${this.zonaSeleccionada?.nombre || this.tierSeleccionado.nombre}
Entrada: ${this.tierSeleccionado.nombre}
Cantidad: ${this.cantidad}${
      this.codigoAplicado
        ? `\nSubtotal: ${this.formatearMoneda(this.calcularSubtotal())}\nCódigo: ${this.codigoDescuento.trim()} (-${this.formatearMoneda(this.descuentoAplicado)})`
        : ''
    }
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
