import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-container">
      <h2>Iniciar sesión</h2>

      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
        <div>
          <label for="correo">Correo</label>
          <input id="correo" type="email" formControlName="correo" />
        </div>

        <div>
          <label for="password">Contraseña</label>
          <input id="password" type="password" formControlName="password" />
        </div>

        <button type="submit" [disabled]="loginForm.invalid || loading">
          {{ loading ? 'Ingresando...' : 'Ingresar' }}
        </button>

        <p *ngIf="errorMessage" style="color:red;">
          {{ errorMessage }}
        </p>
      </form>
    </div>
  `
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = false;
  errorMessage = '';

  loginForm = this.fb.group({
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    const credentials = {
      correo: this.loginForm.value.correo!,
      password: this.loginForm.value.password!
    };

    this.authService.login(credentials).subscribe({
      next: () => {
        const returnUrl =
          this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';

        this.router.navigateByUrl(returnUrl);
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.message || 'Error al iniciar sesión';
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}