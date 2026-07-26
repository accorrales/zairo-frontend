import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';

interface SeleccionCortesia {
  id_evento: number;
  bebida: 'PUNCH_CLUB' | 'SOLEO';
  codigo: string;
  expira_en: number;
}

const CORTESIA_STORAGE_KEY = 'zairo_cortesia_seleccion';

@Injectable({
  providedIn: 'root'
})
export class ComprasEntradasService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/compras-entradas`;

  crearCompra(data: any): Observable<any> {
    const seleccion = this.obtenerCortesia(Number(data?.id_evento));
    const payload = seleccion
      ? {
          ...data,
          bebida_cortesia: seleccion.bebida,
          codigo_cortesia: seleccion.codigo
        }
      : data;

    return this.http.post(this.apiUrl, payload).pipe(
      tap(() => {
        if (seleccion) {
          this.limpiarCortesia();
        }
      })
    );
  }

  validarCodigoCortesia(idEvento: number, codigo: string): Observable<{ valido: boolean }> {
    return this.http.post<{ valido: boolean }>(`${this.apiUrl}/cortesia/validar`, {
      id_evento: idEvento,
      codigo_cortesia: codigo
    });
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

  private obtenerCortesia(idEvento: number): SeleccionCortesia | null {
    if (typeof window === 'undefined' || !Number.isFinite(idEvento)) return null;

    try {
      const guardada = window.sessionStorage.getItem(CORTESIA_STORAGE_KEY);
      if (!guardada) return null;

      const seleccion = JSON.parse(guardada) as SeleccionCortesia;
      const bebidaValida = seleccion?.bebida === 'PUNCH_CLUB' || seleccion?.bebida === 'SOLEO';
      const codigoValido = typeof seleccion?.codigo === 'string' && seleccion.codigo.length >= 20;
      const noExpirada = Number(seleccion?.expira_en) > Date.now();

      if (
        Number(seleccion?.id_evento) !== idEvento ||
        !bebidaValida ||
        !codigoValido ||
        !noExpirada
      ) {
        this.limpiarCortesia();
        return null;
      }

      return {
        id_evento: Number(seleccion.id_evento),
        bebida: seleccion.bebida,
        codigo: seleccion.codigo,
        expira_en: Number(seleccion.expira_en)
      };
    } catch {
      this.limpiarCortesia();
      return null;
    }
  }

  private limpiarCortesia(): void {
    if (typeof window === 'undefined') return;
    window.sessionStorage.removeItem(CORTESIA_STORAGE_KEY);
  }
}
