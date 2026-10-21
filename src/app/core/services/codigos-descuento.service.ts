import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CodigosDescuentoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/codigos-descuento`;

  listar(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  rankingPorEvento(idEvento: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/ranking/${idEvento}`);
  }

  obtenerPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  crear(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  actualizar(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  desactivar(id: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/desactivar`, {});
  }

  reactivar(id: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/reactivar`, {});
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  /** Reto 70: reglas públicas de la campaña (porcentaje, meta, vigencia). */
  campana(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/campana`);
  }

  /** Reto 70: el cliente registra su propio código de descuento. */
  registrarCodigoCampana(data: {
    nombre: string;
    email: string;
    telefono: string;
    instagram: string;
    codigo: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/campana/registro`, data);
  }

  /** Reto 70: entradas válidas vendidas con un código de la campaña. */
  progresoCampana(codigo: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/campana/progreso/${encodeURIComponent(codigo)}`);
  }

  /** Valida un código antes de comprar y devuelve el descuento calculado. */
  validar(codigo: string, idEvento: number, subtotal: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/validar`, {
      codigo,
      id_evento: idEvento,
      subtotal
    });
  }
}
