import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConceptosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/conceptos`;

  obtenerConceptos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  crearConcepto(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  actualizarConcepto(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  eliminarConcepto(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}