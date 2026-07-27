import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  correo: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    nombre: string;
    correo: string;
    rol: string;
  };
}

interface JwtPayload {
  exp?: number;
  rol?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private apiUrl = `${environment.apiUrl}/auth`;

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, data).pipe(
      tap((response) => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      })
    );
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return this.getValidTokenPayload() !== null;
  }

  getUser(): { nombre: string; correo: string; rol: string } | null {
    const user = localStorage.getItem('user');

    if (!user) return null;

    try {
      return JSON.parse(user);
    } catch {
      this.clearSession();
      return null;
    }
  }

  getRole(): string | null {
    return this.getValidTokenPayload()?.rol || null;
  }

  private getValidTokenPayload(): JwtPayload | null {
    const payload = this.decodeTokenPayload();
    const expiration = Number(payload?.exp);

    if (!payload || !Number.isFinite(expiration) || expiration * 1000 <= Date.now()) {
      this.clearSession();
      return null;
    }

    return payload;
  }

  private decodeTokenPayload(): JwtPayload | null {
    const token = this.getToken();
    if (!token) return null;

    const encodedPayload = token.split('.')[1];
    if (!encodedPayload) return null;

    try {
      const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
      const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      const json = decodeURIComponent(
        atob(paddedBase64)
          .split('')
          .map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`)
          .join('')
      );

      return JSON.parse(json) as JwtPayload;
    } catch {
      return null;
    }
  }

  private clearSession(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}
