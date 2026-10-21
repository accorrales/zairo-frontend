import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { CodigosDescuentoService } from '../../core/services/codigos-descuento.service';

type Vista = 'crear' | 'avance';

const ULTIMO_CODIGO_KEY = 'zairo_reto70_codigo';

@Component({
  selector: 'app-public-reto-codigos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './public-reto-codigos.html',
  // Reutiliza los estilos del Home para mantener exactamente el mismo diseño.
  styleUrls: ['../public-eventos/public-eventos.css', './public-reto-codigos.css']
})
export class PublicRetoCodigos implements OnInit {
  private codigosService = inject(CodigosDescuentoService);
  private route = inject(ActivatedRoute);

  // Mismas reglas que el backend; se reemplazan con la respuesta de /campana.
  campana = {
    meta_entradas: 70,
    porcentaje: 10,
    fecha_inicio: '2026-10-21T08:00:00-06:00',
    fecha_fin: '2026-10-28T23:59:59-06:00',
    premio: '1 entrada doble Picnic + 1 entrada doble VIP ZAIRO',
    registro_abierto: true
  };

  vista: Vista = 'crear';

  formulario = { nombre: '', email: '', telefono: '', codigo: '' };
  enviando = false;
  errorRegistro = '';
  registrado: any = null;
  copiado = false;

  codigoConsulta = '';
  consultando = false;
  errorConsulta = '';
  progreso: any = null;

  ngOnInit(): void {
    this.codigosService.campana().subscribe({
      next: (data) => {
        if (data) this.campana = { ...this.campana, ...data };
      },
      error: (err) => console.error('No se pudo cargar el Reto 70', err)
    });

    const codigoUrl = this.route.snapshot.queryParamMap.get('codigo');
    const codigoGuardado = this.leerUltimoCodigo();

    if (codigoUrl) {
      this.codigoConsulta = this.normalizarCodigo(codigoUrl);
      this.cambiarVista('avance');
      this.consultarAvance();
    } else if (codigoGuardado) {
      this.codigoConsulta = codigoGuardado;
    }

    if (!codigoUrl && this.route.snapshot.queryParamMap.get('vista') === 'avance') {
      this.cambiarVista('avance');
      if (this.codigoConsulta) this.consultarAvance();
    }
  }

  get codigoVistaPrevia(): string {
    return this.normalizarCodigo(this.formulario.codigo) || 'TUCODIGO';
  }

  get porcentajeAvance(): number {
    if (!this.progreso) return 0;
    const meta = Number(this.progreso.meta_entradas) || this.campana.meta_entradas;
    return Math.min(100, Math.round((Number(this.progreso.entradas_vendidas) / meta) * 100));
  }

  get linkCompartir(): string {
    const origen = typeof window !== 'undefined' ? window.location.origin : 'https://zairoclub.com';
    return `${origen}/home`;
  }

  get linkWhatsapp(): string {
    const codigo = this.registrado?.codigo || this.progreso?.codigo || '';
    const texto =
      `🎟️ Usá mi código ${codigo} y obtené ${this.campana.porcentaje}% de descuento ` +
      `en tus entradas ZAIRO. Válido hasta el ${this.formatearFecha(this.campana.fecha_fin)}. ` +
      this.linkCompartir;
    return `https://wa.me/?text=${encodeURIComponent(texto)}`;
  }

  cambiarVista(vista: Vista): void {
    this.vista = vista;
    this.errorRegistro = '';
    this.errorConsulta = '';
  }

  onCodigoInput(valor: string): void {
    this.formulario.codigo = this.normalizarCodigo(valor);
  }

  registrar(): void {
    if (this.enviando) return;

    const error = this.validarFormulario();
    if (error) {
      this.errorRegistro = error;
      return;
    }

    this.enviando = true;
    this.errorRegistro = '';

    this.codigosService
      .registrarCodigoCampana({
        nombre: this.formulario.nombre.trim(),
        email: this.formulario.email.trim(),
        telefono: this.formulario.telefono.trim(),
        codigo: this.normalizarCodigo(this.formulario.codigo)
      })
      .subscribe({
        next: (res) => {
          this.enviando = false;
          this.registrado = { ...res, nombre: this.formulario.nombre.trim().split(' ')[0] };
          this.codigoConsulta = res.codigo;
          this.guardarUltimoCodigo(res.codigo);
        },
        error: (err) => {
          this.enviando = false;
          this.errorRegistro =
            err?.error?.error ||
            (err?.status === 0
              ? 'No pudimos conectarnos. Revisá tu internet e intentá de nuevo.'
              : 'No se pudo registrar el código. Intentá de nuevo.');
        }
      });
  }

  consultarAvance(): void {
    const codigo = this.normalizarCodigo(this.codigoConsulta);
    this.codigoConsulta = codigo;

    if (!/^[A-Z0-9]{4,15}$/.test(codigo)) {
      this.errorConsulta = codigo
        ? 'Los códigos tienen de 4 a 15 letras o números.'
        : 'Ingresá tu código.';
      this.progreso = null;
      return;
    }

    this.consultando = true;
    this.errorConsulta = '';

    this.codigosService.progresoCampana(codigo).subscribe({
      next: (res) => {
        this.consultando = false;
        this.progreso = res;
        this.guardarUltimoCodigo(res.codigo);
      },
      error: (err) => {
        this.consultando = false;
        this.progreso = null;
        this.errorConsulta =
          err?.error?.error ||
          (err?.status === 0
            ? 'No pudimos conectarnos. Revisá tu internet e intentá de nuevo.'
            : 'No se pudo consultar el avance.');
      }
    });
  }

  verAvanceRegistrado(): void {
    this.cambiarVista('avance');
    this.consultarAvance();
  }

  registrarOtro(): void {
    this.registrado = null;
    this.copiado = false;
    this.formulario = { nombre: '', email: '', telefono: '', codigo: '' };
  }

  async copiarCodigo(): Promise<void> {
    const codigo = this.registrado?.codigo || this.progreso?.codigo;
    if (!codigo) return;

    try {
      await navigator.clipboard.writeText(codigo);
      this.copiado = true;
      setTimeout(() => (this.copiado = false), 2200);
    } catch {
      this.copiado = false;
    }
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-CR', {
      timeZone: 'America/Costa_Rica',
      day: 'numeric',
      month: 'long',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  private validarFormulario(): string {
    const { nombre, email, telefono, codigo } = this.formulario;
    if (nombre.trim().length < 2) return 'Ingresá tu nombre completo.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return 'Ingresá un correo válido.';
    if (telefono.replace(/\D/g, '').length < 8) return 'Ingresá un número de teléfono válido.';
    if (!/^[A-Z0-9]{4,15}$/.test(this.normalizarCodigo(codigo))) {
      return 'Tu código debe tener de 4 a 15 letras o números.';
    }
    return '';
  }

  private normalizarCodigo(valor: string): string {
    return (valor || '').toString().toUpperCase().replace(/[\s-]+/g, '');
  }

  private leerUltimoCodigo(): string {
    try {
      return window.localStorage.getItem(ULTIMO_CODIGO_KEY) || '';
    } catch {
      return '';
    }
  }

  private guardarUltimoCodigo(codigo: string): void {
    try {
      window.localStorage.setItem(ULTIMO_CODIGO_KEY, codigo);
    } catch {
      // Sin almacenamiento disponible (modo privado): no es necesario.
    }
  }
}
