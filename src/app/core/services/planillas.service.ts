import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DetallePlanillaResponse {
  planilla: any;
  detalle: any[];
}

@Injectable({
  providedIn: 'root'
})
export class PlanillasService {
  private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/planillas`;

  getPlanillas(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  crearPlanilla(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  procesarPlanilla(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/procesar/${id}`, {});
  }

  confirmarPlanilla(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/confirmar/${id}`, {});
  }

  eliminarPlanilla(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  obtenerDetallePlanilla(id: number): Observable<DetallePlanillaResponse> {
    return this.http.get<DetallePlanillaResponse>(`${this.apiUrl}/${id}/detalle`);
  }
}