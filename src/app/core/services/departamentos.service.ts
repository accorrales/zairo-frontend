import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DepartamentosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/departamentos`; 

  getDepartamentos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  crearDepartamento(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  actualizarDepartamento(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  eliminarDepartamento(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}