import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NovedadesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/novedades`;

  obtenerNovedades(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  crearNovedad(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  actualizarNovedad(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  eliminarNovedad(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}