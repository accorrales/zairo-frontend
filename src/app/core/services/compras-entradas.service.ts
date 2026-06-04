import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ComprasEntradasService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/compras-entradas`;

  crearCompra(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  listarPendientes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pendientes`);
  }

  obtenerCompraPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  confirmarCompra(id: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/confirmar`, {});
  }

  rechazarCompra(id: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/rechazar`, {});
  }
}