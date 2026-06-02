import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);

  private empleadosUrl = `${environment.apiUrl}/empleados`;
  private departamentosUrl = `${environment.apiUrl}/departamentos`;

  getDashboardData() {
    return forkJoin({
      empleados: this.http.get<any[]>(this.empleadosUrl),
      departamentos: this.http.get<any[]>(this.departamentosUrl)
    }).pipe(
      map(({ empleados, departamentos }) => {
        const totalEmpleados = empleados.length;
        const empleadosActivos = empleados.filter(e => e.estado === true).length;
        const totalDepartamentos = departamentos.length;

        const sumaSalarios = empleados.reduce((acc, emp) => {
          return acc + Number(emp.salario_base || 0);
        }, 0);

        const promedioSalario = totalEmpleados > 0
          ? sumaSalarios / totalEmpleados
          : 0;

        const ultimosEmpleados = [...empleados]
          .sort((a, b) => new Date(b.fecha_ingreso).getTime() - new Date(a.fecha_ingreso).getTime())
          .slice(0, 5);

        const empleadosPorDepartamento = departamentos.map((dep: any) => {
          const cantidad = empleados.filter(
            emp => emp.id_departamento === dep.id_departamento
          ).length;

          return {
            nombre: dep.nombre,
            cantidad
          };
        });

        return {
          totalEmpleados,
          empleadosActivos,
          totalDepartamentos,
          promedioSalario,
          ultimosEmpleados,
          empleadosPorDepartamento
        };
      })
    );
  }
}