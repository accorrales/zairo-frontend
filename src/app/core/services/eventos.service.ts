import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EventosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/eventos`;

  obtenerEventos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/todos`);
  }

  obtenerEventosActivos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  crearEvento(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  actualizarEvento(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  desactivarEvento(id: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/desactivar`, {});
  }

  reactivarEvento(id: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/reactivar`, {});
  }

  eliminarEvento(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  obtenerEventoPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // ===== Ubicación secreta / notificaciones de ubicación (admin) =====

  obtenerUbicacionPreview(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/ubicacion-preview`);
  }

  actualizarUbicacionSecreta(id: number, data: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/ubicacion-secreta`, data);
  }

  enviarUbicacionManual(id: number, idCompra?: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/enviar-ubicacion`, idCompra ? { id_compra: idCompra } : {});
  }

  obtenerNotificacionesUbicacion(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/notificaciones-ubicacion`);
  }

  exportarCompradores(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/exportar-compradores`);
  }
}