import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

// Servicio del módulo WhatsApp / Comprobantes.
// El token JWT lo agrega automáticamente authInterceptor.

export interface WhatsappComprobante {
  id: number;
  compra_id: number | null;
  conversation_id: number | null;
  file_type: string | null;
  detected_amount: number | null;
  detected_date: string | null;
  detected_reference: string | null;
  detected_bank: string | null;
  confidence_score: number | null;
  validation_status: string;
  validation_notes: string | null;
  reviewed_by: string | null;
  monto_esperado: number | null;
  estado_compra: string | null;
  correo_comprador: string | null;
  telefono_comprador: string | null;
  evento: string | null;
  id_evento: number | null;
  phone_number: string | null;
  contact_name: string | null;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class WhatsappService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/whatsapp`;

  listarComprobantes(filtros: Record<string, string> = {}): Observable<WhatsappComprobante[]> {
    let params = new HttpParams();
    Object.entries(filtros).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') params = params.set(k, v);
    });
    return this.http.get<WhatsappComprobante[]>(`${this.apiUrl}/comprobantes`, { params });
  }

  listarConversaciones(filtros: Record<string, string> = {}): Observable<any[]> {
    let params = new HttpParams();
    Object.entries(filtros).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') params = params.set(k, v);
    });
    return this.http.get<any[]>(`${this.apiUrl}/conversaciones`, { params });
  }

  obtenerMensajes(conversationId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/conversaciones/${conversationId}/mensajes`);
  }

  // El binario se pide como blob (pasa por el interceptor -> lleva JWT).
  obtenerArchivo(comprobanteId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/comprobantes/${comprobanteId}/archivo`, {
      responseType: 'blob'
    });
  }

  confirmar(comprobanteId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/comprobantes/${comprobanteId}/confirmar`, {});
  }

  rechazar(comprobanteId: number, razon?: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/comprobantes/${comprobanteId}/rechazar`, { razon });
  }

  solicitarNuevo(comprobanteId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/comprobantes/${comprobanteId}/solicitar-nuevo`, {});
  }

  enviarMensaje(conversationId: number, texto: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/conversaciones/${conversationId}/mensaje`, { texto });
  }
}
