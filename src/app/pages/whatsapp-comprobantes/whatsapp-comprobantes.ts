import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { WhatsappService, WhatsappComprobante } from '../../core/services/whatsapp.service';

@Component({
  selector: 'app-whatsapp-comprobantes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './whatsapp-comprobantes.html',
  styleUrl: './whatsapp-comprobantes.css'
})
export class WhatsappComprobantes implements OnInit {
  private whatsapp = inject(WhatsappService);

  comprobantes: WhatsappComprobante[] = [];
  seleccionado: WhatsappComprobante | null = null;
  mensajes: any[] = [];
  imagenUrl: string | null = null;
  imagenEsPdf = false;

  cargando = true;
  mensaje = '';
  nuevoMensaje = '';

  filtros = {
    evento: '',
    estado: '',
    telefono: '',
    confianza_min: '',
    pendientes: false
  };

  estados = [
    'RECEIVED', 'OCR_PENDING', 'OCR_PROCESSED', 'LIKELY_VALID',
    'NEEDS_REVIEW', 'POSSIBLE_DUPLICATE', 'REJECTED', 'APPROVED'
  ];

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    const filtros: Record<string, string> = {};
    if (this.filtros.evento) filtros['evento'] = this.filtros.evento;
    if (this.filtros.estado) filtros['estado'] = this.filtros.estado;
    if (this.filtros.telefono) filtros['telefono'] = this.filtros.telefono;
    if (this.filtros.confianza_min) filtros['confianza_min'] = this.filtros.confianza_min;
    if (this.filtros.pendientes) filtros['pendientes'] = 'true';

    this.whatsapp.listarComprobantes(filtros).subscribe({
      next: (data) => {
        this.comprobantes = data;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.mensaje = 'Error cargando comprobantes.';
      }
    });
  }

  limpiarFiltros(): void {
    this.filtros = { evento: '', estado: '', telefono: '', confianza_min: '', pendientes: false };
    this.cargar();
  }

  seleccionar(c: WhatsappComprobante): void {
    this.seleccionado = c;
    this.mensajes = [];
    this.nuevoMensaje = '';
    this.cargarArchivo(c);
    if (c.conversation_id) {
      this.whatsapp.obtenerMensajes(c.conversation_id).subscribe({
        next: (m) => (this.mensajes = m),
        error: () => (this.mensajes = [])
      });
    }
  }

  private cargarArchivo(c: WhatsappComprobante): void {
    this.revocarImagen();
    this.imagenEsPdf = (c.file_type || '').includes('pdf');
    this.whatsapp.obtenerArchivo(c.id).subscribe({
      next: (blob) => {
        this.imagenUrl = URL.createObjectURL(blob);
      },
      error: () => (this.imagenUrl = null)
    });
  }

  private revocarImagen(): void {
    if (this.imagenUrl) {
      URL.revokeObjectURL(this.imagenUrl);
      this.imagenUrl = null;
    }
  }

  cerrarDetalle(): void {
    this.revocarImagen();
    this.seleccionado = null;
  }

  confirmar(c: WhatsappComprobante): void {
    if (!window.confirm('¿Confirmar esta compra como PAGADA? Se generará el QR, se enviará el correo y un WhatsApp de confirmación.')) return;
    this.mensaje = 'Confirmando...';
    this.whatsapp.confirmar(c.id).subscribe({
      next: () => {
        this.mensaje = 'Compra confirmada correctamente.';
        this.cerrarDetalle();
        this.cargar();
      },
      error: (err) => {
        this.mensaje = err.error?.message || 'Error confirmando la compra.';
      }
    });
  }

  rechazar(c: WhatsappComprobante): void {
    const razon = window.prompt('Motivo del rechazo (opcional):') || '';
    if (!window.confirm('¿Rechazar este comprobante? Se enviará un WhatsApp pidiendo uno nuevo.')) return;
    this.mensaje = 'Rechazando...';
    this.whatsapp.rechazar(c.id, razon).subscribe({
      next: () => {
        this.mensaje = 'Comprobante rechazado.';
        this.cerrarDetalle();
        this.cargar();
      },
      error: () => (this.mensaje = 'Error rechazando comprobante.')
    });
  }

  solicitarNuevo(c: WhatsappComprobante): void {
    this.whatsapp.solicitarNuevo(c.id).subscribe({
      next: () => (this.mensaje = 'Solicitud enviada al cliente.'),
      error: () => (this.mensaje = 'Error enviando solicitud.')
    });
  }

  enviarMensaje(): void {
    if (!this.seleccionado?.conversation_id || !this.nuevoMensaje.trim()) return;
    this.whatsapp.enviarMensaje(this.seleccionado.conversation_id, this.nuevoMensaje.trim()).subscribe({
      next: () => {
        this.nuevoMensaje = '';
        if (this.seleccionado?.conversation_id) {
          this.whatsapp.obtenerMensajes(this.seleccionado.conversation_id).subscribe({
            next: (m) => (this.mensajes = m)
          });
        }
      },
      error: () => (this.mensaje = 'No se pudo enviar el mensaje.')
    });
  }

  claseEstado(estado: string): string {
    const map: Record<string, string> = {
      LIKELY_VALID: 'badge-ok',
      APPROVED: 'badge-ok',
      NEEDS_REVIEW: 'badge-warn',
      OCR_PROCESSED: 'badge-warn',
      RECEIVED: 'badge-neutral',
      OCR_PENDING: 'badge-neutral',
      POSSIBLE_DUPLICATE: 'badge-dup',
      REJECTED: 'badge-danger'
    };
    return map[estado] || 'badge-neutral';
  }

  montoCoincide(c: WhatsappComprobante): boolean {
    if (c.detected_amount === null || c.monto_esperado === null) return false;
    return Math.abs(Number(c.detected_amount) - Number(c.monto_esperado)) <= 1;
  }

  money(v: number | null): string {
    return `₡${Number(v || 0).toLocaleString('es-CR')}`;
  }

  fecha(f: string): string {
    return f ? new Date(f).toLocaleString('es-CR') : '';
  }
}
