import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, ConfirmDialog],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  private authService = inject(AuthService);

  @Input() title = '';
  @Input() subtitle = '';

  modalVisible = false;

  get usuario() {
    return this.authService.getUser();
  }

  abrirLogout(): void {
    this.modalVisible = true;
  }

  cancelarLogout(): void {
    this.modalVisible = false;
  }

  confirmarLogout(): void {
    this.modalVisible = false;
    this.authService.logout();
  }
}