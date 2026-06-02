import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1>Panel principal</h1>

    <p>Bienvenido, {{ auth.getUser()?.nombre }}</p>
    <p>Correo: {{ auth.getUser()?.correo }}</p>
    <p>Rol: {{ auth.getUser()?.rol }}</p>

    <button (click)="logout()">Cerrar sesión</button>
  `
})
export class DashboardComponent {
  auth = inject(AuthService);

  logout(): void {
    this.auth.logout();
  }
}