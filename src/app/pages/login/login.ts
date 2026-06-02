import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
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
      correo: this.correo,
      password: this.password
    }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Credenciales inválidas';
      }
    });
  }
}
