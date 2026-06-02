import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-password-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './password-dialog.html',
  styleUrl: './password-dialog.css'
})
export class PasswordDialog {
  @Input() visible = false;
  @Input() usuarioNombre = '';

  @Output() confirmar = new EventEmitter<string>();
  @Output() cancelar = new EventEmitter<void>();

  password = '';
  confirmPassword = '';
  error = '';

  onConfirmar() {
    if (!this.password) {
      this.error = 'La contraseña es obligatoria';
      return;
    }

    if (this.password.length < 4) {
      this.error = 'Debe tener al menos 4 caracteres';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Las contraseñas no coinciden';
      return;
    }

    this.confirmar.emit(this.password);
    this.reset();
  }

  onCancelar() {
    this.cancelar.emit();
    this.reset();
  }

  reset() {
    this.password = '';
    this.confirmPassword = '';
    this.error = '';
  }
}