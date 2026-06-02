import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EntradaTiersService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/entrada-tiers`;

  obtenerTiersPorEvento(idEvento: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/evento/${idEvento}`);
  }
  
  crearTier(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  actualizarTier(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  eliminarTier(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
  
}