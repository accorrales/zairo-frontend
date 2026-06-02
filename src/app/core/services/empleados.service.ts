import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Empleado } from '../models/empleado.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmpleadosService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/empleados`;

  getEmpleados(): Observable<Empleado[]> {
    return this.http.get<Empleado[]>(this.apiUrl);
  }
  createEmpleado(data: any) {
    return this.http.post(this.apiUrl, data);
  }
  updateEmpleado(id: number, data: any) {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }
  deleteEmpleado(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
  obtenerEmpleados(): Observable<any[]> {
  return this.http.get<any[]>(this.apiUrl);
}
}

