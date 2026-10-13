import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EntradasConfirmadasService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/dashboard-entradas`;

  obtenerPorEvento(idEvento: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/evento/${idEvento}`);
  }

  invalidarEntrada(idDetalle: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/detalle/${idDetalle}/invalidar`, {});
  }

  revalidarEntrada(idDetalle: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/detalle/${idDetalle}/revalidar`, {});
  }

  descargarReporteCsv(idEvento: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/evento/${idEvento}/reporte.csv`, { responseType: 'blob' });
  }
}
