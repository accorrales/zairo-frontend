import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { roleHome } from '../../core/guards/role-home';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);

  correo = '';
  password = '';
  errorMessage = '';
  loading = false;

  login(): void {
    if (!this.correo || !this.password) {
      this.errorMessage = 'Debe ingresar correo y contraseña';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login({
      correo: this.correo.trim().toLowerCase(),
      password: this.password
    }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate([roleHome(this.authService.getRole())]);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage =
          err?.error?.error ||
          err?.error?.message ||
          'Credenciales inválidas';
      }
    });
  }

}
