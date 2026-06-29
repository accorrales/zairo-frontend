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

  /** Valida un código antes de comprar y devuelve el descuento calculado. */
  validar(codigo: string, idEvento: number, subtotal: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/validar`, {
      codigo,
      id_evento: idEvento,
      subtotal
    });
  }
}
